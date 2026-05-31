// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script} from "forge-std/Script.sol";
import {MockPhenix} from "../src/mocks/MockPhenix.sol";
import {MockFnft} from "../src/mocks/MockFnft.sol";

contract DeployMocksBaseSepolia is Script {
    function run() external returns (MockPhenix phenix, MockFnft fnft) {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address ownerMultisig = vm.envAddress("BASE_SEPOLIA_OWNER_MULTISIG");

        vm.startBroadcast(deployerKey);
        phenix = new MockPhenix(ownerMultisig);
        fnft = new MockFnft(ownerMultisig);
        vm.stopBroadcast();
    }
}
