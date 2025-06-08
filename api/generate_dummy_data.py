import requests
import random
import string
import hashlib
import os

API_BASE = 'http://localhost:8279/api'

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
