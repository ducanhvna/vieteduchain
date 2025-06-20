#!/bin/sh
set -e

# Configuration
CHAIN_ID="testing"
MONIKER="my-wasmd-node"
VALIDATOR_NAME="validator"
TOKEN_AMOUNT="10000000000000"
STAKING_AMOUNT="300000000"
TOKEN_DENOM="stake"
WASMD_HOME="/root/.wasmd"

# Check if wasmd home directory exists and is writable
if [ ! -d "$WASMD_HOME" ]; then
    echo "Creating wasmd home directory: $WASMD_HOME"
    mkdir -p "$WASMD_HOME"
fi

# Test write access to wasmd home directory
if ! touch "$WASMD_HOME/.write_test" 2>/dev/null; then
    echo "Error: Cannot write to $WASMD_HOME directory. Please check permissions."
    exit 1
else
    rm "$WASMD_HOME/.write_test"
fi

echo "Starting wasmd node with home directory: $WASMD_HOME"

# Check if node is already initialized
if [ ! -f "$WASMD_HOME/config/genesis.json" ]; then
    echo "Initializing wasmd node..."
    wasmd init "$MONIKER" --chain-id "$CHAIN_ID" --home "$WASMD_HOME"
    
    # Generate validator keys
    echo "Creating validator key..."
    wasmd keys add "$VALIDATOR_NAME" --keyring-backend test --home "$WASMD_HOME"
    
    # Get validator address
    VALIDATOR_ADDRESS=$(wasmd keys show "$VALIDATOR_NAME" -a --keyring-backend test --home "$WASMD_HOME")
    echo "Validator address: $VALIDATOR_ADDRESS"
    
    # Add genesis account
    wasmd genesis add-genesis-account "$VALIDATOR_ADDRESS" "${TOKEN_AMOUNT}${TOKEN_DENOM}" --home "$WASMD_HOME"
    
    # Create gentx
    wasmd genesis gentx "$VALIDATOR_NAME" "${STAKING_AMOUNT}${TOKEN_DENOM}" \
      --chain-id "$CHAIN_ID" \
      --keyring-backend test \
      --home "$WASMD_HOME"
    
    # Collect gentxs
    wasmd genesis collect-gentxs --home "$WASMD_HOME"
    
    # Configure for external access
    sed -i 's/127.0.0.1/0.0.0.0/g' "$WASMD_HOME/config/config.toml"
    sed -i 's/localhost/0.0.0.0/g' "$WASMD_HOME/config/config.toml"
    sed -i 's/enable = false/enable = true/g' "$WASMD_HOME/config/app.toml"
    sed -i 's/enable-unsafe-cors = false/enable-unsafe-cors = true/g' "$WASMD_HOME/config/app.toml"
    sed -i 's/address = "tcp:\/\/localhost:1317"/address = "tcp:\/\/0.0.0.0:1317"/g' "$WASMD_HOME/config/app.toml"
    sed -i 's/address = "tcp:\/\/localhost:9090"/address = "tcp:\/\/0.0.0.0:9090"/g' "$WASMD_HOME/config/app.toml"
    
    echo "Node initialization completed."
else
    echo "Found existing node configuration at $WASMD_HOME"
fi

# Start wasmd
echo "Starting wasmd node..."
wasmd start --home "$WASMD_HOME" &

# Create simple HTTP server on port 1318
mkdir -p /var/www
cat > /var/www/server.py <<EOT
import http.server
import socketserver
import json
import os
import subprocess

# Try to get validator address
validator_address = "wasm1..."
try:
    result = subprocess.run(
        ["wasmd", "keys", "show", "validator", "-a", "--keyring-backend", "test", "--home", "/root/.wasmd"],
        capture_output=True, text=True, check=False
    )
    if result.returncode == 0:
        validator_address = result.stdout.strip()
except Exception as e:
    print(f"Error fetching validator address: {e}")

# Create the nodeinfo data similar to Go app
nodeinfo = {
  "contracts": {
    "eduid": "wasm1...",
    "educert": "wasm1...",
    "edupay": "wasm1...",
    "eduadmission": "wasm1...",
    "researchledger": "wasm1..."
  },
    "permissioned_nodes": [validator_address],
  "student_dids": ["did:eduid:..."],
  "chain_id": "testing"
}

class NodeInfoHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Add CORS headers for all responses
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
        # Handle specific endpoints
        if self.path == '/nodeinfo' or self.path == '/':
            self.wfile.write(json.dumps(nodeinfo, indent=2).encode())
        else:
            # Return a 404-like response for unknown endpoints
            error_response = {
                "error": "Not found",
                "message": f"Endpoint {self.path} not found",
                "available_endpoints": ["/nodeinfo", "/"]
            }
            self.wfile.write(json.dumps(error_response, indent=2).encode())

    def do_OPTIONS(self):
        # Handle OPTIONS requests for CORS preflight
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

print("[REST] Starting HTTP server on 0.0.0.0:1318 ... (try http://localhost:1318/nodeinfo)")
socketserver.TCPServer(("0.0.0.0", 1318), NodeInfoHandler).serve_forever()
EOT

echo "Starting HTTP server for nodeinfo on port 1318..."
python3 /var/www/server.py &

# Keep container running
echo "Services started. Keeping container running..."
tail -f /dev/null
