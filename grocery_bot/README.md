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

------------------------------------------------
Copia de ultima documentacion oficial:
Grocery Bot — Game AI
Build a bot that controls a swarm of workers in a procedurally generated grocery store. Your bots navigate the store, pick items from shelves, and deliver them to the drop-off zone to fulfill orders sequentially. Bot count scales by difficulty — from 1 bot to 20.
How It Works
Your bot connects to the game server via WebSocket. Each round, the server sends you the full game state, and you respond with actions for each bot.
Server → Your Bot: game_state (round 0)
Your Bot → Server: {actions: [...]}
Server → Your Bot: game_state (round 1)
Your Bot → Server: {actions: [...]}
...
Server → Your Bot: game_over {score, items, orders}

The game runs for up to 300 rounds (500 on Nightmare) with a 120-second wall-clock limit (300s on Nightmare).
5 Difficulty Levels



Level
Grid
Bots
Aisles
Item Types
Order Size
Drop Zones




Easy
12×10
1
2
4
3-4
1


Medium
16×12
3
3
8
3-5
1


Hard
22×14
5
4
12
3-5
1


Expert
28×18
10
5
16
4-6
1


Nightmare
30×18
20
6
21
4-7
3



One map per difficulty. Item placement and orders change daily — same day, same game (deterministic).
Easy — Solo Pathfinding
One bot, small store. Focus on efficient routing.

Medium — Team Coordination
Three bots, larger store. Divide the work.

Hard — Multi-Agent Planning
Five bots, complex layout. Avoid duplicate work.

Expert — Swarm Management
Ten bots, massive store. Coordinate a swarm efficiently.

Nightmare — Total Chaos
Twenty bots, 3 drop-off zones, 500 rounds, 21 item types. The ultimate coordination challenge.
WebSocket Protocol
Connect via WebSocket to the URL provided when you request a game:
wss://game.ainm.no/ws?token=<jwt_token>

Get a token by clicking "Play" on a map at app.ainm.no/challenge.
Game State Message
Each round, you receive:
{
  "type": "game_state",
  "round": 42,
  "max_rounds": 300,
  "grid": {
    "width": 16,
    "height": 12,
    "walls": [[1,1], [1,2], [3,1]]
  },
  "bots": [
    {"id": 0, "position": [3, 7], "inventory": ["milk"]},
    {"id": 1, "position": [5, 3], "inventory": []},
    {"id": 2, "position": [10, 7], "inventory": ["bread", "eggs"]}
  ],
  "items": [
    {"id": "item_0", "type": "milk", "position": [2, 1]},
    {"id": "item_1", "type": "bread", "position": [4, 1]}
  ],
  "orders": [
    {
      "id": "order_0",
      "items_required": ["milk", "bread", "eggs"],
      "items_delivered": ["milk"],
      "complete": false,
      "status": "active"
    },
    {
      "id": "order_1",
      "items_required": ["cheese", "butter"],
      "items_delivered": [],
      "complete": false,
      "status": "preview"
    }
  ],
  "drop_off": [1, 10],
  "drop_off_zones": [[1, 10], [8, 10], [15, 10]],
  "score": 12
}
Field Reference



Field
Type
Description




round
int
Current round (0-indexed)


max_rounds
int
Maximum rounds (300, or 500 for Nightmare)


grid.walls
int[][]
List of [x, y] wall positions


bots
object[]
All bots with id, position [x,y], and inventory


items
object[]
All items on shelves with id, type, and position [x,y]


orders
object[]
Active + preview orders (max 2 visible)


drop_off
int[]
[x, y] of the primary drop-off zone


drop_off_zones
int[][]
All drop-off zone positions (Nightmare has 3, others have 1). Deliver at any zone.


score
int
Current score



Bot Response
Send within 2 seconds:
{
  "actions": [
    {"bot": 0, "action": "move_up"},
    {"bot": 1, "action": "pick_up", "item_id": "item_3"},
    {"bot": 2, "action": "drop_off"}
  ]
}
Actions
Each bot performs one action per round:



