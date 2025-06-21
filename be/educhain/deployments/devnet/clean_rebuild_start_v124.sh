#!/bin/bash

# Script to clean up and restart the wasm-node container with updated Dockerfile.v124

set -e

cd "$(dirname "$0")"  # Navigate to the script directory

echo "Stopping any running containers..."
docker-compose down || true

echo "Cleaning data directory for a fresh start..."
rm -rf ./data/*

echo "Making enhanced_start_v124.sh executable..."
chmod +x ./enhanced_start_v124.sh

echo "Building container using updated Dockerfile.v124..."
docker-compose -f docker-compose.v124.yml build --no-cache

echo "Starting container..."
docker-compose -f docker-compose.v124.yml up -d

echo "Checking container status..."
sleep 5
docker ps | grep wasm-node || echo "Container may have exited already"

echo "Waiting for container to initialize..."
sleep 10

echo "Showing logs (press Ctrl+C to exit)..."
docker logs -f wasm-node
