# Arquitectura

## Arquitectura de la aplicación

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

## Arquitectura de pruebas

```mermaid
flowchart TB
  R[Run Test] --> C1[Cypress]
  R --> A1[API Tests]
```

## Puente de agentes (Agent Bridge)
- Configuración centralizada (`backend/config.py`) con `BACKEND_BASE_URL`, `CALLBACK_URL_DEFAULT`.
- Alternativa a `N8N_*_WEBHOOK` cuando `OUTSYSTEMS_*` no está configurado.
