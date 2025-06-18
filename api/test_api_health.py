import pytest
from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app)

def test_docs():
    resp = client.get("/docs")
    assert resp.status_code == 200

def test_nodeinfo():
    resp = client.get("/api/nodeinfo")
    assert resp.status_code == 200
    assert "current_permission" in resp.json()
