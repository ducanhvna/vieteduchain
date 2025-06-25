import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_enroll_course_success(monkeypatch):
    # Mock link_dids_on_chain to avoid real blockchain call
    async def mock_link_dids_on_chain(request, sender):
        return {"txhash": "0x123", "status": "success"}
    
    # Patch the function in the app
    import main
    monkeypatch.setattr(main, "link_dids_on_chain", mock_link_dids_on_chain)
    monkeypatch.setattr(main, "query_did_on_chain", lambda did: {"controller": "wasm1testcontroller"})

    payload = {
        "student_did": "did:eduid:student-abc",
        "course_did": "did:eduid:course-xyz"
    }
    response = client.post("/edu-admission/enroll-course", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "tx" in data
    assert data["tx"]["status"] == "success"

def test_enroll_course_missing_controller(monkeypatch):
    # query_did_on_chain returns no controller
    import main
    monkeypatch.setattr(main, "query_did_on_chain", lambda did: {})
    payload = {
        "student_did": "did:eduid:student-abc",
        "course_did": "did:eduid:course-xyz"
    }
    response = client.post("/edu-admission/enroll-course", json=payload)
    assert response.status_code == 400
    assert "Không xác định được controller" in response.text

def test_enroll_course_blockchain_error(monkeypatch):
    async def mock_link_dids_on_chain(request, sender):
        raise Exception("Blockchain error")
    import main
    monkeypatch.setattr(main, "link_dids_on_chain", mock_link_dids_on_chain)
    monkeypatch.setattr(main, "query_did_on_chain", lambda did: {"controller": "wasm1testcontroller"})
    payload = {
        "student_did": "did:eduid:student-abc",
        "course_did": "did:eduid:course-xyz"
    }
    response = client.post("/edu-admission/enroll-course", json=payload)
    assert response.status_code == 500
    assert "Blockchain error" in response.text
