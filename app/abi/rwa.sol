// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/**
 * ------------------------------------------------------------
 * RWA Asset NFT Contract
 * Network : Base L2
 * Standard : ERC721 Enumerable
 * Compiler: Solidity ^0.8.30
 * ------------------------------------------------------------
 */

import "https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-contracts/v5.5.0/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-contracts/v5.5.0/contracts/access/Ownable.sol";
import "https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-contracts/v5.5.0/contracts/utils/ReentrancyGuard.sol";

contract RWANFT is ERC721Enumerable, Ownable, ReentrancyGuard {

    /* ========================= DATA STRUCTURES ========================= */

    enum RWAStatus { PUBLISHED, UNPUBLISHED }

    struct RWAAsset {
        string name;
        uint256 pricePhenix;
        string fileHash;          // ← 修改为 string
        RWAStatus status;
    }

    /* ========================= STORAGE ========================= */

    uint256 public nextTokenId = 1;

    mapping(uint256 => RWAAsset) public rwaAssets;
    mapping(address => bool) public authorizedIssuer;

    string public baseTokenURI;
    string public defaultTokenURI;

    /* ========================= EVENTS ========================= */

    event IssuerAuthorized(address indexed issuer, bool enabled);
    event RWACreated(uint256 indexed tokenId, address indexed owner);
    event RWAStatusUpdated(uint256 indexed tokenId, RWAStatus status);
    event RWABurned(uint256 indexed tokenId);
    event BaseURIUpdated(string newURI);
    event DefaultURIUpdated(string newURI);

    /* ========================= MODIFIERS ========================= */

    modifier onlyIssuer() {
        require(msg.sender == owner() || authorizedIssuer[msg.sender], "Not authorized issuer");
        _;
    }

    /* ========================= CONSTRUCTOR ========================= */

    constructor() ERC721("Phenix RWA", "PHENIXRWA") Ownable(msg.sender) {
        authorizedIssuer[msg.sender] = true;
        emit IssuerAuthorized(msg.sender, true);
    }

    /* ========================= ADMIN FUNCTIONS ========================= */

    function setIssuer(address issuer, bool enabled) external onlyOwner {
        authorizedIssuer[issuer] = enabled;
        emit IssuerAuthorized(issuer, enabled);
    }

    function setBaseTokenURI(string calldata uri) external onlyOwner {
        baseTokenURI = uri;
        emit BaseURIUpdated(uri);
    }

    function setDefaultTokenURI(string calldata uri) external onlyOwner {
        defaultTokenURI = uri;
        emit DefaultURIUpdated(uri);
    }

    /* ========================= RWA LOGIC ========================= */

    function createRWA(
        address to,
        string calldata name,
        uint256 pricePhenix,
        string calldata fileHash
    ) external onlyIssuer nonReentrant returns (uint256 tokenId) {

        require(bytes(name).length > 0, "Invalid name");
        require(pricePhenix > 0, "Invalid price");
        require(bytes(fileHash).length > 0, "Invalid file hash");

        tokenId = nextTokenId++;
        _safeMint(to, tokenId);

        rwaAssets[tokenId] = RWAAsset({
            name: name,
            pricePhenix: pricePhenix,
            fileHash: fileHash,
            status: RWAStatus.PUBLISHED
        });

        emit RWACreated(tokenId, to);
    }

    function updateRWAStatus(uint256 tokenId, RWAStatus status) external onlyIssuer {
        require(_ownerOf(tokenId) != address(0), "Nonexistent token");
        rwaAssets[tokenId].status = status;
        emit RWAStatusUpdated(tokenId, status);
    }

    function burn(uint256 tokenId) external nonReentrant {
        require(ownerOf(tokenId) == msg.sender, "Not asset owner");

        delete rwaAssets[tokenId];
        _burn(tokenId);

        emit RWABurned(tokenId);
    }

    /* ========================= tokenURI ========================= */

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        try this.ownerOf(tokenId) returns (address) {
            RWAAsset storage rwa = rwaAssets[tokenId];
            return string(
                abi.encodePacked(
                    baseTokenURI,
                    "?id=", _toString(tokenId),
                    "&hash=", rwa.fileHash
                )
            );
        } catch {
            return defaultTokenURI;
        }
    }

    /* ========================= INTERNAL UTILS ========================= */

    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) { digits++; temp /= 10; }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits--;
            buffer[digits] = bytes1(uint8(48 + value % 10));
            value /= 10;
        }
        return string(buffer);
    }

    /* ========================= RWA QUERY EXTENSIONS ========================= */

    struct RWAView {
        uint256 tokenId;
        address owner;
        string tokenURI;
        RWAAsset asset;
    }

    function getAllRWAs() external view returns (RWAView[] memory list) {
        uint256 supply = totalSupply();
        list = new RWAView[](supply);

        for (uint256 i = 0; i < supply; i++) {
            uint256 tokenId = tokenByIndex(i);
            list[i] = _buildRWAView(tokenId);
        }
    }

    function getRWA(uint256 tokenId) external view returns (RWAView memory) {
        require(_ownerOf(tokenId) != address(0), "Nonexistent token");
        return _buildRWAView(tokenId);
    }

    function _buildRWAView(uint256 tokenId) internal view returns (RWAView memory v) {
        v.tokenId = tokenId;
        v.owner = ownerOf(tokenId);
        v.tokenURI = tokenURI(tokenId);
        v.asset = rwaAssets[tokenId];
    }
}
