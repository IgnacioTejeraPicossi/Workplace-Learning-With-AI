# Arkitektur

## Applikasjonsarkitektur

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

## Testarkitektur

```mermaid
flowchart TB
  R[Run Test] --> C1[Cypress]
  R --> A1[API Tests]
```

## Agent-bro (Agent Bridge)
- Sentralisert konfigurasjon (`backend/config.py`) med `BACKEND_BASE_URL`, `CALLBACK_URL_DEFAULT`.
- Reserveløsning til `N8N_*_WEBHOOK` når `OUTSYSTEMS_*` ikke er satt.
