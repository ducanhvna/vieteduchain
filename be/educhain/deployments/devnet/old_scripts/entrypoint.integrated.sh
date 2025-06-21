#!/bin/bash
# Integrated entrypoint script for all-in-one Cosmos node with APIs

set -e

# Set environment variables
export DAEMON_NAME=wasmd
export DAEMON_HOME=/root/.wasmd
export CHAIN_ID=${CHAIN_ID:-educhain}

# Initialize a function to log with timestamps
log() {
  echo "[$(date +%T)] $1"
}

# Function to check if a port is open
check_port() {
  nc -z localhost $1 >/dev/null 2>&1
}

# Function to start wasmd node
start_wasmd_node() {
  log "Starting wasmd node..."
  wasmd start --rpc.laddr tcp://0.0.0.0:26657 --grpc.address 0.0.0.0:9090 --log_level info &
  WASMD_PID=$!
  
  # Wait for node to start
  log "Waiting for node to start..."
  MAX_RETRIES=30
  RETRY_COUNT=0
  
  while ! check_port 26657; do
    RETRY_COUNT=$((RETRY_COUNT+1))
    if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
      log "Failed to start wasmd node after $MAX_RETRIES attempts"
      exit 1
    fi
    log "Waiting for RPC to be available... (attempt $RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
  done
  
  log "Wasmd node is running with PID: $WASMD_PID"
}

# Function to start the standard Cosmos REST API
start_cosmos_rest_api() {
  log "Starting Cosmos REST API on port 1317..."
  wasmd rest-server --laddr tcp://0.0.0.0:1317 --node tcp://localhost:26657 --unsafe-cors &
  REST_PID=$!
  
  # Check if REST API started successfully
  sleep 3
  if check_port 1317; then
    log "Cosmos REST API is running with PID: $REST_PID"
  else
    log "Warning: Cosmos REST API might not have started correctly"
  fi
}

# Function to start the custom REST API (best effort)
start_custom_rest_api() {
  log "Attempting to start custom REST API on port 1318..."
  
  if [ -d "/chain" ] && [ -f "/chain/main.go" ]; then
    cd /chain
    
    # Add module replacement if needed
    if ! grep -q "replace github.com/dungbui299/cosmos-permissioned-network/be/educhain/chain => ./" go.mod; then
      log "Adding module replacement to go.mod"
      echo "replace github.com/dungbui299/cosmos-permissioned-network/be/educhain/chain => ./" >> go.mod
    fi
    
    # Add gorilla/mux if it's not already a dependency
    if ! grep -q "github.com/gorilla/mux" go.mod; then
      log "Adding gorilla/mux to dependencies"
      go get github.com/gorilla/mux
    fi
    
    # Update go modules
    go mod tidy
    
    # Check for any syntax issues in main.go and try to fix common problems
    log "Checking and fixing potential issues in main.go..."
    # Check if the file uses Go 1.22+ pattern matching syntax
    if grep -q "mux.HandleFunc.*GET.*POST" main.go; then
      log "Detected newer Go pattern matching syntax, applying compatibility patch..."
      # Apply compatibility patch (only if needed)
      if ! grep -q "github.com/gorilla/mux" main.go; then
        log "Updating main.go to use gorilla/mux router..."
        # Replace http.ServeMux with mux.Router
        sed -i 's/http.NewServeMux()/mux.NewRouter()/g' main.go
        # Update import statement if not already there
        sed -i 's/import (/import (\n\t"github.com/gorilla/mux"/g' main.go
      fi
    fi
    
    # Start the custom REST API
    log "Starting custom REST API..."
    nohup go run main.go > /tmp/custom_api.log 2>&1 &
    CUSTOM_API_PID=$!
    
    # Give it some time to start
    sleep 5
    
    # Check if it's running
    if ps -p $CUSTOM_API_PID > /dev/null; then
      log "Custom REST API started with PID: $CUSTOM_API_PID"
    else
      log "Warning: Custom REST API failed to start. See logs for details."
      cat /tmp/custom_api.log
    fi
  else
    log "Custom REST API code not found at /chain/main.go, skipping..."
  fi
}

# Function to check node is initialized
check_and_initialize_node() {
  # Check if node is already initialized
  if [ ! -f "$DAEMON_HOME/config/genesis.json" ]; then
    log "Node not initialized, initializing new chain..."
    wasmd init --chain-id=$CHAIN_ID "educhain-node"
    
    # Create default account
    wasmd keys add validator --keyring-backend=test
    
    # Add genesis account with enough tokens
    wasmd add-genesis-account $(wasmd keys show validator -a --keyring-backend=test) 1000000000000000stake,1000000000ucosm
    
    # Create genesis transaction with enough stake
    wasmd gentx validator 100000000000000stake --chain-id=$CHAIN_ID --keyring-backend=test
    
    # Collect genesis transactions
    wasmd collect-gentxs
    
    log "Chain initialized successfully!"
  else
    log "Using existing chain data"
  fi
}

# Main execution
log "Starting Cosmos node with integrated APIs..."

# Verify required libraries are available
log "Verifying libwasmvm library..."
if [ -f "/usr/lib/libwasmvm.aarch64.so" ]; then
  log "Found libwasmvm.aarch64.so"
elif [ -f "/usr/lib/libwasmvm.x86_64.so" ]; then
  log "Found libwasmvm.x86_64.so"
else
  log "Warning: libwasmvm library not found in expected location. Listing /usr/lib contents:"
  ls -la /usr/lib/ | grep libwasm
fi

# Check wasmd binary
log "Verifying wasmd binary..."
which wasmd || { log "wasmd binary not found"; exit 1; }

# Initialize the node if needed
check_and_initialize_node

# Start the wasmd node
start_wasmd_node

# Start the standard Cosmos REST API
start_cosmos_rest_api

# Try to start the custom REST API (best effort)
start_custom_rest_api

# Check if all essential services are running
log "Checking essential services..."

if check_port 26657; then
  log "✅ Tendermint RPC (port 26657) is running"
else
  log "❌ Tendermint RPC (port 26657) is NOT running"
fi

if check_port 1317; then
  log "✅ Cosmos REST API (port 1317) is running"
else
  log "❌ Cosmos REST API (port 1317) is NOT running"
fi

if check_port 1318; then
  log "✅ Custom REST API (port 1318) is running"
else
  log "⚠️ Custom REST API (port 1318) is NOT running (optional)"
fi

if check_port 9090; then
  log "✅ gRPC service (port 9090) is running"
else
  log "⚠️ gRPC service (port 9090) is NOT running (optional)"
fi

# Display information about available endpoints
log "Available endpoints:"
log "- Tendermint RPC: http://localhost:26657"
log "- Cosmos REST API: http://localhost:1317"
log "- Custom REST API (if running): http://localhost:1318"
log "- gRPC: localhost:9090"

# Keep container running
log "All services started. Container will remain running."
tail -f /dev/null
