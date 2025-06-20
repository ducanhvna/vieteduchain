#!/bin/bash

# Comprehensive script to set up and run a CosmWasm node with proper initialization
# This script addresses the validator issue by ensuring enough tokens are staked

set -e

# Configuration
CHAIN_ID="testing"
MONIKER="my-wasmd-node"
VALIDATOR_NAME="validator"
TOKEN_AMOUNT="10000000000000"  # Increased token amount
STAKING_AMOUNT="300000000000"  # Increased staking amount to exceed DefaultPowerReduction
TOKEN_DENOM="stake"

# Stop any existing containers
echo "Stopping any existing wasm containers..."
docker stop wasm-node 2>/dev/null || true
docker rm wasm-node 2>/dev/null || true

# Create data directory structure
echo "Creating data directory structure..."
mkdir -p ./data

# Check if image exists
if ! docker images cosmwasm/wasmd:v0.50.0-patched | grep -q v0.50.0-patched; then
  echo "Building Docker image cosmwasm/wasmd:v0.50.0-patched..."
  docker build -t cosmwasm/wasmd:v0.50.0-patched -f Dockerfile.complete .
else
  echo "Using existing Docker image cosmwasm/wasmd:v0.50.0-patched"
  echo "To rebuild the image, run: docker rmi cosmwasm/wasmd:v0.50.0-patched"
  echo "Then run this script again."
fi

# Create a simpler startup script for the container that will initialize the node
cat > init_and_start.sh <<EOF
#!/bin/bash
set -e

# Configuration
CHAIN_ID="$CHAIN_ID"
MONIKER="$MONIKER"
VALIDATOR_NAME="$VALIDATOR_NAME"
TOKEN_AMOUNT="$TOKEN_AMOUNT"
STAKING_AMOUNT="$STAKING_AMOUNT"
TOKEN_DENOM="$TOKEN_DENOM"

# Check if node is already initialized
if [ ! -f /root/.wasmd/config/genesis.json ]; then
    echo "==============================================================="
    echo "Initializing wasmd node with chain-id: \$CHAIN_ID, moniker: \$MONIKER"
    echo "==============================================================="
    
    # Initialize the node
    wasmd init "\$MONIKER" --chain-id "\$CHAIN_ID" --home /root/.wasmd
    
    echo "Initialized wasmd node configuration"
    
    # Generate validator keys
    echo "==============================================================="
    echo "Creating validator key"
    echo "==============================================================="
    wasmd keys add "\$VALIDATOR_NAME" --keyring-backend test --home /root/.wasmd
    
    # Get validator address
    echo "Getting validator address..."
    VALIDATOR_ADDRESS=\$(wasmd keys show "\$VALIDATOR_NAME" -a --keyring-backend test --home /root/.wasmd)
    echo "Validator address: \$VALIDATOR_ADDRESS"
    
    # Add genesis account
    echo "==============================================================="
    echo "Adding genesis account with \$TOKEN_AMOUNT\$TOKEN_DENOM"
    echo "==============================================================="
    wasmd genesis add-genesis-account "\$VALIDATOR_ADDRESS" "\${TOKEN_AMOUNT}\${TOKEN_DENOM}" --home /root/.wasmd
    
    # Create gentx (validator transaction)
    echo "==============================================================="
    echo "Creating gentx (validator transaction) with \$STAKING_AMOUNT\$TOKEN_DENOM staked"
    echo "==============================================================="
    wasmd genesis gentx "\$VALIDATOR_NAME" "\${STAKING_AMOUNT}\${TOKEN_DENOM}" \
      --chain-id "\$CHAIN_ID" \
      --keyring-backend test \
      --home /root/.wasmd
    
    # Collect gentxs into genesis
    echo "Collecting gentxs into genesis..."
    wasmd genesis collect-gentxs --home /root/.wasmd
    
    # Validate genesis
    echo "Validating genesis..."
    wasmd genesis validate-genesis --home /root/.wasmd
    
    # Configure for external access by replacing localhost/127.0.0.1 with 0.0.0.0
    echo "Configuring for external access..."
    sed -i 's/127.0.0.1/0.0.0.0/g' /root/.wasmd/config/config.toml
    sed -i 's/localhost/0.0.0.0/g' /root/.wasmd/config/config.toml
    
    # Enable REST API
    sed -i 's/enable = false/enable = true/g' /root/.wasmd/config/app.toml
    sed -i 's/enable-unsafe-cors = false/enable-unsafe-cors = true/g' /root/.wasmd/config/app.toml
    
    # Make sure API listens on all interfaces
    sed -i 's/address = "tcp:\/\/localhost:1317"/address = "tcp:\/\/0.0.0.0:1317"/g' /root/.wasmd/config/app.toml
    sed -i 's/address = "tcp:\/\/localhost:9090"/address = "tcp:\/\/0.0.0.0:9090"/g' /root/.wasmd/config/app.toml
