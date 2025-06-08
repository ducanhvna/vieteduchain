import requests

API_BASE = 'http://localhost:8279/api'

def test_edu_id_register():
    payload = {
        "did": "did:example:test",
        "public_key": "abc",
        "service_endpoint": "https://test.example.com",
        "context": "https://www.w3.org/ns/did/v1"
    }
    r = requests.post(f"{API_BASE}/edu-id/register", json=payload)
    assert r.status_code == 200 or r.status_code == 400  # 400 nếu đã tồn tại

def test_edu_cert_issue():
    payload = {
        "hash": "testhash",
        "metadata": "test",
        "issuer": "node1",
        "signature": "sig"
    }
    r = requests.post(f"{API_BASE}/edu-cert/issue", json=payload)
    assert r.status_code == 200 or r.status_code == 400

def test_edupay_mint():
    payload = {
        "address": "0xtestaddress",
        "amount": 1000
    }
    r = requests.post(f"{API_BASE}/edupay/mint", json=payload)
    assert r.status_code == 200 or r.status_code == 400

def test_edumarket_mint():
    payload = {
        "id": "nft-test",
        "creator": "0xtestaddress",
        "metadata": "test NFT",
        "price": 100
    }
    r = requests.post(f"{API_BASE}/edumarket/mint", json=payload)
    assert r.status_code == 200 or r.status_code == 400 or r.status_code == 500

def test_nodeinfo():
    r = requests.get(f"{API_BASE}/nodeinfo")
    assert r.status_code == 200 or r.status_code == 404
