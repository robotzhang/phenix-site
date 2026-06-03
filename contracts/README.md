# Phenix F-NFT Staking Contracts

This directory contains the production staking contract, Base Sepolia test harness,
deployment scripts, and Foundry tests.

## Networks

- Base Sepolia testnet: chain id `84532`
- Base mainnet: chain id `8453`

## Flow

1. Run local tests with Foundry.
2. Deploy `PhenixFnftStakingTestHarness` on Base Sepolia for short-cycle testing.
3. Deploy `PhenixFnftStaking` on Base Sepolia with production timing for smoke testing.
4. Deploy `PhenixFnftStaking` on Base mainnet after address review.
5. Sync the compiled ABI into the frontend before shipping the staking page.

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

The Base Sepolia PHENIX and F-NFT addresses are already documented in the
project root README and are hardcoded in the Sepolia staking deploy scripts:

- F-NFT: `0xCBfbb824852047a4fA4CdCa98E106C75545B14bc`
- PHENIX: `0x80F325b67D9cf94518930d6E24C631E38F9334f3`

```bash
cd contracts
set -a
source .env
set +a

forge script script/DeployStakingBaseSepoliaHarness.s.sol:DeployStakingBaseSepoliaHarness \
  --rpc-url $BASE_SEPOLIA_RPC_URL --broadcast --browser --sender $DEPLOYER_ADDRESS

forge script script/DeployStakingBaseSepoliaProdParams.s.sol:DeployStakingBaseSepoliaProdParams \
  --rpc-url $BASE_SEPOLIA_RPC_URL --broadcast --browser --sender $DEPLOYER_ADDRESS

FNFT_STAKING_ADDRESS=<deployed staking address> \
forge script script/FundRewards.s.sol:FundRewards \
  --rpc-url $BASE_SEPOLIA_RPC_URL --broadcast --browser --sender $DEPLOYER_ADDRESS

cd ..
npm run staking:sync-abi
```

`DeployMocksBaseSepolia` remains available for isolated testing, but if fresh
mocks are deployed the hardcoded Sepolia addresses must be updated before using
the staking deploy scripts.

## Base Mainnet Deployment

The Base mainnet PHENIX and F-NFT addresses are project constants and are
hardcoded in `DeployStakingBaseMainnet.s.sol`. Mainnet deployment still requires
the deployer wallet address and Base RPC URL:

```bash
cd contracts
set -a
source .env
set +a

forge script script/DeployStakingBaseMainnet.s.sol:DeployStakingBaseMainnet \
  --rpc-url $BASE_RPC_URL --broadcast --browser --sender $DEPLOYER_ADDRESS
```

These scripts use Foundry's external signer flow. `--browser` lets a browser
wallet approve the deployment transaction; encrypted keystore or hardware wallet
signers can also be used without changing the Solidity scripts.

## Verification

```bash
cd contracts
forge verify-contract --chain-id 84532 <staking_address> src/PhenixFnftStaking.sol:PhenixFnftStaking \
  --constructor-args $(cast abi-encode "constructor(address,address,address)" \
  0xCBfbb824852047a4fA4CdCa98E106C75545B14bc 0x80F325b67D9cf94518930d6E24C631E38F9334f3 $DEPLOYER_ADDRESS) \
  --etherscan-api-key $BASESCAN_API_KEY
```

Or use the helper to avoid rebuilding constructor args by hand:

```bash
cd contracts
./script/verify-staking.sh base-sepolia-prod <staking_address>
./script/verify-staking.sh base-sepolia-harness <staking_address>
./script/verify-staking.sh base-mainnet <staking_address>
```

## Frontend Address Config

Cloudflare deployment should not depend on client-side `.env` address injection.
After each staking deployment, update the public frontend addresses in
`app/lib/constants.ts` and commit them:

- `STAKING_NETWORK`
- `BASE_SEPOLIA_FNFT_STAKING_ADDRESS`
- `BASE_FNFT_STAKING_ADDRESS`
- `app/abi/fnft-staking.json` via `npm run staking:sync-abi`

## Notes

- Production rewards and lock periods are fixed in the contract.
- Owner PHENIX withdrawals can make rewards underfunded; this pauses claim and new stake,
  but users can still unstake matured positions.
- Direct ERC721 `transferFrom` can bypass `onERC721Received`; untracked FNFT recovery is
  intentionally owner-only and must be operated by the configured owner address.
