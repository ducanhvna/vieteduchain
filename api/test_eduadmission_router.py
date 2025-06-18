import pytest
from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app)

# Test mint_seat

def test_eduadmission_mint_seat():
    payload = {"seat_id": "seat-test-001"}
    response = client.post("/api/eduadmission/mint_seat", json=payload)
    print("mint_seat:", response.status_code, response.json())
    assert response.status_code < 500, f"500 error: {response.json()}"

# Test burn_seat

def test_eduadmission_burn_seat():
    payload = {"seat_id": "seat-test-001"}
    response = client.post("/api/eduadmission/burn_seat", json=payload)
    print("burn_seat:", response.status_code, response.json())
    assert response.status_code < 500, f"500 error: {response.json()}"

# Test push_score

def test_eduadmission_push_score():
    payload = {"candidate_hash": "candidate-test-001", "score": 9}
    response = client.post("/api/eduadmission/push_score", json=payload)
    print("push_score:", response.status_code, response.json())
    assert response.status_code < 500, f"500 error: {response.json()}"

# Test run_matching

def test_eduadmission_run_matching():
    response = client.post("/api/eduadmission/run_matching")
    print("run_matching:", response.status_code, response.json())
    assert response.status_code < 500, f"500 error: {response.json()}"

# Test assign_seat

def test_eduadmission_assign_seat():
    payload = {"seat_id": "seat-test-001", "candidate_hash": "candidate-test-001"}
    response = client.post("/api/eduadmission/assign_seat", json=payload)
    print("assign_seat:", response.status_code, response.json())
    assert response.status_code < 500, f"500 error: {response.json()}"

# Test get_seat

def test_eduadmission_get_seat():
    params = {"seat_id": "seat-test-001"}
    response = client.get("/api/eduadmission/get_seat", params=params)
    print("get_seat:", response.status_code, response.json())
    assert response.status_code < 500, f"500 error: {response.json()}"

# Test get_score

def test_eduadmission_get_score():
    params = {"candidate_hash": "candidate-test-001"}
    response = client.get("/api/eduadmission/get_score", params=params)
    print("get_score:", response.status_code, response.json())
    assert response.status_code < 500, f"500 error: {response.json()}"

# Test get_result

def test_eduadmission_get_result():
    params = {"candidate_hash": "candidate-test-001"}
    response = client.get("/api/eduadmission/get_result", params=params)
    print("get_result:", response.status_code, response.json())
    assert response.status_code < 500, f"500 error: {response.json()}"

# Test list_scores

def test_eduadmission_list_scores():
    response = client.get("/api/eduadmission/list_scores")
    print("list_scores:", response.status_code, response.json())
    assert response.status_code < 500, f"500 error: {response.json()}"

# Test list_seats

def test_eduadmission_list_seats():
    response = client.get("/api/eduadmission/list_seats")
    print("list_seats:", response.status_code, response.json())
    assert response.status_code < 500, f"500 error: {response.json()}"

# Test list_results

def test_eduadmission_list_results():
    response = client.get("/api/eduadmission/list_results")
    print("list_results:", response.status_code, response.json())
    assert response.status_code < 500, f"500 error: {response.json()}"
