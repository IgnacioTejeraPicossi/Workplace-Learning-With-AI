# EA Second Brain Agent

## Overview

The **EA Second Brain Agent** is Ketil Stadskleiv's (Director Enterprise Architecture & CTO, Norwegian) 24/7 AI-powered watcher that monitors the technology landscape and provides continuous, portfolio-aware insights to the Enterprise Architecture team.

## Problem Statement

As stated by Ketil:

> "As an Enterprise Architecture we are covering all aspects of IT, and keeping up with changes, news from vendors, tech breakthroughs, deprecations, new projects etc. is impossible."

## Solution

The EA Second Brain Agent acts as an intelligent monitoring system that:

- **Monitors** technology landscape 24/7 (vendor updates, tech changes, deprecations, new projects)
- **Understands** Norwegian's context (strategy, architecture, application portfolio, business priorities)
- **Analyzes** impact of external signals on Norwegian's systems
- **Executes** actions automatically (Jira tickets, Slack notifications, Confluence updates, audit logs)
- **Provides** trust receipts (attestation hashes) for compliance and auditability

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Data Sources                          │
├──────────────────────┬──────────────────────────────────┤
│  Internal            │  External (Open Data)            │
│  • EA tools          │  • Vendor release notes          │
│  • Confluence        │  • Tech news (RSS/Atom)          │
│  • Jira              │  • CVE feeds                     │
│  • Arch Repository   │  • GitHub releases               │
│                      │  • EOL datasets                  │
└──────────────────────┴──────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│              Pulse Job (Scheduler)                       │
│  • Fetch sources                                         │
│  • Normalize & cluster                                   │
│  • Compute impact & urgency                              │
│  • Match to portfolio                                    │
│  • Generate InsightBundle                                │
└─────────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│         /agents/ea/execute (FastAPI)                     │
│  • Verify HMAC signature                                 │
│  • Execute actions (Jira, Slack, Confluence, Sheets)     │
│  • Compute attestation hash                              │
│  • Store in MongoDB                                      │
└─────────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│                  Integrations                            │
├──────────┬──────────┬──────────┬────────────────────────┤
│  Jira    │  Slack   │Confluence│  Google Sheets         │
│  Issues  │ Messages │  Pages   │  Audit Logs            │
└──────────┴──────────┴──────────┴────────────────────────┘
```

## Key Features

### 1. Continuous Monitoring
- 24/7 monitoring of internal and external data sources
- Real-time alerts on tech changes, deprecations, and new projects

### 2. Portfolio-Aware Analysis
- Matches external signals to Norwegian's application portfolio
- Computes impact scores based on relevance, criticality, and freshness
- Identifies affected systems and business processes

### 3. Automatic Action Dispatch
- Creates Jira tasks for follow-up actions
- Sends Slack notifications to relevant channels
- Updates Confluence pages with EA insights
- Logs to Google Sheets for audit trail

### 4. Trust & Auditability
- Every run includes a SHA-256 attestation hash
- Immutable audit trail for compliance
- Transparent evidence and reasoning for all actions

### 5. Norwegian Context-Aware
- Understands Norwegian's strategy and priorities
- Knows the application portfolio and technical stack
- Aligns insights with running projects and business goals

## API Endpoints

### Execute Insight Bundle
```
POST /agents/ea/execute
Headers:
  X-Signature: HMAC-SHA256 signature
