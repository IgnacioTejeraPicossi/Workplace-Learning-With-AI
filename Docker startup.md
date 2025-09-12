# Docker startup guide

## 🚀 Overview

This guide will help you set up Docker and run the application with Docker Compose.

* Go to the [Docker homepage](https://www.docker.com/)
* Download and install Docker Desktop
* From a command line or shell, go to the main application folder (should be same as this file)
* Enter the command `docker compose up --build -d`
* Wait for the docker images to build and start up
* Go to http://localhost:3000 in a browser
* To connect to a locally running LM Studio server, use `http://host.docker.internal:1234` as the ItemAI Local URL
  - on Linux you might have to use `http://172.17.0.1:1234` instead
