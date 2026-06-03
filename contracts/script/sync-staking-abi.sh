#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/../.." && pwd)"
artifact_path="$repo_root/contracts/out/PhenixFnftStaking.sol/PhenixFnftStaking.json"
target_path="$repo_root/app/abi/fnft-staking.json"

if [[ ! -f "$artifact_path" ]]; then
  echo "Missing artifact: $artifact_path" >&2
  echo "Run 'forge build' or 'forge test' in contracts/ first." >&2
  exit 1
fi

jq '.abi' "$artifact_path" > "$target_path"
echo "Synced staking ABI to $target_path"
