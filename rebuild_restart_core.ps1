#!/usr/bin/env pwsh
# Script to rebuild and restart the core containers

Write-Host "Rebuilding and restarting core containers..."

# Stop existing containers
docker-compose -f deploy/docker-compose.yml down

# Rebuild core containers
docker-compose -f deploy/docker-compose.yml build core core1 core2

# Start the containers
docker-compose -f deploy/docker-compose.yml up -d core core1 core2

# Wait for containers to initialize
Write-Host "Waiting for containers to initialize (30 seconds)..."
Start-Sleep -Seconds 30

# Run the backup script
Write-Host "Running backup script..."
& ./backup_contract_addresses.ps1

# Check container status
Write-Host "Checking container status..."
docker ps -a --filter "name=deploy-core"

# Check if contract addresses exist on host
Write-Host "Checking contract address files on host..."
Get-ChildItem -Path deploy/contract_addresses_node*

# Show contract addresses content
Write-Host "Contract addresses content:"
if (Test-Path deploy/contract_addresses_node1/contract_addresses.json) {
    Write-Host "Node 1 contract addresses:"
    Get-Content deploy/contract_addresses_node1/contract_addresses.json
}

if (Test-Path deploy/contract_addresses_node2/contract_addresses.json) {
    Write-Host "Node 2 contract addresses:"
    Get-Content deploy/contract_addresses_node2/contract_addresses.json
}

if (Test-Path deploy/contract_addresses_node3/contract_addresses.json) {
    Write-Host "Node 3 contract addresses:"
    Get-Content deploy/contract_addresses_node3/contract_addresses.json
}

Write-Host "Rebuild and restart completed."
