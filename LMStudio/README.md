Prepare LMStudio container

* Download LM Studio for linux from https://lmstudio.ai/download, copy the .AppImage file to this directory
* In LM Studio, download the LFM2-1.2B model
* Go to `C:\Users\<username>\.lmstudio\models` (should be `~\.lmstudio\models` on linux) and copy the LiquidAI folder to the models folder in this directory
* Run `docker build . -t crolaworkplacelearningwithai-argehzhfhjaeagbp.azurecr.io/learningwithai_lmstudio:latest` 
* Run `docker push crolaworkplacelearningwithai-argehzhfhjaeagbp.azurecr.io/learningwithai_lmstudio:latest`

The LM Studio docker image should now be ready to be deployed by the Kubernetes setup