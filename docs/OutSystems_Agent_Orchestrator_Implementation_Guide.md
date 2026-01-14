# 🚀 OutSystems Agent Orchestrator Implementation Guide

> **Complete step-by-step guide to implement Agent Orchestrator in OutSystems ODC for the OutSystems Low-Code Agent Builder Hackathon**

## 📋 Overview

This guide will help you implement a complete **Agent Orchestrator** in OutSystems ODC that can:
- ✅ Receive payloads from our AI Compliance Agent and AI Productivity Agent
- ✅ Process actions (Jira, Slack, Google Sheets) via OutSystems
- ✅ Send callbacks to our backend
- ✅ Maintain full compatibility with our current n8n implementation

## 🎯 What We're Building

### **Architecture Flow:**
```
AI Compliance Agent / AI Productivity Agent
    ↓
Send to OutSystems Agent (Button)
    ↓
Action Bundle (HMAC-signed)
    ↓
OutSystems Agent Orchestrator (ODC)
    ↓
External Service Integration (Jira/Slack/Sheets)
    ↓
Callback → Our Backend (Audit Trail)
```

### **Key Components:**
1. **Agentic App**: "Agent Orchestrator" in ODC
2. **REST API**: `/agents/{module}/execute`
3. **HMAC Security**: Signature verification
4. **External Integrations**: Jira, Slack, Google Sheets
5. **Callback System**: Status updates to our backend

---

## 🎯 STEP 1: Initial Setup in ODC Portal

### **1.1 Create AI Model Connection (Using Trial Models)**

1. **Access ODC Portal** → **AI Models**
2. **Add AI Model** → **Azure OpenAI Trial** (or Amazon Bedrock Trial)
3. **Configuration:**
   - **Name**: `AgentOrchestrator-LLM`
   - **Model**: `gpt-4` (or `gpt-3.5-turbo`)
   - **Daily Limit**: `100` (trial limit)
   - **No API key required** for trial models

**📸 Screenshot tip**: AI Models page showing trial model selection

### **1.2 Create Agentic App**

1. **ODC Portal** → **Create** → **Agentic app**
2. **App Name**: `Agent Orchestrator`
3. **Module Name**: `AgentOrchestrator`
4. **Click Create**

**📸 Screenshot tip**: App creation dialog with Agent Orchestrator name

---

## 🎯 STEP 2: Configure Site Properties

### **2.1 Add Site Properties**

In **Data** → **Site Properties** (right-click → Add Site Property):

| Property Name | Type | Default Value | Description |
|---------------|------|---------------|-------------|
| `HMAC_SECRET` | Text | `hackathon-secret-key-2024` | Secret for HMAC verification |
| `JIRA_BASE_URL` | Text | `https://your-atlassian.atlassian.net` | Jira instance URL |
| `JIRA_EMAIL` | Text | `your-email@company.com` | Jira user email |
| `JIRA_API_TOKEN` | Text | `your-jira-api-token` | Jira API token (Is Password = True) |
| `SLACK_WEBHOOK_URL` | Text | `https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK` | Slack webhook URL |
| `GOOGLE_SA_JSON` | Text | `{"type":"service_account","project_id":"..."}` | Google Service Account JSON |
| `SHEETS_SPREADSHEET_ID` | Text | `your-spreadsheet-id` | Google Sheets ID |
| `CALLBACK_URL` | Text | `http://localhost:8000/api/agent-runs/callback` | Our backend callback URL |

**📸 Screenshot tip**: Site Properties list with all configured values

---

## 🎯 STEP 3: Create Data Structures

### **3.1 Required Structures**

In **Data** → **Structures** (right-click → Add Structure):

#### **NextAction Structure:**
```
Title (Text)
Detail (Text)
Assignee (Text)
```

#### **Action Structure:**
```
Type (Text) // "jira.createIssue" | "slack.postMessage" | "sheets.appendRow"
Payload (Text) // JSON string
```

