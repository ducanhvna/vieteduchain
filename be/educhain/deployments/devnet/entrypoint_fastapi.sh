#!/bin/bash
# Enhanced entrypoint script with FastAPI support

# Define colors for console output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to log with timestamp
log() {
  echo -e "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Function to start the Cosmos REST API
start_cosmos_rest_api() {
  log "${YELLOW}Starting Cosmos REST API on port 1317...${NC}"
  wasmd rest-server --laddr tcp://0.0.0.0:1317 --node tcp://localhost:26657 --unsafe-cors &
  
  sleep 3
  if curl -s http://localhost:1317/cosmos/base/tendermint/v1beta1/node_info > /dev/null; then
    log "${GREEN}Cosmos REST API is running at http://localhost:1317/cosmos/base/tendermint/v1beta1/node_info${NC}"
  else
    log "${YELLOW}Note: Cosmos REST API may still be starting up${NC}"
  fi
}

# Function to start the FastAPI Custom REST API
start_fastapi_rest_api() {
  log "${YELLOW}Starting FastAPI Custom REST API on port 1318...${NC}"
  
  if [ -d "/chain" ] && [ -f "/chain/main.py" ]; then
    cd /chain
    
    # Install Python dependencies
    log "Installing Python dependencies..."
    pip3 install -r requirements.txt
    
    # Start the FastAPI server
    log "Starting FastAPI server..."
    python3 main.py &
    FASTAPI_PID=$!
    
    # Check if FastAPI server is running
    sleep 5
    if ps -p $FASTAPI_PID > /dev/null; then
      log "${GREEN}FastAPI server process is running with PID: $FASTAPI_PID${NC}"
      
      # Try to access the API
      if curl -s http://localhost:1318/api/v1/nodeinfo > /dev/null; then
        log "${GREEN}FastAPI server is running at http://localhost:1318/api/v1/nodeinfo${NC}"
      else
        log "${YELLOW}FastAPI server process is running but endpoint is not responding yet${NC}"
        log "Check logs below for any errors:"
        ps aux | grep "python3 main.py"
      fi
    else
      log "${RED}Failed to start FastAPI server. Check files in /chain directory:${NC}"
      ls -la /chain
      log "${YELLOW}Trying alternative approach with direct python command...${NC}"
      cd /chain && nohup python3 main.py > /var/log/fastapi.log 2>&1 &
    fi
  else
    log "${RED}No FastAPI server code found in /chain directory. Contents:${NC}"
    ls -la /chain 2>/dev/null || echo "Chain directory not found or empty"
  fi
}

# Function to check if wasmd node is running
check_wasmd_running() {
  if curl -s http://localhost:26657/status > /dev/null; then
    return 0  # Running
  else
    return 1  # Not running
  fi
}

# Main execution
log "${YELLOW}Initializing node...${NC}"

# Verify required libraries are available
log "Verifying libwasmvm library..."
if [ -f "/usr/lib/libwasmvm.aarch64.so" ]; then
  log "${GREEN}Found libwasmvm.aarch64.so${NC}"
elif [ -f "/usr/lib/libwasmvm.x86_64.so" ]; then
  log "${GREEN}Found libwasmvm.x86_64.so${NC}"
else
  log "${RED}Warning: libwasmvm library not found in expected location. Listing /usr/lib contents:${NC}"
  ls -la /usr/lib/ | grep libwasm
fi

# Start wasmd node
log "${YELLOW}Starting wasmd node...${NC}"
wasmd start &
WASMD_PID=$!

# Wait for node to start
log "Waiting for wasmd node to start..."
MAX_RETRIES=30
RETRY_COUNT=0
while ! check_wasmd_running; do
  RETRY_COUNT=$((RETRY_COUNT+1))
  if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
    log "${RED}Failed to start wasmd node after $MAX_RETRIES attempts${NC}"
    exit 1
  fi
  log "${YELLOW}Waiting for RPC to be available... (attempt $RETRY_COUNT/$MAX_RETRIES)${NC}"
  sleep 2
done

log "${GREEN}Wasmd node is running with PID: $WASMD_PID${NC}"

# Start the Cosmos REST API
start_cosmos_rest_api

# Start the FastAPI Custom REST API
start_fastapi_rest_api

# Display available endpoints
log "${GREEN}Available endpoints:${NC}"
log "- Tendermint RPC: http://localhost:26657"
log "- Cosmos REST API: http://localhost:1317"
log "- Custom REST API: http://localhost:1318"
log "- gRPC: localhost:9090"

# Keep container running
log "${GREEN}All services started. Container will remain running.${NC}"
tail -f /dev/null
