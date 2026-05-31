# Phenix F-NFT Staking Contracts

This directory contains the production staking contract, Base Sepolia test harness,
deployment scripts, and Foundry tests.

## Networks

- Base Sepolia testnet: chain id `84532`
- Base mainnet: chain id `8453`

## Flow

1. Run local tests with Foundry.
2. Deploy mocks and `PhenixFnftStakingTestHarness` on Base Sepolia for short-cycle testing.
3. Deploy `PhenixFnftStaking` on Base Sepolia with production timing for smoke testing.
4. Deploy `PhenixFnftStaking` on Base mainnet after address and multisig review.

## Setup

```bash
cd contracts
git -C .. submodule update --init --recursive contracts/lib/forge-std
cp .env.example .env
forge test
```

`forge-std` is pinned as a git submodule in this repository. Do not replace it
with a local `forge install --no-git` checkout when preparing deployment.

## Base Sepolia Deployment

```bash
cd contracts
forge script script/DeployMocksBaseSepolia.s.sol:DeployMocksBaseSepolia \
  --rpc-url $BASE_SEPOLIA_RPC_URL --broadcast

forge script script/DeployStakingBaseSepoliaHarness.s.sol:DeployStakingBaseSepoliaHarness \
  --rpc-url $BASE_SEPOLIA_RPC_URL --broadcast

forge script script/DeployStakingBaseSepoliaProdParams.s.sol:DeployStakingBaseSepoliaProdParams \
  --rpc-url $BASE_SEPOLIA_RPC_URL --broadcast

FNFT_STAKING_ADDRESS=<deployed staking address> \
forge script script/FundRewards.s.sol:FundRewards \
  --rpc-url $BASE_SEPOLIA_RPC_URL --broadcast
```

## Verification

```bash
cd contracts
forge verify-contract --chain-id 84532 <staking_address> src/PhenixFnftStaking.sol:PhenixFnftStaking \
  --constructor-args $(cast abi-encode "constructor(address,address,address)" \
  $BASE_SEPOLIA_FNFT_ADDRESS $BASE_SEPOLIA_PHENIX_ADDRESS $BASE_SEPOLIA_OWNER_MULTISIG) \
  --etherscan-api-key $BASESCAN_API_KEY
```

## Frontend Address Config

Cloudflare deployment should not depend on client-side `.env` address injection.
After each staking deployment, update the public frontend addresses in
`app/lib/constants.ts` and commit them:

- `STAKING_NETWORK`
- `BASE_SEPOLIA_FNFT_ADDRESS`
- `BASE_SEPOLIA_PHENIX_ADDRESS`
- `BASE_SEPOLIA_FNFT_STAKING_ADDRESS`
- `BASE_FNFT_STAKING_ADDRESS`

## Notes

- Production rewards and lock periods are fixed in the contract.
- Owner PHENIX withdrawals can make rewards underfunded; this pauses claim and new stake,
  but users can still unstake matured positions.
- Direct ERC721 `transferFrom` can bypass `onERC721Received`; untracked FNFT recovery is
  intentionally owner-only and must be operated by multisig.
