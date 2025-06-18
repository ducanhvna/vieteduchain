#!/bin/sh
# Entrypoint script for core container: auto-deploy contracts if needed, then start core service

# Do not exit on error - we want the container to keep running
set +e 

# Log all commands executed
set -x

CONTRACT_ADDR_FILE="/app/contract_addresses/contract_addresses.json"
WASM_DIR="/code/cosmwasm-contracts"
CORE_CMD="./cosmos-permissioned-network start"

# Create contract_addresses directory if it doesn't exist
mkdir -p /app/contract_addresses

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
  contract_name="$2"
  echo "[Entrypoint] Deploying contract $contract_name from $wasm_path"
  
  # Try to use real wasmd if available, otherwise use mock for demo
  if command -v wasmd >/dev/null 2>&1; then
    echo "[Entrypoint] Using wasmd to deploy contract"
    WALLET="deployer"
    CHAIN_ID="testing"
    NODE="http://localhost:26657"
    FEES="5000stake"
    
    # Store contract code
    store_result=$(wasmd tx wasm store "$wasm_path" --from "$WALLET" --chain-id "$CHAIN_ID" --node "$NODE" --gas auto --fees "$FEES" --output json -y 2>/dev/null)
    
    # Extract code_id from store result
    code_id=$(echo "$store_result" | grep -o '"code_id":"[0-9]*"' | grep -o '[0-9]*')
    
    if [ -z "$code_id" ]; then
      echo "[Entrypoint] Failed to get code_id, falling back to mock deployment"
      addr="cosmos1$(cat /dev/urandom | tr -dc 'a-z0-9' | fold -w 38 | head -n 1)"
    else
      echo "[Entrypoint] Stored contract with code_id: $code_id"
      
      # Instantiate contract
      inst_result=$(wasmd tx wasm instantiate "$code_id" '{}' --from "$WALLET" --label "$contract_name" --admin "$WALLET" --chain-id "$CHAIN_ID" --node "$NODE" --gas auto --fees "$FEES" --output json -y 2>/dev/null)
      
      # Extract contract address
      addr=$(echo "$inst_result" | grep -o '"_contract_address":"cosmos[0-9a-z]*"' | grep -o 'cosmos[0-9a-z]*')
      
      if [ -z "$addr" ]; then
        echo "[Entrypoint] Failed to get contract address, falling back to mock deployment"
        addr="cosmos1$(cat /dev/urandom | tr -dc 'a-z0-9' | fold -w 38 | head -n 1)"
      else
        echo "[Entrypoint] Instantiated contract at address: $addr"
      fi
    fi
  else
    echo "[Entrypoint] wasmd not available, using mock deployment"
    addr="cosmos1$(cat /dev/urandom | tr -dc 'a-z0-9' | fold -w 38 | head -n 1)"
  fi
  
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
echo "[Entrypoint] Checking and deploying contracts..."

# Lặp qua từng contract, build nếu cần và deploy
echo "$CONTRACTS" | while IFS=: read -r key subdir; do
  echo "[Entrypoint] Processing contract: $key ($subdir)"
  wasm_file="$WASM_DIR/$subdir/artifacts/$subdir.wasm"
  contract_dir="$WASM_DIR/$subdir"
  
  # Build contract if wasm file doesn't exist but source code does
  if [ ! -f "$wasm_file" ] && [ -d "$contract_dir" ]; then
    echo "[Entrypoint] Building wasm for $subdir..."
    if [ -f "$contract_dir/Makefile" ]; then
      (cd "$contract_dir" && make build)
    elif [ -f "$contract_dir/Cargo.toml" ]; then
      echo "[Entrypoint] Building with cargo..."
      (cd "$contract_dir" && cargo build --release --target wasm32-unknown-unknown)
      mkdir -p "$contract_dir/artifacts"
      cp "$contract_dir/target/wasm32-unknown-unknown/release/$subdir.wasm" "$wasm_file" 2>/dev/null || true
    fi
  fi
  
  # Check if wasm file exists now
  if [ ! -f "$wasm_file" ]; then
    echo "[Entrypoint] WARNING: $wasm_file still NOT FOUND after build attempt!"
    # Create empty placeholder wasm file for testing
    mkdir -p "$(dirname "$wasm_file")"
    echo "dummy wasm for testing" > "$wasm_file"
    echo "[Entrypoint] Created dummy wasm file for testing: $wasm_file"
  fi
  
  # Get current address from file
  addr=$(jq -r ".${key}" "$CONTRACT_ADDR_FILE")
  
  # Deploy if address is missing or invalid
  if [ -z "$addr" ] || [ "$addr" = "null" ]; then
    echo "[Entrypoint] $key missing, deploying $wasm_file..."
    new_addr=$(deploy_contract "$wasm_file" "$subdir")
    echo "[Entrypoint] $key deployed at $new_addr"
    jq ".${key} = \"$new_addr\"" "$CONTRACT_ADDR_FILE" > "$CONTRACT_ADDR_FILE.tmp" && mv "$CONTRACT_ADDR_FILE.tmp" "$CONTRACT_ADDR_FILE"
    addr="$new_addr"
    changed=1
  else
    echo "[Entrypoint] $key already set: $addr"
  fi
  
  # Add to environment exports
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

