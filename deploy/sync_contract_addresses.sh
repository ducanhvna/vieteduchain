#!/bin/sh
# Script to synchronize contract addresses between all containers

set -e

echo "[Sync] Starting contract address synchronization..."

# Define locations
CONTRACT_ADDR_FILE="/app/contract_addresses/contract_addresses.json"
NODE1_DIR="/app/contract_addresses_node1"
NODE2_DIR="/app/contract_addresses_node2"
NODE3_DIR="/app/contract_addresses_node3"

# Ensure directories exist
mkdir -p "$NODE1_DIR" "$NODE2_DIR" "$NODE3_DIR"

# Helper function to merge JSON files
merge_contract_addresses() {
  local source="$1"
  local target="$2"
  
  if [ ! -f "$source" ]; then
    echo "[Sync] Source file $source doesn't exist, skipping merge"
    return
  fi
  
  if [ ! -f "$target" ]; then
    echo "[Sync] Target file $target doesn't exist, copying source"
    cp "$source" "$target"
    return
  fi
  
  echo "[Sync] Merging $source into $target"
  # Use jq to merge the JSON files
  jq -s '.[0] * .[1]' "$target" "$source" > "$target.tmp"
  mv "$target.tmp" "$target"
}

# First, check if we're running in a container with NODE_ID
if [ -n "$NODE_ID" ]; then
  echo "[Sync] Running in container with NODE_ID=$NODE_ID"
  
  # Attempt to copy our contract addresses to all known locations
  for dir in "$NODE1_DIR" "$NODE2_DIR" "$NODE3_DIR" "/app/contract_addresses"; do
    if [ -d "$dir" ]; then
      cp "$CONTRACT_ADDR_FILE" "$dir/contract_addresses.json"
      chmod 666 "$dir/contract_addresses.json"
      echo "[Sync] Copied contract_addresses.json to $dir/contract_addresses.json"
    fi
  done
  
  # Also try other potential paths
  for dir in "/code/deploy/contract_addresses_node1" "/code/deploy/contract_addresses_node2" "/code/deploy/contract_addresses_node3"; do
    if [ -d "$(dirname "$dir")" ]; then
      mkdir -p "$dir"
      cp "$CONTRACT_ADDR_FILE" "$dir/contract_addresses.json"
      chmod 666 "$dir/contract_addresses.json"
      echo "[Sync] Also copied to $dir/contract_addresses.json"
    fi
  done
else
  echo "[Sync] Running outside of a container or NODE_ID not set"
fi

echo "[Sync] Contract address synchronization completed"
