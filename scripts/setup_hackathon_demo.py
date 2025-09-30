#!/usr/bin/env python3
"""
n8n Webhook Setup for Hackathon Demo
This script creates a simple n8n webhook that simulates OutSystems behavior
"""

import json
import requests
import hmac
import hashlib
from datetime import datetime

def create_n8n_webhook_config():
    """
    Create n8n webhook configuration for compliance and productivity agents
    """
    
    # n8n webhook configuration
    webhook_config = {
        "name": "Hackathon Agent Webhook",
        "nodes": [
            {
                "id": "webhook",
                "name": "Agent Webhook",
                "type": "n8n-nodes-base.webhook",
                "parameters": {
                    "path": "compliance-agent",
                    "httpMethod": "POST",
                    "responseMode": "responseNode"
                }
            },
            {
                "id": "hmac-verify",
                "name": "HMAC Verification",
                "type": "n8n-nodes-base.function",
                "parameters": {
                    "functionCode": """
// Verify HMAC signature
const crypto = require('crypto');
const secret = 'hackathon-secret-key-2024';
const receivedSignature = $input.first().json.headers['x-signature'];
const body = JSON.stringify($input.first().json.body);

const computedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

if (computedSignature !== receivedSignature) {
    throw new Error('HMAC verification failed');
}

return $input.first().json.body;
"""
                }
            },
            {
                "id": "process-actions",
                "name": "Process Actions",
                "type": "n8n-nodes-base.function",
                "parameters": {
                    "functionCode": """
// Process agent actions and simulate responses
const actions = $input.first().json.actions || [];
const artifacts = {
    jira: [],
    slack: "simulated-slack-ts",
    sheets: "simulated-sheets-url"
};

// Simulate Jira issue creation
actions.forEach(action => {
    if (action.type === 'jira.createIssue') {
        artifacts.jira.push('LEARN-' + Math.floor(Math.random() * 1000));
    }
});

return {
    run_id: $input.first().json.run_id,
    status: 'DONE',
    artifacts: artifacts,
    processed_at: new Date().toISOString()
};
"""
                }
            },
            {
                "id": "callback",
                "name": "Send Callback",
                "type": "n8n-nodes-base.httpRequest",
                "parameters": {
                    "url": "http://localhost:8000/api/agent-runs/callback",
                    "method": "POST",
                    "headers": {
                        "Content-Type": "application/json"
                    },
                    "body": "={{ $json }}"
                }
            },
            {
                "id": "response",
                "name": "Response",
                "type": "n8n-nodes-base.respondToWebhook",
                "parameters": {
                    "respondWith": "json",
                    "responseBody": {
                        "ok": True,
                        "message": "Agent executed successfully",
                        "run_id": "={{ $('hmac-verify').first().json.run_id }}"
                    }
                }
            }
        ],
        "connections": {
            "webhook": {
                "main": [
                    [
                        {
                            "node": "hmac-verify",
                            "type": "main",
                            "index": 0
                        }
                    ]
                ]
            },
            "hmac-verify": {
                "main": [
                    [
                        {
                            "node": "process-actions",
                            "type": "main",
                            "index": 0
                        }
                    ]
                ]
            },
            "process-actions": {
                "main": [
                    [
                        {
                            "node": "callback",
                            "type": "main",
                            "index": 0
                        }
                    ]
                ]
            },
            "callback": {
                "main": [
                    [
                        {
                            "node": "response",
                            "type": "main",
                            "index": 0
                        }
                    ]
                ]
            }
        }
    }
    
    return webhook_config

def test_agent_dispatch():
    """
    Test the agent dispatch functionality
    """
    
    # Test payload for compliance agent
    compliance_payload = {
        "run_id": "comp-test-" + str(int(datetime.now().timestamp())),
        "topic": "[Compliance] GDPR 2025 Test",
        "summary_md": "This is a test compliance document for GDPR requirements.",
        "key_risks": [
            "Data Privacy Compliance",
            "Security Requirements", 
            "Access Control Policies"
        ],
        "doc_url": "https://example.com/gdpr-doc.pdf",
        "actions": [
            {
                "type": "jira.createIssue",
                "payload": {
                    "fields": {
                        "project": {"key": "LEARN"},
                        "summary": "Complete GDPR refresh",
                        "issuetype": {"name": "Task"},
                        "description": "GDPR compliance requirements\n\nSource: https://example.com/gdpr-doc.pdf"
                    }
                }
            },
            {
                "type": "slack.postMessage",
                "payload": {
                    "text": "*Compliance update:* GDPR 2025\nKey risks: Data Privacy, Security, Access Control"
                }
            },
            {
                "type": "sheets.appendRow",
                "payload": {
                    "values": ["GDPR 2025", "Compliance", "High", datetime.now().isoformat()]
                }
            }
        ],
        "callback_url": "http://localhost:8000/api/agent-runs/callback"
    }
    
    # Create HMAC signature
    secret = "hackathon-secret-key-2024"
    body = json.dumps(compliance_payload)
    signature = hmac.new(secret.encode(), body.encode(), hashlib.sha256).hexdigest()
    
    headers = {
        "Content-Type": "application/json",
        "X-Signature": signature
    }
    
    print("🧪 Testing Agent Dispatch...")
    print(f"📤 Payload: {json.dumps(compliance_payload, indent=2)}")
    print(f"🔐 HMAC Signature: {signature}")
    
    return compliance_payload, headers

if __name__ == "__main__":
    print("🚀 Hackathon Agent Setup")
    print("=" * 50)
    
    # Create n8n configuration
    config = create_n8n_webhook_config()
    print("✅ n8n webhook configuration created")
    
    # Test payload
    payload, headers = test_agent_dispatch()
    print("✅ Test payload generated")
    
    print("\n📋 Next Steps:")
    print("1. Copy hackathon_config.env variables to your .env file")
    print("2. Set up n8n webhook with the provided configuration")
    print("3. Update OUTSYSTEMS_COMPLIANCE_URL with your n8n webhook URL")
    print("4. Test the 'Send to OutSystems Agent' button")
    print("5. Check Agent Runs Monitor for results")
    
    print("\n🎯 For OutSystems setup:")
    print("1. Create ODC tenant")
    print("2. Install Service Studio")
    print("3. Follow the step-by-step guide in the document")
    print("4. Switch URLs when ready")
