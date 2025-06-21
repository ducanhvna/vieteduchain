#!/bin/bash
# Script to properly initialize the wasmd blockchain for ARM64 architecture

# Set environment variables
DAEMON_HOME="/root/.wasmd"
CHAIN_ID="educhain"
MONIKER="educhain-node"

# Clean up any existing data to start fresh
echo "Cleaning up any existing blockchain data..."
rm -rf $DAEMON_HOME/*

# Initialize the chain
echo "Initializing fresh chain..."
wasmd init $MONIKER --chain-id=$CHAIN_ID

# Create a validator key
echo "Creating validator key..."
wasmd keys add validator --keyring-backend=test

# Get the validator address
VALIDATOR_ADDR=$(wasmd keys show validator -a --keyring-backend=test)
echo "Validator address: $VALIDATOR_ADDR"

# Add genesis account with enough tokens
echo "Adding genesis account..."
wasmd add-genesis-account $VALIDATOR_ADDR 1000000000000000stake,1000000000ucosm

# Create genesis transaction with enough stake
echo "Creating genesis transaction..."
wasmd gentx validator 100000000000000stake --chain-id=$CHAIN_ID --keyring-backend=test

# Collect genesis transactions
echo "Collecting genesis transactions..."
wasmd collect-gentxs

# Verify the validator was properly created
echo "Verifying genesis file..."
cat $DAEMON_HOME/config/genesis.json | jq '.app_state.staking.validators'

# Start the node
echo "Starting the blockchain node..."
wasmd start --rpc.laddr tcp://0.0.0.0:26657 --grpc.address 0.0.0.0:9090 --log_level info
