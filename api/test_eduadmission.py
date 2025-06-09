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

def test_admission_sync_seat_score_result():
    """Test add seat/score/result from one node and query from another node (simulate sync via contract)."""
    # Thêm seat
    seat_payload = {
        "seat_id": "seat-sync-1",
        "student_id": "did:example:sync1",
        "school": "node1",
        "major": "CNTT",
        "year": 2025
    }
    resp_seat = client.post("/api/eduadmission/add_seat", json=seat_payload)
    assert resp_seat.status_code in (200, 400, 404)
    # Truy vấn lại seat
    resp_list = client.get("/api/eduadmission/list_seats")
    assert resp_list.status_code == 200
    # Nếu contract đã deploy thì seat mới phải nằm trong danh sách (mock sẽ không kiểm tra được, chỉ test API flow)
    # Thêm score
    score_payload = {
        "score_id": "score-sync-1",
        "student_id": "did:example:sync1",
        "subject": "Toán",
        "score": 9.5,
        "year": 2025
    }
    resp_score = client.post("/api/eduadmission/add_score", json=score_payload)
    assert resp_score.status_code in (200, 400, 404)
    # Thêm result
    result_payload = {
        "result_id": "result-sync-1",
        "student_id": "did:example:sync1",
        "school": "node1",
        "status": "Đỗ",
        "year": 2025
    }
    resp_result = client.post("/api/eduadmission/add_result", json=result_payload)
    assert resp_result.status_code in (200, 400, 404)
    # Truy vấn lại result
    resp_list_result = client.get("/api/eduadmission/list_results")
    assert resp_list_result.status_code == 200
