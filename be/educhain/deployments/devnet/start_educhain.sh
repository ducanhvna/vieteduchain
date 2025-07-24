#!/bin/bash

# Simple script to start the EduChain blockchain core
set -e

echo "🚀 Starting EduChain Blockchain Core..."

# Stop any existing container
echo "📦 Cleaning up existing containers..."
docker stop educhain-node 2>/dev/null || true
docker rm educhain-node 2>/dev/null || true

# Create data directory for blockchain state
mkdir -p ./data

echo "🔧 Initializing and starting blockchain node..."

# Start the blockchain node with automatic initialization
docker run -d \
  --name educhain-node \
  -p 26657:26657 \
  -p 1317:1317 \
  -p 9090:9090 \
  -v $(pwd)/data:/root/.wasmd \
  cosmwasm/wasmd:v0.50.0 \
  sh -c "
    # Initialize the blockchain if not already done
    if [ ! -f /root/.wasmd/config/genesis.json ]; then
      echo '🔧 Initializing new blockchain...'
      wasmd init educhain-node --chain-id educhain --home /root/.wasmd
      
      # Create validator key with fixed mnemonic for consistency
      echo 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about' | \
        wasmd keys add validator --keyring-backend test --home /root/.wasmd --recover
      
      # Get validator address
      VALIDATOR_ADDRESS=\$(wasmd keys show validator -a --keyring-backend test --home /root/.wasmd)
      echo \"📝 Validator address: \$VALIDATOR_ADDRESS\"
      
      # Add genesis account with initial tokens
      wasmd genesis add-genesis-account \$VALIDATOR_ADDRESS 10000000000000stake --home /root/.wasmd
      
      # Create validator transaction
      wasmd genesis gentx validator 300000000000stake --chain-id educhain --keyring-backend test --home /root/.wasmd
      
      # Collect genesis transactions
      wasmd genesis collect-gentxs --home /root/.wasmd
      
      # Configure node for external access
      sed -i 's/127.0.0.1/0.0.0.0/g' /root/.wasmd/config/config.toml
      sed -i 's/enable = false/enable = true/g' /root/.wasmd/config/app.toml
      sed -i 's/enable-unsafe-cors = false/enable-unsafe-cors = true/g' /root/.wasmd/config/app.toml
      
      echo '✅ Blockchain initialized successfully!'
    else
      echo '✅ Using existing blockchain data'
    fi
    
    echo '🚀 Starting blockchain node...'
    exec wasmd start --home /root/.wasmd
  "

# Wait for container to start and check status
echo "⏳ Waiting for blockchain to start..."
sleep 10

# Check if the node is running
if docker ps | grep -q educhain-node; then
  echo "✅ EduChain blockchain is running successfully!"
  echo ""
  echo "🔗 Available endpoints:"
  echo "   RPC API:  http://localhost:26657"
  echo "   REST API: http://localhost:1317" 
  echo "   gRPC:     http://localhost:9090"
  echo ""
  echo "📊 Check node status: curl http://localhost:26657/status"
  echo "📋 View logs:         docker logs -f educhain-node"
  echo "🛑 Stop node:         docker stop educhain-node"
else
  echo "❌ Failed to start blockchain node"
  echo "📋 Check logs with:   docker logs educhain-node"
  exit 1
fi