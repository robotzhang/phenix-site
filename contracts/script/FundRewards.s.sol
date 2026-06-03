// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {PhenixFnftStaking} from "../src/PhenixFnftStaking.sol";

contract FundRewards is Script {
    function run() external {
        address stakingAddress = vm.envAddress("FNFT_STAKING_ADDRESS");
        uint256 amount = vm.envUint("INITIAL_REWARD_DEPOSIT_WEI");

        PhenixFnftStaking staking = PhenixFnftStaking(stakingAddress);
        IERC20 phenix = IERC20(address(staking.phenix()));

        vm.startBroadcast();
        phenix.approve(stakingAddress, amount);
        staking.depositRewards(amount);
        vm.stopBroadcast();
    }
}
