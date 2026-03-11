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
    """Move to adjacent cell of item at (ix,iy)."""
    W,H = _grid(state)
    adj = {(ix+dx,iy+dy) for _,dx,dy in _DIRS if 0<=ix+dx<W and 0<=iy+dy<H}
    blocked = _blocked_base(x, y, state)
    for it in state.get("items") or []:
        p=it.get("position") or [0,0]; blocked.add((p[0],p[1]))
    # Do not route around the *current* positions of other bots. In practice,
    # those bots often move away this same round, and treating them as hard
    # blockers created oscillations and sideways detours in the opening trace.
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


def _preview(state):
    return next((o for o in state.get("orders") or [] if o.get("status")=="preview"), None)


def _needed_types(order):
    if not order: return []
    n = list(order.get("items_required") or [])
    for d in order.get("items_delivered") or []:
        if d in n: n.remove(d)
    return n


def _rounds_left(state):
    return (state.get("max_rounds") or 300) - (state.get("round") or 0)


def _remaining_needed(needed_types, inventory):
    remaining = list(needed_types)
    for t in inventory or []:
        if t in remaining:
            remaining.remove(t)
    return remaining


def _best_item_for_types(state, bot, types_needed, failed_pickups=None):
    failed_pickups = failed_pickups or {}
    needed_set = set(types_needed)
    if not needed_set:
        return None

    def score(item):
        ix, iy = item["position"]
        nz = _nearest_zone([ix, iy], state)
        return manhattan(bot["position"], [ix, iy]) + 0.2 * manhattan([ix, iy], nz)

    pool = [
        i for i in (state.get("items") or [])
        if i.get("type") in needed_set
        and failed_pickups.get((bot["id"], i.get("id")), 0) < 1
    ]
    if not pool:
        return None
    return min(pool, key=score)


def _best_preview_item_for_delivery(state, bot, types_needed, failed_pickups=None):
    failed_pickups = failed_pickups or {}
    needed_set = set(types_needed)
    if not needed_set:
        return None

    zone = _nearest_zone(bot["position"], state)
    direct_delivery = manhattan(bot["position"], zone)

    def detour_score(item):
        pos = item["position"]
        via_item = manhattan(bot["position"], pos) + manhattan(pos, zone)
        detour = via_item - direct_delivery
        # Prefer the preview item that adds the smallest extra trip on the way
        # back to drop-off, with a slight bias for shorter total travel.
        return (detour, via_item)

    pool = [
        i for i in (state.get("items") or [])
        if i.get("type") in needed_set
        and failed_pickups.get((bot["id"], i.get("id")), 0) < 1
    ]
    if not pool:
        return None
    return min(pool, key=detour_score)


def _team_inventory(bots):
    items = []
    for bot in bots:
        items.extend(bot.get("inventory") or [])
    return items


