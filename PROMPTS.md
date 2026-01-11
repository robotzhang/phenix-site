# RWA
我现在需要在 base L2 网络上发布一个合约，具有以下功能：
1. 合约拥有者可以授权钱包发布 RWA 资产上架。
2. 发布合约时需要指定 PHENIX 合约地址。
3. 上架 RWA 资产，需要发布如下信息：RWA 名称、RWA 价格(PHENIX定价)、RWA 文件包 hash 值。
4. 发布合约后需要锁定 PHENIX 到 RWA 资产，PHENIX 从合约中划转。
5. RWA 资产拥有者可以销毁该资产。
6. 销毁资产则将锁定的 PHENIX 资产转到 RWA 资产拥有者。
7. 销毁 RWA 划转 PHENIX 时需要收取 5% 的手续费，手续费直接划转到合约地址。
8. 合约拥有者可以设置收取手续费的比例。
9. 合约拥有人可以充值和取出 PHENIX。
10. PHENIX 定价需要考虑 18 位小数，考虑人类可读。

请注意：
1. 构建在 base L2 网络之上。
2. 使用 solidity ^0.8.30。
3. 外部的包使用 https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.5.0/contracts/token/ERC721/extensions/ERC721Enumerable.sol 这种 github 的方式引用。 
4. 给出生产级别的代码，注释完备清晰，能够在 remix.ethereum.org 直接编译通过。