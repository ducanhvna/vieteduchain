#!/usr/bin/env pwsh
# PowerShell script to backup contract addresses from Docker containers to host

Write-Host "Starting contract address backup script"

# Get the container IDs - use different approach for PowerShell
$CORE_CONTAINER = (docker ps -q --filter "name=deploy-core-1")
$CORE1_CONTAINER = (docker ps -q --filter "name=deploy-core1-1")
$CORE2_CONTAINER = (docker ps -q --filter "name=deploy-core2-1")

Write-Host "Found containers: CORE=$CORE_CONTAINER, CORE1=$CORE1_CONTAINER, CORE2=$CORE2_CONTAINER"

# Create host directories if they don't exist
$DirectoryPaths = @(
    "deploy/contract_addresses_node1",
    "deploy/contract_addresses_node2",
    "deploy/contract_addresses_node3"
)

foreach ($dirPath in $DirectoryPaths) {
    if (-not (Test-Path $dirPath)) {
        Write-Host "Creating directory: $dirPath"
        New-Item -Path $dirPath -ItemType Directory -Force | Out-Null
    } else {
        Write-Host "Directory already exists: $dirPath"
    }
}

# Function to copy contract addresses from container
function Copy-ContractAddressesFromContainer {
    param (
        [string]$containerId,
        [string]$destPath
    )

    if (-not $containerId) {
        Write-Host "Container ID is empty. Skipping copy operation for $destPath."
        return
    }

    try {
        # Ensure container is running
        $containerStatus = docker inspect --format='{{.State.Status}}' $containerId
        if ($containerStatus -ne "running") {
            Write-Host "Container $containerId is not running (status: $containerStatus). Cannot copy files."
            return
        }

        # Check if contract_addresses.json exists in the container
        $checkCmd = "ls -la /app/contract_addresses/contract_addresses.json"
        $fileExists = docker exec $containerId sh -c $checkCmd 2>$null
        
        if ($fileExists) {
            Write-Host "Copying contract addresses from container $containerId to $destPath"
            docker cp ${containerId}:/app/contract_addresses/contract_addresses.json $destPath/
            
            # Verify the copy operation
            if (Test-Path "$destPath/contract_addresses.json") {
                $fileContent = Get-Content "$destPath/contract_addresses.json" -Raw
                Write-Host "Successfully copied contract_addresses.json to $destPath"
                Write-Host "Content: $fileContent"
            } else {
                Write-Host "WARNING: Failed to copy contract_addresses.json to $destPath"
            }
        } else {
            Write-Host "WARNING: contract_addresses.json does not exist in container $containerId"
        }
    }
    catch {
        Write-Host "ERROR: Failed to copy from container $containerId to $destPath"
        Write-Host "Exception: $_"
    }
}

# Copy files from containers to host with verification
Copy-ContractAddressesFromContainer -containerId $CORE_CONTAINER -destPath "deploy/contract_addresses_node1"
Copy-ContractAddressesFromContainer -containerId $CORE1_CONTAINER -destPath "deploy/contract_addresses_node2"
Copy-ContractAddressesFromContainer -containerId $CORE2_CONTAINER -destPath "deploy/contract_addresses_node3"

# If containers are running but files weren't copied, try to execute the copy command directly in the container
if ($CORE_CONTAINER) {
    docker exec $CORE_CONTAINER sh -c "cp -f /app/contract_addresses/contract_addresses.json /app/contract_addresses/contract_addresses.json.backup && cat /app/contract_addresses/contract_addresses.json"
}

if ($CORE1_CONTAINER) {
    docker exec $CORE1_CONTAINER sh -c "cp -f /app/contract_addresses/contract_addresses.json /app/contract_addresses/contract_addresses.json.backup && cat /app/contract_addresses/contract_addresses.json"
}

if ($CORE2_CONTAINER) {
    docker exec $CORE2_CONTAINER sh -c "cp -f /app/contract_addresses/contract_addresses.json /app/contract_addresses/contract_addresses.json.backup && cat /app/contract_addresses/contract_addresses.json"
}

Write-Host "Contract addresses backup completed"
