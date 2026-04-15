# Dockerfile for WLWAI Backend — Google Cloud Run
# Build:   docker build -t wlwai-backend -f deployment/Dockerfile .
# Run:     docker run -p 8000:8000 --env-file .env wlwai-backend
# Deploy:  gcloud run deploy wlwai-backend --source .

FROM python:3.11-slim

# Prevent Python from writing bytecode and enable unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONIOENCODING=utf-8

# Set working directory to repo root (required for backend.app:app import path)
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for layer caching
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy the full repo (backend, configs, static assets)
COPY backend/ /app/backend/
COPY configs/ /app/configs/

# Create static directory if it doesn't exist
RUN mkdir -p /app/backend/static

# Cloud Run injects PORT env var (default 8000)
ENV PORT=8000

# Expose the port
EXPOSE ${PORT}

# Health check (optional, Cloud Run uses /health endpoint)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:${PORT}/health')" || exit 1

# Start command — must run from repo root for backend.app:app imports
# Cloud Run sets $PORT automatically; uvicorn binds to it
CMD ["sh", "-c", "python -m uvicorn backend.app:app --host 0.0.0.0 --port ${PORT}"]
