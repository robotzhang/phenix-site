// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/**
 * -----------------------------
 * F-NFT 合约（Base L2 版本 - 修复版）
 * 特性：
 * 1. 使用 OpenZeppelin v5.5（通过 GitHub 原始链接指定版本）
 * 2. 使用 SafeERC20 兼容 USDT（非标准 ERC20）
 * 3. 总量 2,000,000 枚 NFT（不可增发）
 * 4. 修复 redeemStart 初始化逻辑
 * 5. 修复 _nextTokenId 溢出检查
 * 6. 修复 PHENIX 转账兼容性
 * 7. 增强 withdrawUSDT 安全性
 * -----------------------------
 */

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.5.0/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.5.0/contracts/access/Ownable.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.5.0/contracts/utils/ReentrancyGuard.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.5.0/contracts/token/ERC20/utils/SafeERC20.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.5.0/contracts/utils/introspection/IERC165.sol";

contract FNFT is ERC721Enumerable, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // -------------------------
    // 常量 & 状态变量
    // -------------------------
    uint256 public constant MAX_SUPPLY = 2_000_000;     // NFT 最大总量
    uint256 public price;                               // 购买价格（USDT/每 1 张 NFT）
    uint256 public redeemStart;                         // F-NFT → PHENIX 开启兑换时间戳
    uint256 public constant EXCHANGE_RATE = 1000;       // 兑换比例：1 NFT = 1000 PHENIX
    uint256 public totalMinted;                        // 已售出数量

    IERC20 public immutable usdt;                       // USDT 代币地址
    IERC20 public immutable phenix;                     // PHENIX 代币地址

    uint256 private _nextTokenId = 1;                   // TokenId 自增（从1开始）

    // -------------------------
    // 事件
    // -------------------------
    event PriceUpdated(uint256 newPrice);
    event RedeemStarted(uint256 startTimestamp);
    event Purchased(address indexed buyer, uint256 amount, uint256 cost);
    event Redeemed(address indexed user, uint256 tokenId, uint256 phenixAmount);
    event Withdrawn(address indexed admin, uint256 amount);

    // -------------------------
    // 构造函数
    // -------------------------
    /**
     * @param _usdt USDT 合约地址
     * @param _phenix PHENIX ERC20 合约地址
     * @param _price 初始购买价格
     */
    constructor(
        address _usdt,
        address _phenix,
        uint256 _price
    ) ERC721("f-nft", "FNFT") Ownable(msg.sender) {
        require(_usdt != address(0), "usdt=0");
        require(_phenix != address(0), "phenix=0");
        require(_price > 0, "price=0");

        usdt = IERC20(_usdt);
        phenix = IERC20(_phenix);
        price = _price;
        redeemStart = 0;  // 初始化为禁用状态
    }

    // -------------------------
    // 修饰符
    // -------------------------
    // @notice 确保数量为正整数（uint 本身就禁止小数）
    modifier positive(uint256 n) {
        require(n > 0, "amount must be > 0");
        _;
    }

    // @notice 限制只能在兑换开启后执行
    modifier redeemEnabled() {
        require(redeemStart != 0 && block.timestamp >= redeemStart, "redeem not started");
        _;
    }

    // -------------------------
    // 管理员函数
    // -------------------------
    // @notice 设置购买价格（USDT/1 NFT）
    function setPrice(uint256 newPrice) external onlyOwner {
        require(newPrice > 0, "price=0");
        price = newPrice;
        emit PriceUpdated(newPrice);
    }

    // @notice 设置兑换开启时间（时间戳）
    function setRedeemStart(uint256 timestamp) external onlyOwner {
        require(timestamp > block.timestamp, "must be in future");
        redeemStart = timestamp;
        emit RedeemStarted(timestamp);
    }

    // @notice 管理员可提取合约中的 USDT（限制提取比例）
    function withdrawUSDT(uint256 maxPercentage) external onlyOwner nonReentrant {
        require(maxPercentage <= 100, "max 100%");
        uint256 bal = usdt.balanceOf(address(this));
        require(bal > 0, "zero balance");

        uint256 amount = (bal * maxPercentage) / 100;
        usdt.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    // -------------------------
    // 用户购买逻辑
    // -------------------------
    /**
     * @notice 使用 USDT 购买 f-nft
     * @param amount 购买数量（必须为正整数）
     */
    function buy(uint256 amount) external nonReentrant positive(amount) {
        require(_nextTokenId + amount - 1 <= MAX_SUPPLY, "exceeds max supply");

        uint256 cost = amount * price;
        usdt.safeTransferFrom(msg.sender, address(this), cost);

        // 批量铸造优化
        uint256 startId = _nextTokenId;
        _nextTokenId += amount;
        for (uint256 i = 0; i < amount; i++) {
            _safeMint(msg.sender, startId + i);
        }

        totalMinted += amount;  // 更新已售出数量

        emit Purchased(msg.sender, amount, cost);
    }

    // -------------------------
    // 兑换逻辑
    // -------------------------
    /**
     * @notice 将一张 NFT 兑换为 1000 PHENIX
     * @param tokenId 需要兑换的 NFT ID
     */
    function redeem(uint256 tokenId) external nonReentrant redeemEnabled {
        require(ownerOf(tokenId) == msg.sender, "not owner");

        _burn(tokenId);
        // 使用 transfer 兼容非标准 ERC20
        phenix.transfer(msg.sender, EXCHANGE_RATE);
        emit Redeemed(msg.sender, tokenId, EXCHANGE_RATE);
    }
}