def _pick_or_move_to_target(bid, x, y, target, state, useful_types=None):
    if not target:
        return None
    tx, ty = int(target["position"][0]), int(target["position"][1])
    target_still_exists = any(it.get("id") == target["id"] for it in (state.get("items") or []))
    useful_types = set(useful_types or [])
    for it in state.get("items") or []:
        ip = it.get("position") or [0, 0]
        if abs(x - ip[0]) + abs(y - ip[1]) != 1:
            continue
        if target_still_exists:
            if it.get("id") == target["id"]:
                return {"bot": bid, "action": "pick_up", "item_id": it["id"]}
        elif it.get("type") == target.get("type") and (not useful_types or it.get("type") in useful_types):
            return {"bot": bid, "action": "pick_up", "item_id": it["id"]}

    if target_still_exists:
        return _move_adj(bid, x, y, tx, ty, state)

    same_type = [i for i in (state.get("items") or []) if i.get("type") == target.get("type")]
    if same_type:
        nn = min(same_type, key=lambda i: manhattan([x, y], i["position"]))
        return _move_adj(bid, x, y, int(nn["position"][0]), int(nn["position"][1]), state)
    return None


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
        remaining = _remaining_needed(remaining, b.get("inventory") or [])

    def score(bot, item):
        ix,iy = item["position"]
        nz = _nearest_zone([ix,iy], state)
        # Spread bots across the map a bit more instead of overloading the same
        # right-side aisles near spawn. This was closer to the best-scoring runs.
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
    target = assignments.get(bid)

    # Spawn dispersal only for bots that have work to do.
    if inv or target:
        d = _dispersal(bid, x, y, state, claimed_cells)
        if d:
            return d

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

    # === FULL → deliver ===
    if len(inv) >= 3:
        nz = _nearest_zone([x,y], state)
        return _move(bid, x, y, nz[0], nz[1], state)

    # === HAS MATCHING ITEMS → deliver ===
    if matching:
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
    if target:
        ix,iy = int(target["position"][0]),int(target["position"][1])
        useful = set(needed)
        target_still_exists = any(it.get("id") == target["id"] for it in (state.get("items") or []))
        # Adjacent: only pick the assigned item, or another item of the same type if the
        # original one disappeared. This avoids bots opportunistically stealing a different
        # useful type and creating duplicate pickups like the butter trace we saw.
        for it in state.get("items") or []:
            ip = it.get("position") or [0, 0]
            if abs(x - ip[0]) + abs(y - ip[1]) != 1:
                continue
            if target_still_exists:
                if it.get("id") == target["id"]:
                    return {"bot": bid, "action": "pick_up", "item_id": it["id"]}
            else:
                if it.get("type") == target["type"] and it.get("type") in useful:
                    return {"bot": bid, "action": "pick_up", "item_id": it["id"]}
        # Navigate to target item
        if target_still_exists:
            return _move_adj(bid, x, y, ix, iy, state)
        # Item respawned (new ID) → find nearest of same type
        same_type = [i for i in (state.get("items") or []) if i["type"] == target["type"]]
        if same_type:
            nn = min(same_type, key=lambda i: manhattan([x,y], i["position"]))
            return _move_adj(bid, x, y, int(nn["position"][0]), int(nn["position"][1]), state)

    # === NO ASSIGNMENT → stay out of active lanes ===
    return {"bot": bid, "action": "wait"}


def decide_small_team(bot, state, assignments, claimed_cells=None, failed_pickups=None) -> dict[str, Any]:
    """
    Conservative strategy for 2-3 bots:
    keep collecting useful active-order items before delivering, and only use
    preview-order pre-picks once the active order is already covered by team inventory.
    """
    failed_pickups = failed_pickups or {}
    x, y = int(bot["position"][0]), int(bot["position"][1])
    bid = bot["id"]
    inv = bot.get("inventory") or []
    target = assignments.get(bid)

    if inv or target:
        d = _dispersal(bid, x, y, state, claimed_cells)
        if d:
            return d

    active_ord = _active(state)
    preview_ord = _preview(state)
    needed = _needed_types(active_ord)
    preview_needed = _needed_types(preview_ord)
    matching = [t for t in inv if t in needed]
    team_inv = _team_inventory(state.get("bots") or [])
    active_remaining = _remaining_needed(needed, team_inv)
    preview_remaining = _remaining_needed(preview_needed, team_inv)
    zones = _all_zones(state)
    nz = _nearest_zone([x, y], state)

    if [x, y] in zones and matching:
        return {"bot": bid, "action": "drop_off"}

    if len(inv) >= 3:
        return _move(bid, x, y, nz[0], nz[1], state)

    active_target = target
    if not active_target and active_remaining:
        active_target = _best_item_for_types(state, bot, active_remaining, failed_pickups)

    preview_target = None
    if preview_remaining and len(inv) < 3:
        preview_target = _best_preview_item_for_delivery(state, bot, preview_remaining, failed_pickups)

    if active_target and (active_target.get("type") in set(active_remaining) or not matching):
        action = _pick_or_move_to_target(bid, x, y, active_target, state, active_remaining)
        if action:
            return action

    if matching:
        if not active_remaining and preview_target:
            px, py = int(preview_target["position"][0]), int(preview_target["position"][1])
            direct_delivery = manhattan([x, y], nz)
            preview_trip = manhattan([x, y], [px, py])
            preview_delivery = manhattan([px, py], nz)
            detour_cost = preview_trip + preview_delivery - direct_delivery
            if detour_cost <= 4 and _rounds_left(state) > preview_delivery + 5:
                action = _pick_or_move_to_target(bid, x, y, preview_target, state, preview_remaining)
                if action:
                    return action
        return _move(bid, x, y, nz[0], nz[1], state)

    if inv:
        return _move(bid, x, y, nz[0], nz[1], state)

    if not active_remaining and preview_target:
        action = _pick_or_move_to_target(bid, x, y, preview_target, state, preview_remaining)
        if action:
            return action

    return {"bot": bid, "action": "wait"}


