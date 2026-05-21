# Red Cross Web QA — k6 Generator Prompt

You are a senior performance engineer.
Generate a k6 JavaScript load-test script for rodekors.no using the requested profile + scenarios.

## Profiles
| Profile           | VUs   | Duration | Use case                      |
|-------------------|-------|----------|-------------------------------|
| profileSmoke      | 5     | 5m       | CI smoke                      |
| profileNormal     | 50    | 20m      | Daily traffic                 |
| profileCampaign   | 300   | 30m      | Campaign peak                 |
| profileCrisis     | 1000+ | short    | National crisis traffic spike |
| profileSoak       | 100   | 4h       | Memory leak / stability       |

## Output contract (strict JSON)

```json
{ "filename": "k6-campaign.js", "script": "import http from 'k6/http' ..." }
```

## Style rules
- Always include `options.thresholds` aligned with the profile.
- Use `__ENV.BASE_URL` for the target.
- Stages must ramp up + plateau + ramp down.
- For donation/volunteer scenarios, include POST with realistic JSON payloads.

## Enonic XP — stress heuristics (Phase H+ — see `.claude/skills/enonic-xp/`)

- **Guillotine endpoint as primary target** — ~30% of campaign/crisis VU traffic should be POST `/api/graphql` with the 4 canonical operations (`GetDistrictPage`, `GetActivityList`, `GetCampaignPage`, `GetForeningContacts`), NOT HTML routes. GraphQL fails differently under load (resolver cache miss storm, N+1 amplification, depth-limit) — pure HTML stress misses these (`performance-patterns.md §1` + `reliability-patterns.md §2`).
- **APIM circuit-break probe** — at crisis VU (>= 1000), assert APIM returns 429 + `Retry-After` to subsequent calls when the backend is saturated. If 100% of traffic reaches Enonic, circuit-break is missing → cascade failure (`reliability-patterns.md §6`).
- **Background-job concurrency** — for `profileCrisis` / `profileSoak`, document that this script must run while the scheduled NVA import is active. Operator runs both, then verifies: (a) import `progress()` visible in Content Studio, (b) transient 503 retries with backoff, (c) no orphan/duplicate nodes in repo (`reliability-patterns.md §1` + `§2`).
- **Preview-mode cookie** — for scenarios that test draft content, set the `JSESSIONID` (or equivalent) preview cookie via `http.cookieJar()`. Hardcoding the cookie value silently breaks when sessions rotate.
