#!/bin/bash
# filepath: /Users/dungbui299/Documents/github/cosmos-permissioned-network/be/educhain/deployments/devnet/manual_start.sh

echo "=== Manual Startup Script ==="

# Start blockchain node
echo "Starting wasmd node..."
wasmd start --rpc.laddr tcp://0.0.0.0:26657 --grpc.address 0.0.0.0:9090 --log_level debug &
WASMD_PID=$!
echo "wasmd started with PID: $WASMD_PID"

# Wait for blockchain to start
sleep 10

# Start REST API
echo "Starting REST API..."
cd /chain
go mod tidy
go run . &
REST_PID=$!
echo "REST API started with PID: $REST_PID"

# Keep script running
echo "Services started. Press Ctrl+C to stop."
wait
