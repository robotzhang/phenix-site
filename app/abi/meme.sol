// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/**
 * ------------------------------------------------------------
 * Phenix Meme Mining Contract
 * ------------------------------------------------------------
 * Network : Base L2
 * Compiler: Solidity ^0.8.30
 * ------------------------------------------------------------
 */

import "https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-contracts/v5.5.0/contracts/token/ERC20/ERC20.sol";
import "https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-contracts/v5.5.0/contracts/token/ERC20/utils/SafeERC20.sol";
import "https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-contracts/v5.5.0/contracts/access/Ownable.sol";

contract PhenixMemeMining is ERC20, Ownable {
    using SafeERC20 for IERC20;

    /* ========================= CONSTANTS ========================= */
    uint256 public constant PHENIX_PER_MEME = 500 * 1e18;
    uint256 public constant TOTAL_PHENIX_CAP = 2_500_000_000 * 1e18;
    uint256 public constant DEFAULT_LOCK_DURATION = 365 days;

    /* ========================= STATE ========================= */
    IERC20 public immutable usdt; // 6 decimals
    IERC20 public immutable phenix; // 18 decimals

    uint256 public totalPhenixMined;
    uint256 public totalMemeMinted;

    bool public redeemEnabled;

    /* ========================= LOCKING ========================= */
    struct LockInfo {
        uint256 amount; // MEME amount (18d)
        uint256 unlockTime; // unix timestamp
    }

    mapping(address => LockInfo[]) public locks;
    mapping(address => uint256) public lockedBalance;

    /* ========================= EVENTS ========================= */
    event MemeMined(
        address indexed user,
        uint256 memeAmount,
        uint256 usdtPaid,
        uint256 unlockTime
    );
    event MemeRedeemed(
        address indexed user,
        uint256 memeAmount,
        uint256 phenixAmount
    );
    event RedeemEnabled();
    event LocksUnlocked(address indexed user, uint256 amount);
    event UsdtWithdrawn(address indexed owner, uint256 amount);

    /* ========================= STAGES ========================= */
    struct Stage {
        uint256 phenixStart;
        uint256 phenixEnd;
        uint256 priceUsdt; // 6 decimals
    }

    Stage[] public stages;

    /* ========================= CONSTRUCTOR ========================= */
    constructor(
        address usdtAddress,
        address phenixAddress
    ) ERC20("Phenix MEME", "MEME") Ownable(msg.sender) {
        usdt = IERC20(usdtAddress);
        phenix = IERC20(phenixAddress);
        _initStages();
    }

    /* ========================= STAGE INIT ========================= */
    function _initStages() internal {
        stages.push(Stage(0, 1_000_000_000e18, 100));
        stages.push(Stage(1_000_000_000e18, 1_600_000_000e18, 333));
        stages.push(Stage(1_600_000_000e18, 1_900_000_000e18, 1_000));
        stages.push(Stage(1_900_000_000e18, 2_200_000_000e18, 1_333));
        stages.push(Stage(2_200_000_000e18, 2_300_000_000e18, 25_000_000));
        stages.push(Stage(2_300_000_000e18, 2_320_000_000e18, 30_000_000));
        stages.push(Stage(2_320_000_000e18, 2_340_000_000e18, 35_000_000));
        stages.push(Stage(2_340_000_000e18, 2_360_000_000e18, 40_000_000));
        stages.push(Stage(2_360_000_000e18, 2_380_000_000e18, 45_000_000));
        stages.push(Stage(2_380_000_000e18, 2_400_000_000e18, 50_000_000));
        stages.push(Stage(2_400_000_000e18, 2_420_000_000e18, 55_000_000));
        stages.push(Stage(2_420_000_000e18, 2_440_000_000e18, 60_000_000));
        stages.push(Stage(2_440_000_000e18, 2_460_000_000e18, 65_000_000));
        stages.push(Stage(2_460_000_000e18, 2_480_000_000e18, 70_000_000));
        stages.push(Stage(2_480_000_000e18, 2_500_000_000e18, 75_000_000));
    }

    /* ========================= VIEW ========================= */
    function currentStage() public view returns (Stage memory s) {
        for (uint256 i = 0; i < stages.length; i++) {
            if (
                totalPhenixMined >= stages[i].phenixStart &&
                totalPhenixMined < stages[i].phenixEnd
            ) {
                return stages[i];
            }
        }
        revert("Mining finished");
    }

    function previewMine(
        uint256 memeHuman
    ) external view returns (uint256 usdtCost, uint256 phenixOut) {
        uint256 memeRemaining = memeHuman * 1e18;
        uint256 tempPhenix = totalPhenixMined;

        while (memeRemaining > 0 && tempPhenix < TOTAL_PHENIX_CAP) {
            Stage memory s;
            bool found;
            for (uint256 i = 0; i < stages.length; i++) {
                if (
                    tempPhenix >= stages[i].phenixStart &&
                    tempPhenix < stages[i].phenixEnd
                ) {
                    s = stages[i];
                    found = true;
                    break;
                }
            }
            require(found, "No stage");

            uint256 stageRemain = s.phenixEnd - tempPhenix;
            uint256 memeStage = (stageRemain / PHENIX_PER_MEME) * 1e18;
            uint256 use = memeRemaining < memeStage ? memeRemaining : memeStage;

            uint256 memeH = use / 1e18;
            usdtCost += memeH * s.priceUsdt;
            uint256 phenixThis = memeH * PHENIX_PER_MEME;

            phenixOut += phenixThis;
            tempPhenix += phenixThis;
            memeRemaining -= use;
        }
    }

    /* ========================= MINING ========================= */
    function mine(
        uint256 memeHuman,
        uint256 maxUsdtCost,
        uint256 lockDuration
    ) external {
        require(!redeemEnabled, "Mining ended");
        require(memeHuman > 0, "Zero amount");

        uint256 memeRemaining = memeHuman * 1e18;
        uint256 usdtCost;
        uint256 phenixThisTx;

        while (memeRemaining > 0) {
            Stage memory s = currentStage();

            uint256 stageRemain = s.phenixEnd - totalPhenixMined;
            uint256 memeStage = (stageRemain / PHENIX_PER_MEME) * 1e18;
            uint256 use = memeRemaining < memeStage ? memeRemaining : memeStage;

            uint256 memeH = use / 1e18;
            uint256 cost = memeH * s.priceUsdt;
            uint256 phenixOut = memeH * PHENIX_PER_MEME;

            usdtCost += cost;
            phenixThisTx += phenixOut;

            totalPhenixMined += phenixOut;
            totalMemeMinted += use;
            memeRemaining -= use;

            if (totalPhenixMined == TOTAL_PHENIX_CAP) {
                redeemEnabled = true;
                emit RedeemEnabled();
                break;
            }
        }

        require(usdtCost <= maxUsdtCost, "Slippage exceeded");

        usdt.safeTransferFrom(msg.sender, address(this), usdtCost);
        _mint(msg.sender, memeHuman * 1e18);

        uint256 duration = lockDuration == 0
            ? DEFAULT_LOCK_DURATION
            : lockDuration;
        uint256 unlock = block.timestamp + duration;

        locks[msg.sender].push(LockInfo(memeHuman * 1e18, unlock));
        lockedBalance[msg.sender] += memeHuman * 1e18;

        emit MemeMined(msg.sender, memeHuman * 1e18, usdtCost, unlock);
    }

    /* ========================= UNLOCK ========================= */
    function unlockExpiredLocks() external {
        LockInfo[] storage userLocks = locks[msg.sender];
        uint256 unlocked;

        for (uint256 i = 0; i < userLocks.length; i++) {
            if (
                userLocks[i].amount > 0 &&
                block.timestamp >= userLocks[i].unlockTime
            ) {
                unlocked += userLocks[i].amount;
                userLocks[i].amount = 0;
            }
        }

        if (unlocked > 0) {
            lockedBalance[msg.sender] -= unlocked;
            emit LocksUnlocked(msg.sender, unlocked);
        }
    }

    /* ========================= REDEEM ========================= */

    function redeem(uint256 memeHuman) external {
        require(redeemEnabled, "Redeem not enabled");

        uint256 amount = memeHuman * 1e18;
        require(
            balanceOf(msg.sender) - lockedBalance[msg.sender] >= amount,
            "MEME locked"
        );

        uint256 phenixOut = memeHuman * PHENIX_PER_MEME;
        _burn(msg.sender, amount);
        phenix.safeTransfer(msg.sender, phenixOut);

        emit MemeRedeemed(msg.sender, amount, phenixOut);
    }

    /* ========================= TRANSFER LOCK ========================= */
    function _update(
        address from,
        address to,
        uint256 amount
    ) internal override {
        if (from != address(0)) {
            uint256 available = balanceOf(from) - lockedBalance[from];
            require(available >= amount, "Transfer exceeds unlocked balance");
        }
        super._update(from, to, amount);
    }

    /* ========================= OWNER ========================= */
    function withdrawUsdt(uint256 amount) external onlyOwner {
        usdt.safeTransfer(msg.sender, amount);
        emit UsdtWithdrawn(msg.sender, amount);
    }
}
