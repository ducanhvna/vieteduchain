#!/bin/bash
# Script to initialize and start a wasmd node with REST API

# Set environment variables
export DAEMON_NAME=wasmd
export DAEMON_HOME=/root/.wasmd

# Function to start wasmd node
start_wasmd_node() {
  echo "Starting wasmd node..."
  wasmd start --rpc.laddr tcp://0.0.0.0:26657 --grpc.address 0.0.0.0:9090 --log_level info &
  
  # Wait for node to start
  sleep 5
  
  # Check if node is running (using ps instead of pgrep)
  if ! ps aux | grep -v grep | grep "wasmd" > /dev/null; then
    echo "Failed to start wasmd node"
    exit 1
  fi
  
  echo "Wasmd node is running!"
}

# Function to start REST API server
start_rest_api() {
  echo "Starting REST API server on port 1318..."
  
  # If a REST API service is available in /chain directory, start it
  if [ -d "/chain" ] && [ -f "/chain/main.go" ]; then
    cd /chain
    go mod tidy
    go mod download
    
    # Start REST API server
    go run . &
    
    # Check if REST API server is running
    sleep 5
    if curl -s http://localhost:1318/api/v1/nodeinfo > /dev/null; then
      echo "REST API server is running at http://localhost:1318/api/v1/nodeinfo"
    else
      echo "Failed to start REST API server"
    fi
  else
    echo "No REST API server code found in /chain directory"
  fi
  
  # Start Cosmos REST API on port 1317 (this is built into wasmd)
  echo "Starting Cosmos REST API on port 1317..."
  wasmd rest-server --laddr tcp://0.0.0.0:1317 --node tcp://localhost:26657 --unsafe-cors &
  
  sleep 3
  if curl -s http://localhost:1317/node_info > /dev/null; then
    echo "Cosmos REST API is running at http://localhost:1317/node_info"
  else
    echo "Note: Cosmos REST API may still be starting up"
  fi
}

# Main execution
echo "Initializing node..."

# Verify required libraries are available
echo "Verifying libwasmvm library..."
if [ -f "/usr/lib/libwasmvm.aarch64.so" ]; then
  echo "Found libwasmvm.aarch64.so"
elif [ -f "/usr/lib/libwasmvm.x86_64.so" ]; then
  echo "Found libwasmvm.x86_64.so"
else
  echo "Warning: libwasmvm library not found in expected location. Listing /usr/lib contents:"
  ls -la /usr/lib/
fi

# Check wasmd binary
echo "Verifying wasmd binary..."
which wasmd || echo "wasmd binary not found"

# Check if node is already initialized
if [ ! -f "$DAEMON_HOME/config/genesis.json" ]; then
  echo "Node not initialized, initializing new chain..."
  wasmd init --chain-id=educhain "educhain-node"
  
  # Create default account
  wasmd keys add validator --keyring-backend=test
  
  # Add genesis account
  wasmd add-genesis-account $(wasmd keys show validator -a --keyring-backend=test) 1000000000stake,1000000000ucosm
  
  # Create genesis transaction
  wasmd gentx validator 1000000stake --chain-id=educhain --keyring-backend=test
  
  # Collect genesis transactions
  wasmd collect-gentxs
  
  echo "Chain initialized successfully!"
else
  echo "Using existing chain data"
fi

# Start wasmd node
start_wasmd_node

# Start REST API server
start_rest_api

# Keep container running
echo "All services started. Keeping container running..."
tail -f /dev/null
