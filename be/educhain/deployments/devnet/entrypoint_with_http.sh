#!/bin/bash
# Entrypoint script that starts wasmd and runs a basic HTTP server on port 1318 for the nodeinfo endpoint

# Print debugging information
echo "Starting entrypoint script..."
echo "Checking wasmd data directory..."
ls -la /root/.wasmd || echo "wasmd data directory doesn't exist"
echo "Checking wasmd config directory..."
ls -la /root/.wasmd/config || echo "wasmd config directory doesn't exist"

# Check if we need to initialize the node
if [ ! -f /root/.wasmd/config/genesis.json ]; then
    echo "WARNING: genesis.json not found! The node may not have been initialized properly."
    echo "Will still attempt to start wasmd, but it may fail..."
fi

# Start wasmd node in background with explicit home directory
echo "Starting wasmd node with explicit home directory..."
wasmd start --home=/root/.wasmd &
WASMD_PID=$!

# Wait a moment to see if wasmd starts successfully
sleep 5
if ! ps -p $WASMD_PID > /dev/null; then
    echo "ERROR: wasmd failed to start. Check logs above for errors."
    exit 1
fi

echo "wasmd started successfully with PID: $WASMD_PID"

# Create a basic HTTP server for nodeinfo endpoint on port 1318
echo 'Starting simple HTTP server for nodeinfo endpoint on port 1318...'
mkdir -p /var/www
cat > /var/www/server.py <<EOT
import http.server
import socketserver
import json
import os
import time
import subprocess
import socket

# Get validator address from environment (will be populated later)
validator_address = os.environ.get('VALIDATOR_ADDRESS', 'wasm1...')

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
            self.send_header('Access-Control-Allow-Origin', '*')  # Enable CORS
            self.end_headers()
            
            # Try to get more accurate node info from wasmd
            try:
                # Wait for wasmd to start up
                if subprocess.run(["wasmd", "status", "--node", "tcp://localhost:26657"], 
                                 capture_output=True, check=False).returncode == 0:
                    # Get validator address if available
                    validator_result = subprocess.run(
                        ["wasmd", "keys", "show", "validator", "-a", "--keyring-backend", "test"],
                        capture_output=True, text=True, check=False
                    )
                    if validator_result.returncode == 0:
                        validator_address = validator_result.stdout.strip()
                        nodeinfo["permissioned_nodes"] = [validator_address]
            except Exception as e:
                print(f"Error fetching dynamic data: {e}")
            
            self.wfile.write(json.dumps(nodeinfo, indent=2).encode())
        else:
            # Serve static files for other paths
            super().do_GET()

# Start the server
Handler = NodeInfoHandler
httpd = socketserver.TCPServer(("0.0.0.0", 1318), Handler)
print("Server started at port 1318")
EOT

# Start Python HTTP server in background
cd /var/www
python3 server.py &
HTTP_PID=$!

# Function to handle container shutdown
function handle_shutdown {
    echo "Received shutdown signal, gracefully stopping services..."
    
    # Kill HTTP server first
    if kill -TERM $HTTP_PID 2>/dev/null; then
        echo "Sent TERM signal to HTTP server (PID: $HTTP_PID)"
        wait $HTTP_PID 2>/dev/null || true
    else
        echo "HTTP server is already stopped"
    fi
    
    # Then kill wasmd
    if kill -TERM $WASMD_PID 2>/dev/null; then
        echo "Sent TERM signal to wasmd (PID: $WASMD_PID)"
        wait $WASMD_PID 2>/dev/null || true
    else
        echo "wasmd is already stopped"
    fi
    
    echo "All services stopped gracefully"
    exit 0
}

# Setup signal handler to properly terminate child processes
trap handle_shutdown SIGTERM SIGINT

echo "Services are now running..."
echo "wasmd node started with PID: $WASMD_PID"
echo "HTTP server started with PID: $HTTP_PID"

# Monitor both processes and exit if either one exits
while true; do
    # Check if wasmd is running
    if ! ps -p $WASMD_PID > /dev/null; then
        echo "wasmd process exited unexpectedly with PID: $WASMD_PID"
        # Kill HTTP server
        kill -TERM $HTTP_PID 2>/dev/null || true
        exit 1
    fi
    
    # Check if HTTP server is running
    if ! ps -p $HTTP_PID > /dev/null; then
        echo "HTTP server process exited unexpectedly with PID: $HTTP_PID"
        # Kill wasmd
        kill -TERM $WASMD_PID 2>/dev/null || true
        exit 1
    fi
    
    # Sleep for a bit before checking again
    sleep 5
done