def decide_level1(bot, state):
    """
    Safe baseline for 1-bot maps:
    collect only active-order items, keep picking until the order is covered or
    inventory is full, then deliver. If the active order is already covered and a
    preview-order item is nearby, opportunistically pre-pick one extra item.
    """
    x, y = int(bot["position"][0]), int(bot["position"][1])
    bid = bot["id"]
    inv = bot.get("inventory") or []
    active_ord = _active(state)
    preview_ord = _preview(state)
    needed = _needed_types(active_ord)
    preview_needed = _needed_types(preview_ord)
    matching = [t for t in inv if t in needed]
    remaining = _remaining_needed(needed, inv)
    preview_remaining = _remaining_needed(preview_needed, inv)
    nz = _nearest_zone([x, y], state)

    if [x, y] in _all_zones(state) and matching:
        return {"bot": bid, "action": "drop_off"}

    if len(inv) >= 3:
        return _move(bid, x, y, nz[0], nz[1], state)

    target = _best_item_for_types(state, bot, remaining)
    preview_target = (
        _best_preview_item_for_delivery(state, bot, preview_remaining)
        if len(inv) < 3 else None
    )
    if matching and (not remaining or target is None):
        if preview_target:
            px, py = int(preview_target["position"][0]), int(preview_target["position"][1])
            direct_delivery = manhattan([x, y], nz)
            preview_trip = manhattan([x, y], [px, py])
            preview_delivery = manhattan([px, py], nz)
            detour_cost = preview_trip + preview_delivery - direct_delivery
            # Only take a detour for preview stock when the active order is already
            # covered and the extra item adds only a small detour to the delivery
            # path. This is more flexible than a raw distance cutoff while keeping
            # the strong baseline stable.
            if detour_cost <= 4 and _rounds_left(state) > preview_delivery + 5:
                for it in state.get("items") or []:
                    ip = it.get("position") or [0, 0]
                    if abs(x - ip[0]) + abs(y - ip[1]) != 1:
                        continue
                    if it.get("id") == preview_target["id"]:
                        return {"bot": bid, "action": "pick_up", "item_id": it["id"]}
                return _move_adj(bid, x, y, px, py, state)
        return _move(bid, x, y, nz[0], nz[1], state)

    if target:
        ix, iy = int(target["position"][0]), int(target["position"][1])
        for it in state.get("items") or []:
            ip = it.get("position") or [0, 0]
            if abs(x - ip[0]) + abs(y - ip[1]) != 1:
                continue
            if it.get("id") == target["id"]:
                return {"bot": bid, "action": "pick_up", "item_id": it["id"]}
        return _move_adj(bid, x, y, ix, iy, state)

    if matching or inv:
        return _move(bid, x, y, nz[0], nz[1], state)

    return {"bot": bid, "action": "wait"}

def decide_level2(bot, state, failed_pickups=None):
    return decide(bot, state, _assign_targets(state, failed_pickups), failed_pickups=failed_pickups)

def decide_level3(bot, state, bot_assignments, bots_at_drop=None,
                  claimed_next_cells=None, failed_pickups=None):
    return decide(bot, state, bot_assignments,
                  claimed_cells=claimed_next_cells, failed_pickups=failed_pickups)