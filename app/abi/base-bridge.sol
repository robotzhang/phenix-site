// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IPhenix {
    function mint(address to, uint256 amount) external;
    function burnFrom(address from, uint256 amount) external;
}

contract BaseBridge {
    address public owner;
    address public relayer;
    IPhenix public phenix;

    mapping(uint256 => bool) public processedNonces;

    event Minted(address indexed user, uint256 amount, uint256 indexed nonce);
    event Burned(address indexed user, uint256 amount, uint256 indexed nonce);

    modifier onlyOwner() { require(msg.sender == owner, "Not owner"); _; }
    modifier onlyRelayer() { require(msg.sender == relayer, "Not relayer"); _; }

    constructor(address _phenix) {
        owner = msg.sender;
        phenix = IPhenix(_phenix);
    }

    function setRelayer(address _relayer) external onlyOwner {
        relayer = _relayer;
    }

    function mintFromL1(address user, uint256 amount, uint256 nonce) external onlyRelayer {
        require(!processedNonces[nonce], "Already processed");
        processedNonces[nonce] = true;
        phenix.mint(user, amount);
        emit Minted(user, amount, nonce);
    }

    function burnToL1(uint256 amount) external {
        phenix.burnFrom(msg.sender, amount);
        emit Burned(msg.sender, amount, block.number);
    }
}
