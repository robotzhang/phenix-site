// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.0/contracts/token/ERC20/ERC20.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.0/contracts/access/Ownable.sol";

contract Phenix is ERC20, Ownable {
    address public bridge;

    event BridgeUpdated(address bridge);
    event BridgeMint(address indexed to, uint256 amount);
    event BridgeBurn(address indexed from, uint256 amount);

    constructor() ERC20("Phenix", "PHENIX") Ownable(msg.sender) {}

    modifier onlyBridge() {
        require(msg.sender == bridge, "Not bridge");
        _;
    }

    function setBridge(address _bridge) external onlyOwner {
        require(_bridge != address(0), "Zero address");
        bridge = _bridge;
        emit BridgeUpdated(_bridge);
    }

    function mint(address to, uint256 amount) external onlyBridge {
        _mint(to, amount);
        emit BridgeMint(to, amount);
    }

    function burnFrom(address from, uint256 amount) external onlyBridge {
        _burn(from, amount);
        emit BridgeBurn(from, amount);
    }
}
