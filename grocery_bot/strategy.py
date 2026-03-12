"""
NMiAI 2026 Grocery Bot — strategy v26.

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
from collections import Counter, deque
from itertools import permutations as _iperms
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
        # Fallback: drop item blocks but keep spawn blocked (avoids oscillation)
        step = _bfs_step([x,y], {(tx,ty)}, _blocked_base(x, y, state), W, H)
    if not step:
        # Last resort: allow routing through spawn only if truly no other path
        step = _bfs_step([x,y], {(tx,ty)}, _walls(state), W, H)
    return {"bot": bid, "action": step or "wait"}


def _move_with_claims(bid, x, y, tx, ty, state, claimed_cells=None) -> dict:
    W, H = _grid(state)
    claimed_set = {tuple(c) for c in claimed_cells if tuple(c) != (x, y)} if claimed_cells else set()
    blocked = _blocked_base(x, y, state) | claimed_set
    step = _bfs_step([x, y], {(tx, ty)}, blocked, W, H)
    if not step:
        # Drop claimed, keep spawn blocked
        step = _bfs_step([x, y], {(tx, ty)}, _blocked_base(x, y, state), W, H)
    if not step:
        # Last resort: allow through spawn
        step = _bfs_step([x, y], {(tx, ty)}, _walls(state) | claimed_set, W, H)
    if not step:
        step = _bfs_step([x, y], {(tx, ty)}, _walls(state), W, H)
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
        # Drop item blocks, keep spawn blocked
        step = _bfs_step([x,y], adj, _blocked_base(x, y, state), W, H)
    if not step:
        # Last resort: allow through spawn
        step = _bfs_step([x,y], adj, _walls(state), W, H)
    return {"bot": bid, "action": step or "wait"}


def _move_adj_with_claims(bid, x, y, ix, iy, state, claimed_cells=None) -> dict:
    W, H = _grid(state)
    adj = {(ix + dx, iy + dy) for _, dx, dy in _DIRS if 0 <= ix + dx < W and 0 <= iy + dy < H}
    blocked = _blocked_base(x, y, state)
    for it in state.get("items") or []:
        p = it.get("position") or [0, 0]
        blocked.add((p[0], p[1]))
    if claimed_cells:
        blocked |= {tuple(c) for c in claimed_cells if tuple(c) != (x, y)}
    step = _bfs_step([x, y], adj, blocked, W, H)
    if not step:
        # Drop items block, keep spawn blocked + claimed
        fallback = _blocked_base(x, y, state)
        if claimed_cells:
            fallback |= {tuple(c) for c in claimed_cells if tuple(c) != (x, y)}
        step = _bfs_step([x, y], adj, fallback, W, H)
    if not step:
        # Drop claimed too, keep spawn blocked
        step = _bfs_step([x, y], adj, _blocked_base(x, y, state), W, H)
    if not step:
        # Last resort: allow through spawn
        step = _bfs_step([x, y], adj, _walls(state), W, H)
    return {"bot": bid, "action": step or "wait"}


def _dispersal(bid, x, y, state, claimed=None):
    """Exit spawn cluster. Prefer exits with more onward options to avoid dead-ends."""
    sp = _spawn(state)
    if (x, y) != sp:
        return None
    if sum(1 for b in (state.get("bots") or []) if b.get("position") == list(sp)) < 2:
        return None
    W, H = _grid(state)
    walls = _walls(state)
    claimed_set = set(claimed) if claimed else set()

    def exit_options(nx, ny):
        """Count viable onward neighbors (non-wall, non-spawn, in-bounds, not back to source)."""
        count = 0
        for _, ddx, ddy in _DIRS:
            nnx, nny = nx + ddx, ny + ddy
            if not (0 <= nnx < W and 0 <= nny < H):
                continue
            if (nnx, nny) in walls or (nnx, nny) == sp or (nnx, nny) == (x, y):
                continue
            count += 1
        return count

    # Build candidates: (score, is_claimed, act)
    candidates = []
    for act, dx, dy in _DIRS:
        nx, ny = x + dx, y + dy
        if not (0 <= nx < W and 0 <= ny < H) or (nx, ny) in walls:
            continue
        score = exit_options(nx, ny)
        is_claimed = (nx, ny) in claimed_set
        candidates.append((score, is_claimed, act))

    if not candidates:
        return None

    # Prefer exits with more onward options; break ties by unclaimed first.
    # NOTE: score wins over claim status — prevents sending bots to dead-ends
    # (score=1) just because the main corridor (score=3) happens to be claimed.
    candidates.sort(key=lambda c: (-c[0], c[1]))
    return {"bot": bid, "action": candidates[0][2]}


def _all_zones(state):
    z = state.get("drop_off_zones") or []
    return z if z else [state.get("drop_off") or [0,0]]


def _nearest_zone(pos, state, avoid_congestion=False):
    zones = _all_zones(state)
    sp = _spawn(state)
    # Penalize zones adjacent to spawn only when routing for delivery and spawn is congested.
    # Do NOT apply this penalty during assignment scoring — it distorts which items bots target.
    if avoid_congestion:
        bots_at_spawn = sum(
            1 for b in (state.get("bots") or [])
            if tuple(b.get("position") or []) == sp
        )
        spawn_penalty = min(bots_at_spawn * 2, 20)
    else:
        spawn_penalty = 0

    def zone_cost(z):
        d = manhattan(pos, z)
        if spawn_penalty > 0 and manhattan(tuple(z), sp) <= 2:
            d += spawn_penalty
        return d

    return min(zones, key=zone_cost)


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


def _pick_or_move_to_target(
    bid,
    x,
    y,
    target,
    state,
    useful_types=None,
    claimed_cells=None,
):
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
        return _move_adj_with_claims(bid, x, y, tx, ty, state, claimed_cells)

    same_type = [i for i in (state.get("items") or []) if i.get("type") == target.get("type")]
    if same_type:
        nn = min(same_type, key=lambda i: manhattan([x, y], i["position"]))
        return _move_adj_with_claims(
            bid,
            x,
            y,
            int(nn["position"][0]),
            int(nn["position"][1]),
            state,
            claimed_cells,
        )
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

    # Second pass: assign ALL remaining bots to needed items (critical for large teams).
    # The first pass covers only 1 bot per needed type; for Nightmare with 20 bots and a
    # 7-item order, 13 bots would sit idle without this.  Extra bots collecting the same
    # type pre-stock inventory for subsequent orders as they cycle.
    remaining_types = set(needed_types)
    for bot in bots:
        if bot["id"] in assignments or len(bot.get("inventory") or []) >= 3:
            continue
        pool = [
            i for i in items
            if i["type"] in remaining_types
            and i["id"] not in assigned_ids
            and failed_pickups.get((bot["id"], i["id"]), 0) < 1
        ]
        if not pool:
            continue
        best = min(pool, key=lambda i: score(bot, i))
        assignments[bot["id"]] = best
        assigned_ids.add(best["id"])

    return assignments


def _assign_targets_small_team(state: dict, failed_pickups: dict | None = None) -> dict:
    """
    For 2-3 bots, prioritize one bot per distinct needed type before assigning
    duplicate types. This avoids overcommitting two bots to the same shelf type
    while another required type is still uncovered.
    """
    failed_pickups = failed_pickups or {}
    items = state.get("items") or []
    bots = [b for b in sorted(state.get("bots") or [], key=lambda b: b["id"]) if len(b.get("inventory") or []) < 3]
    active_ord = _active(state)
    if not active_ord or not bots:
        return {}

    remaining = list(_needed_types(active_ord))
    for bot in bots:
        remaining = _remaining_needed(remaining, bot.get("inventory") or [])
    if not remaining:
        return {}

    remaining_counts = Counter(remaining)
    assignments: dict[int, dict] = {}
    assigned_item_ids: set[str] = set()
    assigned_type_counts: Counter = Counter()

    def available_items(item_type: str):
        return [
            it for it in items
            if it.get("type") == item_type
            and it.get("id") not in assigned_item_ids
        ]

    def pick_best(bot, pool):
        # Minimize total trip: bot→item + item→drop_off (not just bot→item)
        zone = _nearest_zone(bot["position"], state)
        return min(pool, key=lambda it: manhattan(bot["position"], it["position"]) + manhattan(it["position"], zone))

    # First pass: cover as many distinct needed types as possible.
    distinct_types = list(dict.fromkeys(remaining))
    for item_type in distinct_types:
        best_pair = None
        for bot in bots:
            if bot["id"] in assignments:
                continue
            pool = [
                it for it in available_items(item_type)
                if failed_pickups.get((bot["id"], it["id"]), 0) < 1
            ]
            if not pool:
                continue
            item = pick_best(bot, pool)
            score = manhattan(bot["position"], item["position"])
            if best_pair is None or score < best_pair[0]:
                best_pair = (score, bot, item)
        if best_pair is None:
            continue
        _, bot, item = best_pair
        assignments[bot["id"]] = item
        assigned_item_ids.add(item["id"])
        assigned_type_counts[item_type] += 1

    # Second pass: fill remaining duplicate slots if there are spare bots.
    for bot in bots:
        if bot["id"] in assignments:
            continue
        best_pair = None
        for item_type, count in remaining_counts.items():
            if assigned_type_counts[item_type] >= count:
                continue
            pool = [
                it for it in available_items(item_type)
                if failed_pickups.get((bot["id"], it["id"]), 0) < 1
            ]
            if not pool:
                continue
            item = pick_best(bot, pool)
            score = manhattan(bot["position"], item["position"])
            if best_pair is None or score < best_pair[0]:
                best_pair = (score, item_type, item)
        if best_pair is None:
            continue
        _, item_type, item = best_pair
        assignments[bot["id"]] = item
        assigned_item_ids.add(item["id"])
        assigned_type_counts[item_type] += 1

    return assignments


def decide(bot, state, assignments, claimed_cells=None, failed_pickups=None) -> dict[str, Any]:
    failed_pickups = failed_pickups or {}
    x,y = int(bot["position"][0]),int(bot["position"][1])
    bid = bot["id"]
    inv = bot.get("inventory") or []
    target = assignments.get(bid)

    # Always try dispersal at spawn — even unassigned bots must leave spawn.
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
        # Non-matching or empty: go pick active-order items if room in inventory.
        # Previously this waited forever when carrying preview items — now we keep working.
        if len(inv) < 3:
            active_items = [i for i in (state.get("items") or []) if i["type"] in set(needed)]
            if active_items:
                nn = min(active_items, key=lambda i: manhattan([x,y], i["position"]))
                return _move_adj(bid, x, y, int(nn["position"][0]), int(nn["position"][1]), state)
        return {"bot": bid, "action": "wait"}

    # === FULL → deliver ===
    if len(inv) >= 3:
        nz = _nearest_zone([x,y], state)
        return _move(bid, x, y, nz[0], nz[1], state)

    # === HAS MATCHING ITEMS → fill inventory then deliver ===
    if matching:
        nz = _nearest_zone([x,y], state)
        nz_dist = manhattan([x,y], nz)
        # If room in inventory and time allows, check for nearby needed items to pick
        # on the way back — avoids a full extra round-trip per item.
        if len(inv) < 3 and _rounds_left(state) > nz_dist + 5:
            team_inv_all = []
            for b in (state.get("bots") or []):
                team_inv_all.extend(b.get("inventory") or [])
            active_remaining_team = _remaining_needed(needed, team_inv_all)
            if active_remaining_team:
                assigned_ids_set = {v.get("id") for v in assignments.values()}
                extra_items = [
                    i for i in (state.get("items") or [])
                    if i["type"] in set(active_remaining_team)
                    and i.get("id") not in assigned_ids_set
                ]
                close = [
                    i for i in extra_items
                    if manhattan([x,y], i["position"]) + manhattan(i["position"], nz) - nz_dist <= 4
                ]
                if close:
                    best = min(close, key=lambda i: manhattan([x,y], i["position"]) + manhattan(i["position"], nz) - nz_dist)
                    bx, by = int(best["position"][0]), int(best["position"][1])
                    for it in state.get("items") or []:
                        ip = it.get("position") or [0, 0]
                        if abs(x-ip[0])+abs(y-ip[1]) == 1 and it.get("id") == best["id"]:
                            return {"bot": bid, "action": "pick_up", "item_id": it["id"]}
                    return _move_adj(bid, x, y, bx, by, state)
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

    # === NO ASSIGNMENT → help active order first, then pre-pick 1 preview item ===
    # Unassigned bots (common on large maps) must not sit idle while order is open.
    if len(inv) < 3 and needed:
        active_items = [i for i in (state.get("items") or []) if i["type"] in set(needed)]
        if active_items:
            nn = min(active_items, key=lambda i: manhattan([x, y], i["position"]))
            ix, iy = int(nn["position"][0]), int(nn["position"][1])
            for it in state.get("items") or []:
                ip = it.get("position") or [0, 0]
                if abs(x - ip[0]) + abs(y - ip[1]) == 1 and it.get("id") == nn["id"]:
                    return {"bot": bid, "action": "pick_up", "item_id": it["id"]}
            return _move_adj_with_claims(bid, x, y, ix, iy, state, claimed_cells)

    # Pre-pick at most 1 preview item — filling with 3 preview items causes a
    # deadlock (bot arrives at drop zone, nothing matches, can never unload).
    preview_ord = _preview(state)
    if preview_ord and len(inv) < 2 and _rounds_left(state) > 10:
        preview_needed = _needed_types(preview_ord)
        preview_remaining = _remaining_needed(preview_needed, inv)
        if preview_remaining:
            pt = _best_item_for_types(state, bot, preview_remaining)
            if pt:
                px, py = int(pt["position"][0]), int(pt["position"][1])
                for it in state.get("items") or []:
                    ip = it.get("position") or [0, 0]
                    if abs(x-ip[0])+abs(y-ip[1]) == 1 and it.get("id") == pt["id"]:
                        return {"bot": bid, "action": "pick_up", "item_id": it["id"]}
                return _move_adj(bid, x, y, px, py, state)
    return {"bot": bid, "action": "wait"}


def decide_small_team(bot, state, assignments, claimed_cells=None, failed_pickups=None) -> dict[str, Any]:
    """
    Simple 2-3 bot strategy: all bots collect active-order items and deliver
    when inventory reaches 2+ or the team has covered all remaining needs.
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
    needed = _needed_types(active_ord)
    matching = [t for t in inv if t in needed]
    team_inv = _team_inventory(state.get("bots") or [])
    active_remaining = _remaining_needed(needed, team_inv)
    zones = _all_zones(state)
    nz = _nearest_zone([x, y], state)

    # Types that other empty bots are already en-route to fetch — avoid duplicate effort.
    other_pending_types: list[str] = []
    for _b in (state.get("bots") or []):
        if _b["id"] == bid or _b.get("inventory"):
            continue
        _ot = assignments.get(_b["id"])
        if _ot and _ot.get("type"):
            other_pending_types.append(_ot["type"])
    effective_remaining = _remaining_needed(active_remaining, other_pending_types)

    if [x, y] in zones:
        if matching:
            return {"bot": bid, "action": "drop_off"}
        # Leave zone only if there are uncovered items for this bot to fetch.
        if len(inv) < 3 and effective_remaining:
            active_items = [i for i in (state.get("items") or []) if i["type"] in set(effective_remaining)]
            if active_items:
                nn = min(active_items, key=lambda i: manhattan([x, y], i["position"]))
                return _move_with_claims(bid, x, y, int(nn["position"][0]), int(nn["position"][1]), state, claimed_cells)
        # effective_remaining empty → fall through to preview logic below

    if len(inv) >= 3:
        return _move_with_claims(bid, x, y, nz[0], nz[1], state, claimed_cells)

    # Deliver once this bot's contribution is covered by others (in-hand or assigned).
    if matching and not effective_remaining:
        return _move_with_claims(bid, x, y, nz[0], nz[1], state, claimed_cells)

    active_target = target
    if active_target and active_target.get("type") not in set(effective_remaining):
        active_target = None
    if not active_target and effective_remaining:
        active_target = _best_item_for_types(state, bot, effective_remaining, failed_pickups)

    if active_target and (active_target.get("type") in set(effective_remaining) or not matching):
        action = _pick_or_move_to_target(
            bid, x, y, active_target, state, effective_remaining, claimed_cells
        )
        if action:
            return action

    if matching:
        return _move_with_claims(bid, x, y, nz[0], nz[1], state, claimed_cells)

    # Only move toward zone if not already there — avoids BFS returning wait in place.
    if inv and [x, y] not in zones:
        return _move_with_claims(bid, x, y, nz[0], nz[1], state, claimed_cells)

    # Pre-pick at most 1 preview item (keep ≥1 slot free to avoid deadlock).
    preview_ord = _preview(state)
    if preview_ord and len(inv) < 2 and _rounds_left(state) > 10:
        preview_needed = _needed_types(preview_ord)
        preview_remaining = _remaining_needed(preview_needed, inv)
        if preview_remaining:
            pt = _best_item_for_types(state, bot, preview_remaining)
            if pt:
                px, py = int(pt["position"][0]), int(pt["position"][1])
                for it in state.get("items") or []:
                    ip = it.get("position") or [0, 0]
                    if abs(x-ip[0])+abs(y-ip[1]) == 1 and it.get("id") == pt["id"]:
                        return {"bot": bid, "action": "pick_up", "item_id": it["id"]}
                return _move_adj(bid, x, y, px, py, state)
    return {"bot": bid, "action": "wait"}


