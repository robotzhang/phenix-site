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
- usdt: 0x9Ed1f88180436C8F3202b4f0f02A7382FaD8f4BC 1000000000
- phenix: 0x80F325b67D9cf94518930d6E24C631E38F9334f3 2000000000(20亿)
- f-nft: 0xe63700809Ff3703EDc58FdFAECd19BB05E8c09ca
- setRedeemStart 时间戳，必须到秒：js: Math.floor(Date.now() / 1000) + 60


# deploy
1. 一定要先把 phenix 桥接到 base L2 网络
2. 然后要将 phenix 代币转入 f-nft 合约地址
3. usdt address: 0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2
4. phenix 主网合约地址：0xe713Dcf81438ce1DF23E4C423e74F181c7FB249d

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
