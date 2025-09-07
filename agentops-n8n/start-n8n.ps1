# AgentOps Studio - n8n Startup Script
# This script starts n8n with Docker Compose

Write-Host "🚀 Starting AgentOps Studio n8n..." -ForegroundColor Green

# Check if Docker is running
try {
    docker --version | Out-Null
    Write-Host "✅ Docker is available" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not installed or not running" -ForegroundColor Red
    Write-Host "Please install Docker Desktop from: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    exit 1
}

# Check if docker-compose.yml exists
if (-not (Test-Path "docker-compose.yml")) {
    Write-Host "❌ docker-compose.yml not found" -ForegroundColor Red
    Write-Host "Please run this script from the agentops-n8n directory" -ForegroundColor Yellow
    exit 1
}

# Start n8n with Docker Compose
Write-Host "🐳 Starting n8n with Docker Compose..." -ForegroundColor Blue
docker compose up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ n8n started successfully!" -ForegroundColor Green
    Write-Host "🌐 Open http://localhost:5678 to access n8n" -ForegroundColor Cyan
    Write-Host "📋 Import the workflows from:" -ForegroundColor Yellow
    Write-Host "   - web-research-workflow.json" -ForegroundColor White
    Write-Host "   - software-planning-workflow.json" -ForegroundColor White
    Write-Host "" -ForegroundColor White
    Write-Host "🔧 Next steps:" -ForegroundColor Magenta
    Write-Host "1. Complete n8n setup (create admin user)" -ForegroundColor White
    Write-Host "2. Import the workflow JSON files" -ForegroundColor White
    Write-Host "3. Copy Production Webhook URLs to AgentOps Studio" -ForegroundColor White
    Write-Host "4. Test the integration" -ForegroundColor White
} else {
    Write-Host "❌ Failed to start n8n" -ForegroundColor Red
    Write-Host "Check Docker logs: docker compose logs" -ForegroundColor Yellow
}
