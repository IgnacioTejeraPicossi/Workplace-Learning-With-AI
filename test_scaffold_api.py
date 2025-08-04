import requests

url = "http://localhost:8000/generate-scaffold"
data = {
    "feature_name": "Daily Learning Tip",
    "feature_summary": "Send a daily AI-generated learning tip to users.",
    "scaffold_type": "API Route"  # Change to 'DB Model', 'Background Job', etc. to test other types
}

response = requests.post(url, json=data)
print("Status:", response.status_code)
print("Response:")
print(response.json())
print("Raw response text:")
print(response.text) 