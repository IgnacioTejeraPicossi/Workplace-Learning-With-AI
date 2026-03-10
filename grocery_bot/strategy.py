"""
NMiAI 2026 Grocery Bot — strategy v19.

ROOT CAUSE OF ALL FAILURES (finally found via round-by-round trace):

Bot 3 exits spawn to [28,15], navigates toward target, then BFS routes it
BACK through spawn [28,16] because it's a shorter path to zone [27,16].
Once at spawn, dispersal fires → bot goes up to [28,15].
At [28,15], BFS again routes DOWN through [28,16]. Infinite oscillation.
13+ bots trapped in this spawn-oscillation loop = only 7 bots working.

THE FIX: Block spawn [28,16] in BFS when bot is not at spawn.
Bots route [28,15]→[27,15]→[27,16] (1 extra step) instead of via spawn.
This completely eliminates the oscillation trap.

Other fixes:
  - No claimed_cells in movement (was causing unnecessary waits)
  - Non-matching items → go to nearest zone (get out of aisles)
  - 1 bot per needed type assignment (no surplus picking)
  - Items respawn → always a target available
"""
from collections import deque
from typing import Any


def manhattan(a, b) -> int:
    return abs(a[0] - b[0]) + abs(a[1] - b[1])


_DIRS = [("move_up",0,-1),("move_down",0,1),("move_left",-1,0),("move_right",1,0)]


def _grid(state):
    g = state.get("grid") or {}
    return g.get("width", 30), g.get("height", 18)


def _walls(state):
    return {(w[0],w[1]) for w in (state.get("grid") or {}).get("walls") or []}


def _spawn(state):
    """Spawn = bottom-right free cell = (W-2, H-2)."""
    g = state.get("grid") or {}
    return (g.get("width", 30) - 2, g.get("height", 18) - 2)


def _bfs_step(from_pos, targets: set, blocked: set, W: int, H: int):
    x0,y0 = int(from_pos[0]),int(from_pos[1])
    if (x0,y0) in targets: return None
    reachable = targets - blocked
    if not reachable: return None
    visited = {(x0,y0)}; fm = {}
    q = deque([(x0,y0)])
    while q:
        cx,cy = q.popleft()
        if (cx,cy) in reachable: return fm[(cx,cy)]
        for act,dx,dy in _DIRS:
            nx,ny = cx+dx, cy+dy
            if not (0<=nx<W and 0<=ny<H): continue
            if (nx,ny) in blocked or (nx,ny) in visited: continue
            visited.add((nx,ny))
            fm[(nx,ny)] = act if (cx,cy)==(x0,y0) else fm[(cx,cy)]
            q.append((nx,ny))
    return None


def _blocked_base(x, y, state):
    """Walls + spawn (unless bot is at spawn)."""
    sp = _spawn(state)
    blocked = _walls(state)
    if (x,y) != sp:
        blocked.add(sp)  # KEY FIX: never route through spawn
    return blocked


def _move(bid, x, y, tx, ty, state) -> dict:
    W,H = _grid(state)
    blocked = _blocked_base(x, y, state)
    step = _bfs_step([x,y], {(tx,ty)}, blocked, W, H)
    if not step:
        # Fallback without spawn block (in case path only goes through spawn)
        step = _bfs_step([x,y], {(tx,ty)}, _walls(state), W, H)
    return {"bot": bid, "action": step or "wait"}


def _move_adj(bid, x, y, ix, iy, state) -> dict:
    """Move to adjacent cell of item at (ix,iy). Bot-aware with fallback."""
    W,H = _grid(state)
    adj = {(ix+dx,iy+dy) for _,dx,dy in _DIRS if 0<=ix+dx<W and 0<=iy+dy<H}
    blocked = _blocked_base(x, y, state)
    for it in state.get("items") or []:
        p=it.get("position") or [0,0]; blocked.add((p[0],p[1]))
    bot_blocked = set()
    for b in state.get("bots") or []:
        if b.get("id")==bid: continue
        p=b.get("position") or [0,0]; bot_blocked.add((p[0],p[1]))
    # Try full blocking, then relax bots, then relax spawn
    step = _bfs_step([x,y], adj, blocked | bot_blocked, W, H)
    if not step:
        step = _bfs_step([x,y], adj, blocked, W, H)
    if not step:
        step = _bfs_step([x,y], adj, _walls(state), W, H)
    return {"bot": bid, "action": step or "wait"}


def _dispersal(bid, x, y, state, claimed=None):
    """Exit spawn cluster. claimed only used here to spread bots out."""
    sp = _spawn(state)
    if (x,y) != sp: return None
    if sum(1 for b in (state.get("bots") or []) if b.get("position")==list(sp)) < 2:
        return None
    W,H = _grid(state); walls = _walls(state)
    for act,dx,dy in [("move_left",-1,0),("move_up",0,-1),("move_down",0,1),("move_right",1,0)]:
        nx,ny = x+dx, y+dy
        if not (0<=nx<W and 0<=ny<H) or (nx,ny) in walls: continue
        if claimed and (nx,ny) in claimed: continue
        return {"bot": bid, "action": act}
    # All exits claimed: force exit anyway
    for act,dx,dy in [("move_left",-1,0),("move_up",0,-1)]:
        nx,ny = x+dx, y+dy
        if 0<=nx<W and 0<=ny<H and (nx,ny) not in walls:
            return {"bot": bid, "action": act}
    return None


def _all_zones(state):
    z = state.get("drop_off_zones") or []
    return z if z else [state.get("drop_off") or [0,0]]


