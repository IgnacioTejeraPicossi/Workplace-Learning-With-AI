# NMiAI 2026 — Grocery Bot Plan

Plan de implementación del bot para el **Pre-Challenge** del Norwegian AI Championship (NMiAI) 2026, alineado con [app.ainm.no/docs/game](https://app.ainm.no/docs/game).

---

## Objetivo

- Participar en el pre-challenge (grocery bot: bots en una tienda, recoger ítems, entregar pedidos).
- Practicar la pila que luego usaremos en la competición NM i AI 2026.
- Opcional: integrar con AI Gateway y Robomind Clinic para monitorear fallos de planificación y comportamiento del swarm (narrativa de verificación).

---

## Checklist operativo

1. **Registro y token**
   - Login en [app.ainm.no](https://app.ainm.no) → Challenge → Play.
   - Copiar WebSocket URL: `wss://game.ainm.no/ws?token=<jwt_token>`.
   - Configurar `GROCERY_BOT_WS_URL` o `GROCERY_BOT_TOKEN` en `.env`.

2. **Ejecutar el bot**
   - `cd grocery_bot && pip install -r requirements.txt && python bot.py` (Level 2).
   - Level 1: `python bot.py --level 1` (solo conectar y wait).

3. **Restricciones**
   - Responder en &lt; 2 s por ronda.
   - Máx. 300 rondas, 120 s total.
   - Sin reconexión; cooldown 60 s entre partidas.

---

## Niveles de implementación

| Nivel | Estado | Descripción |
|-------|--------|-------------|
| **1** | ✅ Hecho | Conectar, imprimir estado, responder `wait`, salir en `game_over`. |
| **2** | ✅ Hecho | Un bot: orden activa → ítem más cercano (Manhattan) → pick_up → drop_off. |
| **3** | Pendiente | 3 bots: reparto de ítems por proximidad, evitar mismo ítem, evitar bloqueos. |
| **4** | Pendiente | Task allocation, pathfinding (BFS/A*), evitar paredes y colisiones. |

---

## Integración con AI_NM_2026 (opcional)

- **Opción A:** Mantener el Grocery Bot como proyecto separado (solo `grocery_bot/`).
- **Opción B:** Envolver con el AI Gateway y registrar razonamiento; usar Robomind Clinic para analizar comportamiento del swarm (fallos de planificación, colapso de coordinación). Útil como narrativa de “sistemas verificables” en la competición.

---

## Referencias

- Especificación del juego: [app.ainm.no/docs/game](https://app.ainm.no/docs/game)
- Código del bot: [grocery_bot/](../grocery_bot/)
- Robomind Clinic (AI_NM_2026): [docs/ROBOMIND_AI_NM_2026_PLAN.md](ROBOMIND_AI_NM_2026_PLAN.md)
