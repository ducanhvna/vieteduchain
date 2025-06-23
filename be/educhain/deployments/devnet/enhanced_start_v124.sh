#!/bin/bash
# Enhanced startup script for wasmd chain initialization and execution

set -e

# Set environment variables
DAEMON_HOME=${DAEMON_HOME:-"/root/.wasmd"}
CHAIN_ID=${CHAIN_ID:-"educhain"}
TOKEN_AMOUNT=${TOKEN_AMOUNT:-"1000000000000000stake,1000000000ucosm"}
STAKING_AMOUNT=${STAKING_AMOUNT:-"100000000000000stake"}
CLEAN_START=${CLEAN_START:-"false"}

# Colors for better output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Export contract addresses from file if available
if [ -f "$DAEMON_HOME/eduid_address.txt" ]; then
  export EDUID_CONTRACT_ADDRESS=$(cat "$DAEMON_HOME/eduid_address.txt")
  echo -e "${YELLOW}Exported EDUID_CONTRACT_ADDRESS=$EDUID_CONTRACT_ADDRESS${NC}"
fi
if [ -f "$DAEMON_HOME/educert_address.txt" ]; then
  export EDUCERT_CONTRACT_ADDRESS=$(cat "$DAEMON_HOME/educert_address.txt")
  echo -e "${YELLOW}Exported EDUCERT_CONTRACT_ADDRESS=$EDUCERT_CONTRACT_ADDRESS${NC}"
fi
# Thêm các contract khác tương tự nếu cần

# Function to check if FastAPI is already running
check_fastapi_running() {
  # Check if a FastAPI process is already running
  if pgrep -f "uvicorn main:app" > /dev/null; then
    echo -e "${GREEN}FastAPI server is already running${NC}"
    FASTAPI_PID=$(pgrep -f "uvicorn main:app")
    echo -e "${GREEN}FastAPI server PID: $FASTAPI_PID${NC}"
    return 0  # Already running
  else
    return 1  # Not running
  fi
}

# Function to wait for FastAPI to be ready
wait_for_fastapi() {
  local MAX_RETRIES=10
  local RETRY_COUNT=0
  local SUCCESS=false
  
  echo -e "${YELLOW}Waiting for FastAPI service to be ready...${NC}"
  
  while [ $RETRY_COUNT -lt $MAX_RETRIES ] && [ "$SUCCESS" = false ]; do
    if curl -s http://localhost:1318/api/v1/health > /dev/null; then
      echo -e "${GREEN}FastAPI service is responding at http://localhost:1318${NC}"
      SUCCESS=true
    else
      RETRY_COUNT=$((RETRY_COUNT+1))
      echo -e "${YELLOW}FastAPI service not responding yet. Retry $RETRY_COUNT of $MAX_RETRIES...${NC}"
      sleep 3
    fi
  done
  
  if [ "$SUCCESS" = false ]; then
    echo -e "${RED}WARNING: FastAPI service is not responding after $MAX_RETRIES retries${NC}"
    echo -e "${YELLOW}Checking FastAPI logs...${NC}"
    tail -20 /var/log/fastapi.log || echo "No log file found"
    echo -e "${YELLOW}Checking running processes...${NC}"
    ps aux | grep uvicorn
    return 1
  fi
  
  return 0
}

