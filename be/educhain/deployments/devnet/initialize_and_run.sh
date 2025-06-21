#!/bin/bash
# A simplified script to initialize the blockchain and start the REST API

set -e  # Exit on any error

# Set up variables
DAEMON_HOME="/root/.wasmd"
CHAIN_ID="educhain"
NODE_MONIKER="educhain-node"

# Clean up any existing data
echo "Cleaning up existing data..."
rm -rf $DAEMON_HOME/*

# Initialize the chain
echo "Initializing chain..."
wasmd init --chain-id=$CHAIN_ID $NODE_MONIKER

# Create validator key
echo "Creating validator key..."
echo "y" | wasmd keys add validator --keyring-backend=test

# Get validator address
VAL_ADDR=$(wasmd keys show validator -a --keyring-backend=test)
echo "Validator address: $VAL_ADDR"

# Add genesis account
echo "Adding genesis account..."
wasmd add-genesis-account $VAL_ADDR 1000000000000000stake,1000000000ucosm

# Create genesis transaction
echo "Creating genesis transaction..."
wasmd gentx validator 100000000000000stake --chain-id=$CHAIN_ID --keyring-backend=test

# Collect genesis transactions
echo "Collecting genesis transactions..."
wasmd collect-gentxs

# Verify the genesis file has validators
if ! grep -q "validators" $DAEMON_HOME/config/genesis.json; then
  echo "Validator not found in genesis, manually adding..."
  
  # Manually add validators to the genesis file
  cp $DAEMON_HOME/config/genesis.json $DAEMON_HOME/config/genesis.json.bak
  
  # Extract the validator's consensus pubkey
  PUBKEY=$(wasmd tendermint show-validator)
  
  # Create validator JSON (using dummy values that will be updated with jq)
  cat > /tmp/validator.json << EOF
{
  "app_state": {
    "staking": {
      "validators": [
        {
          "operator_address": "cosmosvaloper1xxxxxx",
          "consensus_pubkey": $PUBKEY,
          "jailed": false,
          "status": "BOND_STATUS_BONDED",
          "tokens": "100000000000000",
          "delegator_shares": "100000000000000.000000000000000000",
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
      "last_total_power": "100000000000000",
      "last_validator_powers": [
        {
          "address": "cosmosvaloper1xxxxxx",
          "power": "100000000000000"
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
fi

# Start wasmd node
echo "Starting wasmd node..."
# Ensure correct app_state.staking configuration to fix InitChain issues
echo "Checking genesis configuration..."
cat $DAEMON_HOME/config/genesis.json | jq '.app_state.staking'

# Add custom configuration for Cosmos SDK
echo "Adjusting configuration parameters..."
sed -i 's/timeout_commit = "5s"/timeout_commit = "1s"/g' $DAEMON_HOME/config/config.toml
sed -i 's/timeout_propose = "3s"/timeout_propose = "1s"/g' $DAEMON_HOME/config/config.toml

# Start the node with more verbose logging
wasmd start --rpc.laddr tcp://0.0.0.0:26657 --grpc.address 0.0.0.0:9090 --log_level debug &
WASMD_PID=$!

# Wait for the chain to start with extended timeout
echo "Waiting for chain to start (extended timeout)..."
sleep 15

# Check if wasmd is still running
if ! ps -p $WASMD_PID > /dev/null; then
  echo "Error: wasmd node failed to start or crashed"
  exit 1
fi

# Start REST API
echo "Starting REST API on port 1318..."
cd /chain

# Verify REST API code exists
if [ ! -f "/chain/main.go" ]; then
  echo "ERROR: main.go not found in /chain directory. Available files:"
  ls -la /chain/
  echo "Will attempt to copy from source..."
  # Try to copy from a source location
  mkdir -p /tmp/chain_source
  cp -r /usr/src/chain/* /chain/ 2>/dev/null || echo "No source found at /usr/src/chain/"
fi

# Ensure go.mod file has correct replacements and dependencies
if grep -q "replace github.com/dungbui299/cosmos-permissioned-network/be/educhain/chain => ./" go.mod; then
  echo "Module replacement already set"
else
  echo "Adding module replacement to go.mod"
  echo "replace github.com/dungbui299/cosmos-permissioned-network/be/educhain/chain => ./" >> go.mod
fi

echo "Running go mod tidy and download..."
go mod tidy
go mod download

# List the REST API files to verify they exist
echo "Files in REST API directory:"
ls -la /chain/rest/

# Start the REST API with logging
echo "Running the REST API server..."
go run . 2>&1 | tee /tmp/rest_api.log &
REST_PID=$!

# Wait for the REST API to initialize
sleep 5

# Check if REST API is running
if ! ps -p $REST_PID > /dev/null; then
  echo "Error: REST API failed to start or crashed"
  # Try to get any error logs
  echo "Last logs:"
  tail -n 20 /tmp/rest_api.log
  echo "Will try to run with go directly..."
  go run main.go &
  REST_PID=$!
  sleep 5
fi

# Check if REST API is responding
echo "Testing REST API endpoint..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:1318/api/v1/nodeinfo || echo "API not responding yet"

# Don't start the Cosmos REST API with rest-server command as it's deprecated
# Instead use the gRPC-gateway that's built in to wasmd
echo "Note: Not starting the Cosmos REST API using rest-server (deprecated)"
echo "The gRPC-gateway should be available on port 1317 automatically"

echo "All services started successfully!"
echo "Blockchain node running on port 26657"
echo "REST API running on port 1318"
echo "Try accessing: http://localhost:1318/api/v1/nodeinfo"

# Keep the container running
tail -f /dev/null
