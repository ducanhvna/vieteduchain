#!/usr/bin/env python3
"""
fix_eduadmission_contract.py - Script to fix the EduAdmission contract address issues
"""

import os
import json
import subprocess
import requests
import time
import argparse

# Parse command line arguments
parser = argparse.ArgumentParser(description='Fix EduAdmission contract address issues')
parser.add_argument('--node', choices=['1', '2', '3'], default='1', help='Node number (1, 2, or 3)')
parser.add_argument('--dry-run', action='store_true', help='Print actions without executing them')
args = parser.parse_args()

# Constants
NODE_NUM = args.node
DRY_RUN = args.dry_run
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CONTRACT_JSON_DIR = os.path.join(BASE_DIR, f"deploy/contract_addresses_node{NODE_NUM}")
CONTRACT_JSON = os.path.join(CONTRACT_JSON_DIR, "contract_addresses.json")
API_BASE_URL = "http://localhost:8279/api"

# Function to load contract addresses from JSON file
def load_contract_addresses():
    """Load contract addresses from the JSON file"""
    if not os.path.exists(CONTRACT_JSON):
        print(f"Error: Contract addresses file not found at {CONTRACT_JSON}")
        return None
    
    try:
        with open(CONTRACT_JSON, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading contract addresses: {str(e)}")
        return None

# Function to check if contract address is valid
def is_valid_contract_address(address):
    """Check if a contract address is valid"""
    return (
        address and 
        not address.endswith('_contract_address') and 
        not address.endswith('_placeholder_address') and
        address != ''
    )

# Function to update environment variables in Docker containers
def update_docker_env_vars(contract_addresses):
    """Update environment variables in Docker containers"""
    updated = False
    
    for container in ["deploy-api-1", "deploy-api1-1", "deploy-api2-1"]:
        try:
            # Check if container exists
            result = subprocess.run(
                f'docker ps -q -f name={container}', 
                shell=True, 
                capture_output=True, 
                text=True
            )
            
            if not result.stdout.strip():
                print(f"Container {container} not found, skipping")
                continue
            
            print(f"Updating environment variables in container {container}...")
            if DRY_RUN:
                print(f"  [DRY RUN] Would set environment variables in {container}")
                continue
                
            # Create a temporary shell script to set environment variables
            env_script = os.path.join(BASE_DIR, "set_env.sh")
            with open(env_script, 'w') as f:
                f.write("#!/bin/sh\n")
                for key, value in contract_addresses.items():
                    if is_valid_contract_address(value):
                        f.write(f"export {key}='{value}'\n")
            
            # Copy the script to the container
            subprocess.run(f'docker cp {env_script} {container}:/tmp/set_env.sh', shell=True)
            
            # Set execute permissions and run the script
            subprocess.run(f'docker exec {container} chmod +x /tmp/set_env.sh', shell=True)
            subprocess.run(f'docker exec {container} /tmp/set_env.sh', shell=True)
            
            # Verify the environment variables were set
            for key, value in contract_addresses.items():
                if is_valid_contract_address(value):
                    result = subprocess.run(
                        f'docker exec {container} sh -c "echo ${key}"', 
                        shell=True,
                        capture_output=True,
                        text=True
                    )
                    actual_value = result.stdout.strip()
                    if actual_value == value:
                        print(f"  ✅ {key} set correctly to {value}")
                        updated = True
                    else:
                        print(f"  ❌ Failed to set {key}. Expected {value}, got {actual_value}")
            
            # Clean up
            os.unlink(env_script)
            
        except Exception as e:
            print(f"Error updating environment variables in {container}: {str(e)}")
    
    return updated

# Function to create environment file
def create_env_file(contract_addresses):
    """Create environment file for Docker containers"""
    env_file = os.path.join(BASE_DIR, "deploy/contract.env")
    
    try:
        if DRY_RUN:
            print(f"[DRY RUN] Would create environment file at {env_file}")
            for key, value in contract_addresses.items():
                if is_valid_contract_address(value):
                    print(f"  {key}={value}")
            return True
        
        with open(env_file, 'w') as f:
            for key, value in contract_addresses.items():
                if is_valid_contract_address(value):
                    f.write(f"{key}={value}\n")
        
        print(f"Created environment file at {env_file}")
        return True
    except Exception as e:
        print(f"Error creating environment file: {str(e)}")
        return False

# Function to update docker-compose.yml
def update_docker_compose():
    """Update docker-compose.yml to include environment variables"""
    docker_compose_file = os.path.join(BASE_DIR, "deploy/docker-compose.yml")
    
    if not os.path.exists(docker_compose_file):
        print(f"Error: docker-compose.yml not found at {docker_compose_file}")
        return False
    
    try:
        if DRY_RUN:
            print(f"[DRY RUN] Would update docker-compose.yml at {docker_compose_file}")
            return True
        
        # Create a backup of the original file
        backup_file = docker_compose_file + '.bak'
        subprocess.run(f'copy "{docker_compose_file}" "{backup_file}"', shell=True)
        
        with open(docker_compose_file, 'r') as f:
            docker_compose_content = f.read()
        
        # Check if env_file is already in the API service
        if 'env_file:' not in docker_compose_content:
            # Add env_file to all API services
            modified_content = docker_compose_content
            
            # Add to api service
            modified_content = modified_content.replace(
                'api:',
                'api:\n    env_file:\n      - ./contract.env'
            )
            
            # Add to api1 service if it exists
            if 'api1:' in modified_content:
                modified_content = modified_content.replace(
                    'api1:',
                    'api1:\n    env_file:\n      - ./contract.env'
                )
            
            # Add to api2 service if it exists
            if 'api2:' in modified_content:
                modified_content = modified_content.replace(
                    'api2:',
                    'api2:\n    env_file:\n      - ./contract.env'
                )
            
            with open(docker_compose_file, 'w') as f:
                f.write(modified_content)
            
            print(f"Updated {docker_compose_file} with env_file configuration")
            return True
        else:
            print("env_file configuration already exists in docker-compose.yml")
            return True
    except Exception as e:
        print(f"Error updating docker-compose.yml: {str(e)}")
        return False

# Function to restart Docker containers
def restart_containers():
    """Restart Docker containers to apply changes"""
    try:
        if DRY_RUN:
            print("[DRY RUN] Would restart containers:")
            print("  - deploy-api-1")
            print("  - deploy-api1-1")
            print("  - deploy-api2-1")
            return True
        
        print("Restarting containers...")
        subprocess.run('docker restart deploy-api-1', shell=True)
        subprocess.run('docker restart deploy-api1-1 2>/dev/null', shell=True)
        subprocess.run('docker restart deploy-api2-1 2>/dev/null', shell=True)
        
        print("Waiting for containers to restart...")
        time.sleep(10)
        
        # Check if containers are running
        result = subprocess.run(
            'docker ps -f name=deploy-api-1 --format "{{.Status}}"', 
            shell=True,
            capture_output=True,
            text=True
        )
        
        if "Up" in result.stdout:
            print("✅ Containers restarted successfully")
            return True
        else:
            print("❌ Failed to restart containers")
            return False
    except Exception as e:
        print(f"Error restarting containers: {str(e)}")
        return False

# Function to test API endpoints
def test_api_endpoints():
    """Test API endpoints to verify they're working"""
    endpoints = [
        "/eduadmission/list_seats",
        "/eduadmission/list_scores",
        "/eduadmission/list_results"
    ]
    
    results = {}
    all_success = True
    
    for endpoint in endpoints:
        url = f"{API_BASE_URL}{endpoint}"
        try:
            if DRY_RUN:
                print(f"[DRY RUN] Would test endpoint: {url}")
                results[endpoint] = {"status": 200, "success": True, "response": "[DRY RUN]"}
                continue
            
            print(f"Testing endpoint: {url}")
            response = requests.get(url)
            status = response.status_code
            success = status < 400
            response_text = response.text
            
            if not success and "Contract address not set or not deployed" in response_text:
                print(f"❌ {endpoint} failed: Contract address not set or not deployed")
            elif not success:
                print(f"❌ {endpoint} failed with status {status}: {response_text[:100]}")
            else:
                print(f"✅ {endpoint} succeeded with status {status}")
            
            results[endpoint] = {
                "status": status,
                "success": success,
                "response": response_text[:100] + "..." if len(response_text) > 100 else response_text
            }
            
            all_success = all_success and success
        except Exception as e:
            print(f"Error testing endpoint {endpoint}: {str(e)}")
            results[endpoint] = {
                "status": 0,
                "success": False,
                "error": str(e)
            }
            all_success = False
    
    return all_success, results

# Function to copy contract address to all node files
def sync_contract_addresses(contract_addresses):
    """Sync contract addresses to all node files"""
    try:
        if DRY_RUN:
            print("[DRY RUN] Would sync contract addresses to all node files")
            return True
        
        # Ensure all node directories exist
        for node_num in ['1', '2', '3']:
            node_dir = os.path.join(BASE_DIR, f"deploy/contract_addresses_node{node_num}")
            os.makedirs(node_dir, exist_ok=True)
            
            node_file = os.path.join(node_dir, "contract_addresses.json")
            
            # If the file exists, update it; otherwise, create it
            if os.path.exists(node_file):
                with open(node_file, 'r') as f:
                    existing_addresses = json.load(f)
                
                # Update only the EduAdmission address
                if "EDUADMISSION_CONTRACT_ADDR" in contract_addresses:
                    existing_addresses["EDUADMISSION_CONTRACT_ADDR"] = contract_addresses["EDUADMISSION_CONTRACT_ADDR"]
                
                with open(node_file, 'w') as f:
                    json.dump(existing_addresses, f, indent=2)
            else:
                with open(node_file, 'w') as f:
                    json.dump(contract_addresses, f, indent=2)
            
            print(f"Updated contract addresses in {node_file}")
        
        return True
    except Exception as e:
        print(f"Error syncing contract addresses: {str(e)}")
        return False

# Function to inject contract addresses directly into API code
def inject_contract_addresses(contract_addresses):
    """Inject contract addresses directly into API code"""
    api_routers_dir = os.path.join(BASE_DIR, "api/routers")
    
    if not os.path.exists(api_routers_dir):
        print(f"Error: API routers directory not found at {api_routers_dir}")
        return False
    
    eduadmission_router = os.path.join(api_routers_dir, "eduadmission.py")
    
    if not os.path.exists(eduadmission_router):
        print(f"Error: EduAdmission router not found at {eduadmission_router}")
        return False
    
    try:
        if DRY_RUN:
            print(f"[DRY RUN] Would update EduAdmission router at {eduadmission_router}")
            return True
        
        # Create a backup of the original file
        backup_file = eduadmission_router + '.bak'
        subprocess.run(f'copy "{eduadmission_router}" "{backup_file}"', shell=True)
        
        with open(eduadmission_router, 'r') as f:
            router_content = f.read()
        
        # Replace the contract address line
        if "EDUADMISSION_CONTRACT_ADDR =" in router_content:
            contract_addr = contract_addresses.get("EDUADMISSION_CONTRACT_ADDR", "")
            
            if not is_valid_contract_address(contract_addr):
                print("Error: Invalid EduAdmission contract address")
                return False
            
            # Replace the line with a hardcoded address
            original_line = 'EDUADMISSION_CONTRACT_ADDR = os.getenv("EDUADMISSION_CONTRACT_ADDR", "eduadmission_contract_address")'
            new_line = f'EDUADMISSION_CONTRACT_ADDR = os.getenv("EDUADMISSION_CONTRACT_ADDR", "{contract_addr}")'
            
            if original_line in router_content:
                modified_content = router_content.replace(original_line, new_line)
                
                with open(eduadmission_router, 'w') as f:
                    f.write(modified_content)
                
                print(f"Updated EduAdmission router with contract address {contract_addr}")
                return True
            else:
                print("Warning: Could not find EDUADMISSION_CONTRACT_ADDR line in router file")
                return False
        else:
            print("Warning: Could not find EDUADMISSION_CONTRACT_ADDR line in router file")
            return False
    except Exception as e:
        print(f"Error updating EduAdmission router: {str(e)}")
        return False

# Function to deploy contract if it doesn't exist
def deploy_contract_if_needed(contract_addresses):
    """Deploy the EduAdmission contract if it doesn't exist"""
    if "EDUADMISSION_CONTRACT_ADDR" in contract_addresses and is_valid_contract_address(contract_addresses["EDUADMISSION_CONTRACT_ADDR"]):
        print(f"EduAdmission contract already deployed: {contract_addresses['EDUADMISSION_CONTRACT_ADDR']}")
        return True, contract_addresses
    
    try:
        if DRY_RUN:
            print("[DRY RUN] Would deploy EduAdmission contract")
            # For dry run, provide a fake address
            contract_addresses["EDUADMISSION_CONTRACT_ADDR"] = "cosmos1dry_run_fake_address"
            return True, contract_addresses
        
        print("Deploying EduAdmission contract...")
        deploy_script = os.path.join(BASE_DIR, "deploy_contracts.py")
        
        if not os.path.exists(deploy_script):
            print(f"Error: Deploy script not found at {deploy_script}")
            return False, contract_addresses
        
        # Run the deployment script
        result = subprocess.run(
            f'python {deploy_script} --module eduadmission',
            shell=True,
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            print(f"Error deploying contract: {result.stderr}")
            return False, contract_addresses
        
        print("Contract deployed successfully. Reloading contract addresses...")
        
        # Reload contract addresses
        new_addresses = load_contract_addresses()
        if not new_addresses:
            print("Error reloading contract addresses")
            return False, contract_addresses
        
        # Check if the EduAdmission contract address is now valid
        if "EDUADMISSION_CONTRACT_ADDR" in new_addresses and is_valid_contract_address(new_addresses["EDUADMISSION_CONTRACT_ADDR"]):
            print(f"EduAdmission contract deployed: {new_addresses['EDUADMISSION_CONTRACT_ADDR']}")
            return True, new_addresses
        else:
            print("Error: EduAdmission contract address still invalid after deployment")
            return False, contract_addresses
    except Exception as e:
        print(f"Error deploying contract: {str(e)}")
        return False, contract_addresses

# Main function
def main():
    print("=== EduAdmission Contract Address Fixer ===")
    print(f"Using contract addresses from node {NODE_NUM}")
    
    if DRY_RUN:
        print("Running in DRY RUN mode - no changes will be made")
    
    # Step 1: Load contract addresses
    print("\nStep 1: Loading contract addresses...")
    contract_addresses = load_contract_addresses()
    
    if not contract_addresses:
        print("Failed to load contract addresses. Exiting.")
        return
    
    print("Loaded contract addresses:")
    for key, value in contract_addresses.items():
        valid = "✅ Valid" if is_valid_contract_address(value) else "❌ Invalid"
        print(f"  {key}: {value} ({valid})")
    
    # Check if EDUADMISSION_CONTRACT_ADDR is valid
    if not is_valid_contract_address(contract_addresses.get("EDUADMISSION_CONTRACT_ADDR", "")):
        print("\nEduAdmission contract address is invalid.")
        print("Attempting to deploy the contract...")
        
        # Deploy the contract if needed
        success, contract_addresses = deploy_contract_if_needed(contract_addresses)
        if not success:
            print("Failed to deploy EduAdmission contract. Exiting.")
            return
    
    # Step 2: Sync contract addresses to all node files
    print("\nStep 2: Syncing contract addresses to all node files...")
    if not sync_contract_addresses(contract_addresses):
        print("Failed to sync contract addresses. Continuing anyway...")
    
    # Step 3: Create environment file
    print("\nStep 3: Creating environment file...")
    if not create_env_file(contract_addresses):
        print("Failed to create environment file. Continuing anyway...")
    
    # Step 4: Update docker-compose.yml
    print("\nStep 4: Updating docker-compose.yml...")
    if not update_docker_compose():
        print("Failed to update docker-compose.yml. Continuing anyway...")
    
    # Step 5: Update Docker environment variables
    print("\nStep 5: Updating Docker environment variables...")
    if not update_docker_env_vars(contract_addresses):
        print("Failed to update Docker environment variables. Continuing anyway...")
    
    # Step 6: Inject contract addresses into API code
    print("\nStep 6: Injecting contract addresses into API code...")
    if not inject_contract_addresses(contract_addresses):
        print("Failed to inject contract addresses into API code. Continuing anyway...")
    
    # Step 7: Restart containers
    print("\nStep 7: Restarting containers...")
    if not restart_containers():
        print("Failed to restart containers. Continuing anyway...")
    
    # Step 8: Test API endpoints
    print("\nStep 8: Testing API endpoints...")
    success, results = test_api_endpoints()
    
    # Print results
    print("\n=== Test Results ===")
    all_success = True
    for endpoint, result in results.items():
        status = "✅ Success" if result["success"] else "❌ Failed"
        all_success = all_success and result["success"]
        print(f"{endpoint}: {status} (Status code: {result['status']})")
        if "error" in result:
            print(f"  Error: {result['error']}")
        elif not result["success"]:
            print(f"  Response: {result['response']}")
    
    if all_success:
        print("\n✅ All API endpoints are working correctly!")
    else:
        print("\n⚠️ Some API endpoints failed. Please check the logs for details.")
    
    print("\n=== Completed ===")

if __name__ == "__main__":
    main()
