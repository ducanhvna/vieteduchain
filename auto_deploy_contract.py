import os
import json
import subprocess

# Map contract key to contract name and wasm path
CONTRACTS = {
    "EDUADMISSION_CONTRACT_ADDR": {
        "name": "eduadmission",
        "wasm": "cosmwasm-contracts/cosmwasm-contracts/eduadmission/artifacts/eduadmission.wasm"
    },
    "EDUID_CONTRACT_ADDR": {
        "name": "eduid",
        "wasm": "cosmwasm-contracts/cosmwasm-contracts/eduid/artifacts/eduid.wasm"
    },
    "EDUCERT_CONTRACT_ADDR": {
        "name": "educert",
        "wasm": "cosmwasm-contracts/cosmwasm-contracts/educert/artifacts/educert.wasm"
    },
    "EDUPAY_CONTRACT_ADDR": {
        "name": "edupay",
        "wasm": "cosmwasm-contracts/cosmwasm-contracts/edupay/artifacts/edupay.wasm"
    },
    "EDUMARKET_CONTRACT_ADDR": {
        "name": "edumarket",
        "wasm": "cosmwasm-contracts/cosmwasm-contracts/edumarket/artifacts/edumarket.wasm"
    },
    "RESEARCHLEDGER_CONTRACT_ADDR": {
        "name": "researchledger",
        "wasm": "cosmwasm-contracts/cosmwasm-contracts/researchledger/artifacts/researchledger.wasm"
    }
}

# Always resolve contract_addresses.json relative to this script
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CONTRACT_JSON = os.path.join(SCRIPT_DIR, "deploy/contract_addresses/contract_addresses.json")

# You must set these for your environment
WALLET = os.environ.get("DEPLOY_WALLET", "<WALLET>")
CHAIN_ID = os.environ.get("DEPLOY_CHAIN_ID", "<CHAIN_ID>")
NODE = os.environ.get("DEPLOY_NODE", "http://localhost:26657")
FEES = os.environ.get("DEPLOY_FEES", "5000stake")


def deploy_contract(wasm_path, contract_label):
    # 1. Store contract
    store_cmd = f"wasmd tx wasm store {wasm_path} --from {WALLET} --chain-id {CHAIN_ID} --node {NODE} --gas auto --fees {FEES} --output json -y"
    print(f"Storing contract: {store_cmd}")
    store_result = subprocess.check_output(store_cmd, shell=True)
    store_json = json.loads(store_result)
    code_id = None
    # Parse code_id from logs
    for log in store_json.get("logs", []):
        for event in log.get("events", []):
            if event["type"] == "store_code":
                for attr in event["attributes"]:
                    if attr["key"] == "code_id":
                        code_id = attr["value"]
    if not code_id:
        raise Exception("Cannot find code_id in store result")
    # 2. Instantiate contract
    inst_cmd = f"wasmd tx wasm instantiate {code_id} '{{}}' --from {WALLET} --label '{contract_label}' --admin {WALLET} --chain-id {CHAIN_ID} --node {NODE} --gas auto --fees {FEES} --output json -y"
    print(f"Instantiating contract: {inst_cmd}")
    inst_result = subprocess.check_output(inst_cmd, shell=True)
    inst_json = json.loads(inst_result)
    contract_addr = None
    # Parse contract address from logs
    for log in inst_json.get("logs", []):
        for event in log.get("events", []):
            if event["type"] == "instantiate":
                for attr in event["attributes"]:
                    if attr["key"] == "_contract_address":
                        contract_addr = attr["value"]
    if not contract_addr:
        raise Exception("Cannot find contract address in instantiate result")
    return contract_addr

def auto_deploy_all():
    with open(CONTRACT_JSON) as f:
        data = json.load(f)
    changed = False
    for key, info in CONTRACTS.items():
        if not data.get(key):
            wasm_path = os.path.join(SCRIPT_DIR, info["wasm"])
            if not os.path.exists(wasm_path):
                print(f"WASM file not found: {wasm_path}. Please build contract first.")
                continue
            addr = deploy_contract(wasm_path, info["name"])
            data[key] = addr
            print(f"Deployed {info['name']} contract: {addr}")
            changed = True
    if changed:
        with open(CONTRACT_JSON, "w") as f:
            json.dump(data, f, indent=2)
        print("Updated contract_addresses.json with new contract addresses.")
    else:
        print("No contract deployed. All addresses already set or missing WASM.")

if __name__ == "__main__":
    auto_deploy_all()
