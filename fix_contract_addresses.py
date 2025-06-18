import os
import json
import subprocess
import requests
import time

# Paths to contract addresses files
CONTRACT_JSON_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "deploy/contract_addresses_node1")
CONTRACT_JSON = os.path.join(CONTRACT_JSON_DIR, "contract_addresses.json")

# API base URL
API_BASE_URL = "http://localhost:8279/api"

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

def update_api_env_vars(contract_addresses):
    """Update API container environment variables with contract addresses"""
    if not contract_addresses:
        print("No contract addresses to update")
        return False
    
    try:
        # For each contract address, update the Docker container environment
        for env_var, address in contract_addresses.items():
            if address and not address.endswith('_placeholder_address'):
                # Update the API container environment variable
                cmd = f'docker exec deploy-api-1 sh -c "export {env_var}={address}"'
                print(f"Running: {cmd}")
                subprocess.run(cmd, shell=True)
                
                # Also set for API1 and API2 if they exist
                subprocess.run(f'docker exec deploy-api1-1 sh -c "export {env_var}={address}" 2>/dev/null', shell=True)
                subprocess.run(f'docker exec deploy-api2-1 sh -c "export {env_var}={address}" 2>/dev/null', shell=True)
        
        return True
    except Exception as e:
        print(f"Error updating API environment variables: {str(e)}")
        return False

def create_env_file(contract_addresses):
    """Create an .env file with contract addresses that can be loaded into Docker"""
    env_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "deploy/contract.env")
    
    try:
        with open(env_file, 'w') as f:
            for env_var, address in contract_addresses.items():
                if address and not address.endswith('_placeholder_address'):
                    f.write(f"{env_var}={address}\n")
        
        print(f"Created environment file at {env_file}")
        return env_file
    except Exception as e:
        print(f"Error creating environment file: {str(e)}")
        return None

def restart_api_containers():
    """Restart API containers to apply environment changes"""
    try:
        print("Restarting API containers...")
        subprocess.run('docker restart deploy-api-1', shell=True)
        subprocess.run('docker restart deploy-api1-1 2>/dev/null', shell=True)
        subprocess.run('docker restart deploy-api2-1 2>/dev/null', shell=True)
        
        # Wait for containers to restart
        print("Waiting for API containers to restart...")
        time.sleep(10)
        return True
    except Exception as e:
        print(f"Error restarting API containers: {str(e)}")
        return False

def test_api_endpoints():
    """Test API endpoints to verify contract addresses are working"""
    endpoints = [
        "/nodeinfo",
        "/edu-id/all",
        "/edu-cert/all",
        "/edupay/balance",
        "/edu-admission/all",
        "/edu-market/all",
        "/research-ledger/all"
    ]
    
    results = {}
    
    for endpoint in endpoints:
        url = f"{API_BASE_URL}{endpoint}"
        try:
            print(f"Testing endpoint: {url}")
            response = requests.get(url)
            status = response.status_code
            results[endpoint] = {
                "status": status,
                "success": status < 400,
                "response": response.text[:100] + "..." if len(response.text) > 100 else response.text
            }
        except Exception as e:
            results[endpoint] = {
                "status": 0,
                "success": False,
                "error": str(e)
            }
    
    return results

def update_docker_compose():
    """Update docker-compose.yml to include environment variables"""
    docker_compose_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "deploy/docker-compose.yml")
    
    if not os.path.exists(docker_compose_file):
        print(f"Error: docker-compose.yml not found at {docker_compose_file}")
        return False
    
    try:
        # Create a backup of the original file
        backup_file = docker_compose_file + '.bak'
        subprocess.run(f'copy "{docker_compose_file}" "{backup_file}"', shell=True)
        
        with open(docker_compose_file, 'r') as f:
            docker_compose_content = f.read()
        
        # Check if env_file is already in the API service
        if 'env_file:' not in docker_compose_content:
            # Add env_file to the API service
            modified_content = docker_compose_content.replace(
                'api:',
                'api:\n    env_file:\n      - ./contract.env'
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

def main():
    print("=== Contract Address Fixer ===")
    
    # 1. Load contract addresses
    print("\nStep 1: Loading contract addresses...")
    contract_addresses = load_contract_addresses()
    
    if not contract_addresses:
        print("Failed to load contract addresses. Exiting.")
        return
    
    print(f"Loaded {len(contract_addresses)} contract addresses:")
    for env_var, address in contract_addresses.items():
        print(f"  {env_var}: {address}")
    
    # 2. Create environment file
    print("\nStep 2: Creating environment file...")
    env_file = create_env_file(contract_addresses)
    
    if not env_file:
        print("Failed to create environment file. Exiting.")
        return
    
    # 3. Update docker-compose.yml
    print("\nStep 3: Updating docker-compose.yml...")
    if not update_docker_compose():
        print("Failed to update docker-compose.yml. Continuing anyway...")
    
    # 4. Update API environment variables directly
    print("\nStep 4: Updating API environment variables...")
    if not update_api_env_vars(contract_addresses):
        print("Failed to update API environment variables. Continuing anyway...")
    
    # 5. Restart API containers
    print("\nStep 5: Restarting API containers...")
    if not restart_api_containers():
        print("Failed to restart API containers. Continuing anyway...")
    
    # 6. Test API endpoints
    print("\nStep 6: Testing API endpoints...")
    results = test_api_endpoints()
    
    # 7. Print results
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
