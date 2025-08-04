from fastapi.testclient import TestClient
from backend.app import app

client = TestClient(app)

def test_concepts():
    response = client.get("/concepts")
    assert response.status_code == 200
    assert "concepts" in response.json()