#### **Artifacts Structure:**
```
Jira (List of Text)
Slack (Text)
Sheets (Text)
```

#### **AgentRequest Structure:**
```
RunId (Text)
Topic (Text)
SummaryMd (Text)
KeyRisks (List of Text) // compliance only
NextActions (List of NextAction) // productivity only
DocUrl (Text)
PrimaryUrl (Text)
Actions (List of Action)
CallbackUrl (Text)
```

#### **AgentCallback Structure:**
```
RunId (Text)
Status (Text) // "RUNNING" | "DONE" | "FAILED"
Artifacts (Artifacts)
Error (Text)
```

**📸 Screenshot tip**: Structures tree showing all created structures

---

## 🎯 STEP 4: Create REST API

### **4.1 Expose REST API**

1. **Logic** → **Integrations** (right-click) → **Expose REST API**
2. **REST API Name**: `Agents`
3. **Add Method**:
   - **Name**: `ExecuteAgent`
   - **URL**: `/agents/{Module}/execute`
   - **HTTP Method**: `POST`
   - **Input URL Param**: `Module (Text)`
   - **Input Body**: `Request (AgentRequest)`
   - **Input Header**: `XSignature (Text)` (map to HTTP header X-Signature)
   - **Output**: `Status 200`
   - **Response Structure**: `Ok (Boolean)` - set to True on success

**📸 Screenshot tip**: Method properties showing URL, Params, Body, Header configuration

---

## 🎯 STEP 5: Implement AgentFlow Logic

### **5.1 Server Action: ExecuteAgent**

Open the generated Server Action behind ExecuteAgent and implement the flow:

#### **5.1.1 Local Variables:**
```
ComputedSig (Text)
ArtifactsAcc (Artifacts)
JiraKeys (List of Text)
RawBody (Text)
```

#### **5.1.2 HMAC Verification:**
Add a Logic node to compute HMAC of the raw request body:

1. **Get Raw Body**: Use `GetRequestContent()` or `Request_GetRawBody()` from System/Request
2. **Compute HMAC**: Use Crypto action for HMAC-SHA256
   - **Input**: Raw body of the request
   - **Key**: `Site.HMAC_SECRET`
   - **Convert**: Binary to hex to match our backend format
3. **Compare**: `Lower(ComputedSig) = Lower(XSignature)`
4. **If false**: Set response status 401 and Abort Activity

**📸 Screenshot tip**: Flow chunk showing HMAC compute + If (sig ok?) logic

#### **5.1.3 Mark RUNNING (Optional):**
- If you created an AgentRunOS entity, insert or update with Status = "RUNNING"

#### **5.1.4 Process Actions Loop:**
```
For Each Action in Request.Actions:
    Switch Action.Type:
        Case "jira.createIssue":
            // Create Jira issue
            JiraKeys.Add(CreateJiraIssue(Action.Payload))
        Case "slack.postMessage":
            // Send Slack message
            SendSlackMessage(Action.Payload)
        Case "sheets.appendRow":
            // Append to Google Sheets
            AppendToSheets(Action.Payload)
End For
```

**📸 Screenshot tip**: For Each → Switch with three branches → HTTP nodes

#### **5.1.5 Send Callback:**
Create a Consume REST for the callback URL:

1. **Method**: POST
2. **URL**: `Request.CallbackUrl`
3. **Body**: `AgentCallback` with:
   - `RunId = Request.RunId`
   - `Status = "DONE"` (or "FAILED" in exception handler)
   - `Artifacts = ArtifactsAcc`

Wrap the action in a Try/Catch:
- **On Exception**: Call callback with Status="FAILED" and Error=Exception.Message

**📸 Screenshot tip**: End of flow with Callback → End

---

## 🎯 STEP 6: Implement External Integrations

### **6.1 Jira Integration**