Body: InsightBundle (JSON)
```

### Get Runs
```
GET /agents/ea/runs?limit=50
```

## Data Models

### InsightBundle
```json
{
  "run_id": "ea-1234567890",
  "topic": "Kubernetes 1.31 Deprecation Alert",
  "summary_md": "## Impact on Norwegian Portfolio...",
  "evidence": [
    {
      "url": "https://kubernetes.io/blog/...",
      "source": "Kubernetes Blog",
      "snippet": "Several APIs are being deprecated..."
    }
  ],
  "portfolio_matches": [
    {
      "id": "APP-123",
      "name": "Payments API",
      "score": 0.86,
      "reason": "Uses deprecated PodSecurityPolicy"
    }
  ],
  "recommended_actions": [
    {
      "title": "Plan upgrade window",
      "detail": "Schedule maintenance for Q1 2025",
      "assignee": "team-platform"
    }
  ],
  "actions": [
    {
      "type": "jira.createIssue",
      "payload": {
        "projectKey": "EA",
        "summary": "EA Update: Kubernetes 1.31",
        "description": "...",
        "issueType": "Task"
      }
    },
    {
      "type": "slack.postMessage",
      "payload": {
        "text": "🚨 EA Alert: Kubernetes 1.31 affects Payments API"
      }
    }
  ],
  "callback_url": "/api/agent-runs/callback"
}
```

## Frontend Components

### Overview Tab
- Agent description and key features
- Stats (total runs, success rate)
- Capabilities and data sources
- MCP information

### Insights Tab
- Sample insight demo
- Future: automated insights table
- Send to orchestrator button

### Runs Tab
- Execution history with status
- Attestation hashes (trust receipts)
- Run details (topic, artifacts, timestamps)

### Settings Tab
- Integration status (Jira, Slack, Confluence, Sheets)
- Environment variables documentation
- Execution policies
- Data sources configuration

## Environment Variables

```bash
# HMAC Security
HMAC_SECRET=hackathon-secret-key-2024

# Jira Integration
JIRA_BASE_URL=https://itemtest.atlassian.net
JIRA_EMAIL=ignacio.tejera@item.no
JIRA_API_TOKEN=***

# Slack Integration
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
# or
SLACK_BOT_TOKEN=xoxb-***

# Confluence Integration
CONFLUENCE_BASE=https://itemtest.atlassian.net/wiki
CONFLUENCE_AUTH=base64(user:apitoken)

# Google Sheets Integration
SHEETS_SPREADSHEET_ID=1e97xVkDTW8gUNSTKNclYSvaoJEoojCias3iAp1YLxF4
GOOGLE_SA_JSON={"type":"service_account",...}

# MongoDB
MONGO_URI=mongodb://localhost:27017/app
```

## Usage

### 1. Configure Environment
Set up the required environment variables in your `.env` file.

### 2. Start Backend
```bash
cd backend
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

### 3. Access Frontend
Navigate to the "Item Agents" section in the sidebar and select "EA Second Brain Agent".

### 4. Send Sample Insight
Use the "Insights" tab to send a sample Kubernetes deprecation alert and verify the integration with Jira and Slack.

### 5. Monitor Runs
Check the "Runs" tab to see execution history and attestation hashes.

## Testing

### Manual Test
1. Navigate to "Insights" tab
2. Click "Send Sample Insight"
3. Verify Jira issue created
4. Verify Slack message sent
5. Check "Runs" tab for attestation hash

### API Test
```bash
# Sign bundle
curl -X POST http://localhost:8000/api/dev/sign \
  -H "Content-Type: application/json" \
  -d @sample_bundle.json

# Execute bundle
curl -X POST http://localhost:8000/agents/ea/execute \
  -H "Content-Type: application/json" \
  -H "X-Signature: <signature>" \
  -d @sample_bundle.json
```

## Future Enhancements

### Pulse Job (Scheduler)
- Automated fetching from data sources
- Clustering and deduplication
- Impact scoring algorithm
- Portfolio matching logic

### Additional Data Sources
- LeanIX / HOPEX integration
- Azure DevOps / GitHub Actions
- Vendor-specific feeds (AWS, Azure, GCP)
- Security vulnerability databases (NVD, CERT)

### Advanced Features
- Machine learning for impact prediction
- Trend analysis and forecasting
- Automatic policy enforcement
- Integration with Norwegian's CMDB

## Agent Catalog Descriptor

The agent is registered in the Agent Catalog at `configs/agents/ea-second-brain.json` with:
- MCP endpoint: `mcp://localhost:5678`
- Capabilities: Jira, Slack, Confluence, Sheets
- Policy: Low-risk auto-execution mode
- Schemas: InsightBundle, GetRunStatus

## Support

For questions or issues, contact:
- **Ketil Stadskleiv** (Product Owner) - Director EA & CTO, Norwegian
- **Platform Team** (Technical Support)

## References

- Original requirement: Ketil's "2nd brain" vision
- OutSystems Hackathon: October 14th, 2024
- Agent Creator GPT: Plan documentation
- MCP Specification: Model Context Protocol standard

