import requests
import random
import string
import hashlib
import os

API_BASE = 'http://localhost:8279/api'

# Auto-deploy contract if address is missing (for local dev/demo)
def ensure_contract_address(contract_key, contract_name, wasm_path):
    import subprocess
    import json
    import os
    contract_json = os.path.join(os.path.dirname(__file__), '../deploy/contract_addresses/contract_addresses.json')
    with open(contract_json) as f:
        data = json.load(f)
    if not data.get(contract_key):
        print(f"[AutoDeploy] {contract_key} missing, attempting auto-deploy...")
        WALLET = os.environ.get("DEPLOY_WALLET", "<WALLET>")
        CHAIN_ID = os.environ.get("DEPLOY_CHAIN_ID", "<CHAIN_ID>")
        NODE = os.environ.get("DEPLOY_NODE", "http://localhost:26657")
        FEES = os.environ.get("DEPLOY_FEES", "5000stake")
        wasm_path = os.path.join(os.path.dirname(__file__), '../', wasm_path)
        if not os.path.exists(wasm_path):
            print(f"[AutoDeploy] WASM file not found: {wasm_path}. Please build contract first.")
            return None
        # Store contract
        store_cmd = f"wasmd tx wasm store {wasm_path} --from {WALLET} --chain-id {CHAIN_ID} --node {NODE} --gas auto --fees {FEES} --output json -y"
        store_result = subprocess.check_output(store_cmd, shell=True)
        store_json = json.loads(store_result)
        code_id = None
        for log in store_json.get("logs", []):
            for event in log.get("events", []):
                if event["type"] == "store_code":
                    for attr in event["attributes"]:
                        if attr["key"] == "code_id":
                            code_id = attr["value"]
        if not code_id:
            print("[AutoDeploy] Cannot find code_id in store result")
            return None
        # Instantiate contract
        inst_cmd = f"wasmd tx wasm instantiate {code_id} '{{}}' --from {WALLET} --label '{contract_name}' --admin {WALLET} --chain-id {CHAIN_ID} --node {NODE} --gas auto --fees {FEES} --output json -y"
        inst_result = subprocess.check_output(inst_cmd, shell=True)
        inst_json = json.loads(inst_result)
        contract_addr = None
        for log in inst_json.get("logs", []):
            for event in log.get("events", []):
                if event["type"] == "instantiate":
                    for attr in event["attributes"]:
                        if attr["key"] == "_contract_address":
                            contract_addr = attr["value"]
        if contract_addr:
            data[contract_key] = contract_addr
            with open(contract_json, "w") as f:
                json.dump(data, f, indent=2)
            print(f"[AutoDeploy] {contract_key} deployed: {contract_addr}")
            return contract_addr
        print("[AutoDeploy] Cannot find contract address in instantiate result")
        return None
    return data[contract_key]

# Tự động deploy contract nếu chưa có địa chỉ, cho tất cả các module
CONTRACTS = [
    ("EDUADMISSION_CONTRACT_ADDR", "eduadmission", "cosmwasm-contracts/cosmwasm-contracts/eduadmission/artifacts/eduadmission.wasm"),
    ("EDUID_CONTRACT_ADDR", "eduid", "cosmwasm-contracts/cosmwasm-contracts/eduid/artifacts/eduid.wasm"),
    ("EDUCERT_CONTRACT_ADDR", "educert", "cosmwasm-contracts/cosmwasm-contracts/educert/artifacts/educert.wasm"),
    ("EDUPAY_CONTRACT_ADDR", "edupay", "cosmwasm-contracts/cosmwasm-contracts/edupay/artifacts/edupay.wasm"),
    ("EDUMARKET_CONTRACT_ADDR", "edumarket", "cosmwasm-contracts/cosmwasm-contracts/edumarket/artifacts/edumarket.wasm"),
    ("RESEARCHLEDGER_CONTRACT_ADDR", "researchledger", "cosmwasm-contracts/cosmwasm-contracts/researchledger/artifacts/researchledger.wasm"),
]
for contract_key, contract_name, wasm_path in CONTRACTS:
    ensure_contract_address(contract_key, contract_name, wasm_path)

# 1. Dummy nodes (3 nodes only, not 100)
nodes = [
    {"id": "node1", "name": "Dai hoc A", "address": "0x1111"},
    {"id": "node2", "name": "Dai hoc B", "address": "0x2222"},
    {"id": "node3", "name": "Dai hoc C", "address": "0x3333"},
]

# 2. Dummy EduID (DID)
def create_did(idx):
    did = f"did:example:{idx:04d}"
    public_key = ''.join(random.choices(string.hexdigits, k=64)).lower()
    service_endpoint = f"https://service{idx}.example.com"
    context = "https://www.w3.org/ns/did/v1"
    payload = {
        "did": did,
        "public_key": public_key,
        "service_endpoint": service_endpoint,
        "context": context
    }
    r = requests.post(f"{API_BASE}/edu-id/register", json=payload)
    if r.status_code != 200:
        print(f"[DID] {did} error: {r.text}")
    return did

did_list = [create_did(i) for i in range(1, 101)]

