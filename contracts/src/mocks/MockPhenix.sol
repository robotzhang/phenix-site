// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract MockPhenix is ERC20, Ownable {
    constructor(address owner_) ERC20("Mock PHENIX", "mPHENIX") Ownable(owner_) {}

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
