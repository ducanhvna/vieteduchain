import requests
import json
import os

DATA_FILE = "data.json"

# Node 1 contract addresses
CONTRACTS = {
    "EDUADMISSION_CONTRACT_ADDR": "cosmos11innvpn6qidskr00qi8inlrmo9ia9pep9wxjd3",
    "EDUID_CONTRACT_ADDR": "cosmos1e2349lwkx3duh4xslyxwjnfmrjzwtyeibu9tq0",
    "EDUCERT_CONTRACT_ADDR": "cosmos1o3fyi3uhpuyvtuubi7xdg2f5bxie8ovkyitsbo",
    "EDUPAY_CONTRACT_ADDR": "cosmos1fia520u7jvxll6jyr6gj62zm3zd0kr4fl459fz",
    "RESEARCHLEDGER_CONTRACT_ADDR": "cosmos1abtei3amhzhezu6q0eu535nxn2xr0lp824sok6",
    "EDUMARKET_CONTRACT_ADDR": "cosmos17oa565xvjx4ag6gpcazhhjkrbhjxnw6sy368c5",
    "GRANT_CONTRACT_ADDR": "cosmos1r4pzw8f9z0sypct5l9j906d47z998ulwvhvsqv",
    "UPLOAD_CONTRACT_ADDR": "cosmos1w4x4s6j560p7rjrsy4xl6nfks6vjq42naw5gkd",
    "NODEINFO_CONTRACT_ADDR": "cosmos1dmqyd7900vzcq5m7f8y9u7xk5yptsr0q8mhu8a"
}

BASE_URL = "http://localhost:26657"
HEADERS = {"Content-Type": "application/json"}

# Helper functions for direct core REST API

def wasm_execute(contract_addr, exec_msg, sender="node1"):
    url = f"{BASE_URL}/wasm/v1/contract/{contract_addr}/execute"
    payload = {
        "sender": sender,
        "msg": exec_msg
    }
    resp = requests.post(url, json=payload, headers=HEADERS)
    return resp

def wasm_query(contract_addr, query_msg):
    url = f"{BASE_URL}/wasm/v1/contract/{contract_addr}/smart/{json.dumps(query_msg)}"
    resp = requests.get(url, headers=HEADERS)
    return resp

def load_data():
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def save_data(data):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

data_store = load_data()

def print_result(title, resp):
    print(f"\n=== {title} ===")
    print(f"Status: {resp.status_code}")
    try:
        print(json.dumps(resp.json(), indent=2, ensure_ascii=False))
    except Exception:
        print(resp.text)

def test_eduid():
    # Register DID (execute)
    did = "did:viedu:0001"
    exec_msg = {"register_did": {"did_doc": {
        "did": did,
        "public_key": "pubkey-0001",
        "service_endpoint": "https://node1.edu.vn"
    }}}
    resp = wasm_execute(CONTRACTS["EDUID_CONTRACT_ADDR"], exec_msg)
    print_result("Register DID", resp)
    data_store.setdefault("dids", [])
    if did not in data_store["dids"]:
        data_store["dids"].append(did)
        save_data(data_store)

def test_eduadmission():
    # Mint seat (execute)
    seat_id = "seat-001"
    exec_msg = {"mint_seat_nft": {"seat_id": seat_id}}
    resp = wasm_execute(CONTRACTS["EDUADMISSION_CONTRACT_ADDR"], exec_msg)
    print_result("Mint Seat", resp)
    data_store.setdefault("seats", [])
    if seat_id not in data_store["seats"]:
        data_store["seats"].append(seat_id)
        save_data(data_store)
    # Push score (execute)
    exec_msg = {"push_score": {"candidate_hash": "did:viedu:0001", "score": 9}}
    resp = wasm_execute(CONTRACTS["EDUADMISSION_CONTRACT_ADDR"], exec_msg)
    print_result("Push Score", resp)
    # Run matching (execute)
    exec_msg = {"run_matching": {}}
    resp = wasm_execute(CONTRACTS["EDUADMISSION_CONTRACT_ADDR"], exec_msg)
    print_result("Run Matching", resp)

def test_edumarket():
    # Mint course NFT (execute)
    nft_id = "course-001"
    exec_msg = {"mint_course_nft": {
        "id": nft_id,
        "metadata": "Intro to Blockchain",
        "price": 100.0,
        "creator": "did:viedu:0001"
    }}
    resp = wasm_execute(CONTRACTS["EDUMARKET_CONTRACT_ADDR"], exec_msg)
    print_result("Mint Course NFT", resp)
    data_store.setdefault("nfts", [])
    if nft_id not in data_store["nfts"]:
        data_store["nfts"].append(nft_id)
        save_data(data_store)
    # Buy course NFT (execute)
    exec_msg = {"buy_course_nft": {
        "id": nft_id,
        "buyer": "did:viedu:0001",
        "amount": 100.0
    }}
    resp = wasm_execute(CONTRACTS["EDUMARKET_CONTRACT_ADDR"], exec_msg)
    print_result("Buy Course NFT", resp)

def test_edupay():
    # Mint eVND (execute)
    wallet = "did:viedu:0001"
    exec_msg = {"mint": {"address": wallet, "amount": 1000.0}}
    resp = wasm_execute(CONTRACTS["EDUPAY_CONTRACT_ADDR"], exec_msg)
    print_result("Mint eVND", resp)
    data_store.setdefault("wallets", [])
    if wallet not in data_store["wallets"]:
        data_store["wallets"].append(wallet)
        save_data(data_store)

def test_educert():
    # Issue VC (execute)
    cert_hash = "cert-001"
    exec_msg = {"issue_vc": {
        "hash": cert_hash,
        "metadata": "{\"student\":\"did:viedu:0001\"}",
        "issuer": "did:viedu:0001",
        "signature": "sig-001"
    }}
    resp = wasm_execute(CONTRACTS["EDUCERT_CONTRACT_ADDR"], exec_msg)
    print_result("Issue VC", resp)
    data_store.setdefault("certificates", [])
    if cert_hash not in [c.get("hash", c) for c in data_store["certificates"]]:
        data_store["certificates"].append({"hash": cert_hash, "student": "did:viedu:0001"})
        save_data(data_store)

def main():
    test_eduid()
    test_eduadmission()
    test_edumarket()
    test_edupay()
    test_educert()

if __name__ == "__main__":
    main()
