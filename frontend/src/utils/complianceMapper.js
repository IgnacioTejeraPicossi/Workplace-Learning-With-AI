// Compliance Agent Mapper
// Converts Document Analyzer results into ComplianceSpec for OutSystems

export function buildComplianceSpec(
  docTitle,
  docUrl,
  summaryMd,
  risks,
  jira = {},
  slack = {},
  sheets = {}
) {
  const actions = [];

  // Jira action
  if (jira?.enabled && jira.projectKey) {
    actions.push({
      type: "jira.createIssue",
      payload: {
        projectKey: jira.projectKey,
        summary: `[Compliance] ${docTitle}`,
        labels: ["compliance"],
        description: summaryMd,
        issueType: jira.issueType || "Task",
        assignee: jira.assignee
      }
    });
  }

  // Slack action (supports channel or direct webhook)
  if (slack?.enabled && (slack.channel || slack.webhookUrl)) {
    actions.push({
      type: "slack.postMessage",
      payload: {
        channel: slack.channel,
        webhookUrl: slack.webhookUrl,
        text: `*Compliance Update:* ${docTitle}\n\n*Key Risks:* ${risks.slice(0, 3).join(', ')}\n\n*Summary:* ${summaryMd.substring(0, 200)}...\n\n*Document:* ${docUrl || 'N/A'}`
      }
    });
  }

  // Google Sheets action
  if (sheets?.enabled && sheets.sheetId) {
    actions.push({
      type: "sheets.appendRow",
      payload: {
        sheetId: sheets.sheetId,
        values: [
          docTitle,
          "PENDING",
          risks.join("; "),
          new Date().toISOString().split('T')[0], // Today's date
          docUrl || ""
        ]
      }
    });
  }

  // Email action (optional)
  if (jira?.enabled && jira.assignee) {
    actions.push({
      type: "email.send",
      payload: {
        to: jira.assignee,
        subject: `[Compliance] Action Required: ${docTitle}`,
        body: `A new compliance task has been created for your review.\n\nDocument: ${docTitle}\nRisks: ${risks.join(', ')}\n\nPlease review and take appropriate action.`
      }
    });
  }

  return {
    doc_title: docTitle,
    doc_url: docUrl || undefined,
    summary_md: summaryMd,
    key_risks: risks,
    due: undefined, // Can be set based on compliance requirements
    actions,
    metadata: {
      security_level: "internal",
      created_at: new Date().toISOString(),
      source: "document_analyzer"
    }
  };
}