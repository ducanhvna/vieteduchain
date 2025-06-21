#!/bin/bash
# filepath: /Users/dungbui299/Documents/github/cosmos-permissioned-network/be/educhain/deployments/devnet/fix_and_run.sh

set -e  # Exit on any error

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Stop any existing containers
echo -e "${YELLOW}Stopping any existing wasm containers...${NC}"
docker stop wasm-node 2>/dev/null || true
docker rm wasm-node 2>/dev/null || true

# Step 1: Fix the Go architecture in Dockerfile.allinone
echo -e "${YELLOW}Fixing Dockerfile.allinone...${NC}"
DOCKERFILE="/Users/dungbui299/Documents/github/cosmos-permissioned-network/be/educhain/deployments/devnet/Dockerfile.allinone"

# Check if the Dockerfile exists
if [ ! -f "$DOCKERFILE" ]; then
  echo -e "${RED}Dockerfile.allinone not found at $DOCKERFILE${NC}"
  exit 1
fi

# Fix Go download for ARM64 architecture
sed -i '' '/Install Go 1.19 for running the REST API/,/rm go1.19.13.linux-arm64.tar.gz/ c\
# Install Go for running the REST API (supporting both architectures)\
RUN ARCH=$(uname -m) && \\\
    if [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ]; then \\\
        wget https://golang.org/dl/go1.19.13.linux-arm64.tar.gz && \\\
        tar -C /usr/local -xzf go1.19.13.linux-arm64.tar.gz && \\\
        rm go1.19.13.linux-arm64.tar.gz; \\\
    else \\\
        wget https://golang.org/dl/go1.19.13.linux-amd64.tar.gz && \\\
        tar -C /usr/local -xzf go1.19.13.linux-amd64.tar.gz && \\\
        rm go1.19.13.linux-amd64.tar.gz; \\\
    fi' "$DOCKERFILE"

echo -e "${GREEN}Dockerfile.allinone fixed!${NC}"

# Step 2: Create a better start script for inside the container
echo -e "${YELLOW}Creating improved start script...${NC}"
cat > "/Users/dungbui299/Documents/github/cosmos-permissioned-network/be/educhain/deployments/devnet/start_fixed.sh" << 'EOF'
#!/bin/bash
# Script to initialize and start a wasmd node with REST API

set -e  # Exit on any error

# Set environment variables
export DAEMON_NAME=wasmd
export DAEMON_HOME=/root/.wasmd

# Function to start wasmd node
start_wasmd_node() {
  echo "Starting wasmd node..."
  wasmd start --rpc.laddr tcp://0.0.0.0:26657 --grpc.address 0.0.0.0:9090 --log_level info &
  WASMD_PID=$!
  
  # Wait for node to start
  sleep 10
  
  # Check if node is running
  if ! ps -p $WASMD_PID > /dev/null; then
    echo "Failed to start wasmd node"
    exit 1
  fi
  
  echo "Wasmd node is running with PID: $WASMD_PID"
}

