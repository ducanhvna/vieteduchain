#!/bin/sh
# Entrypoint script for core container: auto-deploy contracts if needed, then start core service

set -e

CONTRACT_ADDR_FILE="/app/contract_addresses/contract_addresses.json"
WASM_DIR="/code/cosmwasm-contracts"
CORE_CMD="./cosmos-permissioned-network start"

# List of contract keys và subdir
CONTRACTS="EDUADMISSION_CONTRACT_ADDR:eduadmission
EDUID_CONTRACT_ADDR:eduid
EDUCERT_CONTRACT_ADDR:educert
EDUPAY_CONTRACT_ADDR:edupay
EDUMARKET_CONTRACT_ADDR:edumarket
RESEARCHLEDGER_CONTRACT_ADDR:researchledger
GRANT_CONTRACT_ADDR:grant
UPLOAD_CONTRACT_ADDR:upload
NODEINFO_CONTRACT_ADDR:nodeinfo"

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

# Build wasm thật cho các contract còn thiếu trước khi deploy
echo "[Entrypoint] Checking if any contracts need to be built..."
for entry in $CONTRACTS; do
  subdir="${entry##*:}"
  wasm_file="$WASM_DIR/$subdir/artifacts/$subdir.wasm"
  contract_dir="$WASM_DIR/$subdir"
  if [ ! -f "$wasm_file" ] && [ -d "$contract_dir" ]; then
    echo "[Entrypoint] Building wasm for $subdir ..."
    if [ -f "$contract_dir/Makefile" ]; then
      (cd "$contract_dir" && make build)
    elif [ -f "$contract_dir/Cargo.toml" ]; then
      (cd "$contract_dir" && cargo build --release --target wasm32-unknown-unknown)
      mkdir -p "$contract_dir/artifacts"
      cp "$contract_dir/target/wasm32-unknown-unknown/release/$subdir.wasm" "$wasm_file" 2>/dev/null || true
    fi
  fi
done

# Check and deploy contracts if needed
changed=0
env_exports=""
# Lặp qua từng contract, KHÔNG tạo dummy wasm nữa, chỉ deploy nếu file wasm thật tồn tại
while IFS=: read -r key subdir; do
  wasm_file="$WASM_DIR/$subdir/artifacts/$subdir.wasm"
  if [ ! -f "$wasm_file" ]; then
    echo "[Entrypoint] ERROR: $wasm_file NOT FOUND! Bỏ qua $key."
    continue
  fi
  addr=$(jq -r ".${key}" "$CONTRACT_ADDR_FILE")
  if [ -z "$addr" ] || [ "$addr" = "null" ]; then
    echo "[Entrypoint] $key missing, deploying $wasm_file ..."
    new_addr=$(deploy_contract "$wasm_file")
    echo "[Entrypoint] $key deployed at $new_addr"
    jq ".${key} = \"$new_addr\"" "$CONTRACT_ADDR_FILE" > "$CONTRACT_ADDR_FILE.tmp" && mv "$CONTRACT_ADDR_FILE.tmp" "$CONTRACT_ADDR_FILE"
    addr="$new_addr"
    changed=1
  else
    echo "[Entrypoint] $key already set: $addr"
  fi
  env_exports="$env_exports export ${key}=$addr\n"
done <<EOF
$CONTRACTS
EOF

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

# Copy contract_addresses.json ra volume node tương ứng nếu NODE_ID có giá trị
# Luôn copy contract_addresses.json ra volume contract_addresses (đúng với docker-compose)
cp "$CONTRACT_ADDR_FILE" /app/contract_addresses/contract_addresses.json
chmod 666 /app/contract_addresses/contract_addresses.json
echo "[Entrypoint] Copied contract_addresses.json to /app/contract_addresses/contract_addresses.json with permissions 666"

# Nếu NODE_ID, vẫn copy ra contract_addresses_node$NODE_ID để backward compatible (nếu cần)
if [ -n "$NODE_ID" ]; then
  VOLUME_DIR="/app/contract_addresses_node$NODE_ID"
  mkdir -p "$VOLUME_DIR"
  cp "$CONTRACT_ADDR_FILE" "$VOLUME_DIR/contract_addresses.json"
  chmod 666 "$VOLUME_DIR/contract_addresses.json"
  echo "[Entrypoint] Copied contract_addresses.json to $VOLUME_DIR/contract_addresses.json with permissions 666"
  
  # Also try copying to alternative paths that might be volume-mounted
  for ALT_DIR in "/app/deploy/contract_addresses_node$NODE_ID" "/code/deploy/contract_addresses_node$NODE_ID"; do
    if [ -d "$(dirname "$ALT_DIR")" ]; then
      mkdir -p "$ALT_DIR"
      cp "$CONTRACT_ADDR_FILE" "$ALT_DIR/contract_addresses.json"
      chmod 666 "$ALT_DIR/contract_addresses.json"
      echo "[Entrypoint] Also copied contract_addresses.json to $ALT_DIR/contract_addresses.json"
    fi
  done
fi

# Export addresses as environment variables for other containers to read
echo "[Entrypoint] Creating contract_env.sh with environment variables"
echo '#!/bin/sh' > /app/contract_addresses/contract_env.sh
echo "$CONTRACTS" | while IFS=: read -r key subdir; do
  addr=$(jq -r ".${key}" "$CONTRACT_ADDR_FILE")
  if [ -n "$addr" ] && [ "$addr" != "null" ]; then
    echo "export ${key}=${addr}" >> /app/contract_addresses/contract_env.sh
  fi
done
chmod 755 /app/contract_addresses/contract_env.sh

echo "[Entrypoint] Starting core service..."
exec $CORE_CMD
