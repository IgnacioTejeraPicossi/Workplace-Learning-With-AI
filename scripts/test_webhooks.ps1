# Test n8n Webhooks for Hackathon Demo
# This script tests the webhook endpoints to ensure they're working

Write-Host "🧪 Testing n8n Webhooks for Hackathon Demo..." -ForegroundColor Green

# Test data for compliance agent
$compliancePayload = @{
    run_id = "comp-test-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    topic = "[Compliance] GDPR 2025 Test"
    summary_md = "This is a test document for GDPR compliance requirements."
    key_risks = @("Data Privacy Compliance", "Security Requirements", "Access Control Policies")
    doc_url = "https://example.com/test-document.pdf"
    actions = @(
        @{
            type = "jira.createIssue"
            payload = @{
                fields = @{
                    project = @{ key = "TEST" }
                    summary = "Test GDPR Compliance Issue"
                    issuetype = @{ name = "Task" }
                    description = "Test issue created by AI Compliance Agent"
                }
            }
        }
    )
    callback_url = "http://localhost:8000/api/agent-runs/callback"
} | ConvertTo-Json -Depth 10

# Test data for productivity agent
$productivityPayload = @{
    run_id = "prod-test-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    topic = "[Productivity] Workflow Optimization Test"
    summary_md = "This is a test document for productivity optimization."
    next_actions = @(
        @{
            title = "Optimize Workflow"
            detail = "Review and optimize current workflow processes"
            assignee = "team-lead@company.com"
        }
    )
    primary_url = "https://example.com/productivity-doc.pdf"
    actions = @(
        @{
            type = "jira.createIssue"
            payload = @{
                fields = @{
                    project = @{ key = "PROD" }
                    summary = "Test Productivity Optimization Issue"
                    issuetype = @{ name = "Task" }
                    description = "Test issue created by AI Productivity Agent"
                }
            }
        }
    )
    callback_url = "http://localhost:8000/api/agent-runs/callback"
} | ConvertTo-Json -Depth 10

# Test Compliance Webhook
Write-Host "`n🔍 Testing Compliance Agent Webhook..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5678/webhook/compliance-agent" `
        -Method POST `
        -ContentType "application/json" `
        -Body $compliancePayload `
        -ErrorAction Stop
    
    Write-Host "✅ Compliance webhook response: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor White
} catch {
    Write-Host "❌ Compliance webhook failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
    }
}

# Test Productivity Webhook
Write-Host "`n🔍 Testing Productivity Agent Webhook..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5678/webhook/productivity-agent" `
        -Method POST `
        -ContentType "application/json" `
        -Body $productivityPayload `
        -ErrorAction Stop
    
    Write-Host "✅ Productivity webhook response: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor White
} catch {
    Write-Host "❌ Productivity webhook failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
    }
}

Write-Host "`n📋 Test Summary:" -ForegroundColor Blue
Write-Host "• If webhooks return 404, you need to configure them in n8n interface" -ForegroundColor White
Write-Host "• If webhooks return 200, they are working correctly" -ForegroundColor White
Write-Host "• Check n8n interface at http://localhost:5678" -ForegroundColor White