# Function to start REST API server
start_rest_api() {
  echo "Starting REST API server on port 1318..."
  
  # Check if /chain directory exists and has the necessary files
  if [ -d "/chain" ]; then
    echo "Chain directory exists, checking contents..."
    ls -la /chain
    
    if [ -f "/chain/main.go" ]; then
      echo "Found main.go, starting REST API..."
      cd /chain
      
      # Check go.mod and update if needed
      if ! grep -q "replace github.com/dungbui299/cosmos-permissioned-network/be/educhain/chain => ./" go.mod; then
        echo "Adding module replacement to go.mod"
        echo "replace github.com/dungbui299/cosmos-permissioned-network/be/educhain/chain => ./" >> go.mod
      fi
      
      # Check Go version
      echo "Go version:"
      go version
      
      # Run go mod tidy with verbose output
      echo "Running go mod tidy..."
      go mod tidy -v
      
      # Check if the rest directory exists and has files
      if [ -d "/chain/rest" ]; then
        echo "Rest directory exists with the following files:"
        ls -la /chain/rest
      else
        echo "ERROR: /chain/rest directory not found!"
      fi
      
      # Start the REST API server
      echo "Starting the REST API server..."
      go run main.go &
      REST_PID=$!
      
      # Give it some time to start
      sleep 5
      
      # Check if process is running
      if ps -p $REST_PID > /dev/null; then
        echo "REST API server process is running with PID: $REST_PID"
        
        # Try to access the API
        if curl -s http://localhost:1318/api/v1/nodeinfo > /dev/null; then
          echo "REST API server is running at http://localhost:1318/api/v1/nodeinfo"
        else
          echo "REST API server process is running but endpoint is not responding yet"
          echo "Waiting more time for API to become available..."
          sleep 10
          curl -v http://localhost:1318/api/v1/nodeinfo || echo "Still failed to reach API"
        fi
      else
        echo "Failed to start REST API server. Check files in /chain directory:"
        ls -la /chain
        echo "Trying alternative approach with direct go build..."
        go build -o /tmp/rest-api && /tmp/rest-api &
      fi
    else
      echo "ERROR: main.go not found in /chain directory"
    fi
  else
    echo "ERROR: /chain directory not found"
  fi
}

# Main execution
echo "Initializing node..."

# Verify required libraries are available
echo "Verifying libwasmvm library..."
find /usr/lib -name "libwasmvm*" || echo "libwasmvm library not found in /usr/lib"

# Check wasmd binary
echo "Verifying wasmd binary..."
which wasmd || echo "wasmd binary not found"
wasmd version || echo "wasmd version command failed"

# Check if node is already initialized
if [ ! -f "$DAEMON_HOME/config/genesis.json" ]; then
  echo "Node not initialized, initializing new chain..."
  wasmd init --chain-id=educhain "educhain-node"
  
  # Create validator key with auto yes for prompt
  echo "Creating validator key..."
  echo "y" | wasmd keys add validator --keyring-backend=test
  
  # Get validator address
  VAL_ADDR=$(wasmd keys show validator -a --keyring-backend=test)
  echo "Validator address: $VAL_ADDR"
  
  # Add genesis account with enough tokens
  echo "Adding genesis account..."
  wasmd add-genesis-account $VAL_ADDR 1000000000000000stake,1000000000ucosm
  
  # Create genesis transaction with enough stake
  echo "Creating genesis transaction..."
  wasmd gentx validator 100000000000000stake --chain-id=educhain --keyring-backend=test
  
  # Collect genesis transactions
  echo "Collecting genesis transactions..."
  wasmd collect-gentxs
  
  # Verify genesis has validators
  echo "Verifying genesis has validators..."
  grep -q "validators" $DAEMON_HOME/config/genesis.json
  if [ $? -ne 0 ]; then
    echo "Error: No validators found in genesis file. Creating manually..."
    # Backup genesis
    cp $DAEMON_HOME/config/genesis.json $DAEMON_HOME/config/genesis.json.bak
    
    # Get validator pubkey
    PUBKEY=$(wasmd tendermint show-validator)
    echo "Validator pubkey: $PUBKEY"
    
    # Get validator address
    VALOPER_ADDR="cosmosvaloper"$(echo $VAL_ADDR | cut -c 7-)
    echo "Validator operator address: $VALOPER_ADDR"
    
    # Create temporary validator JSON
    cat > /tmp/validator.json << EOF
{
  "app_state": {
    "staking": {
      "validators": [
        {
          "operator_address": "$VALOPER_ADDR",
          "consensus_pubkey": $PUBKEY,
          "jailed": false,
          "status": "BOND_STATUS_BONDED",
          "tokens": "1000000000000000",
          "delegator_shares": "1000000000000000.000000000000000000",
          "description": {
            "moniker": "validator",
            "identity": "",
            "website": "",
            "security_contact": "",
            "details": ""
          },
          "unbonding_height": "0",
          "unbonding_time": "1970-01-01T00:00:00Z",
          "commission": {
            "commission_rates": {
              "rate": "0.100000000000000000",
              "max_rate": "0.200000000000000000",
              "max_change_rate": "0.010000000000000000"
            },
            "update_time": "2025-06-21T00:00:00Z"
          },
          "min_self_delegation": "1"
        }
      ],
      "last_total_power": "1000000000000000",
      "last_validator_powers": [
        {
          "address": "$VALOPER_ADDR",
          "power": "1000000000000000"
        }
      ]
    }
  }
}
EOF
    
    # Use jq to merge the validator information into the genesis file
    jq -s '.[0].app_state.staking.validators = .[1].app_state.staking.validators | 
         .[0].app_state.staking.last_total_power = .[1].app_state.staking.last_total_power | 
         .[0].app_state.staking.last_validator_powers = .[1].app_state.staking.last_validator_powers | 
         .[0]' $DAEMON_HOME/config/genesis.json /tmp/validator.json > $DAEMON_HOME/config/genesis.json.new
    
    mv $DAEMON_HOME/config/genesis.json.new $DAEMON_HOME/config/genesis.json
    
    # Add delegation if not already present
    echo "Adding delegation..."
    jq '.app_state.staking.delegations = [{"delegator_address":"'$VAL_ADDR'","validator_address":"'$VALOPER_ADDR'","shares":"1000000000000000.000000000000000000"}]' $DAEMON_HOME/config/genesis.json > $DAEMON_HOME/config/genesis.json.tmp
    mv $DAEMON_HOME/config/genesis.json.tmp $DAEMON_HOME/config/genesis.json
  fi
  
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
EOF

