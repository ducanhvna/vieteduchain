#!/bin/bash
# Script to backup contract addresses from Docker containers to host

set -e

echo "Starting contract address backup script"

# Get the container IDs
CORE_CONTAINER=$(docker compose -f deploy/docker-compose.yml ps -q core)
CORE1_CONTAINER=$(docker compose -f deploy/docker-compose.yml ps -q core1)
CORE2_CONTAINER=$(docker compose -f deploy/docker-compose.yml ps -q core2)

echo "Found containers: CORE=$CORE_CONTAINER, CORE1=$CORE1_CONTAINER, CORE2=$CORE2_CONTAINER"

# Create host directories if they don't exist
mkdir -p deploy/contract_addresses_node1
mkdir -p deploy/contract_addresses_node2
mkdir -p deploy/contract_addresses_node3

# Copy files from containers to host
if [ -n "$CORE_CONTAINER" ]; then
  echo "Copying contract addresses from core container to host"
  docker cp $CORE_CONTAINER:/app/contract_addresses/contract_addresses.json deploy/contract_addresses_node1/
  echo "Copied to deploy/contract_addresses_node1/contract_addresses.json"
fi

if [ -n "$CORE1_CONTAINER" ]; then
  echo "Copying contract addresses from core1 container to host"
  docker cp $CORE1_CONTAINER:/app/contract_addresses/contract_addresses.json deploy/contract_addresses_node2/
  echo "Copied to deploy/contract_addresses_node2/contract_addresses.json"
fi

if [ -n "$CORE2_CONTAINER" ]; then
  echo "Copying contract addresses from core2 container to host"
  docker cp $CORE2_CONTAINER:/app/contract_addresses/contract_addresses.json deploy/contract_addresses_node3/
  echo "Copied to deploy/contract_addresses_node3/contract_addresses.json"
fi

echo "Contract addresses backup completed"
