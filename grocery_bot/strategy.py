"""
NMiAI 2026 Grocery Bot — strategy v11.

ROOT CAUSE of all previous score=0-2:
  claimed_cells PERMANENTLY TRAPS 12-18 bots at spawn [28,16].
  Map has only 2 exits: [27,16] (left) and [28,15] (up).
  Bots process in order 0-19. Bot 0 claims [27,16], bot 1 claims [28,15].
  Bots 2-19: BOTH exits claimed → dispersal returns "wait".
  They wait EVERY SINGLE ROUND for 500 rounds → score=0-2.

v11 fix — ELIMINATE claimed_cells from ALL movement:
  Server handles collisions (bot stays put for 1 round if cell occupied).
  This is far better than 18 bots waiting 500 rounds.
  claimed_cells only used for DISPERSAL (ensures 2 different bots exit spawn).

Architecture:
  - All 20 bots assigned to items at all times (no idle bots blocking corridors)
  - After delivering, bot immediately heads to next assignment
  - Wall-only BFS for delivery (stable, no oscillation)
  - Bot-aware BFS for picking (but NO claimed_cells blocking)
  - Priorities: active order items → preview → any useful item
"""
from collections import deque
from typing import Any


def manhattan(a, b) -> int:
    return abs(a[0] - b[0]) + abs(a[1] - b[1])


def _all_drop_zones(state: dict) -> list:
    zones = state.get("drop_off_zones") or []
    return zones if zones else [state.get("drop_off") or [0, 0]]


def _nearest_zone(pos, state: dict) -> list:
    return min(_all_drop_zones(state), key=lambda z: manhattan(pos, z))


_DIRS = [("move_up",0,-1),("move_down",0,1),("move_left",-1,0),("move_right",1,0)]


def _walls_only(state: dict) -> set:
    return {(w[0],w[1]) for w in (state.get("grid") or {}).get("walls") or []}


def _bfs(from_pos, targets: set, blocked: set, W: int, H: int):
    x0,y0 = int(from_pos[0]), int(from_pos[1])
    if (x0,y0) in targets: return None
    reachable = targets - blocked
    if not reachable: return None
    visited = {(x0,y0)}
    fm: dict = {}
    q: deque = deque([(x0,y0)])
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


def _delivery_step(bot_id, x, y, target, state) -> dict[str, Any]:
    """Wall-only BFS. No claimed_cells — server handles collisions."""
    grid = state.get("grid") or {}
    W,H = grid.get("width",32), grid.get("height",24)
    step = _bfs([x,y], {(target[0],target[1])}, _walls_only(state), W, H)
    return {"bot": bot_id, "action": step or "wait"}


def _picking_step(bot_id, x, y, item_pos, state) -> dict[str, Any]:
    """Navigate to adjacent cell of item. Bot-aware but NO claimed_cells."""
    grid = state.get("grid") or {}
    W,H = grid.get("width",32), grid.get("height",24)
    px,py = int(item_pos[0]), int(item_pos[1])
    adj = {(px+dx,py+dy) for _,dx,dy in _DIRS if 0<=px+dx<W and 0<=py+dy<H}

    blocked = _walls_only(state)
    for it in state.get("items") or []:
        p = it.get("position") or [0,0]; blocked.add((p[0],p[1]))
    for b in state.get("bots") or []:
        if b.get("id") == bot_id: continue
        p = b.get("position") or [0,0]; blocked.add((p[0],p[1]))

    step = _bfs([x,y], adj, blocked, W, H)
    if step: return {"bot": bot_id, "action": step}
    # Fallback: wall-only (ignore other bots entirely)
    step2 = _bfs([x,y], adj, _walls_only(state), W, H)
    return {"bot": bot_id, "action": step2 or "wait"}


def _dispersal_move(bot_id, x, y, state, claimed=None):
    """Only function that uses claimed_cells — ensures different exit directions."""
    if sum(1 for b in (state.get("bots") or []) if b.get("position")==[x,y]) < 2:
        return None
    grid = state.get("grid") or {}
    W,H = grid.get("width",32), grid.get("height",24)
    walls = {(w[0],w[1]) for w in grid.get("walls") or []}
    for act,dx,dy in [("move_left",-1,0),("move_up",0,-1),("move_down",0,1),("move_right",1,0)]:
        nx,ny = x+dx, y+dy
        if not (0<=nx<W and 0<=ny<H): continue
        if (nx,ny) in walls: continue
        if claimed and (nx,ny) in claimed: continue
        return {"bot": bot_id, "action": act}
    # ALL exits claimed — IGNORE claimed_cells and force movement anyway
    for act,dx,dy in [("move_left",-1,0),("move_up",0,-1)]:
        nx,ny = x+dx, y+dy
        if not (0<=nx<W and 0<=ny<H): continue
        if (nx,ny) in walls: continue
        return {"bot": bot_id, "action": act}
    return {"bot": bot_id, "action": "wait"}


def _active_order(state):
    return next((o for o in state.get("orders") or [] if o.get("status")=="active"), None)

def _preview_order(state):
    return next((o for o in state.get("orders") or [] if o.get("status")=="preview"), None)

def _needed_types(order):
    if not order: return []
    needed = list(order.get("items_required") or [])
    for d in order.get("items_delivered") or []:
        if d in needed: needed.remove(d)
    return needed

def _remaining_to_pick(state, needed):
    remaining = list(needed)
    for bot in state.get("bots") or []:
        for t in bot.get("inventory") or []:
            if t in remaining: remaining.remove(t)
    return remaining

def _item_on_map(state, item_id):
    return any(it.get("id")==item_id for it in state.get("items") or [])

def _rounds_left(state):
    return (state.get("max_rounds") or 300) - (state.get("round") or 0)