Action
Extra Fields
Description




move_up
—
Move one cell up (y-1)


move_down
—
Move one cell down (y+1)


move_left
—
Move one cell left (x-1)


move_right
—
Move one cell right (x+1)


pick_up
item_id
Pick up item from adjacent shelf


drop_off
—
Deliver matching items at drop-off zone


wait
—
Do nothing



Invalid actions are treated as wait.

Pickup Rules

Bot must be adjacent (Manhattan distance 1) to the shelf with the item
Bot inventory must not be full (max 3 items)
item_id must match an item on the map


Dropoff Rules

Bot must be standing on the drop-off cell
Only items matching the active order are delivered
Non-matching items stay in inventory
When an order completes, the next order activates and remaining items are re-checked


Sequential Orders
Orders are revealed one at a time and keep generating:

Active order — the current order you must complete. You can deliver items for it.
Preview order — the next order. Visible but you cannot deliver to it yet. You can pre-pick items.
Infinite — when you complete an order, a new one appears. Orders never run out. Rounds are the only limit.

Scoring



Event
Points




Item delivered
+1


Order completed
+5 bonus



Your leaderboard score = sum of your best score on each of the 5 maps.
Constraints

300 rounds maximum per game (500 for Nightmare)
120 seconds wall-clock limit (300s for Nightmare)
3 items per bot inventory
Collision — bots block each other (no two on same tile, except spawn)
Full visibility — entire map visible every round
2-second timeout per round for your response
60-second cooldown between games, max 40 per hour and 300 per day per team
Disconnect = game over — no reconnect
Multiple drop-off zones — Nightmare has 3 interchangeable drop-off points

Coordinate System

Origin (0, 0) is the top-left corner
X increases to the right
Y increases downward

Example Bot
import asyncio
import json
import websockets
 
WS_URL = "wss://game.ainm.no/ws?token=YOUR_TOKEN"
 
async def play():
    async with websockets.connect(WS_URL) as ws:
        while True:
            msg = json.loads(await ws.recv())
 
            if msg["type"] == "game_over":
                print(f"Game over! Score: {msg['score']}")
                break
 
            state = msg
            actions = []
 
            for bot in state["bots"]:
                action = decide(bot, state)
                actions.append(action)
 
            await ws.send(json.dumps({"actions": actions}))
 
def decide(bot, state):
    x, y = bot["position"]
    drop_off = state["drop_off"]
 
    if bot["inventory"] and [x, y] == drop_off:
        return {"bot": bot["id"], "action": "drop_off"}
 
    if len(bot["inventory"]) >= 3:
        return move_toward(bot["id"], x, y, drop_off)
 
    active = next((o for o in state["orders"] if o["status"] == "active"), None)
    if not active:
        return {"bot": bot["id"], "action": "wait"}
 
    needed = list(active["items_required"])
    for d in active["items_delivered"]:
        if d in needed:
            needed.remove(d)
 
    for item in state["items"]:
        if item["type"] in needed:
            ix, iy = item["position"]
            if abs(ix - x) + abs(iy - y) == 1:
                return {"bot": bot["id"], "action": "pick_up", "item_id": item["id"]}
 
    for item in state["items"]:
        if item["type"] in needed:
            return move_toward(bot["id"], x, y, item["position"])
 
    if bot["inventory"]:
        return move_toward(bot["id"], x, y, drop_off)
 
    return {"bot": bot["id"], "action": "wait"}
 
def move_toward(bot_id, x, y, target):
    tx, ty = target
    if abs(tx - x) > abs(ty - y):
        return {"bot": bot_id, "action": "move_right" if tx > x else "move_left"}
    elif ty != y:
        return {"bot": bot_id, "action": "move_down" if ty > y else "move_up"}
    return {"bot": bot_id, "action": "wait"}
 
asyncio.run(play())