# Function to start the FastAPI server
start_fastapi() {
  echo -e "${YELLOW}Setting up FastAPI server on port 1318...${NC}"
  
  # Check if already running
  if check_fastapi_running; then
    echo -e "${GREEN}FastAPI is already running, no need to start it again${NC}"
    wait_for_fastapi
    return 0
  fi
  
  # Check if the chain directory exists
  if [ ! -d "/root/chain" ]; then
    echo -e "${YELLOW}Chain directory not found at /root/chain, creating it...${NC}"
    mkdir -p /root/chain
  fi
  
  cd /root/chain

  # Create a proper main.py file if it doesn't exist or is empty
  if [ ! -s "/root/chain/main.py" ]; then
    echo -e "${YELLOW}Creating FastAPI main.py file...${NC}"
    cat > /root/chain/main.py << 'EOF'
#!/usr/bin/env python3
"""
FastAPI implementation of the Custom REST API for Cosmos Permissioned Network
This replaces the Go implementation with a Python-based FastAPI version
"""

from fastapi import FastAPI, HTTPException, Request, Path, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import httpx
import uvicorn
import os
from datetime import datetime
from typing import Dict, List, Any, Optional
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="EduChain Custom API",
    description="Custom REST API for Cosmos Permissioned Network",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
TENDERMINT_RPC_URL = os.getenv("TENDERMINT_RPC_URL", "http://localhost:26657")
COSMOS_REST_URL = os.getenv("COSMOS_REST_URL", "http://localhost:1317")

# Basic routes
@app.get("/api/v1/nodeinfo")
async def get_node_info():
    """Get node information including version, network, and validator details"""
    try:
        # Call Tendermint RPC
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{TENDERMINT_RPC_URL}/status")
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="Failed to get node status")
            
            data = response.json()
            
            # Extract relevant info
            node_info = {
                "node_id": data["result"]["node_info"]["id"],
                "network": data["result"]["node_info"]["network"],
                "version": data["result"]["node_info"]["version"],
                "channels": data["result"]["node_info"]["channels"],
                "moniker": data["result"]["node_info"]["moniker"],
                "other": data["result"]["node_info"]["other"],
                "application_version": {
                    "name": "wasmd",
                    "server_name": "wasmd",
                    "version": data["result"]["node_info"]["version"],
                    "git_commit": "",
                    "build_tags": "netgo",
                    "go_version": "go version go1.19.13 linux/amd64"
                },
                "latest_block_height": data["result"]["sync_info"]["latest_block_height"],
                "catching_up": data["result"]["sync_info"]["catching_up"]
            }
            
            return node_info
    except Exception as e:
        logger.error(f"Error getting node info: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/api/v1/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    port = 1318
    print(f"Starting FastAPI server on http://0.0.0.0:{port}")
    uvicorn.run("main:app", host="0.0.0.0", port=port)
EOF
    chmod +x /root/chain/main.py
  fi

  # Create requirements.txt if it doesn't exist or is empty
  if [ ! -s "/root/chain/requirements.txt" ]; then
    echo -e "${YELLOW}Creating FastAPI requirements file...${NC}"
    cat > /root/chain/requirements.txt << 'EOF'
fastapi==0.104.1
uvicorn==0.24.0
httpx==0.25.1
EOF
  fi
  
  # Make sure the Python virtual environment has the required packages
  echo -e "${YELLOW}Installing FastAPI dependencies...${NC}"
  /venv/bin/pip install -r /root/chain/requirements.txt
  
  # Start FastAPI server in the background
  echo -e "${YELLOW}Starting FastAPI server...${NC}"
  cd /root/chain
  
  # Kill any existing FastAPI processes that might be zombie or stale
  pkill -f "uvicorn main:app" || true
  
  # Give a moment for any existing process to terminate
  sleep 1
  
  # Install any missing Python dependencies
  echo -e "${YELLOW}Installing required Python packages...${NC}"
  /venv/bin/pip install -r /root/chain/requirements.txt
  /venv/bin/pip install minio prometheus-client psutil httpx pymongo asyncio pydantic python-dotenv orjson

  # Run directly with uvicorn to avoid module loading issues
  echo -e "${YELLOW}Starting uvicorn with: /venv/bin/uvicorn main:app --host 0.0.0.0 --port 1318${NC}"
  ls -la /root/chain  # Debug: Show what files are in the directory
  PYTHONPATH=/root/chain nohup /venv/bin/uvicorn main:app --host 0.0.0.0 --port 1318 > /var/log/fastapi.log 2>&1 &
  FASTAPI_PID=$!
  
  # Wait a bit for the server to start
  sleep 3
  
  # Check if the process is still running
  if ps -p $FASTAPI_PID > /dev/null; then
    echo -e "${GREEN}FastAPI server started with PID: $FASTAPI_PID${NC}"
    
    # Check if the API is responding
    if wait_for_fastapi; then
      # Create a PID file for monitoring
      echo $FASTAPI_PID > /var/run/fastapi.pid
      return 0
    else
      echo -e "${RED}WARNING: FastAPI service started but not responding properly${NC}"
      return 1
    fi
  else
    echo -e "${RED}ERROR: FastAPI service failed to start${NC}"
    echo -e "${YELLOW}Last few log lines:${NC}"
    tail -10 /var/log/fastapi.log || echo "No log file found"
    return 1
  fi
}

