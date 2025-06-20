#!/bin/bash

# Comprehensive script to set up and run a CosmWasm node with proper initialization
# This script addresses the validator issue by ensuring enough tokens are staked

set -e

# Configuration
CHAIN_ID="testing"
MONIKER="my-wasmd-node"
VALIDATOR_NAME="validator"
TOKEN_AMOUNT="10000000000000"  # Increased token amount
STAKING_AMOUNT="300000000000"  # Increased staking amount to exceed DefaultPowerReduction
TOKEN_DENOM="stake"

# Stop any existing containers
echo "Stopping any existing wasm containers..."
docker stop wasm-node 2>/dev/null || true
docker rm wasm-node 2>/dev/null || true

# Clear existing data
echo "Clearing data directory..."
rm -rf ./data

# Create data directory structure
echo "Creating data directory structure..."
mkdir -p ./data
mkdir -p ./config

# Check if image exists
if ! docker images cosmwasm/wasmd:v0.50.0-patched | grep -q v0.50.0-patched; then
  echo "Building Docker image cosmwasm/wasmd:v0.50.0-patched..."
  docker build -t cosmwasm/wasmd:v0.50.0-patched -f Dockerfile.complete .
else
  echo "Using existing Docker image cosmwasm/wasmd:v0.50.0-patched"
  echo "To rebuild the image, run: docker rmi cosmwasm/wasmd:v0.50.0-patched"
  echo "Then run this script again."
fi

# Run initialization steps in a consistent environment
echo "==============================================================="
echo "Initializing wasmd node with chain-id: $CHAIN_ID, moniker: $MONIKER"
echo "==============================================================="

# First, initialize the node
docker run --rm -v $(pwd)/data:/root/.wasmd cosmwasm/wasmd:v0.50.0-patched \
  init "$MONIKER" --chain-id "$CHAIN_ID"

echo "Initialized wasmd node configuration"

# Generate validator keys
echo "==============================================================="
echo "Creating validator key - save the mnemonic if you need to recover!"
echo "==============================================================="
docker run --rm -v $(pwd)/data:/root/.wasmd cosmwasm/wasmd:v0.50.0-patched \
  keys add "$VALIDATOR_NAME" --keyring-backend test

# Get validator address
echo "Getting validator address..."
VALIDATOR_ADDRESS=$(docker run --rm -v $(pwd)/data:/root/.wasmd cosmwasm/wasmd:v0.50.0-patched \
  keys show "$VALIDATOR_NAME" -a --keyring-backend test)
echo "Validator address: $VALIDATOR_ADDRESS"

# Add genesis account
echo "==============================================================="
echo "Adding genesis account with $TOKEN_AMOUNT$TOKEN_DENOM"
echo "==============================================================="
docker run --rm -v $(pwd)/data:/root/.wasmd cosmwasm/wasmd:v0.50.0-patched \
  genesis add-genesis-account "$VALIDATOR_ADDRESS" "${TOKEN_AMOUNT}${TOKEN_DENOM}"

# Create gentx (validator transaction)
echo "==============================================================="
echo "Creating gentx (validator transaction) with $STAKING_AMOUNT$TOKEN_DENOM staked"
echo "==============================================================="
docker run --rm -v $(pwd)/data:/root/.wasmd cosmwasm/wasmd:v0.50.0-patched \
  genesis gentx "$VALIDATOR_NAME" "${STAKING_AMOUNT}${TOKEN_DENOM}" \
  --chain-id "$CHAIN_ID" \
  --keyring-backend test

# Collect gentxs into genesis
echo "Collecting gentxs into genesis..."
docker run --rm -v $(pwd)/data:/root/.wasmd cosmwasm/wasmd:v0.50.0-patched \
  genesis collect-gentxs

# Validate genesis
echo "Validating genesis..."
docker run --rm -v $(pwd)/data:/root/.wasmd cosmwasm/wasmd:v0.50.0-patched \
  genesis validate-genesis

# Configure for external access by replacing localhost/127.0.0.1 with 0.0.0.0
echo "Configuring for external access..."
sed -i '' 's/127.0.0.1/0.0.0.0/g' ./data/config/config.toml 2>/dev/null || sed -i 's/127.0.0.1/0.0.0.0/g' ./data/config/config.toml
sed -i '' 's/localhost/0.0.0.0/g' ./data/config/config.toml 2>/dev/null || sed -i 's/localhost/0.0.0.0/g' ./data/config/config.toml

# Enable REST API
sed -i '' 's/enable = false/enable = true/g' ./data/config/app.toml 2>/dev/null || sed -i 's/enable = false/enable = true/g' ./data/config/app.toml
sed -i '' 's/enable-unsafe-cors = false/enable-unsafe-cors = true/g' ./data/config/app.toml 2>/dev/null || sed -i 's/enable-unsafe-cors = false/enable-unsafe-cors = true/g' ./data/config/app.toml

# Make sure API listens on all interfaces
sed -i '' 's/address = "tcp:\/\/localhost:1317"/address = "tcp:\/\/0.0.0.0:1317"/g' ./data/config/app.toml 2>/dev/null || sed -i 's/address = "tcp:\/\/localhost:1317"/address = "tcp:\/\/0.0.0.0:1317"/g' ./data/config/app.toml
sed -i '' 's/address = "tcp:\/\/localhost:9090"/address = "tcp:\/\/0.0.0.0:9090"/g' ./data/config/app.toml 2>/dev/null || sed -i 's/address = "tcp:\/\/localhost:9090"/address = "tcp:\/\/0.0.0.0:9090"/g' ./data/config/app.toml

# Start the container
echo "==============================================================="
echo "Starting the wasmd node..."
echo "==============================================================="
docker run -d \
  --name wasm-node \
  -p 26656:26656 \
  -p 26657:26657 \
  -p 1317:1317 \
  -p 1318:1318 \
  -p 9090:9090 \
  -e VALIDATOR_ADDRESS="$VALIDATOR_ADDRESS" \
  -v $(pwd)/data:/root/.wasmd \
  --entrypoint /entrypoint.sh \
  cosmwasm/wasmd:v0.50.0-patched

echo "Container is starting. Waiting for it to initialize..."
sleep 5

# Check if container is running
if docker ps | grep -q wasm-node; then
  echo "Success! wasmd node is running."
  echo "==============================================================="
  echo "Blockchain node is running with the following services:"
  echo "- RPC: http://localhost:26657"
  echo "- REST API: http://localhost:1317"
  echo "- Custom nodeinfo REST API: http://localhost:1318"
  echo "- gRPC: http://localhost:9090"
  echo "==============================================================="
  echo "Validator address: $VALIDATOR_ADDRESS"
  echo "To check node status: curl http://localhost:26657/status"
  echo "To view logs: docker logs -f wasm-node"
  echo "To stop node: docker stop wasm-node"
else
  echo "Error: Container failed to start. Checking logs..."
  docker logs wasm-node
  exit 1
fi
