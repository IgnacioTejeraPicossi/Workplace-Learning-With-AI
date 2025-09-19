Setting up Kubernetes

Assume existing AKS cluster exists

Build images:
 * docker build ./backend -t crolaworkplacelearningwithai-argehzhfhjaeagbp.azurecr.io/learningwithai_backend:latest
 * cd frontend && docker build . -t crolaworkplacelearningwithai-argehzhfhjaeagbp.azurecr.io/learningwithai_frontend:latest
 * cd lmstudio && docker build . -t crolaworkplacelearningwithai-argehzhfhjaeagbp.azurecr.io/learningwithai_lmstudio:latest

Push images to Azure Container repository:
 * az acr login -n crolaworkplacelearningwithai
 * docker push crolaworkplacelearningwithai-argehzhfhjaeagbp.azurecr.io/learningwithai_backend:latest
 * docker push crolaworkplacelearningwithai-argehzhfhjaeagbp.azurecr.io/learningwithai_frontend:latest
 * docker push crolaworkplacelearningwithai-argehzhfhjaeagbp.azurecr.io/learningwithai_lmstudio:latest

Set up cluster:    

* Deploy Application Gateway for Containers ALB Controller  
    https://learn.microsoft.com/en-us/azure/application-gateway/for-containers/quickstart-deploy-application-gateway-for-containers-alb-controller?tabs=install-helm-windows

 * Create Application Gateway for Containers managed by ALB Controller  
    https://learn.microsoft.com/en-us/azure/application-gateway/for-containers/quickstart-create-application-gateway-for-containers-managed-by-alb-controller?tabs=new-subnet-aks-vnet

 * Expose an AKS service over HTTP or HTTPS by using Application Gateway (ingress)  
    https://learn.microsoft.com/en-us/azure/application-gateway/ingress-controller-expose-service-over-http-https

 * (alternative to ingress) Traffic splitting with Application Gateway for Containers - Gateway API  
    https://learn.microsoft.com/en-us/azure/application-gateway/for-containers/how-to-traffic-splitting-gateway-api?tabs=alb-managed

 * `kubectl apply -f '*.yaml'`

 * Check progress with `kubectl get pods -n learningwithai -w`

 * When pods report status running, the Workplace Learning With AI site should be available at http://bfhye4htbwejd4d9.fz12.alb.azure.com/


TODO:
 * SSL certificate for https endpoint
 * (DONE) Fix CORS issues with frontend/backend communication
 * (DONE) Containerize LM Studio 