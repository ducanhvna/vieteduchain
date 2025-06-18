import pytest
from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app)

# Test for /api/edu-id/register

def test_eduid_register():
    payload = {
        "did": "did:viedu:testcase",
        "public_key": "a"*64,
        "service_endpoint": "http://localhost:8279"
    }
    response = client.post("/api/edu-id/register", json=payload)
    assert response.status_code < 500, f"500 error: {response.text}"
    # Accept 200 or 4xx (if already exists), but not 5xx

# Test for /api/edu-id/update

def test_eduid_update():
    payload = {
        "did": "did:viedu:testcase",
        "public_key": "b"*64,
        "service_endpoint": "http://localhost:8279"
    }
    response = client.post("/api/edu-id/update", json=payload)
    assert response.status_code < 500, f"500 error: {response.text}"

# Test for /api/edu-id/get_did

def test_eduid_get_did():
    params = {"did": "did:viedu:testcase"}
    response = client.get("/api/edu-id/get_did", params=params)
    assert response.status_code < 500, f"500 error: {response.text}"

# Test for /api/edu-id/get_did_hash

def test_eduid_get_did_hash():
    params = {"did": "did:viedu:testcase"}
    response = client.get("/api/edu-id/get_did_hash", params=params)
    assert response.status_code < 500, f"500 error: {response.text}"

# Test for /api/edu-id/list

def test_eduid_list():
    response = client.get("/api/edu-id/list")
    assert response.status_code < 500, f"500 error: {response.text}"
