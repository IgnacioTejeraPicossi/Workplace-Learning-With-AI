# Update Environment Variables for Hackathon Demo
# Run this script to add the necessary variables to your .env file

Write-Host "🔧 Adding Hackathon Configuration to .env file..." -ForegroundColor Green

# Variables to add
$envVars = @"
# OutSystems Integration (Hackathon) - Using n8n local
OUTSYSTEMS_COMPLIANCE_URL=http://localhost:5678/webhook/compliance-agent
OUTSYSTEMS_PRODUCTIVITY_URL=http://localhost:5678/webhook/productivity-agent
AGENTOPS_HMAC_SECRET=hackathon-secret-key-2024
OUTSYSTEMS_CALLBACK_URL=http://localhost:8000/api/agent-runs/callback

# n8n Webhook URLs (Using existing Docker setup)
N8N_COMPLIANCE_WEBHOOK=http://localhost:5678/webhook/compliance-agent
N8N_PRODUCTIVITY_WEBHOOK=http://localhost:5678/webhook/productivity-agent
"@

# Check if .env file exists
if (Test-Path ".env") {
    Write-Host "✅ .env file found" -ForegroundColor Green
    
    # Check if variables already exist
    $content = Get-Content ".env" -Raw
    if ($content -match "OUTSYSTEMS_COMPLIANCE_URL") {
        Write-Host "⚠️  Hackathon variables already exist in .env" -ForegroundColor Yellow
        Write-Host "Current values:" -ForegroundColor Cyan
        Get-Content ".env" | Where-Object { $_ -match "OUTSYSTEMS_|N8N_" }
    } else {
        Write-Host "➕ Adding hackathon variables to .env..." -ForegroundColor Green
        Add-Content ".env" $envVars
        Write-Host "✅ Variables added successfully!" -ForegroundColor Green
    }
} else {
    Write-Host "❌ .env file not found. Please create it first." -ForegroundColor Red
    Write-Host "You can copy from hackathon_config.env:" -ForegroundColor Yellow
    Write-Host "Copy-Item hackathon_config.env .env" -ForegroundColor Cyan
}

Write-Host "`n🚀 Next steps:" -ForegroundColor Blue
Write-Host "1. Configure webhooks in n8n interface (http://localhost:5678)" -ForegroundColor White
Write-Host "2. Test webhooks with the provided curl commands" -ForegroundColor White
Write-Host "3. Restart your backend server" -ForegroundColor White
Write-Host "4. Test the full integration in the application" -ForegroundColor White
