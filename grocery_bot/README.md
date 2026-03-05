# Grocery Bot — NMiAI 2026 Pre-Challenge

Bot para el Pre-Challenge del Norwegian AI Championship (Norges mester i AI) 2026. Conecta por WebSocket al servidor del juego, recibe el estado cada ronda y envía acciones para que los bots recojan ítems y entreguen pedidos.

- **Docs oficiales:** https://app.ainm.no/docs/game  
- **Jugar / token:** https://app.ainm.no/challenge → Play → copiar la URL WebSocket.  
- **Leaderboard:** mejor puntuación por mapa; total = suma de los 4 mapas.

## Cómo obtener el token / URL

1. Entra en https://app.ainm.no e inicia sesión.
2. Ve a Challenge.
3. Elige un mapa (Easy/Medium/Hard/Expert) y haz clic en Play.
4. Copia la URL WebSocket (ej: wss://game.ainm.no/ws?token=eyJ...).
5. Configura esa URL o solo el token (ver abajo).

## Instalación y ejecución

```bash
cd grocery_bot
pip install -r requirements.txt
```

Configura una de estas opciones en el .env del repo o en grocery_bot/.env:

- Opción A — URL completa: GROCERY_BOT_WS_URL=wss://game.ainm.no/ws?token=eyJ...
- Opción B — Solo token: GROCERY_BOT_TOKEN=eyJ...

Ejecutar:

```bash
# Nivel 2: jugar (un bot, Manhattan, recoger y entregar)
python bot.py

# Nivel 1: solo conectar y responder wait (probar conexión)
python bot.py --level 1

python bot.py --quiet
python bot.py --trace   # Ver posición/acción por bot en las primeras 10 rondas
```

## Niveles de implementación

- **Level 1:** Conectar, imprimir estado, wait, salir en game_over.
- **Level 2:** Un bot, pedido activo, ítem más cercano, BFS para evitar paredes, path hacia celda adyacente al ítem (shelves no son caminables), pick_up, drop_off.
- **Level 3:** Varios bots: reparto de ítems por proximidad, BFS evitando paredes y celdas “reservadas” por otros bots en la misma ronda (para separarse al salir del spawn), path hacia celda adyacente al ítem.

## Reglas importantes

2 s por ronda, 120 s total, 300 rondas máx. Desconexión = game over. Inventario máx. 3. Recoger adyacente; entregar en drop_off. Cooldown 60 s entre partidas.

## Alineado con la documentación oficial

- **game_state:** type, round, max_rounds, grid (width, height, walls), bots, items, orders, drop_off, score.
- **Recoger:** bot adyacente (Manhattan 1) al shelf del ítem; inventario máx. 3; pathfinding hacia una celda adyacente al ítem (no hacia la celda del ítem).
- **Entregar:** bot en la celda drop_off; solo ítems del pedido activo; al completar orden, siguiente se activa.
- **Colisión:** “no two on same tile, except spawn” — por eso al salir del spawn reservamos la celda destino de cada bot para que elijan pasos distintos.
- **Preview order:** implementado — bots ociosos pre-recogen ítems del pedido preview.

## Estructura

- config.py: URL/token desde env
- strategy.py: decide_level1 / level2 / level3, BFS, step_toward_adjacent_to_item, claimed cells
- bot.py: WebSocket, bucle de juego, decisión por orden de bot (claimed_next_cells)

Plan detallado: docs/NMiAI_2026_GROCERY_BOT_PLAN.md