chmod +x "/Users/dungbui299/Documents/github/cosmos-permissioned-network/be/educhain/deployments/devnet/start_fixed.sh"
echo -e "${GREEN}Improved start script created!${NC}"

# Step 3: Run the container with the new script
echo -e "${YELLOW}Starting container with fixed script...${NC}"
cd /Users/dungbui299/Documents/github/cosmos-permissioned-network/be/educhain/deployments/devnet

# Use the existing run_allinone.sh script with our new start_fixed.sh
chmod +x ./run_allinone.sh

# Modify run command to use our fixed script
docker run -d \
  --name wasm-node \
  -p 26656:26656 \
  -p 26657:26657 \
  -p 1317:1317 \
  -p 1318:1318 \
  -p 9090:9090 \
  -v $(pwd)/data:/root/.wasmd \
  -v $(pwd)/start_fixed.sh:/root/start_node.sh \
  -v "$(cd ../../chain && pwd)":/chain \
  cosmos-wasmd-allinone

if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to start the container. Trying to build the image first...${NC}"
  
  # Try to build the image first
  echo -e "${YELLOW}Building Docker image...${NC}"
  docker build -t cosmos-wasmd-allinone -f Dockerfile.allinone .
  
  # Try running again
  docker run -d \
    --name wasm-node \
    -p 26656:26656 \
    -p 26657:26657 \
    -p 1317:1317 \
    -p 1318:1318 \
    -p 9090:9090 \
    -v $(pwd)/data:/root/.wasmd \
    -v $(pwd)/start_fixed.sh:/root/start_node.sh \
    -v "$(cd ../../chain && pwd)":/chain \
    cosmos-wasmd-allinone
  
  if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to start container even after building the image.${NC}"
    exit 1
  fi
fi

echo -e "${GREEN}Container started successfully!${NC}"

# Wait for the services to start
echo -e "${YELLOW}Waiting for services to start (15 seconds)...${NC}"
sleep 15

# Check if the container is still running
if ! docker ps | grep -q wasm-node; then
  echo -e "${RED}Container stopped unexpectedly. Checking logs...${NC}"
  docker logs wasm-node
  exit 1
fi

# Test the REST API
echo -e "${YELLOW}Testing REST API...${NC}"
curl -s http://localhost:1318/api/v1/nodeinfo || echo -e "${RED}API not responding yet${NC}"

echo -e "${GREEN}Done! Container is running.${NC}"
echo -e "You can check the logs with: ${YELLOW}docker logs -f wasm-node${NC}"
echo -e "You can access the API at: ${YELLOW}http://localhost:1318/api/v1/nodeinfo${NC}"
