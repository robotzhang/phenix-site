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
- phenix: 0xEC25aC2BEA897C8e1c33F40500bda71e523B7aa4 10000000000
- f-nft: 0x5150da54f0cfCCcC3771E032E1925d7404cf176C
- setRedeemStart 时间戳，必须到秒：js: Math.floor(Date.now() / 1000) + 60


# deploy
1. 一定要先把 phenix 桥接到 base L2 网络
2. 然后要将 phenix 代币转入 f-nft 合约地址
