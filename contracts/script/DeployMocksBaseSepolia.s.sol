// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script} from "forge-std/Script.sol";
import {MockPhenix} from "../src/mocks/MockPhenix.sol";
import {MockFnft} from "../src/mocks/MockFnft.sol";

contract DeployMocksBaseSepolia is Script {
    function run() external returns (MockPhenix phenix, MockFnft fnft) {
        address deployerAddress = vm.envAddress("DEPLOYER_ADDRESS");

        vm.startBroadcast();
        phenix = new MockPhenix(deployerAddress);
        fnft = new MockFnft(deployerAddress);
        vm.stopBroadcast();
    }
}
