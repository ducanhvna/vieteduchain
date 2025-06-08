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
