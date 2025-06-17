# Contract Addresses Synchronization

## Problem

In Windows environments, Docker volume mounts sometimes have permission issues that prevent files created inside Docker containers from appearing in the host system's mounted volumes. This affects our contract addresses synchronization between the containers and the host system.

## Solution

We've created two mechanisms to ensure contract addresses are properly synchronized:

1. **Enhanced entrypoint_core.sh**: The script now sets proper permissions (666) on the contract_addresses.json file and attempts to copy it to multiple potential locations where the volume might be mounted.

2. **Backup Scripts**: Use these scripts to manually copy the contract addresses from the Docker containers to the host system:
   - `backup_contract_addresses.ps1` (PowerShell script for Windows)
   - `backup_contract_addresses.sh` (Bash script for Linux/Mac)

## Usage

### After Starting Containers

After starting the containers with `docker compose -f deploy/docker-compose.yml up -d`, you should run the backup script to ensure contract addresses are available on the host:

```powershell
# In PowerShell
.\backup_contract_addresses.ps1
```

### Checking Contract Addresses

To verify that contract addresses have been properly synchronized:

```powershell
# For node1 (core)
Get-Content deploy/contract_addresses_node1/contract_addresses.json

# For node2 (core1)
Get-Content deploy/contract_addresses_node2/contract_addresses.json

# For node3 (core2)
Get-Content deploy/contract_addresses_node3/contract_addresses.json
```

## Root Cause

The issue is related to Windows-specific Docker volume mounting permissions. While the files are correctly created inside the container (as verified by `docker exec deploy-core-1 ls -la /app/contract_addresses/`), they are not properly synced to the host system through the volume mount.

This issue is common in Windows Docker environments, especially when running Docker Desktop on Windows.

## Best Practice

Run the backup script after:
1. Starting or restarting containers
2. Deploying new contracts
3. Whenever you need to ensure the contract addresses are in sync

## Additional Information

The contract_addresses.json file contains the addresses of deployed contracts on the blockchain. These addresses are essential for other services (like the API and UI) to interact with the contracts.

If you experience any issues with contract address synchronization, try:
1. Running the backup script
2. Checking if the files exist in the container with `docker exec deploy-core-1 cat /app/contract_addresses/contract_addresses.json`
3. Restart the core containers and run the backup script again