# Function to ensure MinIO bucket exists
ensure_minio_bucket() {
  # Set these variables as needed or export from environment
  MINIO_ALIAS="localminio"
  MINIO_ENDPOINT="${MINIO_ENDPOINT:-http://minio:9000}"
  MINIO_ACCESS_KEY="${MINIO_ACCESS_KEY:-minioadmin}"
  MINIO_SECRET_KEY="${MINIO_SECRET_KEY:-minioadmin}"
  MINIO_BUCKET="${MINIO_BUCKET:-educhain-did}"

  # Check if mc is installed
  if ! command -v mc &> /dev/null; then
    echo -e "${YELLOW}MinIO Client (mc) not found, installing...${NC}"
    curl -sSL https://dl.min.io/client/mc/release/linux-amd64/mc -o /usr/local/bin/mc
    chmod +x /usr/local/bin/mc
  fi

  # Configure mc alias (idempotent)
  mc alias set "$MINIO_ALIAS" "$MINIO_ENDPOINT" "$MINIO_ACCESS_KEY" "$MINIO_SECRET_KEY" --api S3v4 || true

  # Check if bucket exists
  if mc ls "$MINIO_ALIAS/$MINIO_BUCKET" > /dev/null 2>&1; then
    echo -e "${GREEN}MinIO bucket '$MINIO_BUCKET' already exists.${NC}"
  else
    echo -e "${YELLOW}MinIO bucket '$MINIO_BUCKET' not found. Creating...${NC}"
    mc mb "$MINIO_ALIAS/$MINIO_BUCKET"
    mc policy set public "$MINIO_ALIAS/$MINIO_BUCKET"
    echo -e "${GREEN}MinIO bucket '$MINIO_BUCKET' created and set to public.${NC}"
  fi
}

echo -e "${YELLOW}Enhanced wasmd initialization and startup script for wasmd v0.40.0 with wasmvm v1.2.4${NC}"

# System information
echo -e "${YELLOW}System information:${NC}"
uname -a
cat /etc/os-release

# Check for wasmd binary
if ! command -v wasmd &> /dev/null; then
    echo -e "${RED}ERROR: wasmd binary not found in PATH${NC}"
    exit 1
fi

# Print library path
echo -e "${YELLOW}Library path:${NC}"
echo $LD_LIBRARY_PATH

# Check wasmd version
echo -e "${YELLOW}wasmd version:${NC}"
wasmd version 2>/dev/null || echo -e "${RED}WARNING: Unable to get wasmd version${NC}"

# Check for required libraries
echo -e "${YELLOW}Checking for required libraries...${NC}"
if [ -f "/lib/libwasmvm.so" ]; then
  echo -e "${GREEN}Found libwasmvm.so in /lib${NC}"
  # Check file permissions
  ls -la /lib/libwasmvm.so
  # Check file type
  file /lib/libwasmvm.so
  # Check if library is properly linked
  ldd /usr/local/bin/wasmd 2>/dev/null || echo -e "${RED}WARNING: Unable to check library dependencies${NC}"
  # Check if wasmd is looking for this library
  strace -e open wasmd version 2>&1 | grep libwasmvm || echo -e "${RED}WARNING: wasmd does not seem to look for libwasmvm.so${NC}"
elif [ -f "/usr/lib/libwasmvm.so" ]; then
  echo -e "${GREEN}Found libwasmvm.so in /usr/lib${NC}"
  ls -la /usr/lib/libwasmvm.so
  file /usr/lib/libwasmvm.so
  ldd /usr/local/bin/wasmd 2>/dev/null || echo -e "${RED}WARNING: Unable to check library dependencies${NC}"
else
  echo -e "${RED}ERROR: libwasmvm.so not found!${NC}"
  echo "Listing /lib:"
  ls -la /lib | grep wasm
  echo "Listing /usr/lib:"
  ls -la /usr/lib | grep wasm
  echo "Checking environment:"
  env | grep -i library
  exit 1
fi

