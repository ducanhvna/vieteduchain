import requests

def test_list_seats_real():
    resp = requests.get("http://localhost:8279/api/eduadmission/list_seats")
    assert resp.status_code == 200, resp.text
    assert isinstance(resp.json(), (list, dict))

def test_list_scores_real():
    resp = requests.get("http://localhost:8279/api/eduadmission/list_scores")
    assert resp.status_code == 200, resp.text
    assert isinstance(resp.json(), (list, dict))

def test_list_results_real():
    resp = requests.get("http://localhost:8279/api/eduadmission/list_results")
    assert resp.status_code == 200, resp.text
    assert isinstance(resp.json(), (list, dict))

def test_add_seat():
    payload = {
        "seat_id": "seat-test-001",
        "student_id": "did:example:test001",
        "school": "node1",
        "major": "CNTT",
        "year": 2025
    }
    resp = requests.post("http://localhost:8279/api/eduadmission/add_seat", json=payload)
    if resp.status_code == 200:
        data = resp.json()
        assert "seat_id" in data or data.get("success", False)
    else:
        # Chấp nhận nếu đã tồn tại
        assert resp.status_code == 400 and "already exists" in resp.text

def test_add_score():
    payload = {
        "score_id": "score-test-001",
        "student_id": "did:example:test001",
        "subject": "Toán",
        "score": 9.5,
        "year": 2025
    }
    resp = requests.post("http://localhost:8279/api/eduadmission/add_score", json=payload)
    if resp.status_code == 200:
        data = resp.json()
        assert "score_id" in data or data.get("success", False)
    else:
        assert resp.status_code == 400 and "already exists" in resp.text

def test_add_result():
    payload = {
        "result_id": "result-test-001",
        "student_id": "did:example:test001",
        "school": "node1",
        "status": "Đỗ",
        "year": 2025
    }
    resp = requests.post("http://localhost:8279/api/eduadmission/add_result", json=payload)
    if resp.status_code == 200:
        data = resp.json()
        assert "result_id" in data or data.get("success", False)
    else:
        assert resp.status_code == 400 and "already exists" in resp.text

def test_add_seat_missing_field():
    # Thiếu trường major
    payload = {
        "seat_id": "seat-missing-major",
        "student_id": "did:example:test002",
        "school": "node1",
        # "major": "CNTT",  # intentionally missing
        "year": 2025
    }
    resp = requests.post("http://localhost:8279/api/eduadmission/add_seat", json=payload)
    assert resp.status_code == 422 or resp.status_code == 400, resp.text

def test_add_score_invalid_score():
    # Score ngoài khoảng hợp lệ
    payload = {
        "score_id": "score-invalid",
        "student_id": "did:example:test002",
        "subject": "Toán",
        "score": 15.0,  # invalid, should be <= 10
        "year": 2025
    }
    resp = requests.post("http://localhost:8279/api/eduadmission/add_score", json=payload)
    assert resp.status_code != 200, resp.text
    assert "error" in resp.text or resp.status_code in (400, 422, 500)

def test_add_result_invalid_status():
    # Status không hợp lệ
    payload = {
        "result_id": "result-invalid-status",
        "student_id": "did:example:test002",
        "school": "node1",
        "status": "INVALID_STATUS",
        "year": 2025
    }
    resp = requests.post("http://localhost:8279/api/eduadmission/add_result", json=payload)
    assert resp.status_code != 200, resp.text
    assert "error" in resp.text or resp.status_code in (400, 422, 500)

def test_add_seat_duplicate_id():
    # Gửi 2 lần cùng seat_id
    payload = {
        "seat_id": "seat-duplicate",
        "student_id": "did:example:test003",
        "school": "node1",
        "major": "CNTT",
        "year": 2025
    }
    resp1 = requests.post("http://localhost:8279/api/eduadmission/add_seat", json=payload)
    resp2 = requests.post("http://localhost:8279/api/eduadmission/add_seat", json=payload)
    # Chấp nhận nếu lần đầu đã tồn tại
    assert resp1.status_code == 200 or (resp1.status_code == 400 and "already exists" in resp1.text), resp1.text
    assert resp2.status_code != 200 or "error" in resp2.text or "already exists" in resp2.text
