# Architecture

## Application Architecture

```mermaid
flowchart TB
  A((User)) --> B[Main App]
  subgraph Core
    C[Dashboard]
    D[AI Concepts]
    E[Micro Lessons]
  end
  subgraph Advanced
    F[Knowledge Map]
    G[Agentic RAG]
  end
  B --> C
  B --> D
  B --> E
  B --> F
  B --> G
```

## Testing Architecture

```mermaid
flowchart TB
  R[Run Test] --> C1[Cypress]
  R --> A1[API Tests]
```

## Agent Bridge
- Centralized config (`backend/config.py`) with `BACKEND_BASE_URL`, `CALLBACK_URL_DEFAULT`.
- Fallback to `N8N_*_WEBHOOK` when `OUTSYSTEMS_*` is unset.
