#!/bin/sh
# Entrypoint script for core container: auto-deploy contracts if needed, then start core service

set -e

CONTRACT_ADDR_FILE="/app/contract_addresses/contract_addresses.json"
WASM_DIR="/code/cosmwasm-contracts"
CORE_CMD="./cosmos-permissioned-network start"

# List of contract keys and their wasm subdirs
CONTRACTS="EDUADMISSION_CONTRACT_ADDR:eduadmission\nEDUID_CONTRACT_ADDR:eduid\nEDUCERT_CONTRACT_ADDR:educert\nEDUPAY_CONTRACT_ADDR:edupay\nEDUMARKET_CONTRACT_ADDR:edumarket\nRESEARCHLEDGER_CONTRACT_ADDR:researchledger"

# Helper: deploy contract and return address (mocked for demo)
deploy_contract() {
  wasm_path="$1"
  # Replace this with actual deploy command, e.g.:
  # addr=$(wasmd tx wasm instantiate ... | grep -o 'cosmos1[0-9a-z]*')
  # For demo, generate a fake address:
  addr="cosmos1$(cat /dev/urandom | tr -dc 'a-z0-9' | fold -w 38 | head -n 1)"
  echo "$addr"
}

# Ensure contract addresses file exists
if [ ! -f "$CONTRACT_ADDR_FILE" ]; then
  echo "{}" > "$CONTRACT_ADDR_FILE"
fi

# Check and deploy contracts if needed
changed=0
env_exports=""
echo "$CONTRACTS" | while IFS= read -r entry; do
  key="${entry%%:*}"
  subdir="${entry##*:}"
  wasm_file="$WASM_DIR/$subdir/artifacts/$subdir.wasm"
  # Get current address from JSON
  addr=$(jq -r ".${key}" "$CONTRACT_ADDR_FILE")
  if [ -z "$addr" ] || [ "$addr" = "null" ]; then
    echo "[Entrypoint] $key missing, deploying $wasm_file ..."
    if [ ! -f "$wasm_file" ]; then
      echo "[Entrypoint] ERROR: $wasm_file not found! Build contract first."
      exit 1
    fi
    new_addr=$(deploy_contract "$wasm_file")
    echo "[Entrypoint] $key deployed at $new_addr"
    # Update JSON file
    jq ".${key} = \"$new_addr\"" "$CONTRACT_ADDR_FILE" > "$CONTRACT_ADDR_FILE.tmp" && mv "$CONTRACT_ADDR_FILE.tmp" "$CONTRACT_ADDR_FILE"
    addr="$new_addr"
    changed=1
  else
    echo "[Entrypoint] $key already set: $addr"
  fi
  # Prepare env export string
  env_exports="$env_exports export ${key}=$addr\n"
done

if [ "$changed" -eq 1 ]; then
  echo "[Entrypoint] Updated contract addresses:"
  cat "$CONTRACT_ADDR_FILE"
fi

echo "[Entrypoint] Contract addresses summary:"
echo "$CONTRACTS" | while IFS= read -r entry; do
  key="${entry%%:*}"
  addr=$(jq -r ".${key}" "$CONTRACT_ADDR_FILE")
  echo "  $key: $addr"
done

# Export contract addresses to environment
if [ -n "$env_exports" ]; then
  printf "%b" "$env_exports" > /app/contract_addresses/contract_env.sh
  . /app/contract_addresses/contract_env.sh
fi

echo "[Entrypoint] Starting core service..."
exec $CORE_CMD
