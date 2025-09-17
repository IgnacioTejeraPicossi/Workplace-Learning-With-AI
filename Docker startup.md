# Docker startup guide

## 🚀 Overview

This guide will help you set up Docker and run the application with Docker Compose.

### Prerequisites
* Docker Desktop, can be installed from https://www.docker.com
* Git, can be installed from https://git-scm.com/downloads
* Access to the Github repository at https://github.com/IgnacioTejeraPicossi/Workplace-Learning-With-AI
  - Ask Ignacio to give you give access if you need it
* If you want to use offline AI, LM Studio should be installed and its server running on http://localhost:1234

### Install
* Open a command line or shell, navigate to a suitable directory and run these commands:
  - `git clone https://github.com/IgnacioTejeraPicossi/Workplace-Learning-With-AI.git`
  - `cd Workplace-Learning-With-AI`
  - `git checkout docker`
* Create a file `frontend/src/firebase.js` with this content:
```
  import { initializeApp } from 'firebase/app';
  import { getAuth, GoogleAuthProvider } from 'firebase/auth';

  const firebaseConfig = {
      apiKey: "YOUR_API_KEY",
      authDomain: "YOUR_AUTH_DOMAIN",
      projectId: "YOUR_PROJECT_ID",
      storageBucket: "YOUR_STORAGE_BUCKET",
      messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
      appId: "YOUR_APP_ID"
  };

  const app = initializeApp(firebaseConfig);
  export const auth = getAuth(app);
  export const googleProvider = new GoogleAuthProvider();
```
The placeholder values do not have to be replaced with actual values, but they must exist for the app to run
* Run this command:
  - `docker compose up --build -d`
* Wait for the docker images to build and start up
* Go to http://localhost:3000 in a browser
* To connect to a locally running LM Studio server, use `http://host.docker.internal:1234` as the ItemAI Local URL
  - on Linux you might have to use `http://172.17.0.1:1234` instead

To stop the application, enter the command `docker compose down`  
To upgrade the application, get the latest changes with `git pull`, then `docker compose up --build -d`