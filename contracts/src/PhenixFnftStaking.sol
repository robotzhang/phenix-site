// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract PhenixFnftStaking is Ownable, Pausable, ReentrancyGuard, IERC721Receiver {
    using SafeERC20 for IERC20;

    uint8 public constant PLAN_COUNT = 4;
    uint256 public constant MAX_TOKENS_PER_POSITION = 50;
    uint256 public constant MAX_POSITIONS_PER_TX = 20;
    uint256 public constant MAX_NFT_TRANSFERS_PER_TX = 100;
    uint256 public constant MAX_PAGE_LIMIT = 100;

    IERC721 public immutable fnft;
    IERC20 public immutable phenix;

    struct Position {
        address owner;
        uint8 planId;
        uint64 startTime;
        uint64 unlockTime;
        uint16 tokenCount;
        uint256 totalReward;
        uint256 claimedReward;
        bool nftWithdrawn;
    }

    uint256 public nextPositionId = 1;
    uint256 public reservedRewards;
    bool public permanentlyStopped;

    mapping(uint256 => Position) private _positions;
    mapping(uint256 => uint256[]) private _positionTokenIds;
    mapping(address => uint256[]) private _userPositionIds;
    mapping(uint256 => uint256) public tokenPositionId;

    bool private _acceptingFnft;
    mapping(uint256 => bool) private _expectedTokenId;

    event PositionCreated(
        address indexed owner,
        uint256 indexed positionId,
        uint8 indexed planId,
        uint256 tokenCount,
        uint256 totalReward,
        uint256 startTime,
        uint256 unlockTime
    );
    event RewardClaimed(address indexed owner, uint256 indexed positionId, uint256 amount);
    event PositionUnstaked(
        address indexed owner, uint256 indexed positionId, address indexed recipient, uint256 tokenCount
    );
    event RewardsDeposited(address indexed funder, uint256 requestedAmount, uint256 receivedAmount);
    event OwnerPhenixWithdrawn(address indexed owner, address indexed to, uint256 amount);
    event UntrackedFnftRecovered(address indexed owner, address indexed to, uint256 indexed tokenId);
    event StakingPermanentlyStopped(address indexed owner);

    error ZeroAddress();
    error ZeroAmount();
    error EmptyTokenIds();
    error InvalidPlan();
    error TooManyTokens();
    error TooManyPositions();
    error TooManyNftTransfers();
    error InvalidPageLimit();
    error RewardPoolInsufficient();
    error TokenAlreadyStaked(uint256 tokenId);
    error NotPositionOwner(uint256 positionId);
    error PositionLocked(uint256 positionId);
    error PositionAlreadyUnstaked(uint256 positionId);
    error NothingToClaim();
    error UnexpectedFnftTransfer();
    error NotUntrackedFnft(uint256 tokenId);
    error StakingAlreadyStopped();

    constructor(address fnftAddress, address phenixAddress, address ownerAddress) Ownable(ownerAddress) {
        if (fnftAddress == address(0) || phenixAddress == address(0) || ownerAddress == address(0)) {
            revert ZeroAddress();
        }

        fnft = IERC721(fnftAddress);
        phenix = IERC20(phenixAddress);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        if (permanentlyStopped) revert StakingAlreadyStopped();
        _unpause();
    }

    function stopStakingPermanently() external onlyOwner {
        if (permanentlyStopped) revert StakingAlreadyStopped();
        permanentlyStopped = true;
        if (!paused()) {
            _pause();
        }
        emit StakingPermanentlyStopped(msg.sender);
    }

    function stake(uint256[] calldata tokenIds, uint8 planId)
        external
        nonReentrant
        returns (uint256 positionId)
    {
        _requireActiveStaking();
        uint256 tokenCount = tokenIds.length;
        if (tokenCount == 0) revert EmptyTokenIds();
        if (tokenCount > MAX_TOKENS_PER_POSITION) revert TooManyTokens();
        _validatePlan(planId);

        uint256 totalReward = _rewardPerNft(planId) * tokenCount;
        if (phenix.balanceOf(address(this)) < reservedRewards + totalReward) {
            revert RewardPoolInsufficient();
        }

        positionId = nextPositionId++;
        uint64 startTime = uint64(block.timestamp);
        uint64 unlockTime = startTime + _lockDuration(planId);

        _positions[positionId] = Position({
            owner: msg.sender,
            planId: planId,
            startTime: startTime,
            unlockTime: unlockTime,
            // casting to 'uint16' is safe because MAX_TOKENS_PER_POSITION caps tokenCount at 50
            // forge-lint: disable-next-line(unsafe-typecast)
            tokenCount: uint16(tokenCount),
            totalReward: totalReward,
            claimedReward: 0,
            nftWithdrawn: false
        });
        _userPositionIds[msg.sender].push(positionId);
        reservedRewards += totalReward;

        for (uint256 i = 0; i < tokenCount; i++) {
            uint256 tokenId = tokenIds[i];
            if (tokenPositionId[tokenId] != 0) revert TokenAlreadyStaked(tokenId);

            _expectedTokenId[tokenId] = true;
            _acceptingFnft = true;
            fnft.safeTransferFrom(msg.sender, address(this), tokenId);
            _acceptingFnft = false;
            _expectedTokenId[tokenId] = false;

            tokenPositionId[tokenId] = positionId;
            _positionTokenIds[positionId].push(tokenId);
        }

        emit PositionCreated(msg.sender, positionId, planId, tokenCount, totalReward, startTime, unlockTime);
    }

    function claim(uint256[] calldata positionIds) external nonReentrant {
        _requireActiveStaking();
        _validatePositionBatch(positionIds.length);
        if (!rewardSolvent()) revert RewardPoolInsufficient();

        uint256 totalClaim;

        for (uint256 i = 0; i < positionIds.length; i++) {
            uint256 positionId = positionIds[i];
            Position storage position = _positions[positionId];
            if (position.owner != msg.sender) revert NotPositionOwner(positionId);

            uint256 amount = _claimable(position);
            if (amount == 0) continue;

            position.claimedReward += amount;
            reservedRewards -= amount;
            totalClaim += amount;

            emit RewardClaimed(msg.sender, positionId, amount);
        }

        if (totalClaim == 0) revert NothingToClaim();
        phenix.safeTransfer(msg.sender, totalClaim);
    }

    function unstakeTo(uint256[] calldata positionIds, address recipient) external nonReentrant {
        if (recipient == address(0)) revert ZeroAddress();
        _validatePositionBatch(positionIds.length);

        uint256 totalTransfers;
        for (uint256 i = 0; i < positionIds.length; i++) {
            Position storage position = _positions[positionIds[i]];
            if (position.owner != msg.sender) revert NotPositionOwner(positionIds[i]);
            if (position.nftWithdrawn) revert PositionAlreadyUnstaked(positionIds[i]);
            if (!permanentlyStopped && block.timestamp < position.unlockTime) revert PositionLocked(positionIds[i]);
            totalTransfers += position.tokenCount;
        }
        if (totalTransfers > MAX_NFT_TRANSFERS_PER_TX) revert TooManyNftTransfers();

        for (uint256 i = 0; i < positionIds.length; i++) {
            uint256 positionId = positionIds[i];
            Position storage position = _positions[positionId];
            position.nftWithdrawn = true;

            uint256[] storage tokenIds = _positionTokenIds[positionId];
            uint256 tokenCount = tokenIds.length;
            for (uint256 j = 0; j < tokenCount; j++) {
                uint256 tokenId = tokenIds[j];
                tokenPositionId[tokenId] = 0;
                fnft.safeTransferFrom(address(this), recipient, tokenId);
            }

            emit PositionUnstaked(msg.sender, positionId, recipient, tokenCount);
        }
    }

    function depositRewards(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();

        uint256 beforeBalance = phenix.balanceOf(address(this));
        phenix.safeTransferFrom(msg.sender, address(this), amount);
        uint256 received = phenix.balanceOf(address(this)) - beforeBalance;
        if (received == 0) revert ZeroAmount();

        emit RewardsDeposited(msg.sender, amount, received);
    }

    function ownerWithdrawPhenix(address to, uint256 amount) external onlyOwner nonReentrant {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();

        phenix.safeTransfer(to, amount);
        emit OwnerPhenixWithdrawn(msg.sender, to, amount);
    }

    function recoverUntrackedFnft(uint256 tokenId, address to) external onlyOwner nonReentrant {
        if (to == address(0)) revert ZeroAddress();
        if (tokenPositionId[tokenId] != 0 || fnft.ownerOf(tokenId) != address(this)) {
            revert NotUntrackedFnft(tokenId);
        }

        fnft.safeTransferFrom(address(this), to, tokenId);
        emit UntrackedFnftRecovered(msg.sender, to, tokenId);
    }

    function claimable(uint256 positionId) external view returns (uint256) {
        return _claimable(_positions[positionId]);
    }

    function positionInfo(uint256 positionId) external view returns (Position memory) {
        return _positions[positionId];
    }

    function positionTokenIds(uint256 positionId) external view returns (uint256[] memory) {
        return _positionTokenIds[positionId];
    }

    function positionsOf(address user, uint256 offset, uint256 limit) external view returns (uint256[] memory) {
        if (limit > MAX_PAGE_LIMIT) revert InvalidPageLimit();

        uint256[] storage allPositions = _userPositionIds[user];
        uint256 length = allPositions.length;
        if (offset >= length || limit == 0) return new uint256[](0);

        uint256 end = offset + limit;
        if (end > length) end = length;

        uint256[] memory page = new uint256[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            page[i - offset] = allPositions[i];
        }
        return page;
    }

    function userPositionCount(address user) external view returns (uint256) {
        return _userPositionIds[user].length;
    }

    function planInfo(uint8 planId)
        external
        pure
        returns (uint256 lockUnits, uint256 timeUnit, uint256 lockDuration, uint256 rewardPerNft)
    {
        _validatePlan(planId);
        lockUnits = _lockUnits(planId);
        timeUnit = _timeUnit();
        lockDuration = _lockDuration(planId);
        rewardPerNft = _rewardPerNft(planId);
    }

    function rewardSolvent() public view returns (bool) {
        return phenix.balanceOf(address(this)) >= reservedRewards;
    }

    function rewardDeficit() external view returns (uint256) {
        uint256 balance = phenix.balanceOf(address(this));
        return balance >= reservedRewards ? 0 : reservedRewards - balance;
    }

    function onERC721Received(address, address, uint256 tokenId, bytes calldata)
        external
        view
        override
        returns (bytes4)
    {
        if (msg.sender != address(fnft) || !_acceptingFnft || !_expectedTokenId[tokenId]) {
            revert UnexpectedFnftTransfer();
        }
        return IERC721Receiver.onERC721Received.selector;
    }

    function _claimable(Position storage position) internal view returns (uint256) {
        if (position.owner == address(0)) return 0;

        uint256 endTime = block.timestamp < position.unlockTime ? block.timestamp : position.unlockTime;
        if (endTime <= position.startTime) return 0;

        uint256 elapsedUnits = (endTime - position.startTime) / _timeUnit();
        uint256 totalUnits = _lockUnits(position.planId);
        if (elapsedUnits > totalUnits) elapsedUnits = totalUnits;

        uint256 vested = (position.totalReward * elapsedUnits) / totalUnits;
        return vested > position.claimedReward ? vested - position.claimedReward : 0;
    }

    function _requireActiveStaking() internal view {
        if (permanentlyStopped) revert StakingAlreadyStopped();
        _requireNotPaused();
    }

    function _validatePositionBatch(uint256 length) internal pure {
        if (length == 0) revert TooManyPositions();
        if (length > MAX_POSITIONS_PER_TX) revert TooManyPositions();
    }

    function _validatePlan(uint8 planId) internal pure {
        if (planId >= PLAN_COUNT) revert InvalidPlan();
    }

    function _lockDuration(uint8 planId) internal pure returns (uint64) {
        return uint64(_lockUnits(planId) * _timeUnit());
    }

    function _timeUnit() internal pure virtual returns (uint64) {
        return 1 days;
    }

    function _lockUnits(uint8 planId) internal pure virtual returns (uint16) {
        if (planId == 0) return 90;
        if (planId == 1) return 180;
        if (planId == 2) return 360;
        if (planId == 3) return 720;
        revert InvalidPlan();
    }

    function _rewardPerNft(uint8 planId) internal pure virtual returns (uint256) {
        if (planId == 0) return 10 ether;
        if (planId == 1) return 25 ether;
        if (planId == 2) return 80 ether;
        if (planId == 3) return 200 ether;
        revert InvalidPlan();
    }
}
