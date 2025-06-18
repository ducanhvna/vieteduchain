import os
import pytest
from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app)

def test_nodeinfo_default():
    # Không set NODE_ID, chỉ kiểm tra granted_nodes trả về đúng initial_nodes
    response = client.get("/nodeinfo")
    assert response.status_code == 200
    data = response.json()
    assert "granted_nodes" in data
    assert isinstance(data["granted_nodes"], list)
    # Phải có ít nhất 1 node mặc định
    assert len(data["granted_nodes"]) > 0
    # current_node phải là None nếu NODE_ID không set
    assert data["current_node"] is None or data["current_node"] == {}
    assert data["current_permission"] is False

def test_nodeinfo_with_nodeid():
    # Set NODE_ID env và kiểm tra trả về đúng node profile
    os.environ["NODE_ID"] = "node1"
    response = client.get("/nodeinfo")
    assert response.status_code == 200
    data = response.json()
    assert data["current_node"] is not None
    assert data["current_node"]["id"] == "node1"
    assert data["current_permission"] is True
    # granted_nodes phải chứa node1
    ids = [n["id"] for n in data["granted_nodes"]]
    assert "node1" in ids
    # Xóa env để không ảnh hưởng test khác
    del os.environ["NODE_ID"]
