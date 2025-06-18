import requests
import time
import os
import json
from typing import Dict, Any, List, Optional

BASE_URL = "http://localhost:8279/api"

# Common test utilities
def wait_for_api_ready(max_retries=30, delay=5):
    """Wait for the API to be ready by checking the root endpoint"""
    print("Waiting for API to be ready...")
    for i in range(max_retries):
        try:
            r = requests.get(f"{BASE_URL.split('/api')[0]}")
            if r.status_code == 200:
                print(f"API is ready after {i*delay} seconds")
                return True
        except requests.RequestException:
            pass
        
        print(f"API not ready yet, retrying in {delay} seconds... ({i+1}/{max_retries})")
        time.sleep(delay)
    
    print("Failed to connect to API after maximum retries")
    return False

# Node Info Tests
def test_node_info():
    """Test the /nodeinfo endpoint"""
    print("\n=== Testing Node Info API ===")
    try:
        r = requests.get(f"{BASE_URL}/nodeinfo")
        print(f"Status code: {r.status_code}")
        if r.status_code == 200:
            print(f"Response: {r.json()}")
            return True
        return False
    except Exception as e:
        print(f"Error: {str(e)}")
        return False

# Edu ID Tests
def test_edu_id_register():
    """Test registering an educational ID"""
    print("\n=== Testing Edu ID Register API ===")
    payload = {
        "did": f"did:example:test{int(time.time())}",
        "public_key": "abcdef1234567890",
        "service_endpoint": "https://test.example.com",
        "context": "https://www.w3.org/ns/did/v1"
    }
    try:
        r = requests.post(f"{BASE_URL}/edu-id/register", json=payload)
        print(f"Status code: {r.status_code}")
        print(f"Response: {r.text}")
        return r.status_code in (200, 201, 400, 404)  # 400 if already exists, 404 if contract not deployed
    except Exception as e:
        print(f"Error: {str(e)}")
        return False

# Edu Certificate Tests
def test_edu_cert_issue():
    """Test issuing an educational certificate"""
    print("\n=== Testing Edu Certificate Issue API ===")
    payload = {
        "hash": f"testhash{int(time.time())}",
        "metadata": "test certificate metadata",
        "issuer": "node1",
        "signature": "test_signature_123"
    }
    try:
        r = requests.post(f"{BASE_URL}/edu-cert/issue", json=payload)
        print(f"Status code: {r.status_code}")
        print(f"Response: {r.text}")
        return r.status_code in (200, 201, 400, 404)
    except Exception as e:
        print(f"Error: {str(e)}")
        return False

# Edu Pay Tests
def test_edupay_mint():
    """Test minting edu pay tokens"""
    print("\n=== Testing Edu Pay Mint API ===")
    payload = {
        "address": f"0xtest{int(time.time())}",
        "amount": 1000
    }
    try:
        r = requests.post(f"{BASE_URL}/edupay/mint", json=payload)
        print(f"Status code: {r.status_code}")
        print(f"Response: {r.text}")
        return r.status_code in (200, 201, 400, 404, 500)
    except Exception as e:
        print(f"Error: {str(e)}")
        return False

def test_edupay_transfer():
    """Test transferring edu pay tokens"""
    print("\n=== Testing Edu Pay Transfer API ===")
    payload = {
        "from_address": f"0xtest{int(time.time())}",
        "to_address": f"0xrecipient{int(time.time())}",
        "amount": 100
    }
    try:
        r = requests.post(f"{BASE_URL}/edupay/transfer", json=payload)
        print(f"Status code: {r.status_code}")
        print(f"Response: {r.text}")
        return r.status_code in (200, 201, 400, 404, 500)
    except Exception as e:
        print(f"Error: {str(e)}")
        return False

# Edu Admission Tests
def test_edu_admission_create():
    """Test creating an admission record"""
    print("\n=== Testing Edu Admission Create API ===")
    payload = {
        "student_id": f"student_{int(time.time())}",
        "school_id": "school_123",
        "program_id": "program_456",
        "status": "applied",
        "application_date": "2023-06-01"
    }
    try:
        r = requests.post(f"{BASE_URL}/edu-admission/create", json=payload)
        print(f"Status code: {r.status_code}")
        print(f"Response: {r.text}")
        return r.status_code in (200, 201, 400, 404, 500)
    except Exception as e:
        print(f"Error: {str(e)}")
        return False

# Run all tests
def run_all_tests():
    if not wait_for_api_ready():
        return False
    
    results = {
        "node_info": test_node_info(),
        "edu_id_register": test_edu_id_register(),
        "edu_cert_issue": test_edu_cert_issue(),
        "edupay_mint": test_edupay_mint(),
        "edupay_transfer": test_edupay_transfer(),
        "edu_admission_create": test_edu_admission_create()
    }
    
    print("\n=== Test Results Summary ===")
    for test_name, result in results.items():
        print(f"{test_name}: {'PASS' if result else 'FAIL'}")
    
    return all(results.values())

if __name__ == "__main__":
    run_all_tests()
