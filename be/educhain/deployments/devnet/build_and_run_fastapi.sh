#!/bin/bash

# build_and_run_fastapi.sh
# Script to build and run the FastAPI version of the Cosmos Permissioned Network

# Define colors for console output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Building and starting the FastAPI version of the Cosmos Permissioned Network${NC}"

# Stop any running containers
echo -e "${YELLOW}Stopping any running containers...${NC}"
docker-compose down

# Build and start the containers
echo -e "${YELLOW}Building and starting new containers...${NC}"
docker-compose up -d --build

# Wait for services to start
echo -e "${YELLOW}Waiting for services to start...${NC}"
sleep 10

# Check if services are running
echo -e "${YELLOW}Checking if services are running...${NC}"

echo -n "Checking Tendermint RPC (port 26657): "
if curl -s http://localhost:26657/status > /dev/null; then
  echo -e "${GREEN}OK${NC}"
else
  echo -e "${RED}Not responding${NC}"
fi

echo -n "Checking Cosmos REST API (port 1317): "
if curl -s http://localhost:1317/cosmos/base/tendermint/v1beta1/node_info > /dev/null; then
  echo -e "${GREEN}OK${NC}"
else
  echo -e "${RED}Not responding${NC}"
  echo -e "${YELLOW}Cosmos REST API may still be starting up...${NC}"
fi

echo -n "Checking FastAPI Custom REST API (port 1318): "
if curl -s http://localhost:1318/api/v1/nodeinfo > /dev/null; then
  echo -e "${GREEN}OK${NC}"
else
  echo -e "${RED}Not responding${NC}"
  echo -e "${YELLOW}FastAPI may still be starting up...${NC}"
fi

echo -e "\n${GREEN}Setup complete! You can now use the following endpoints:${NC}"
echo -e "  Tendermint RPC: http://localhost:26657"
echo -e "  Cosmos REST API: http://localhost:1317"
echo -e "  FastAPI Custom REST API: http://localhost:1318"
echo -e "  gRPC: localhost:9090"
echo ""
echo -e "${YELLOW}To view logs:${NC} docker-compose logs -f"
echo -e "${YELLOW}To stop:${NC} docker-compose down"