#### **Server Action: CreateJiraIssue**
```
URL: Site.JIRA_BASE_URL + "/rest/api/3/issue"
Headers: 
  Authorization: "Basic " + Base64Encode(Site.JIRA_EMAIL + ":" + Site.JIRA_API_TOKEN)
  Content-Type: "application/json"
Body: Action.Payload (raw JSON)
On Success: Parse response JSON for "key" → append to JiraKeys
```

#### **Jira Payload Example:**
```json
{
  "fields": {
    "project": {"key": "LEARN"},
    "summary": "Complete GDPR refresh",
    "issuetype": {"name": "Task"},
    "description": "Summary here...\n\nSource: https://..."
  }
}
```

### **6.2 Slack Integration**

#### **Server Action: SendSlackMessage**
```
URL: Site.SLACK_WEBHOOK_URL
Body: Action.Payload (should be {"text":"..."} or rich block)
On Success: Store timestamp or "ok" in ArtifactsAcc.Slack
```

#### **Slack Payload Example:**
```json
{
  "text": "*Compliance update:* GDPR 2025\nKey risks: A, B, C"
}
```

### **6.3 Google Sheets Integration**

#### **Server Action: AppendToSheets**
Using Google Sheets Connector:
```
Action: AppendValues
Inputs: 
  SpreadsheetId = Site.SHEETS_SPREADSHEET_ID
  Values = ParseFromPayload(Action.Payload)
On Success: Store sheet URL in ArtifactsAcc.Sheets
```

---

## 🎯 STEP 7: Configure HMAC Verification

### **7.1 HMAC Server Action**

Create a reusable Server Action for HMAC verification:

#### **Input Parameters:**
- `Body (Text)`
- `Secret (Text)`

#### **Output Parameters:**
- `Signature (Text)`

#### **Logic:**
```
// Use Crypto component for HMAC-SHA256
Signature = HMAC_SHA256(Body, Secret)
```

**📸 Screenshot tip**: HMAC verification logic flow

---

## 🎯 STEP 8: Install Required Components

### **8.1 Forge Components**

**Forge** → **Install**:
- **Crypto** or **CryptoAPI** (for HMAC-SHA256)
- **Google Sheets Connector** (OutSystems official)
- **Jira REST Connector** (optional, or use HTTP)
- **Slack Webhook Connector** (optional, or use HTTP)

**📸 Screenshot tip**: Manage Dependencies dialog showing installed components

---

## 🎯 STEP 9: Testing and Deployment

### **9.1 Publish App**

1. **Click 1-Click Publish** in ODC Studio
2. **Copy base URL** from Module → Integrations → Expose REST → Agents
3. **Final endpoints:**
   - Compliance: `https://<env>/AgentOrchestrator/rest/Agents/agents/compliance/execute`
   - Productivity: `https://<env>/AgentOrchestrator/rest/Agents/agents/productivity/execute`

**📸 Screenshot tip**: Exposed REST screen with full URL

### **9.2 Update .env Configuration**

In your backend `.env` file:
```env
# OutSystems Integration (Production)
OUTSYSTEMS_COMPLIANCE_URL=https://<env>/AgentOrchestrator/rest/Agents/agents/compliance/execute
OUTSYSTEMS_PRODUCTIVITY_URL=https://<env>/AgentOrchestrator/rest/Agents/agents/productivity/execute
AGENTOPS_HMAC_SECRET=hackathon-secret-key-2024
OUTSYSTEMS_CALLBACK_URL=http://localhost:8000/api/agent-runs/callback

# Optional: Keep n8n as fallback
N8N_COMPLIANCE_WEBHOOK=http://localhost:5678/webhook/compliance-agent
N8N_PRODUCTIVITY_WEBHOOK=http://localhost:5678/webhook/productivity-agent
```

---

## 🎯 STEP 10: End-to-End Testing

### **10.1 Test Checklist**

1. **AI Compliance Agent**:
   - Select document → Analyze → Send to OutSystems Agent
   - Verify Jira issue created
   - Verify Slack message sent
   - Verify Google Sheets row added
   - Check Agent Runs Monitor shows DONE status

