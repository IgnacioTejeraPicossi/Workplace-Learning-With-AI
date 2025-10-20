// Productivity Agent Mapper
// Converts Agentic RAG results into ProductivitySpec for OutSystems

export function buildProductivitySpec(
  briefTitle,
  primaryUrl,
  summaryMd,
  actionsTop5,
  jira = {},
  slack = {},
  sheets = {}
) {
  const actions = [];

  // Multiple Jira actions (one per next action)
  if (jira?.enabled && jira.projectKey) {
    actionsTop5.forEach((action, index) => {
      actions.push({
        type: "jira.createIssue",
        payload: {
          projectKey: jira.projectKey,
          summary: action.title,
          description: `${action.detail || ''}\n\nSource: ${primaryUrl || briefTitle}`,
          issueType: jira.issueType || "Task",
          assignee: action.assignee || jira.assignee,
          labels: ["productivity", "ai-generated"],
          priority: index < 2 ? "High" : "Medium" // First 2 actions get High priority
        }
      });
    });
  }

  // Slack digest action (supports channel or direct webhook)
  if (slack?.enabled && (slack.channel || slack.webhookUrl)) {
    const actionTitles = actionsTop5.map(a => a.title).join('\n• ');
    actions.push({
      type: "slack.postMessage",
      payload: {
        channel: slack.channel,
        webhookUrl: slack.webhookUrl,
        text: `*Productivity Brief:* ${briefTitle}\n\n*Top Actions:*\n• ${actionTitles}\n\n*Summary:* ${summaryMd.substring(0, 200)}...`
      }
    });
  }

  // Google Sheets snapshot
  if (sheets?.enabled && sheets.sheetId) {
    actions.push({
      type: "sheets.appendRow",
      payload: {
        sheetId: sheets.sheetId,
        values: [
          briefTitle,
          primaryUrl || "",
          actionsTop5.map(a => a.title).join(" | "),
          new Date().toISOString().split('T')[0], // Today's date
          summaryMd.substring(0, 100) + "..."
        ]
      }
    });
  }

  // Email digest (optional)
  if (jira?.enabled && jira.assignee) {
    actions.push({
      type: "email.send",
      payload: {
        to: jira.assignee,
        subject: `[Productivity] ${actionsTop5.length} New Tasks: ${briefTitle}`,
        body: `New productivity tasks have been created based on: ${briefTitle}\n\nTasks:\n${actionsTop5.map((a, i) => `${i+1}. ${a.title}`).join('\n')}\n\nSource: ${primaryUrl || 'Manual input'}`
      }
    });
  }

  return {
    brief_title: briefTitle,
    primary_url: primaryUrl || undefined,
    summary_md: summaryMd,
    next_actions: actionsTop5,
    actions,
    metadata: {
      origin: "agentic_rag",
      created_at: new Date().toISOString(),
      action_count: actionsTop5.length,
      source_type: primaryUrl ? "url" : "manual"
    }
  };
}