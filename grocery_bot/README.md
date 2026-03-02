# Grocery Bot — NMiAI 2026 Pre-Challenge

Bot para el Pre-Challenge del Norwegian AI Championship (Norges mester i AI) 2026. Conecta por WebSocket al servidor del juego, recibe el estado cada ronda y envía acciones para que los bots recojan ítems y entreguen pedidos.

- Docs oficiales: https://app.ainm.no/docs/game
- Jugar / token: https://app.ainm.no/challenge → Play → copiar la URL WebSocket.

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
```

## Niveles de implementación

- Level 1: Conectar, imprimir estado, wait, salir en game_over.
- Level 2: Un bot, pedido activo, ítem más cercano (Manhattan), pick_up, drop_off.
- Level 3 (próximo): Varios bots, reparto por proximidad, evitar mismo ítem.
- Level 4 (futuro): Pathfinding BFS/A*, evitar paredes y colisiones.

## Reglas importantes

2 s por ronda, 120 s total, 300 rondas máx. Desconexión = game over. Inventario máx. 3. Recoger adyacente; entregar en drop_off. Cooldown 60 s entre partidas.

## Estructura

- config.py: Lee URL/token desde env
- strategy.py: decide_level1 / decide_level2
- bot.py: Conexión WebSocket y bucle de juego

Plan detallado: docs/NMiAI_2026_GROCERY_BOT_PLAN.md
