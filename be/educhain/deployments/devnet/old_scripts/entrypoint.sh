#!/bin/bash
# Entrypoint script for wasmd node container

set -e

export DAEMON_NAME=wasmd
export DAEMON_HOME=/root/.wasmd

# Function to start wasmd node
start_wasmd_node() {
  echo "Starting wasmd node..."
  wasmd start --rpc.laddr tcp://0.0.0.0:26657 --grpc.address 0.0.0.0:9090 --log_level info &
  
  # Wait for node to start
  sleep 5
  
  # Check if node is running
  if ! ps aux | grep -v grep | grep "wasmd" > /dev/null; then
    echo "Failed to start wasmd node"
    exit 1
  fi
  
  echo "Wasmd node is running!"
}

# Function to start REST API services
start_rest_apis() {
  # Start Cosmos REST API on port 1317 (this is built into wasmd)
  echo "Starting Cosmos REST API on port 1317..."
  wasmd rest-server --laddr tcp://0.0.0.0:1317 --node tcp://localhost:26657 --unsafe-cors &
  
  sleep 3
  if curl -s http://localhost:1317/cosmos/base/tendermint/v1beta1/node_info > /dev/null; then
    echo "Cosmos REST API is running at http://localhost:1317/cosmos/base/tendermint/v1beta1/node_info"
  else
    echo "Note: Cosmos REST API may still be starting up"
  fi
  
  # Try to start Custom REST API if possible
  echo "Attempting to start Custom REST API server on port 1318..."
  if [ -d "/chain" ] && [ -f "/chain/main.go" ]; then
    cd /chain
    
    # Add module replacement if needed
    if ! grep -q "replace github.com/dungbui299/cosmos-permissioned-network/be/educhain/chain => ./" go.mod; then
      echo "Adding module replacement to go.mod"
      echo "replace github.com/dungbui299/cosmos-permissioned-network/be/educhain/chain => ./" >> go.mod
    fi
    
    # Check if gorilla/mux is in go.mod
    if ! grep -q "github.com/gorilla/mux" go.mod; then
      echo "Adding gorilla/mux dependency..."
      go get github.com/gorilla/mux
    fi
    
    go mod tidy
    go mod download
    
    # Start Custom REST API server
    echo "Starting Custom REST API server..."
    nohup go run . > /var/log/custom-api.log 2>&1 &
    
    # Don't fail if custom API doesn't work - we still have the Cosmos REST API
    echo "Custom REST API server started (check /var/log/custom-api.log for logs)"
  else
    echo "Custom REST API server code not found, skipping..."
  fi
}

# Main execution
echo "Initializing node..."

# Verify required libraries are available
echo "Verifying libraries and binaries..."
if [ -f "/usr/lib/libwasmvm.aarch64.so" ]; then
  echo "Found libwasmvm.aarch64.so"
elif [ -f "/usr/lib/libwasmvm.x86_64.so" ]; then
  echo "Found libwasmvm.x86_64.so"
else
  echo "Warning: libwasmvm library not found in expected location."
  ls -la /usr/lib/ | grep wasmvm
fi

# Check if node is already initialized
if [ ! -f "$DAEMON_HOME/config/genesis.json" ]; then
  echo "Node not initialized, initializing new chain..."
  wasmd init --chain-id=educhain "educhain-node"
  
  # Create default account
  wasmd keys add validator --keyring-backend=test
  
  # Add genesis account with enough tokens
  wasmd add-genesis-account $(wasmd keys show validator -a --keyring-backend=test) 1000000000000000stake,1000000000ucosm
  
  # Create genesis transaction with enough stake
  wasmd gentx validator 100000000000000stake --chain-id=educhain --keyring-backend=test
  
  # Collect genesis transactions
  wasmd collect-gentxs
  
  echo "Chain initialized successfully!"
else
  echo "Using existing chain data"
fi

# Start wasmd node
start_wasmd_node

# Start REST API services
start_rest_apis

# Print available endpoints
echo "======================================================="
echo "All services started. Available endpoints:"
echo "Tendermint RPC: http://localhost:26657"
echo "Cosmos REST API: http://localhost:1317"
echo "Custom REST API (if working): http://localhost:1318"
echo "gRPC: localhost:9090"
echo "======================================================="

# Keep container running
echo "Container is now running. Use docker-compose logs to view ongoing logs."
tail -f /dev/null