def _tsp_best_first(pos, needed_types, state):
    """
    Returns the first item to pick that minimizes total round-trip cost:
      pos → item1 → item2 → ... → drop_off  (Manhattan distances, exhaustive).
    Pre-selects the nearest candidate item per needed type, then evaluates all
    orderings (N! ≤ 6 for 3 items, ≤ 24 for 4 items — trivially fast).
    Falls back to nearest-first greedy when no items are available.
    """
    items = state.get("items") or []
    drop_off = _nearest_zone(pos, state)
    # One candidate per slot (handles duplicates like yogurt×2)
    used_ids: set = set()
    plan: list = []
    for t in needed_types[:3]:  # cap at inventory limit
        pool = [i for i in items if i["type"] == t and i.get("id") not in used_ids]
        if not pool:
            continue
        best = min(pool, key=lambda i: manhattan(pos, i["position"]))
        plan.append(best)
        used_ids.add(best.get("id"))
    if not plan:
        return None
    if len(plan) == 1:
        return plan[0]
    best_first = plan[0]
    best_cost = float("inf")
    for perm in _iperms(plan):
        cost = manhattan(pos, perm[0]["position"])
        for k in range(len(perm) - 1):
            cost += manhattan(perm[k]["position"], perm[k + 1]["position"])
        cost += manhattan(perm[-1]["position"], drop_off)
        if cost < best_cost:
            best_cost = cost
            best_first = perm[0]
    return best_first


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

    # TSP route planning: when ≥2 items needed, pick the order that minimises
    # total trip distance rather than greedily picking the nearest item.
    if len(remaining) >= 2:
        target = _tsp_best_first([x, y], remaining, state)
    else:
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