# Copy contract_addresses.json ra volume node tương ứng nếu NODE_ID có giá trị
# Luôn copy contract_addresses.json ra volume contract_addresses (đúng với docker-compose)
cp "$CONTRACT_ADDR_FILE" /app/contract_addresses/contract_addresses.json
chmod 666 /app/contract_addresses/contract_addresses.json
echo "[Entrypoint] Copied contract_addresses.json to /app/contract_addresses/contract_addresses.json with permissions 666"
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

# Export contract addresses as environment variables for other containers to read
echo "[Entrypoint] Creating contract_env.sh with environment variables"
echo '#!/bin/sh' > /app/contract_addresses/contract_env.sh
echo "# Contract environment variables generated at $(date)" >> /app/contract_addresses/contract_env.sh
echo "# This file is automatically generated by entrypoint_core.sh" >> /app/contract_addresses/contract_env.sh
echo "" >> /app/contract_addresses/contract_env.sh

# Read the latest contract addresses from the JSON file
echo "$CONTRACTS" | while IFS=: read -r key subdir; do
  addr=$(jq -r ".${key}" "$CONTRACT_ADDR_FILE")
  if [ -n "$addr" ] && [ "$addr" != "null" ]; then
    echo "export ${key}=${addr}" >> /app/contract_addresses/contract_env.sh
    echo "[Entrypoint] Added ${key}=${addr} to environment variables"
  else
    echo "[Entrypoint] WARNING: ${key} not found in contract_addresses.json"
    # Add a placeholder value that shows there's a problem
    echo "export ${key}=CONTRACT_NOT_DEPLOYED_${subdir}" >> /app/contract_addresses/contract_env.sh
  fi
done

# Make the file executable
chmod 755 /app/contract_addresses/contract_env.sh
echo "[Entrypoint] Environment file created at /app/contract_addresses/contract_env.sh"

# Show the contents of the environment file
echo "[Entrypoint] contract_env.sh contents:"
cat /app/contract_addresses/contract_env.sh

echo "[Entrypoint] Starting core service..."

# Make sure the contract addresses are readable
chmod -R 777 /app/contract_addresses

# Start the core service in the background
echo "[Entrypoint] Running: $CORE_CMD"
$CORE_CMD &
CORE_PID=$!

# Signal handler for graceful shutdown
trap 'kill $CORE_PID 2>/dev/null || true; echo "Container stopping..."; exit 0' TERM INT

echo "[Entrypoint] Core service started with PID $CORE_PID"
echo "[Entrypoint] Container will remain running to keep files accessible"

# Log a message every 60 seconds to show container is still alive
while true; do
  # Check if contract_addresses.json exists and has been updated
  if [ -f "$CONTRACT_ADDR_FILE" ]; then
    echo "[Entrypoint] Contract addresses at $(date):"
    cat "$CONTRACT_ADDR_FILE"
    
    # Copy the file to host-mounted volume again to ensure it's synchronized
    cp -f "$CONTRACT_ADDR_FILE" /app/contract_addresses/contract_addresses.json
    
    # Add extra permission to ensure host can read it
    chmod 666 /app/contract_addresses/contract_addresses.json
    
    # Copy to node-specific directory if NODE_ID is set
    if [ -n "$NODE_ID" ]; then
      VOLUME_DIR="/app/contract_addresses_node$NODE_ID"
      mkdir -p "$VOLUME_DIR"
      cp -f "$CONTRACT_ADDR_FILE" "$VOLUME_DIR/contract_addresses.json"
      chmod 666 "$VOLUME_DIR/contract_addresses.json"
      echo "[Entrypoint] Updated $VOLUME_DIR/contract_addresses.json"
    fi
  else
    echo "[Entrypoint] Contract addresses file not found at $CONTRACT_ADDR_FILE"
  fi
  
  # Sleep for 60 seconds
  sleep 60
done
