// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script} from "forge-std/Script.sol";
import {PhenixFnftStakingTestHarness} from "../src/PhenixFnftStakingTestHarness.sol";

contract DeployStakingBaseSepoliaHarness is Script {
    function run() external returns (PhenixFnftStakingTestHarness staking) {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address fnft = vm.envAddress("BASE_SEPOLIA_FNFT_ADDRESS");
        address phenix = vm.envAddress("BASE_SEPOLIA_PHENIX_ADDRESS");
        address ownerMultisig = vm.envAddress("BASE_SEPOLIA_OWNER_MULTISIG");

        vm.startBroadcast(deployerKey);
        staking = new PhenixFnftStakingTestHarness(fnft, phenix, ownerMultisig);
        vm.stopBroadcast();
    }
}
