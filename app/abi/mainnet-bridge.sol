// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/*
  Minimal ERC20 interface
*/
interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

contract MainnetBridge {
    address public owner;
    address public relayer;
    address public phenix;

    uint256 public nonce;

    event Locked(address indexed user, uint256 amount, uint256 indexed nonce);
    event Released(address indexed user, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyRelayer() {
        require(msg.sender == relayer, "Not relayer");
        _;
    }

    constructor(address _phenix) {
        require(_phenix != address(0), "Zero address");
        owner = msg.sender;
        phenix = _phenix;
    }

    function setRelayer(address _relayer) external onlyOwner {
        relayer = _relayer;
    }

    function lock(uint256 amount) external {
        IERC20(phenix).transferFrom(msg.sender, address(this), amount);
        emit Locked(msg.sender, amount, nonce++);
    }

    function release(address to, uint256 amount) external onlyRelayer {
        IERC20(phenix).transfer(to, amount);
        emit Released(to, amount);
    }
}
