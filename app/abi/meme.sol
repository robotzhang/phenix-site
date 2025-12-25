// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/**
 * ------------------------------------------------------------
 * Phenix Meme Mining Contract
 * ------------------------------------------------------------
 * Network : Base L2
 * Compiler: Solidity ^0.8.30
 * ------------------------------------------------------------
 */
import "https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-contracts/v5.5.0/contracts/token/ERC20/ERC20.sol";
import "https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-contracts/v5.5.0/contracts/token/ERC20/utils/SafeERC20.sol";
import "https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-contracts/v5.5.0/contracts/access/Ownable.sol";

contract PhenixMeme is ERC20, Ownable {
    using SafeERC20 for IERC20;

    /* ========================= CONSTANTS ========================= */
    uint256 public constant PHENIX_PER_MEME = 500 * 1e18;
    uint256 public constant TOTAL_PHENIX_CAP = 2_500_000_000 * 1e18;

    /* ========================= STATE ========================= */
    IERC20 public immutable usdt; // 6 decimals
    IERC20 public immutable phenix; // 18 decimals

    uint256 public totalPhenixMined;
    uint256 public totalMemeMinted;

    bool public redeemEnabled;

    /* ========================= EVENTS ========================= */
    event MemeMined(
        address indexed user,
        uint256 memeAmount,
        uint256 usdtPaid
    );
    event MemeRedeemed(
        address indexed user,
        uint256 memeAmount,
        uint256 phenixAmount
    );
    event RedeemEnabled();
    event UsdtWithdrawn(address indexed owner, uint256 amount);

    /* ========================= STAGES ========================= */
    struct Stage {
        uint256 phenixStart;
        uint256 phenixEnd;
        uint256 priceUsdt; // 6 decimals
    }

    Stage[] public stages;

    /* ========================= CONSTRUCTOR ========================= */
    constructor(
        address usdtAddress,
        address phenixAddress
    ) ERC20("Phenix MEME", "MEME") Ownable(msg.sender) {
        usdt = IERC20(usdtAddress);
        phenix = IERC20(phenixAddress);
        _initStages();
    }

    /* ========================= STAGE INIT ========================= */
    function _initStages() internal {
        stages.push(Stage(0, 1_000_000_000e18, 100));
        stages.push(Stage(1_000_000_000e18, 1_600_000_000e18, 333));
        stages.push(Stage(1_600_000_000e18, 1_900_000_000e18, 1_000));
        stages.push(Stage(1_900_000_000e18, 2_200_000_000e18, 1_333));
        stages.push(Stage(2_200_000_000e18, 2_300_000_000e18, 25_000_000));
        stages.push(Stage(2_300_000_000e18, 2_320_000_000e18, 30_000_000));
        stages.push(Stage(2_320_000_000e18, 2_340_000_000e18, 35_000_000));
        stages.push(Stage(2_340_000_000e18, 2_360_000_000e18, 40_000_000));
        stages.push(Stage(2_360_000_000e18, 2_380_000_000e18, 45_000_000));
        stages.push(Stage(2_380_000_000e18, 2_400_000_000e18, 50_000_000));
        stages.push(Stage(2_400_000_000e18, 2_420_000_000e18, 55_000_000));
        stages.push(Stage(2_420_000_000e18, 2_440_000_000e18, 60_000_000));
        stages.push(Stage(2_440_000_000e18, 2_460_000_000e18, 65_000_000));
        stages.push(Stage(2_460_000_000e18, 2_480_000_000e18, 70_000_000));
        stages.push(Stage(2_480_000_000e18, 2_500_000_000e18, 75_000_000));
    }

    /* ========================= VIEW ========================= */
    function currentStage() public view returns (Stage memory s) {
        for (uint256 i = 0; i < stages.length; i++) {
            if (
                totalPhenixMined >= stages[i].phenixStart &&
                totalPhenixMined < stages[i].phenixEnd
            ) {
                return stages[i];
            }
        }
        revert("Mining finished");
    }

    /* ========================= INTERNAL UTILS ========================= */
    function _memeToPhenix(uint256 memeHuman) internal pure returns (uint256) {
        return memeHuman * PHENIX_PER_MEME;
    }

    function _memeToWei(uint256 memeHuman) internal pure returns (uint256) {
        return memeHuman * 1e18;
    }

    /* ========================= PREVIEW ========================= */
    function previewMine(
        uint256 memeHuman
    ) external view returns (uint256 usdtCost, uint256 phenixOut) {
        uint256 memeRemaining = _memeToWei(memeHuman);
        uint256 tempPhenix = totalPhenixMined;

        while (memeRemaining > 0 && tempPhenix < TOTAL_PHENIX_CAP) {
            Stage memory s;
            bool found;
            for (uint256 i = 0; i < stages.length; i++) {
                if (
                    tempPhenix >= stages[i].phenixStart &&
                    tempPhenix < stages[i].phenixEnd
                ) {
                    s = stages[i];
                    found = true;
                    break;
                }
            }
            require(found, "No stage");

            uint256 stageRemain = s.phenixEnd - tempPhenix;
            uint256 memeStage = (stageRemain / PHENIX_PER_MEME) * 1e18;
            uint256 use = memeRemaining < memeStage ? memeRemaining : memeStage;

            uint256 memeH = use / 1e18;
            usdtCost += memeH * s.priceUsdt;
            uint256 phenixThis = _memeToPhenix(memeH);

            phenixOut += phenixThis;
            tempPhenix += phenixThis;
            memeRemaining -= use;
        }
    }

    /* ========================= MINING ========================= */
    function mine(
        uint256 memeHuman,
        uint256 maxUsdtCost
    ) external {
        require(!redeemEnabled, "Mining ended");
        require(memeHuman > 0, "Zero amount");

        uint256 memeRemaining = _memeToWei(memeHuman);
        uint256 usdtCost;
        uint256 phenixThisTx;

        while (memeRemaining > 0) {
            Stage memory s = currentStage();

            uint256 stageRemain = s.phenixEnd - totalPhenixMined;
            uint256 memeStage = (stageRemain / PHENIX_PER_MEME) * 1e18;
            uint256 use = memeRemaining < memeStage ? memeRemaining : memeStage;

            uint256 memeH = use / 1e18;
            uint256 cost = memeH * s.priceUsdt;
            uint256 phenixOut = _memeToPhenix(memeH);

            usdtCost += cost;
            phenixThisTx += phenixOut;

            totalPhenixMined += phenixOut;
            totalMemeMinted += use;
            memeRemaining -= use;

            if (totalPhenixMined == TOTAL_PHENIX_CAP) {
                redeemEnabled = true;
                emit RedeemEnabled();
                break;
            }
        }

        require(usdtCost <= maxUsdtCost, "Slippage exceeded");

        usdt.safeTransferFrom(msg.sender, address(this), usdtCost);
        _mint(msg.sender, _memeToWei(memeHuman));

        emit MemeMined(msg.sender, _memeToWei(memeHuman), usdtCost);
    }

    /* ========================= REDEEM ========================= */
    function redeem(uint256 memeHuman) external {
        require(redeemEnabled, "Redeem not enabled");

        uint256 amount = _memeToWei(memeHuman);
        require(balanceOf(msg.sender) >= amount, "Insufficient MEME");

        uint256 phenixOut = _memeToPhenix(memeHuman);
        _burn(msg.sender, amount);
        phenix.safeTransfer(msg.sender, phenixOut);

        emit MemeRedeemed(msg.sender, amount, phenixOut);
    }

    /* ========================= TRANSFER ========================= */
    function _update(
        address from,
        address to,
        uint256 amount
    ) internal override {
        // 已移除锁仓检查，直接使用 ERC20 默认转账逻辑
        super._update(from, to, amount);
    }

    /* ========================= OWNER ========================= */
    function withdrawUsdt(uint256 amount) external onlyOwner {
        usdt.safeTransfer(msg.sender, amount);
        emit UsdtWithdrawn(msg.sender, amount);
    }
}
