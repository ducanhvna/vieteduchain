# PowerShell script to backup contract addresses from Docker containers to host

Write-Host "Starting contract address backup script"

# Get the container IDs - use different approach for PowerShell
$CORE_CONTAINER = (docker ps -q --filter "name=deploy-core-1")
$CORE1_CONTAINER = (docker ps -q --filter "name=deploy-core1-1")
$CORE2_CONTAINER = (docker ps -q --filter "name=deploy-core2-1")

Write-Host "Found containers: CORE=$CORE_CONTAINER, CORE1=$CORE1_CONTAINER, CORE2=$CORE2_CONTAINER"

# Create host directories if they don't exist
New-Item -Path "deploy/contract_addresses_node1" -ItemType Directory -Force | Out-Null
New-Item -Path "deploy/contract_addresses_node2" -ItemType Directory -Force | Out-Null
New-Item -Path "deploy/contract_addresses_node3" -ItemType Directory -Force | Out-Null

# Copy files from containers to host
if ($CORE_CONTAINER) {
  Write-Host "Copying contract addresses from core container to host"
  docker cp ${CORE_CONTAINER}:/app/contract_addresses/contract_addresses.json deploy/contract_addresses_node1/
  Write-Host "Copied to deploy/contract_addresses_node1/contract_addresses.json"
}

if ($CORE1_CONTAINER) {
  Write-Host "Copying contract addresses from core1 container to host"
  docker cp ${CORE1_CONTAINER}:/app/contract_addresses/contract_addresses.json deploy/contract_addresses_node2/
  Write-Host "Copied to deploy/contract_addresses_node2/contract_addresses.json"
}

if ($CORE2_CONTAINER) {
  Write-Host "Copying contract addresses from core2 container to host"
  docker cp ${CORE2_CONTAINER}:/app/contract_addresses/contract_addresses.json deploy/contract_addresses_node3/
  Write-Host "Copied to deploy/contract_addresses_node3/contract_addresses.json"
}

Write-Host "Contract addresses backup completed"
