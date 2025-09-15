# Docker startup guide

## 🚀 Overview

This guide will help you set up Docker and run the application with Docker Compose.

### Prerequisites
* Docker Desktop, can be installed from https://www.docker.com
* Git, can be installed from https://git-scm.com/downloads
* Access to the Github repository at https://github.com/IgnacioTejeraPicossi/Workplace-Learning-With-AI
  - Ask Ignacio to give you give access if you need it

### Install
* Open a command line or shell, navigate to a suitable directory and run these commands:
  - `git clone https://github.com/IgnacioTejeraPicossi/Workplace-Learning-With-AI.git`
  - `cd Workplace-Learning-With-AI`
  - `git checkout docker`
  - `docker compose up --build -d`
* Wait for the docker images to build and start up
* Go to http://localhost:3000 in a browser
* To connect to a locally running LM Studio server, use `http://host.docker.internal:1234` as the ItemAI Local URL
  - on Linux you might have to use `http://172.17.0.1:1234` instead

To stop the application, enter the command `docker compose down`  
To upgrade the application, get the latest changes with `git pull`, then `docker compose up --build -d`