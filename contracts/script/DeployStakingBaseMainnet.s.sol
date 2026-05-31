// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script} from "forge-std/Script.sol";
import {PhenixFnftStaking} from "../src/PhenixFnftStaking.sol";

contract DeployStakingBaseMainnet is Script {
    function run() external returns (PhenixFnftStaking staking) {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address fnft = vm.envAddress("BASE_FNFT_ADDRESS");
        address phenix = vm.envAddress("BASE_PHENIX_ADDRESS");
        address ownerMultisig = vm.envAddress("BASE_OWNER_MULTISIG");

        vm.startBroadcast(deployerKey);
        staking = new PhenixFnftStaking(fnft, phenix, ownerMultisig);
        vm.stopBroadcast();
    }
}