fi

# Start wasmd node
echo "Starting wasmd node..."
wasmd start --home /root/.wasmd &
WASMD_PID=\$!

# Create a simple HTTP server for nodeinfo endpoint on port 1318
echo 'Starting simple HTTP server for nodeinfo endpoint on port 1318...'
mkdir -p /var/www
cat > /var/www/server.py <<EOT
import http.server
import socketserver
import json
import os
import subprocess

# Get validator address
validator_address = "unknown"
try:
    result = subprocess.run(
        ["wasmd", "keys", "show", "$VALIDATOR_NAME", "-a", "--keyring-backend", "test", "--home", "/root/.wasmd"],
        capture_output=True, text=True, check=True
    )
    validator_address = result.stdout.strip()
except Exception as e:
    print(f"Error getting validator address: {e}")

# Create the nodeinfo data
nodeinfo = {
  "contracts": {
    "eduid": "wasm1...",
    "educert": "wasm1...",
    "edupay": "wasm1...",
    "eduadmission": "wasm1...",
    "researchledger": "wasm1..."
  },
  "permissioned_nodes": [validator_address],
  "student_dids": ["did:eduid:..."]
}

class NodeInfoHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/nodeinfo' or self.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(nodeinfo, indent=2).encode())
        else:
            super().do_GET()

# Start the server
Handler = NodeInfoHandler
httpd = socketserver.TCPServer(("0.0.0.0", 1318), Handler)
print("Server started at port 1318")
httpd.serve_forever()
EOT

# Start Python HTTP server in background
cd /var/www
python3 server.py &
HTTP_PID=\$!

# Wait for both processes
echo "Services are now running..."
echo "wasmd node started with PID: \$WASMD_PID"
echo "HTTP server started with PID: \$HTTP_PID"

# Monitor both processes
while true; do
    # Check if wasmd is running
    if ! ps -p \$WASMD_PID > /dev/null; then
        echo "wasmd process exited unexpectedly with PID: \$WASMD_PID"
        kill -TERM \$HTTP_PID 2>/dev/null || true
        exit 1
    fi
    
    # Check if HTTP server is running
    if ! ps -p \$HTTP_PID > /dev/null; then
        echo "HTTP server process exited unexpectedly with PID: \$HTTP_PID"
        kill -TERM \$WASMD_PID 2>/dev/null || true
        exit 1
    fi
    
    # Sleep for a bit before checking again
    sleep 5
done
EOF

chmod +x init_and_start.sh

# Start the container
echo "==============================================================="
echo "Starting the wasmd node container..."
echo "==============================================================="
docker run -d \
  --name wasm-node \
  -p 26656:26656 \
  -p 26657:26657 \
  -p 1317:1317 \
  -p 1318:1318 \
  -p 9090:9090 \
  -v $(pwd)/data:/root/.wasmd \
  -v $(pwd)/init_and_start.sh:/init_and_start.sh \
  --entrypoint /init_and_start.sh \
  cosmwasm/wasmd:v0.50.0-patched

echo "Container is starting. Waiting for it to initialize..."
sleep 5

# Check if container is running and show logs
if docker ps | grep -q wasm-node; then
  echo "Success! wasmd node container is running."
  echo "==============================================================="
  echo "Showing container logs (press Ctrl+C to stop viewing logs):"
  echo "==============================================================="
  docker logs -f wasm-node
else
  echo "Error: Container failed to start. Checking logs..."
  docker logs wasm-node
  exit 1
fi