def _assign_targets(state: dict, failed_pickups: dict | None = None) -> dict:
    failed_pickups = failed_pickups or {}
    items = state.get("items") or []
    bots = sorted(state.get("bots") or [], key=lambda b: b["id"])
    assigned_ids: set = set()
    assignments: dict = {}

    def _best(bot, cands):
        best, bd = None, 999999
        for item in cands:
            if item["id"] in assigned_ids: continue
            if failed_pickups.get((bot["id"],item["id"]),0) >= 1: continue
            d = manhattan(bot["position"], item["position"])
            if d < bd or (d==bd and best and item["id"] < best["id"]):
                bd, best = d, item
        return best

    active = _active_order(state)
    preview = _preview_order(state)
    active_types = set(_needed_types(active))
    preview_types = set(_needed_types(preview)) if preview else set()
    useful_types = active_types | preview_types

    # Pass 1: 1 bot per active type (closest)
    needed = _needed_types(active)
    remaining = _remaining_to_pick(state, needed)
    types_left = list(remaining)
    ac = [i for i in items if i["type"] in types_left]
    for bot in bots:
        if len(bot.get("inventory") or []) >= 3 or not types_left: continue
        best = _best(bot, [i for i in ac if i["type"] in types_left])
        if best:
            assignments[bot["id"]] = best
            assigned_ids.add(best["id"])
            types_left.remove(best["type"])

    # Pass 2: preview items (empty idle bots only)
    if preview:
        pt = list(_needed_types(preview))
        pc = [i for i in items if i["type"] in pt and i["id"] not in assigned_ids]
        for bot in bots:
            if bot["id"] in assignments or not pt: continue
            inv = bot.get("inventory") or []
            if len(inv) >= 3 or inv: continue
            best = _best(bot, [i for i in pc if i["type"] in pt])
            if best:
                assignments[bot["id"]] = best
                assigned_ids.add(best["id"])
                pt.remove(best["type"])

    # Pass 3: ALL remaining idle empty bots → useful-type items (multiple per type ok)
    # This keeps all 20 bots moving toward useful items instead of blocking corridors
    useful_pool = [i for i in items if i["type"] in useful_types and i["id"] not in assigned_ids]
    for bot in bots:
        if bot["id"] in assignments: continue
        inv = bot.get("inventory") or []
        if len(inv) >= 3 or inv: continue
        if not useful_pool: break
        best = _best(bot, useful_pool)
        if best:
            assignments[bot["id"]] = best
            # Don't exclude from pool — multiple bots can target same item
            # (only 1 will pick it up; others will re-assign next round)

    return assignments


def decide(
    bot: dict, state: dict, assignments: dict,
    claimed_cells=None,   # kept for bot.py API compatibility, NOT used for movement
    failed_pickups=None,
) -> dict[str, Any]:
    failed_pickups = failed_pickups or {}
    pos = bot["position"]
    x,y = int(pos[0]), int(pos[1])
    bid = bot["id"]
    inv = bot.get("inventory") or []
    rounds_remaining = _rounds_left(state)

    # Spawn dispersal (the only place claimed_cells matters)
    d = _dispersal_move(bid, x, y, state, claimed_cells)
    if d: return d

    all_zones = _all_drop_zones(state)
    near_zone = _nearest_zone(pos, state)
    dist_drop = manhattan(pos, near_zone)

    active = _active_order(state)
    needed = _needed_types(active)
    matching = [t for t in inv if t in needed]

    # 1. Standing on drop-off AND have matching items → deliver
    if matching and [x,y] in all_zones:
        return {"bot": bid, "action": "drop_off"}

    # 2. Full inventory → deliver (no claimed_cells blocking)
    if len(inv) >= 3:
        return _delivery_step(bid, x, y, near_zone, state)

    # 3. Running out of rounds → deliver
    if matching and rounds_remaining <= dist_drop + 5:
        return _delivery_step(bid, x, y, near_zone, state)

    # 4. Has matching items → head to drop zone immediately
    if matching:
        return _delivery_step(bid, x, y, near_zone, state)

    # 5. Go pick assigned item
    target = assignments.get(bid)
    if target and _item_on_map(state, target["id"]):
        ix,iy = int(target["position"][0]), int(target["position"][1])
        if manhattan([x,y], [ix,iy]) == 1:
            # Only pick up if type is useful (active or preview)
            preview = _preview_order(state)
            preview_types = set(_needed_types(preview)) if preview else set()
            if target["type"] in set(needed) | preview_types:
                return {"bot": bid, "action": "pick_up", "item_id": target["id"]}
            # Not useful yet — wait adjacent (don't block, just hover)
            return {"bot": bid, "action": "wait"}
        return _picking_step(bid, x, y, [ix,iy], state)

    # 6. Non-matching inv or no assignment — DO NOT return to spawn.
    #    Head toward nearest active-type item on map instead.
    active_items = [i for i in (state.get("items") or []) if i["type"] in set(needed)]
    if active_items and not inv:
        nearest = min(active_items, key=lambda i: manhattan([x,y], i["position"]))
        return _picking_step(bid, x, y, nearest["position"], state)

    # 7. Has non-matching inventory — wait in place (order will change)
    return {"bot": bid, "action": "wait"}


def decide_level1(_bot, _state): return {"bot": _bot["id"], "action": "wait"}

def decide_level2(bot, state, failed_pickups=None):
    return decide(bot, state, _assign_targets(state, failed_pickups), failed_pickups=failed_pickups)

def decide_level3(bot, state, bot_assignments, bots_at_drop=None,
                  claimed_next_cells=None, failed_pickups=None):
    return decide(bot, state, bot_assignments,
                  claimed_cells=claimed_next_cells, failed_pickups=failed_pickups)
