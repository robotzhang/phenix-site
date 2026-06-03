// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract MockFnft is ERC721Enumerable, Ownable {
    uint256 private _nextTokenId = 1;

    constructor(address owner_) ERC721("Mock f-nft", "mFNFT") Ownable(owner_) {}

    function mint(address to) external onlyOwner returns (uint256 tokenId) {
        tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
    }

    function mintBatch(address to, uint256 amount) external onlyOwner {
        for (uint256 i = 0; i < amount; i++) {
            uint256 tokenId = _nextTokenId++;
            _safeMint(to, tokenId);
        }
    }
}