def _nearest_zone(pos, state):
    return min(_all_zones(state), key=lambda z: manhattan(pos, z))


def _active(state):
    return next((o for o in state.get("orders") or [] if o.get("status")=="active"), None)


def _needed_types(order):
    if not order: return []
    n = list(order.get("items_required") or [])
    for d in order.get("items_delivered") or []:
        if d in n: n.remove(d)
    return n


def _rounds_left(state):
    return (state.get("max_rounds") or 300) - (state.get("round") or 0)


def _assign_targets(state: dict, failed_pickups: dict | None = None) -> dict:
    """1 bot per needed type. Prefer lower-band items (faster loop)."""
    failed_pickups = failed_pickups or {}
    items = state.get("items") or []
    bots = sorted(state.get("bots") or [], key=lambda b: b["id"])
    assignments: dict = {}
    assigned_ids: set = set()

    active_ord = _active(state)
    needed_types = list(_needed_types(active_ord))

    # Subtract inventory
    remaining = list(needed_types)
    for b in bots:
        for t in (b.get("inventory") or []):
            if t in remaining:
                remaining.remove(t)

    def score(bot, item):
        ix,iy = item["position"]
        nz = _nearest_zone([ix,iy], state)
        return (0 if iy >= 10 else 6) + manhattan([ix,iy], nz) + manhattan(bot["position"], [ix,iy]) * 0.5

    types_left = list(remaining)
    for bot in bots:
        inv = bot.get("inventory") or []
        if len(inv) >= 3 or not types_left: continue
        pool = [i for i in items if i["type"] in types_left
                and i["id"] not in assigned_ids
                and failed_pickups.get((bot["id"],i["id"]),0) < 1]
        if not pool: continue
        best = min(pool, key=lambda i: score(bot, i))
        assignments[bot["id"]] = best
        assigned_ids.add(best["id"])
        types_left.remove(best["type"])

    return assignments


def decide(bot, state, assignments, claimed_cells=None, failed_pickups=None) -> dict[str, Any]:
    failed_pickups = failed_pickups or {}
    x,y = int(bot["position"][0]),int(bot["position"][1])
    bid = bot["id"]
    inv = bot.get("inventory") or []

    # Spawn dispersal (only place claimed_cells is used)
    d = _dispersal(bid, x, y, state, claimed_cells)
    if d: return d

    all_zones = _all_zones(state)
    active_ord = _active(state)
    needed = _needed_types(active_ord)
    matching = [t for t in inv if t in needed]

    # === AT DROP ZONE ===
    if [x,y] in all_zones:
        if matching:
            return {"bot": bid, "action": "drop_off"}
        if inv:
            return {"bot": bid, "action": "wait"}
        # No matching at zone → immediately go pick nearest needed item
        active_items = [i for i in (state.get("items") or []) if i["type"] in set(needed)]
        if active_items:
            nn = min(active_items, key=lambda i: manhattan([x,y], i["position"]))
            return _move_adj(bid, x, y, int(nn["position"][0]), int(nn["position"][1]), state)
        return {"bot": bid, "action": "wait"}

    # === HAS MATCHING ITEMS → deliver ===
    if matching:
        nz = _nearest_zone([x,y], state)
        return _move(bid, x, y, nz[0], nz[1], state)

    # === FULL → deliver ===
    if len(inv) >= 3:
        nz = _nearest_zone([x,y], state)
        return _move(bid, x, y, nz[0], nz[1], state)

    # === RUNNING OUT OF TIME → deliver ===
    if inv:
        nz = _nearest_zone([x,y], state)
        if _rounds_left(state) <= manhattan([x,y], nz) + 3:
            return _move(bid, x, y, nz[0], nz[1], state)

    # === HAS NON-MATCHING ITEMS → go to zone (clear aisles!) ===
    if inv:
        nz = _nearest_zone([x,y], state)
        return _move(bid, x, y, nz[0], nz[1], state)

    # === EMPTY → pick assigned item ===
    target = assignments.get(bid)
    if target:
        ix,iy = int(target["position"][0]),int(target["position"][1])
        useful = set(needed)
        # Adjacent: pick up any needed item
        for it in state.get("items") or []:
            ip=it.get("position") or [0,0]
            if abs(x-ip[0])+abs(y-ip[1])==1 and it["type"] in useful:
                return {"bot": bid, "action": "pick_up", "item_id": it["id"]}
        # Navigate to target item
        if any(it.get("id")==target["id"] for it in (state.get("items") or [])):
            return _move_adj(bid, x, y, ix, iy, state)
        # Item respawned (new ID) → find nearest of same type
        same_type = [i for i in (state.get("items") or []) if i["type"] in useful]
        if same_type:
            nn = min(same_type, key=lambda i: manhattan([x,y], i["position"]))
            return _move_adj(bid, x, y, int(nn["position"][0]), int(nn["position"][1]), state)

    # === NO ASSIGNMENT → go to nearest zone to be ready ===
    nz = _nearest_zone([x,y], state)
    if [x,y] != nz:
        return _move(bid, x, y, nz[0], nz[1], state)
    return {"bot": bid, "action": "wait"}


def decide_level1(_bot, _state): return {"bot": _bot["id"], "action": "wait"}

def decide_level2(bot, state, failed_pickups=None):
    return decide(bot, state, _assign_targets(state, failed_pickups), failed_pickups=failed_pickups)

def decide_level3(bot, state, bot_assignments, bots_at_drop=None,
                  claimed_next_cells=None, failed_pickups=None):
    return decide(bot, state, bot_assignments,
                  claimed_cells=claimed_next_cells, failed_pickups=failed_pickups)