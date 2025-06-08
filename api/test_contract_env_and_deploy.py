import os
import requests
import pytest
import re

# Test contract address env var and contract deployment for all modules
MODULES = [
    ("EDUADMISSION_CONTRACT_ADDR", "/eduadmission"),
    ("EDUID_CONTRACT_ADDR", "/edu-id"),
    ("EDUCERT_CONTRACT_ADDR", "/edu-cert"),
    ("EDUPAY_CONTRACT_ADDR", "/edupay"),
    ("EDUMARKET_CONTRACT_ADDR", "/edumarket"),
    ("RESEARCHLEDGER_CONTRACT_ADDR", "/researchledger"),
]

API_BASE = os.environ.get("API_BASE", "http://localhost:8279/api")

# Patch: fallback to docker-compose.yml for contract address if env not set
DOCKER_COMPOSE_PATH = os.path.join(os.path.dirname(__file__), '../deploy/docker-compose.yml')
# Patch: fallback to contract_addresses.json if not found in env or docker-compose.yml
CONTRACT_ADDR_JSON = os.path.join(os.path.dirname(__file__), '../deploy/contract_addresses/contract_addresses.json')
def get_contract_addr(env_var):
    addr = os.environ.get(env_var, "")
    if not addr or addr == env_var.lower() or addr == "" or addr.endswith("_address"):
        # Try to read from docker-compose.yml
        try:
            with open(DOCKER_COMPOSE_PATH) as f:
                for line in f:
                    m = re.match(rf"\s*- {env_var}=(.+)", line)
                    if m:
                        val = m.group(1).strip().split()[0]
                        if val and not val.endswith('_address') and not val.startswith('placeholder'):
                            return val
        except Exception:
            pass
        # Try to read from contract_addresses.json
        try:
            import json
            with open(CONTRACT_ADDR_JSON) as f:
                data = json.load(f)
                val = data.get(env_var, "")
                if val and not val.endswith('_address') and not val.startswith('placeholder'):
                    return val
        except Exception:
            pass
    return addr

def test_contract_addresses_set():
    for env_var, _ in MODULES:
        addr = get_contract_addr(env_var)
        assert addr and not addr.startswith("placeholder"), f"{env_var} is not set or is placeholder: {addr}"

def test_contract_deployed():
    for env_var, api_path in MODULES:
        addr = get_contract_addr(env_var)
        if not addr or addr.startswith("placeholder"):
            pytest.skip(f"{env_var} not set, skipping deploy check")
        # Try a query endpoint that requires contract
        url = f"{API_BASE}{api_path}/list"
        r = requests.get(url)
        assert r.status_code == 200, f"{api_path} contract not deployed or API error: {r.text}"

def test_api_blockchain_sync():
    # Check EduAdmission as example
    url = f"{API_BASE}/eduadmission/list_seats"
    r = requests.get(url)
    assert r.status_code == 200, f"EduAdmission API error: {r.text}"
    assert isinstance(r.json(), list), "API should return a list"
    # Optionally check other modules similarly
