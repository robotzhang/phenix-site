// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script} from "forge-std/Script.sol";
import {PhenixFnftStaking} from "../src/PhenixFnftStaking.sol";

contract DeployStakingBaseSepoliaProdParams is Script {
    address internal constant BASE_SEPOLIA_FNFT_ADDRESS = 0xCBfbb824852047a4fA4CdCa98E106C75545B14bc;
    address internal constant BASE_SEPOLIA_PHENIX_ADDRESS = 0x80F325b67D9cf94518930d6E24C631E38F9334f3;

    function run() external returns (PhenixFnftStaking staking) {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address ownerMultisig = vm.envAddress("BASE_SEPOLIA_OWNER_MULTISIG");

        vm.startBroadcast(deployerKey);
        staking = new PhenixFnftStaking(BASE_SEPOLIA_FNFT_ADDRESS, BASE_SEPOLIA_PHENIX_ADDRESS, ownerMultisig);
        vm.stopBroadcast();
    }
}
