import pytest
from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app)

def test_eduid_register():
    payload = {
        "did": "did:viedu:testcase",
        "public_key": "a"*64,
        "service_endpoint": "http://localhost:8279"
    }
    response = client.post("/api/edu-id/register", json=payload)
    print("register response:", response.status_code, response.text)
    assert response.status_code < 500, f"500 error: {response.text}"

def test_eduid_update():
    payload = {
        "did": "did:viedu:testcase",
        "public_key": "b"*64,
        "service_endpoint": "http://localhost:8279"
    }
    response = client.post("/api/edu-id/update", json=payload)
    print("update response:", response.status_code, response.text)
    assert response.status_code < 500, f"500 error: {response.text}"

def test_eduid_get_did():
    params = {"did": "did:viedu:testcase"}
    response = client.get("/api/edu-id/get_did", params=params)
    print("get_did response:", response.status_code, response.text)
    assert response.status_code < 500, f"500 error: {response.text}"

def test_eduid_get_did_hash():
    params = {"did": "did:viedu:testcase"}
    response = client.get("/api/edu-id/get_did_hash", params=params)
    print("get_did_hash response:", response.status_code, response.text)
    assert response.status_code < 500, f"500 error: {response.text}"

def test_eduid_list():
    response = client.get("/api/edu-id/list")
    print("list response:", response.status_code, response.text)
    assert response.status_code < 500, f"500 error: {response.text}"
