// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import {PhenixFnftStaking} from "../src/PhenixFnftStaking.sol";
import {PhenixFnftStakingTestHarness} from "../src/PhenixFnftStakingTestHarness.sol";
import {MockPhenix} from "../src/mocks/MockPhenix.sol";
import {MockFnft} from "../src/mocks/MockFnft.sol";

contract PhenixFnftStakingTest is Test, IERC721Receiver {
    MockPhenix private phenix;
    MockFnft private fnft;
    PhenixFnftStakingTestHarness private staking;

    address private owner = address(0xA11CE);
    address private user = address(0xB0B);
    address private recipient = address(0xCAFE);

    function setUp() public {
        phenix = new MockPhenix(owner);
        fnft = new MockFnft(owner);
        staking = new PhenixFnftStakingTestHarness(address(fnft), address(phenix), owner);

        vm.startPrank(owner);
        phenix.mint(owner, 1_000_000 ether);
        fnft.mintBatch(user, 120);
        phenix.approve(address(staking), type(uint256).max);
        staking.depositRewards(50_000 ether);
        vm.stopPrank();
    }

    function testStakeCreatesIndependentPositions() public {
        uint256[] memory first = _tokens(1, 2);
        uint256[] memory second = _tokens(3, 1);

        vm.startPrank(user);
        fnft.setApprovalForAll(address(staking), true);
        uint256 firstPosition = staking.stake(first, 0);
        uint256 secondPosition = staking.stake(second, 1);
        vm.stopPrank();

        assertEq(firstPosition, 1);
        assertEq(secondPosition, 2);
        assertEq(staking.userPositionCount(user), 2);
        assertEq(fnft.ownerOf(1), address(staking));
        assertEq(fnft.ownerOf(3), address(staking));
    }

    function testCannotStakeSameTokenTwice() public {
        uint256[] memory first = _tokens(1, 1);

        vm.startPrank(user);
        fnft.setApprovalForAll(address(staking), true);
        staking.stake(first, 0);
        vm.expectRevert(abi.encodeWithSelector(PhenixFnftStaking.TokenAlreadyStaked.selector, 1));
        staking.stake(first, 0);
        vm.stopPrank();
    }

    function testCannotStakeDuplicateTokenIdsInSamePosition() public {
        uint256[] memory tokenIds = new uint256[](2);
        tokenIds[0] = 1;
        tokenIds[1] = 1;

        vm.startPrank(user);
        fnft.setApprovalForAll(address(staking), true);
        vm.expectRevert(abi.encodeWithSelector(PhenixFnftStaking.TokenAlreadyStaked.selector, 1));
        staking.stake(tokenIds, 0);
        vm.stopPrank();
    }

    function testStakeRevertsWhenRewardPoolCannotCoverReservation() public {
        uint256[] memory tokens = _tokens(1, 1);
        uint256 stakingBalance = phenix.balanceOf(address(staking));

        vm.prank(owner);
        staking.ownerWithdrawPhenix(owner, stakingBalance);

        vm.startPrank(user);
        fnft.setApprovalForAll(address(staking), true);
        vm.expectRevert(PhenixFnftStaking.RewardPoolInsufficient.selector);
        staking.stake(tokens, 0);
        vm.stopPrank();
    }

    function testClaimUsesCompleteTimeUnits() public {
        uint256[] memory tokens = _tokens(1, 1);

        vm.startPrank(user);
        fnft.setApprovalForAll(address(staking), true);
        uint256 positionId = staking.stake(tokens, 0);

        vm.warp(block.timestamp + 59 seconds);
        assertEq(staking.claimable(positionId), 0);

        vm.warp(block.timestamp + 1 seconds);
        assertEq(staking.claimable(positionId), 5 ether);

        uint256 beforeBalance = phenix.balanceOf(user);
        staking.claim(_positionIds(positionId));
        assertEq(phenix.balanceOf(user) - beforeBalance, 5 ether);
        vm.stopPrank();
    }

    function testOwnerWithdrawPausesClaimButNotUnstake() public {
        uint256[] memory tokens = _tokens(1, 1);

        vm.startPrank(user);
        fnft.setApprovalForAll(address(staking), true);
        uint256 positionId = staking.stake(tokens, 0);
        vm.stopPrank();

        uint256 stakingBalance = phenix.balanceOf(address(staking));
        vm.prank(owner);
        staking.ownerWithdrawPhenix(owner, stakingBalance);

        vm.warp(block.timestamp + 2 minutes);

        vm.prank(user);
        vm.expectRevert(PhenixFnftStaking.RewardPoolInsufficient.selector);
        staking.claim(_positionIds(positionId));

        vm.prank(user);
        staking.unstakeTo(_positionIds(positionId), recipient);
        assertEq(fnft.ownerOf(1), recipient);
    }

    function testDepositRestoresClaim() public {
        uint256[] memory tokens = _tokens(1, 1);

        vm.startPrank(user);
        fnft.setApprovalForAll(address(staking), true);
        uint256 positionId = staking.stake(tokens, 0);
        vm.stopPrank();

        uint256 stakingBalance = phenix.balanceOf(address(staking));
        vm.prank(owner);
        staking.ownerWithdrawPhenix(owner, stakingBalance);

        vm.warp(block.timestamp + 2 minutes);

        vm.startPrank(owner);
        phenix.approve(address(staking), 10 ether);
        staking.depositRewards(10 ether);
        vm.stopPrank();

        vm.prank(user);
        staking.claim(_positionIds(positionId));
        assertEq(phenix.balanceOf(user), 10 ether);
    }

    function testRecoverUntrackedFnft() public {
        vm.prank(user);
        fnft.transferFrom(user, address(staking), 1);

        vm.prank(owner);
        staking.recoverUntrackedFnft(1, recipient);
        assertEq(fnft.ownerOf(1), recipient);
    }

    function testCannotRecoverActiveStake() public {
        uint256[] memory tokens = _tokens(1, 1);

        vm.startPrank(user);
        fnft.setApprovalForAll(address(staking), true);
        staking.stake(tokens, 0);
        vm.stopPrank();

        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(PhenixFnftStaking.NotUntrackedFnft.selector, 1));
        staking.recoverUntrackedFnft(1, recipient);
    }

    function testSafeTransferWithoutStakeFlowReverts() public {
        vm.startPrank(user);
        fnft.setApprovalForAll(address(this), true);
        vm.expectRevert(PhenixFnftStaking.UnexpectedFnftTransfer.selector);
        fnft.safeTransferFrom(user, address(staking), 1);
        vm.stopPrank();
    }

    function testBatchLimits() public {
        uint256[] memory tooMany = _tokens(1, 51);

        vm.startPrank(user);
        fnft.setApprovalForAll(address(staking), true);
        vm.expectRevert(PhenixFnftStaking.TooManyTokens.selector);
        staking.stake(tooMany, 0);
        vm.stopPrank();
    }

    function testUnstakeBatchRevertsWhenTransferCountExceedsLimit() public {
        vm.startPrank(user);
        fnft.setApprovalForAll(address(staking), true);
        for (uint256 i = 0; i < 3; i++) {
            staking.stake(_tokens(1 + (i * 40), 40), 0);
        }
        vm.warp(block.timestamp + 3 minutes);
        vm.expectRevert(PhenixFnftStaking.TooManyNftTransfers.selector);
        staking.unstakeTo(_positionRange(1, 3), recipient);
        vm.stopPrank();
    }

    function testPositionsOfRejectsOversizedLimit() public {
        vm.expectRevert(PhenixFnftStaking.InvalidPageLimit.selector);
        staking.positionsOf(user, 0, 101);
    }

    function _tokens(uint256 start, uint256 count) private pure returns (uint256[] memory tokenIds) {
        tokenIds = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            tokenIds[i] = start + i;
        }
    }

    function _positionIds(uint256 positionId) private pure returns (uint256[] memory positionIds) {
        positionIds = new uint256[](1);
        positionIds[0] = positionId;
    }

    function _positionRange(uint256 start, uint256 count) private pure returns (uint256[] memory positionIds) {
        positionIds = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            positionIds[i] = start + i;
        }
    }

    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
}