# 3. Dummy EduCert (Credential)
def create_credential(idx):
    pdf_content = f"Certificate {idx} - Dummy content for testing.".encode()
    hash_val = hashlib.sha256(pdf_content).hexdigest()
    metadata = f"Bằng số {idx:03d} - CNTT, 2025"
    issuer = random.choice(nodes)["id"]
    signature = ''.join(random.choices(string.hexdigits, k=64)).lower()
    payload = {
        "hash": hash_val,
        "metadata": metadata,
        "issuer": issuer,
        "signature": signature
    }
    r = requests.post(f"{API_BASE}/edu-cert/issue", json=payload)
    if r.status_code != 200:
        print(f"[Credential] {hash_val} error: {r.text}")
    # Lưu file PDF vào thư mục dummy_data
    pdf_dir = os.path.join(os.path.dirname(__file__), '../deploy/dummy_data')
    os.makedirs(pdf_dir, exist_ok=True)
    with open(os.path.join(pdf_dir, f"dummy_cert_{hash_val[:8]}.pdf"), "wb") as f:
        f.write(pdf_content)
    return hash_val

cert_hashes = [create_credential(i) for i in range(1, 101)]

# 4. Dummy EduPay (ví, giao dịch, escrow)
def create_wallet(idx):
    address = "0x" + ''.join(random.choices(string.hexdigits, k=40)).lower()
    r = requests.post(f"{API_BASE}/edupay/mint", json={"address": address, "amount": 1000000})
    if r.status_code != 200:
        print(f"[Wallet] {address} error: {r.text}")
    return address

wallets = [create_wallet(i) for i in range(1, 101)]

def create_transfer():
    from_addr = random.choice(wallets)
    to_addr = random.choice(wallets)
    while from_addr == to_addr:
        to_addr = random.choice(wallets)
    amount = random.randint(1, 1000)
    r = requests.post(f"{API_BASE}/edupay/transfer", json={"from_address": from_addr, "to_address": to_addr, "amount": amount})
    if r.status_code != 200:
        print(f"[Transfer] {from_addr}->{to_addr} error: {r.text}")

for _ in range(100):
    create_transfer()

def create_escrow(idx):
    escrow_id = f"escrow-{idx:03d}"
    payer = random.choice(wallets)
    school = random.choice(nodes)["id"]
    amount = random.randint(1000, 10000)
    r = requests.post(f"{API_BASE}/edupay/escrow/create", json={"escrow_id": escrow_id, "payer": payer, "school": school, "amount": amount})
    if r.status_code != 200:
        print(f"[Escrow] {escrow_id} error: {r.text}")

for i in range(1, 101):
    create_escrow(i)

# 5. Dummy EduMarket (NFT)
def create_nft(idx):
    nft_id = f"nft-{idx:03d}"
    creator = random.choice(wallets)
    metadata = f"NFT khóa học số {idx:03d} - Blockchain"
    price = random.randint(100, 1000)  # Use int, not str
    payload = {
        "id": nft_id,
        "creator": creator,
        "metadata": metadata,
        "price": price
    }
    r = requests.post(f"{API_BASE}/edumarket/mint", json=payload)
    if r.status_code != 200:
        print(f"[NFT] {nft_id} error: {r.text}")
    return nft_id

nft_ids = [create_nft(i) for i in range(1, 101)]

def buy_nft():
    nft_id = random.choice(nft_ids)
    buyer = random.choice(wallets)
    amount = random.randint(100, 1000)  # Use int, not str
    r = requests.post(f"{API_BASE}/edumarket/buy", json={"id": nft_id, "buyer": buyer, "amount": amount})
    if r.status_code != 200:
        print(f"[BuyNFT] {nft_id} error: {r.text}")

for _ in range(100):
    buy_nft()

# 6. Dummy EduAdmission (seats, scores, results)
def create_seat(idx):
    seat_id = f"seat-{idx:03d}"
    student_id = random.choice(did_list)
    school = random.choice(nodes)["id"]
    major = random.choice(["CNTT", "Kinh tế", "Luật", "Y dược"])
    payload = {
        "seat_id": seat_id,
        "student_id": student_id,
        "school": school,
        "major": major,
        "year": 2025
    }
    r = requests.post(f"{API_BASE}/eduadmission/add_seat", json=payload)
    if r.status_code != 200:
        print(f"[Seat] {seat_id} error: {r.text}")
    return seat_id

def create_score(idx):
    score_id = f"score-{idx:03d}"
    student_id = random.choice(did_list)
    subject = random.choice(["Toán", "Văn", "Anh", "Lý", "Hóa", "Sinh"])
    score = round(random.uniform(5, 10), 2)
    payload = {
        "score_id": score_id,
        "student_id": student_id,
        "subject": subject,
        "score": score,
        "year": 2025
    }
    r = requests.post(f"{API_BASE}/eduadmission/add_score", json=payload)
    if r.status_code != 200:
        print(f"[Score] {score_id} error: {r.text}")
    return score_id

def create_result(idx):
    result_id = f"result-{idx:03d}"
    student_id = random.choice(did_list)
    school = random.choice(nodes)["id"]
    status = random.choice(["Đỗ", "Trượt"])
    payload = {
        "result_id": result_id,
        "student_id": student_id,
        "school": school,
        "status": status,
        "year": 2025
    }
    r = requests.post(f"{API_BASE}/eduadmission/add_result", json=payload)
    if r.status_code != 200:
        print(f"[Result] {result_id} error: {r.text}")
    return result_id

# Sinh dữ liệu dummy cho EduAdmission
seat_ids = [create_seat(i) for i in range(1, 101)]
score_ids = [create_score(i) for i in range(1, 101)]
result_ids = [create_result(i) for i in range(1, 101)]

print("Dummy data generation complete!")

# Tự động sinh dữ liệu dummy và deploy contract khi container khởi động lần đầu
def start_with_dummy():
    import subprocess
    try:
        print("[Auto] Generating dummy data and deploying contracts if needed...")
        subprocess.run(["python", "generate_dummy_data.py"], check=True)
    except Exception as e:
        print(f"[Auto] Dummy data generation failed: {e}")

if __name__ == "__main__":
    start_with_dummy()
