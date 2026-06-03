#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 2 ]]; then
  cat <<'EOF'
Usage:
  ./script/verify-staking.sh <deployment> <staking_address>

Deployments:
  base-sepolia-prod
  base-sepolia-harness
  base-mainnet
EOF
  exit 1
fi

deployment="$1"
staking_address="$2"

case "$deployment" in
  base-sepolia-prod)
    chain_alias="base-sepolia"
    contract_path="src/PhenixFnftStaking.sol:PhenixFnftStaking"
    fnft_address="0xCBfbb824852047a4fA4CdCa98E106C75545B14bc"
    phenix_address="0x80F325b67D9cf94518930d6E24C631E38F9334f3"
    owner_address="${DEPLOYER_ADDRESS:-}"
    ;;
  base-sepolia-harness)
    chain_alias="base-sepolia"
    contract_path="src/PhenixFnftStakingTestHarness.sol:PhenixFnftStakingTestHarness"
    fnft_address="0xCBfbb824852047a4fA4CdCa98E106C75545B14bc"
    phenix_address="0x80F325b67D9cf94518930d6E24C631E38F9334f3"
    owner_address="${DEPLOYER_ADDRESS:-}"
    ;;
  base-mainnet)
    chain_alias="base"
    contract_path="src/PhenixFnftStaking.sol:PhenixFnftStaking"
    fnft_address="0xC1083E18b75A096d32de5BE0fB44ead84f06e402"
    phenix_address="0xBc121C4d6cfE2B7830dCf18163E1892e5bbB1735"
    owner_address="${DEPLOYER_ADDRESS:-}"
    ;;
  *)
    echo "Unknown deployment: $deployment" >&2
    exit 1
    ;;
esac

if [[ -z "${BASESCAN_API_KEY:-}" ]]; then
  echo "BASESCAN_API_KEY is required" >&2
  exit 1
fi

if [[ -z "$owner_address" ]]; then
  echo "DEPLOYER_ADDRESS is required for $deployment constructor args" >&2
  exit 1
fi

constructor_args="$(cast abi-encode "constructor(address,address,address)" "$fnft_address" "$phenix_address" "$owner_address")"

forge verify-contract \
  --chain "$chain_alias" \
  "$staking_address" \
  "$contract_path" \
  --constructor-args "$constructor_args" \
  --etherscan-api-key "$BASESCAN_API_KEY"
