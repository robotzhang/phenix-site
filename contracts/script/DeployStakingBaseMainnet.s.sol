// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script} from "forge-std/Script.sol";
import {PhenixFnftStaking} from "../src/PhenixFnftStaking.sol";

contract DeployStakingBaseMainnet is Script {
    address internal constant BASE_FNFT_ADDRESS = 0xC1083E18b75A096d32de5BE0fB44ead84f06e402;
    address internal constant BASE_PHENIX_ADDRESS = 0xBc121C4d6cfE2B7830dCf18163E1892e5bbB1735;

    function run() external returns (PhenixFnftStaking staking) {
        address ownerAddress = vm.envAddress("BASE_OWNER_ADDRESS");

        vm.startBroadcast();
        staking = new PhenixFnftStaking(BASE_FNFT_ADDRESS, BASE_PHENIX_ADDRESS, ownerAddress);
        vm.stopBroadcast();
    }
}