# Clean data directory if needed
if [ "${CLEAN_START}" = "true" ]; then
  echo -e "${YELLOW}Cleaning data directory for fresh start...${NC}"
  rm -rf $DAEMON_HOME/*
fi

# Make sure the data directory has correct permissions
echo -e "${YELLOW}Setting correct permissions for data directory...${NC}"
mkdir -p $DAEMON_HOME
chmod -R 755 $DAEMON_HOME

# Check if chain is already initialized
if [ ! -f "$DAEMON_HOME/config/genesis.json" ]; then
  echo -e "${YELLOW}No genesis.json found. Initializing new chain...${NC}"

  # Initialize the chain with verbose logging
  echo -e "${YELLOW}Initializing chain with ID: $CHAIN_ID${NC}"
  wasmd init --chain-id=$CHAIN_ID "educhain-node" --home=$DAEMON_HOME

  # Modify config.toml to allow any connections
  sed -i 's/cors_allowed_origins = \[\]/cors_allowed_origins = \["*"\]/g' $DAEMON_HOME/config/config.toml
  # Enable Prometheus metrics
  sed -i 's/prometheus = false/prometheus = true/g' $DAEMON_HOME/config/config.toml
  # Enable API server
  sed -i 's/enable = false/enable = true/g' $DAEMON_HOME/config/app.toml
  # Set minimum gas prices
  sed -i 's/minimum-gas-prices = ""/minimum-gas-prices = "0.025ucosm"/g' $DAEMON_HOME/config/app.toml

  # Create validator key
  echo -e "${YELLOW}Creating validator key...${NC}"
  wasmd keys add validator --keyring-backend=test --home=$DAEMON_HOME

  # Get validator address
  VALIDATOR_ADDR=$(wasmd keys show validator -a --keyring-backend=test --home=$DAEMON_HOME)
  echo -e "${GREEN}Validator address: $VALIDATOR_ADDR${NC}"

  # Add genesis account with sufficient tokens
  echo -e "${YELLOW}Adding genesis account with tokens: $TOKEN_AMOUNT${NC}"
  wasmd genesis add-genesis-account $VALIDATOR_ADDR $TOKEN_AMOUNT --home=$DAEMON_HOME

  # Create genesis transaction with sufficient stake
  echo -e "${YELLOW}Creating genesis transaction with stake: $STAKING_AMOUNT${NC}"
  wasmd genesis gentx validator $STAKING_AMOUNT --chain-id=$CHAIN_ID --keyring-backend=test --home=$DAEMON_HOME

  # Collect genesis transactions
  echo -e "${YELLOW}Collecting genesis transactions...${NC}"
  wasmd genesis collect-gentxs --home=$DAEMON_HOME

  # Set the genesis hash for Rosetta API
  GENESIS_HASH=$(sha256sum $DAEMON_HOME/config/genesis.json | awk '{print $1}')
  export GENESIS_HASH
  echo -e "${GREEN}Genesis hash: $GENESIS_HASH${NC}"

  echo -e "${GREEN}Chain initialized successfully!${NC}"
else
  echo -e "${GREEN}Genesis already exists, using existing chain data${NC}"
fi

# Validate genesis
echo -e "${YELLOW}Validating genesis...${NC}"
wasmd genesis validate-genesis --home=$DAEMON_HOME || {
  echo -e "${RED}Genesis validation failed, but continuing...${NC}"
}

# Ensure MinIO bucket exists before starting FastAPI
ensure_minio_bucket

# Start FastAPI server
start_fastapi

# Add supervisory function for FastAPI
monitor_fastapi() {
  echo -e "${YELLOW}Setting up FastAPI monitoring...${NC}"
  
  # Check every 30 seconds if FastAPI is still running
  while true; do
    sleep 30
    
    # If PID file exists, check if process is running
    if [ -f "/var/run/fastapi.pid" ]; then
      FASTAPI_PID=$(cat /var/run/fastapi.pid)
      if ! ps -p $FASTAPI_PID > /dev/null; then
        echo -e "${RED}$(date): FastAPI process with PID $FASTAPI_PID is no longer running. Restarting...${NC}" >> /var/log/fastapi_monitor.log
        start_fastapi
      fi
    else
      # No PID file, check if any uvicorn process is running
      if ! pgrep -f "uvicorn main:app" > /dev/null; then
        echo -e "${RED}$(date): No FastAPI process found. Restarting...${NC}" >> /var/log/fastapi_monitor.log
        start_fastapi
      fi
    fi
  done
}

# Start FastAPI monitoring in background
monitor_fastapi &
MONITOR_PID=$!
echo $MONITOR_PID > /var/run/fastapi_monitor.pid

# Start the comprehensive monitor_services.sh script if it exists
if [ -f "/root/monitor_services.sh" ]; then
  echo -e "${YELLOW}Starting comprehensive service monitoring...${NC}"
  chmod +x /root/monitor_services.sh
  nohup /root/monitor_services.sh > /var/log/service_monitor.log 2>&1 &
  SERVICES_MONITOR_PID=$!
  echo $SERVICES_MONITOR_PID > /var/run/services_monitor.pid
  echo -e "${GREEN}Services monitoring started with PID: $SERVICES_MONITOR_PID${NC}"
fi

# Start wasmd node
echo -e "${YELLOW}Starting wasmd node...${NC}"
nohup wasmd start --rpc.laddr tcp://0.0.0.0:26657 --api.enable --api.address tcp://0.0.0.0:1317 --grpc.address 0.0.0.0:9090 --log_level info --home=$DAEMON_HOME > /var/log/wasmd.log 2>&1 &
WASMD_PID=$!
echo $WASMD_PID > /var/run/wasmd.pid

# Check if wasmd is running
sleep 5
if ps -p $WASMD_PID > /dev/null; then
  echo -e "${GREEN}Wasmd started successfully with PID: $WASMD_PID${NC}"
else
  echo -e "${RED}Failed to start wasmd. Check logs at /var/log/wasmd.log${NC}"
  exit 1
fi

# Keep container running
tail -f /var/log/wasmd.log
