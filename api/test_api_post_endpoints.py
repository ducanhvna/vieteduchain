import pytest
from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app)

def test_nodeinfo_register():
    payload = {"id": "node_test", "name": "Test Node", "address": "0x1234567890abcdef1234567890abcdef12345678"}
    response = client.post("/api/nodeinfo/register", json=payload)
    assert response.status_code < 500, f"500 error: {response.text}"

def test_eduid_register():
    payload = {"did": "did:viedu:test", "public_key": "a"*64, "service_endpoint": "http://localhost:8279"}
    response = client.post("/api/edu-id/register", json=payload)
    assert response.status_code < 500, f"500 error: {response.text}"

def test_educert_create_certificate():
    payload = {
        "student_did": "did:viedu:test",
        "certificate_type": "degree",
        "certificate_name": "Test Certificate",
        "issue_date": "2025-06-18",
        "issuer_did": "did:viedu:test",
        "metadata": "{}"
    }
    response = client.post("/api/educert/create_certificate", json=payload)
    assert response.status_code < 500, f"500 error: {response.text}"

def test_edupay_mint():
    payload = {"address": "0x1234567890abcdef1234567890abcdef12345678", "amount": 1000}
    response = client.post("/api/edupay/mint", json=payload)
    assert response.status_code < 500, f"500 error: {response.text}"

def test_edumarket_mint():
    payload = {"id": "nft-test", "creator": "0x1234567890abcdef1234567890abcdef12345678", "metadata": "Test NFT", "price": 100}
    response = client.post("/api/edumarket/mint", json=payload)
    assert response.status_code < 500, f"500 error: {response.text}"

def test_eduadmission_mint_seat():
    payload = {"seat_id": "seat-test"}
    response = client.post("/api/eduadmission/mint_seat", json=payload)
    assert response.status_code < 500, f"500 error: {response.text}"
