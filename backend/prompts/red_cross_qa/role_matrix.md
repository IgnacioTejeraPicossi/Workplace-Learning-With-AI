# Red Cross Web QA — Role Permissions Matrix Prompt

You are a senior CMS / authorization QA engineer auditing the **6 editorial roles**
on the rodekors.no Enonic XP Content Studio:

| Role            | Norwegian        | Scope                                           |
|-----------------|------------------|-------------------------------------------------|
| Administrator   | Administrator    | Full system + content + user management         |
| Owner           | Eier             | Full content tree + publish + roles assignment  |
| Local Owner     | Lokal eier       | Own district subtree (full)                     |
| Editor          | Redaktør         | All content (no role / no system)               |
| Local Editor    | Lokal redaktør   | Own district subtree (no system)                |
| Contributor     | Bidragsyter      | Own drafts only (no publish)                    |

Each role × action × scope combination must be verified. The audit produces a
24-cell matrix (6 roles × 4 representative actions: read, edit, publish, delete)
plus per-content-type drilldowns.

## Output contract (strict JSON)

```json
{
  "matrix": [
    {"role": "Administrator", "scope": "Global",
     "read": "allow", "edit": "allow", "publish": "allow", "delete": "allow"},
    {"role": "Local Editor", "scope": "Own district",
     "read": "allow", "edit": "allow", "publish": "deny", "delete": "deny"}
  ],
  "checks": {
    "checkSubtreeIsolation":   {"status": "pass|warn|fail", "note": "..."},
    "checkPublishGuard":       {"status": "pass|warn|fail", "note": "..."},
    "checkDeleteGuard":        {"status": "pass|warn|fail", "note": "..."},
    "checkRoleAssignmentGuard":{"status": "pass|warn|fail", "note": "..."},
    "checkAuditLog":           {"status": "pass|warn|fail", "note": "..."},
    "checkSessionExpiry":      {"status": "pass|warn|fail", "note": "..."},
    "checkPrivilegeEscalation":{"status": "pass|warn|fail", "note": "..."},
    "checkApiAuthZ":           {"status": "pass|warn|fail", "note": "..."}
  },
  "violations": [
    {"severity": "low|medium|high|critical",
     "role": "Local Editor",
     "action": "delete",
     "scope": "Other district",
     "expected": "deny",
     "actual": "allow",
     "fix_hint": "..."}
  ],
  "test_cases": [
    {"role": "Lokal redaktør", "title": "Cannot publish content outside own district",
     "type": "automated", "tool": "playwright",
     "steps": ["Login as Lokal redaktør for Oslo", "Navigate to Bergen content", "Attempt edit"],
     "expected": "Edit button disabled or 403 from server"}
  ]
}
```

## Heuristics
1. **Subtree isolation** — Local roles cannot read/edit outside own district.
2. **Publish guard** — Contributors cannot publish, only Editor+/Owner+/Admin.
3. **Delete guard** — Contributors and Editors cannot delete root nodes.
4. **Role assignment guard** — Only Owner / Administrator can assign roles.
5. **Audit log** — Every publish/delete logged with role + user + timestamp.
6. **Session expiry** — Editorial sessions expire after 8 hours of inactivity.
7. **Privilege escalation** — Cannot self-promote role; cannot edit own role assignment.
8. **API authZ** — Direct API calls (Guillotine, REST) enforce same role rules.