2. **AI Productivity Agent**:
   - Enter URL → Analyze → Send to OutSystems Agent
   - Verify multiple Jira issues created (one per action)
   - Verify Slack digest sent
   - Verify Google Sheets snapshot created
   - Check Agent Runs Monitor shows DONE status

3. **Error Handling**:
   - Test with invalid HMAC signature
   - Test with missing external service credentials
   - Verify FAILED status in Agent Runs Monitor

### **10.2 Expected Results**

- **Jira**: Issues created with proper titles and descriptions
- **Slack**: Messages posted to configured channel
- **Google Sheets**: Rows appended with analysis data
- **Agent Runs Monitor**: Status updates from RUNNING → DONE
- **Artifacts**: Links to created Jira issues, Slack timestamps, Sheet URLs

---

## 🚀 Benefits of This Implementation

### **✅ Enterprise-Grade Features:**
- **Governance**: OutSystems-first execution ensures compliance and security
- **Scalability**: Enterprise-grade infrastructure and connectors
- **Audit**: Complete trail of AI-generated actions and outcomes
- **Flexibility**: Support for both OutSystems and n8n execution engines
- **Separation of Concerns**: Dedicated endpoints for different agent functionalities
- **Maintainability**: Independent modules that can be updated without affecting others

### **✅ Hackathon Advantages:**
- **Professional Demo**: Enterprise-grade solution using OutSystems
- **Real Integration**: Actual Jira, Slack, and Google Sheets integration
- **Scalable Architecture**: Ready for production deployment
- **Complete Audit Trail**: Full visibility into AI agent executions

### **✅ Development Benefits:**
- **Trial Models**: No Azure configuration required
- **Rapid Development**: Low-code approach with visual development
- **Easy Testing**: Built-in testing capabilities
- **Quick Deployment**: 1-click publish to cloud

---

## 🔧 Troubleshooting

### **Common Issues:**

1. **HMAC Verification Failed**:
   - Check `HMAC_SECRET` matches between OutSystems and backend
   - Verify raw body is being passed correctly
   - Ensure signature comparison is case-insensitive

2. **External Service Errors**:
   - Verify API credentials in Site Properties
   - Check service URLs are accessible
   - Test individual integrations separately

3. **Callback Failures**:
   - Ensure `CALLBACK_URL` is accessible from OutSystems
   - Check network connectivity
   - Verify callback payload format

4. **Trial Model Limits**:
   - Monitor usage in ODC Portal
   - Switch to production model if needed
   - Consider implementing request batching

---

## 📚 Next Steps

### **Immediate Actions:**
1. **Follow Steps 1-10** to implement the complete solution
2. **Test thoroughly** with both Compliance and Productivity agents
3. **Document any customizations** for your specific environment

### **Future Enhancements:**
1. **Production AI Model**: Configure Azure OpenAI or Amazon Bedrock for production
2. **Advanced Error Handling**: Implement retry logic and detailed error reporting
3. **Performance Optimization**: Add caching and request batching
4. **Monitoring**: Implement comprehensive logging and monitoring
5. **Security**: Add additional security layers and audit logging

### **Migration Path:**
This implementation provides a **dual-path approach**:
- **Immediate**: Use OutSystems Agent Orchestrator for hackathon demo
- **Fallback**: Keep n8n configuration for development/testing
- **Future**: Migrate completely to OutSystems for production

---

## 🎉 Conclusion

This guide provides a complete implementation of an Agent Orchestrator in OutSystems ODC that seamlessly integrates with your existing AI Compliance Agent and AI Productivity Agent modules. The solution is enterprise-ready, hackathon-appropriate, and maintains full compatibility with your current architecture.

**Ready to build the future of AI-powered enterprise automation!** 🚀

---

*Created for the OutSystems Low-Code Agent Builder Hackathon - October 14th, 2025*
