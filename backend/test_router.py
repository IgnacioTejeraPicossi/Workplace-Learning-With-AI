from fastapi import FastAPI
from fastapi.testclient import TestClient
from simple_web_search import router

# Create a test app
test_app = FastAPI()
test_app.include_router(router, prefix="/api")

# Create test client
client = TestClient(test_app)

# Test the endpoint
def test_simple_search():
    response = client.post("/api/simple-search", json={"topic": "AI Ethics", "limit": 5})
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    return response.status_code

if __name__ == "__main__":
    test_simple_search()
