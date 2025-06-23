#!/bin/bash
# filepath: /Users/dungbui299/Documents/github/cosmos-permissioned-network/be/educhain/deployments/devnet/build_and_run.sh

set -e  # Exit on any error

# Build the Docker image
echo "Building Docker image..."
docker build -t educhain-arm64:latest -f Dockerfile.arm64.simple .

# Run the container
echo "Running the container..."
docker run -d --name educhain-node \
  -p 26656:26656 \
  -p 26657:26657 \
  -p 1317:1317 \
  -p 1318:1318 \
  -p 9090:9090 \
  educhain-arm64:latest

# Wait for services to start
echo "Waiting for services to start..."
sleep 15

# Check if REST API is accessible
echo "Testing REST API..."
curl http://localhost:1318/api/v1/nodeinfo || echo "Failed to reach REST API"

echo "Container logs:"
docker logs educhain-node

echo "To stop the container: docker stop educhain-node && docker rm educhain-node"
