# phenix site

# DEPLOY 合约
- 注意 price 要带6位0: 100000000 这才是100u

## 使用 shadcn ui
在 tsconfig.json 文件中添加 path alias
```json
{
  "compilerOptions": {
    "baseUrl": "./",
    "paths": {
      "@/*": ["app/*"]
    }
  }
}
```

## 提示词
### 购买
我现在需要开发一个购买的功能，已知的信息如下：
1. 合约部署在 base sepolia testnet
2. 合约地址的数据放在了 @/lib/constants.ts 文件，内容如下：
```
export const FNFT_ADDRESS = "0xE225ee9cf947c3F78b78EB8F4600501742B5d2d4"; // F-NFT 地址
export const PHENIX_ADDRESS = "0x35CF1a00a53f17145bEfddbD9F720CA05C76f39f"; // 模拟的 Phenix 代币地址
export const USDT_ADDRESS = "0x5502af653792D5d24876f12Ac6658eC2332224bB"; // 模拟的 usdt 地址
export const USDT_DECIMALS = 6;
export const PHENIX_DECIMALS = 18;
export const FNFT_DECIMALS = 18;
export const FNFT_MAX_SUPPLY = 2000000;
```
3. 使用了 "viem": "^2.39.0", "wagmi": "^2.19.3", "ethers": "^6.15.0",
4. 钱包链接通过 rainbowkit 已经实现
5. 使用 shadcn 作为 ui 库
6. abi 文件放到了 @/abi/fnft.json 文件里，内容请查看上传的附件。

我需要实现以下功能：
1. 获取 f-nft 对 usdt 的价格(price)，已经售出的量，注意：这些数据应该不用连接钱包就能获取到。
2. 获取 f-nft 的销售记录，同样这也应该不用链接钱包就获取到。
3. 用户通过 usdt 购买 f-nft，如果 usdt 不够则不应该发起调用。

请仔细思考，特别是使用的包的版本，结合最新的文档，帮忙生成代码，注意：
1. 要简洁并且加注释
2. 不能出现 import 错误，typescript 错误
3. 生产可用

# resources
- https://www.alchemy.com/faucets/base-sepolia # 测试网以太坊，每天领0.1eth，不需要注册，非常快速

# test
f-nft price 必须是6位小数 100000000 才是100u
- usdt: 0xa66Beb8229d7D7C5B078Bea2ae3E87C4DBEe3902 1000000000
- phenix: 0x80F325b67D9cf94518930d6E24C631E38F9334f3 2000000000(20亿)
- f-nft: 0xCBfbb824852047a4fA4CdCa98E106C75545B14bc
- setRedeemStart 时间戳，必须到秒：js: Math.floor(Date.now() / 1000) + 60


# deploy
1. 一定要先把 phenix 桥接到 base L2 网络
2. 然后要将 phenix 代币转入 f-nft 合约地址
3. usdt address: 0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2
4. phenix base 主网合约地址: 0xf9A7E7D1EA36F2Bbf9e6AD3988177DC001d0f8c0
5. f-nft: 0xceBc6e3bDbDd972658056CB852B5F1bA8e548268

# 桥接资产
1. 桥接主合约以太坊到 base L2 以太坊，用于发布合约的 gas
2. 使用 主合约地址 在 base L2 上发布合约
3. 桥接 L1 资产到 L2 上，通过 base 的桥接代码


# prompts
GEO 时代下的官网会是什么形态？如何将 SEO 时代的建站系统升级？

GEO 建站 SAAS 系统，
我需要：
1. 核心卖点
2. 核心功能列表
3. 匹配的开源组件
4. 实现系统的 SOP

# meme prompts
我现在想做一个 meme 合约用于 phenix 代币的挖矿, meme 是 ERC20 代币，
1. 构建在 base L2 网络之上
2. 使用 solidity ^0.8.30
3. 挖矿 phenix 总量为 25亿枚， 挖矿最小单位为500枚phenix，即1meme=500phenix
4. 价格的算法为：
   1-10亿枚 phenix, 产出200万张meme，价格为 0.0001U;
   10-16亿枚 phenix, 产出120万张meme，价格为 0.000333U;
   16-19亿枚 phenix, 产出60万张meme，价格为 0.001U;
   19-22亿枚 phenix, 产出60万张meme，价格为 0.001333U;
   22-23亿枚 phenix，产出20万张meme，价格为 0.001333U;
   22亿-23亿枚 phenix，产出20万张meme，价格为为25U；
   23亿-23.2亿枚 phenix，产出4万张meme，价格为为30U；
   23.2-23.4亿枚 phenix，产出4万张meme，价格为为35U；
   23.4-23.6亿枚 phenix，产出4万张meme，价格为为40U；
   23.6-23.8亿枚 phenix，产出4万张meme，价格为为45U；
   23.8-24亿枚 phenix，产出4万张meme，价格为为50U；
   24-24.2亿枚 phenix，产出4万张meme，价格为为55U；
   24.2-24.4亿枚 phenix，产出4万张meme，价格为为60U；
   24.4-24.6亿枚 phenix，产出4万张meme，价格为为65U；
   24.6-24.8亿枚 phenix，产出4万张meme，价格为为70U；
   24.8-25亿，产出4万张meme，价格为为75U；
5. 合约拥有者可以取出 usdt
6. 挖矿完成后，即 phenix 被 100% 挖出，开放 meme 兑换成 phenix
7. phenix 是单独的 ERC20 合约，由主网桥接到 base L2 网络
8. 合约能查看已产出meme数量，当前价格
9. 部署合约时能设置 usdt 和 phenix 的合约地址
10. usdt 为6位小数，phenix 为 18 位小数，用户挖矿时需要使用人类正常的位数
11. 用户购买 meme 时，要考虑跨价格区间的问题
12. 支持meme锁仓，可以自定义锁仓时长，默认一年

请注意要给出生产级别的代码，注释完备清晰，能够在 remix.ethereum.org 直接编译通过，外部的包使用 https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.5.0/contracts/token/ERC721/extensions/ERC721Enumerable.sol 这种 github 的方式引用 

testnet:
meme address: 0x7e517e4Efb16807c14188c83bBC7D6756c1ea64B