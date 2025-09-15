FROM python:3.11-slim

WORKDIR /app

COPY ./ ./backend

RUN apt-get update
RUN apt-get install -y git

WORKDIR /app/backend

RUN pip install --no-cache-dir -r requirements.txt

WORKDIR /app

EXPOSE 8000

CMD ["uvicorn", "backend.app:app", "--host", "0.0.0.0", "--port", "8000"]