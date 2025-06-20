#!/bin/bash

# Script to build and run the wasmd node container with the all-in-one approach

set -e

# Define colors for console output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Display information about what this script does
cat << EOF
${YELLOW}======================================================${NC}
${YELLOW}       WASMD All-in-One Node Setup Script            ${NC}
${YELLOW}======================================================${NC}

This script will:
1. Check for available disk space
2. Clean up Docker resources to free space
3. Build the wasmd Docker image
4. Start a container with all necessary services

EOF

# Check if script is run with the --pull flag to use pre-built image
USE_PREBUILT=false
if [ "$1" == "--pull" ]; then
    USE_PREBUILT=true
    echo -e "${YELLOW}Using pre-built image option selected.${NC}"
    echo -e "This will pull the image instead of building it locally."
    echo -e "This is recommended if you have limited disk space.\n"
fi

# Check available disk space
echo -e "${YELLOW}Checking available disk space...${NC}"
df -h
echo ""

# Check Docker disk usage
echo -e "${YELLOW}Checking Docker disk usage...${NC}"
docker system df
echo ""

# Function to clean up Docker resources
cleanup_docker() {
    echo -e "${YELLOW}Cleaning up Docker resources...${NC}"
    
    # Remove unused containers
    echo "Removing unused containers..."
    docker container prune -f
    
    # Remove unused images
    echo "Removing unused images..."
    docker image prune -f
    
    # Remove build cache
    echo "Removing build cache..."
    docker builder prune -f
    
    # Full system prune as a last resort
    echo "Performing system prune..."
    docker system prune -f --volumes
    
    echo -e "${GREEN}Docker cleanup completed.${NC}"
    docker system df
    echo ""
}

# Stop any existing containers
echo -e "${YELLOW}Stopping any existing wasm containers...${NC}"
docker stop wasm-node 2>/dev/null || true
docker rm wasm-node 2>/dev/null || true

# Create data directory structure if it doesn't exist
echo -e "${YELLOW}Setting up data directory structure...${NC}"
mkdir -p ./data

# Check available disk space
AVAILABLE_SPACE=$(df -k . | awk 'NR==2 {print $4}')
REQUIRED_SPACE=2000000  # Approximately 2GB in KB

if [ "$AVAILABLE_SPACE" -lt "$REQUIRED_SPACE" ] && [ "$USE_PREBUILT" = false ]; then
    echo -e "${RED}Warning: Low disk space detected ($(( AVAILABLE_SPACE / 1024 )) MB available, $(( REQUIRED_SPACE / 1024 )) MB recommended)${NC}"
    echo -e "${YELLOW}You can run this script with --pull to use a pre-built image instead.${NC}"
    echo -e "Example: ./run_allinone.sh --pull"
    echo ""
    read -p "Continue with build anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Build cancelled. Try running with --pull option.${NC}"
        exit 1
    fi
fi

# Clean up Docker resources to free space
cleanup_docker

if [ "$USE_PREBUILT" = true ]; then
    # Pull pre-built image
    echo -e "${YELLOW}Pulling pre-built wasmd image...${NC}"
    docker pull cosmwasm/wasmd:v0.50.0
    
    # Tag the image to match our expected name
    docker tag cosmwasm/wasmd:v0.50.0 cosmos-wasmd-allinone
    
    if [ $? -ne 0 ]; then
        echo -e "\n${RED}Failed to pull Docker image. Please check your internet connection.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}Docker image pulled successfully!${NC}"
else
    # Build the Docker image
    echo -e "${YELLOW}Building Docker image (this may take a few minutes)...${NC}"
    
    # Build with options to minimize disk usage
    docker build --no-cache --force-rm --rm=true -t cosmos-wasmd-allinone -f Dockerfile.allinone .
    
    # Check if build was successful
    if [ $? -ne 0 ]; then
        echo -e "\n${RED}Docker build failed. Please check the error messages above.${NC}"
        echo -e "${YELLOW}Try running with --pull option to use a pre-built image:${NC}"
        echo -e "./run_allinone.sh --pull"
        exit 1
    fi
    
    echo -e "${GREEN}Docker image built successfully!${NC}"
fi

# Run the container
echo -e "${YELLOW}Starting container...${NC}"

# Ensure start_node.sh has correct permissions
echo -e "${YELLOW}Ensuring script has proper permissions...${NC}"
chmod +x ./start_node.sh

docker run -d \
  --name wasm-node \
  -p 26656:26656 \
  -p 26657:26657 \
  -p 1317:1317 \
  -p 1318:1318 \
  -p 9090:9090 \
  -v $(pwd)/data:/root/.wasmd \
  -v $(pwd)/start_node.sh:/root/start_node.sh \
  -v $(pwd)/../../chain:/chain \
  cosmos-wasmd-allinone

# Check if container started successfully
if [ $? -ne 0 ]; then
    echo -e "\n${RED}Failed to start the container. Please check the error messages above.${NC}"
    exit 1
fi

echo -e "${GREEN}Container started successfully!${NC}"

# Monitor the container logs for a short time to catch any startup errors
echo -e "${YELLOW}Monitoring container logs for startup issues...${NC}"
docker logs -f wasm-node &
DOCKER_LOGS_PID=$!

# Monitor for 10 seconds then stop showing logs
sleep 10
kill $DOCKER_LOGS_PID 2>/dev/null || true

echo -e "${GREEN}Node is running! You can access:${NC}"
echo -e "  REST API: http://localhost:1317"
echo -e "  Node Info: http://localhost:1318"
echo -e "  RPC: http://localhost:26657"
echo -e "  gRPC: http://localhost:9090"
echo ""
echo -e "${YELLOW}To view logs:${NC} docker logs -f wasm-node"
echo -e "${YELLOW}To stop:${NC} docker stop wasm-node"
echo -e "${YELLOW}Showing logs (press Ctrl+C to exit logs without stopping the container)...${NC}"
echo -e "REST API will be available at: http://localhost:1317"
echo -e "Node info will be available at: http://localhost:1318"
echo -e "RPC endpoint will be available at: http://localhost:26657"

# Show the logs
docker logs -f wasm-node
