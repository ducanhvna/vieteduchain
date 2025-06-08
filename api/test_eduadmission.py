import pytest
from fastapi.testclient import TestClient
from main import app
from unittest.mock import patch

client = TestClient(app)

# Mock dữ liệu trả về cho các query blockchain
mock_seats = [{"seat_id": "seat1", "info": "test seat"}]
mock_scores = [{"score_id": "score1", "score": 10}]
mock_results = [{"result_id": "result1", "status": "pass"}]

def mock_wasm_query(contract_addr, query_msg):
    if "list_seats" in query_msg:
        return mock_seats
    if "list_scores" in query_msg:
        return mock_scores
    if "list_admission_results" in query_msg:
        return mock_results
    return {}

@patch("routers.eduadmission.wasm_query", side_effect=mock_wasm_query)
def test_list_seats(mock_query):
    resp = client.get("/api/eduadmission/list_seats")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
    assert resp.json() == mock_seats

@patch("routers.eduadmission.wasm_query", side_effect=mock_wasm_query)
def test_list_scores(mock_query):
    resp = client.get("/api/eduadmission/list_scores")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
    assert resp.json() == mock_scores

@patch("routers.eduadmission.wasm_query", side_effect=mock_wasm_query)
def test_list_results(mock_query):
    resp = client.get("/api/eduadmission/list_results")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
    assert resp.json() == mock_results
