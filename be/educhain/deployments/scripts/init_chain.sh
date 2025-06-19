#!/bin/bash

# Initialize the blockchain

# Set the necessary environment variables
CHAIN_ID="educhain"
MONIKER="educhain-node"
NODE_HOME="$HOME/.educhain"

# Create the node home directory
mkdir -p $NODE_HOME

# Initialize the blockchain
educhain init $MONIKER --chain-id $CHAIN_ID

# Create a genesis file
cp deployments/devnet/config/genesis.json $NODE_HOME/config/genesis.json

# Set the application configuration
cp deployments/devnet/config/app.toml $NODE_HOME/config/app.toml
cp deployments/devnet/config/config.toml $NODE_HOME/config/config.toml

# Start the blockchain node
educhain start --home $NODE_HOME --log_level info

echo "Blockchain initialized and node started."