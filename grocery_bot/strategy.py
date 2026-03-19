"""
NMiAI 2026 Grocery Bot — strategy v30 (clean rebuild from first principles).

Core design rules:
  1. LIMIT ACTIVE BOTS — send out exactly len(needed_types) bots.
     Never flood corridors with redundant bots. This is the single
     biggest cause of all past failures (17 bots on y=15 -> permanent jam).
  2. BOT-AWARE BFS — try routing around other bots first; fall back to
     wall-only routing when no bypass exists.
  3. SOLE-AISLE PROTECTION — only one bot per x-column for items with
     a single access cell (e.g. items at x=25 accessed only via x=24 aisle).
  4. NO SPAWN OSCILLATION — block spawn in BFS when bot is not at spawn.
  5. CLEAN STATE MACHINE — matching inv -> deliver; assignment -> fetch;
     non-matching inv -> dump at zone; no assignment -> wait.
"""
from collections import deque
from itertools import permutations as _iperms
from typing import Any


# ---------------------------------------------------------------------------
# Utilities
# ---------------------------------------------------------------------------

def manhattan(a, b) -> int:
    return abs(a[0] - b[0]) + abs(a[1] - b[1])


_DIRS = [
    ("move_up",    0, -1),
    ("move_down",  0,  1),
    ("move_left",  -1, 0),
    ("move_right",  1, 0),
]

# Open horizontal corridors in the Nightmare 30×18 map.
# Bots approaching items via these rows avoid entering single-file
# vertical aisles where head-on deadlocks occur.
_CORRIDOR_Y = frozenset({1, 9, 15, 16})


def _grid(state):
    g = state.get("grid") or {}
    return g.get("width", 30), g.get("height", 18)


def _walls(state):
    return {(w[0], w[1]) for w in (state.get("grid") or {}).get("walls") or []}


def _spawn(state):
    g = state.get("grid") or {}
    return (g.get("width", 30) - 2, g.get("height", 18) - 2)


def _all_zones(state):
    z = state.get("drop_off_zones") or []
    return z if z else [state.get("drop_off") or [0, 0]]


def _nearest_zone(pos, state):
    zones = _all_zones(state)
    return min(zones, key=lambda z: manhattan(pos, z))


def _active(state):
    return next((o for o in state.get("orders") or [] if o.get("status") == "active"), None)


def _preview(state):
    return next((o for o in state.get("orders") or [] if o.get("status") == "preview"), None)


def _needed_types(order):
    """Types still required by order (preserves duplicates like juice x2)."""
    if not order:
        return []
    n = list(order.get("items_required") or [])
    for d in order.get("items_delivered") or []:
        if d in n:
            n.remove(d)
    return n


def _remaining(needed, inventory):
    """Remove already-held types from needed list."""
    r = list(needed)
    for t in inventory or []:
        if t in r:
            r.remove(t)
    return r


def _rounds_left(state):
    return (state.get("max_rounds") or 300) - (state.get("round") or 0)


def _other_bots(bid, state):
    """Positions of all bots except self."""
    return {tuple(b.get("position") or []) for b in (state.get("bots") or []) if b["id"] != bid}


def _items_pos(state):
    return {(int(i["position"][0]), int(i["position"][1])) for i in (state.get("items") or [])}


def _access_cells(item, state):
    """Walkable cells adjacent to item (not a wall, not any item, in-bounds)."""
    walls = _walls(state)
    ipos = _items_pos(state)
    W, H = _grid(state)
    ix, iy = int(item["position"][0]), int(item["position"][1])
    result = set()
    for _, dx, dy in _DIRS:
        nx, ny = ix + dx, iy + dy
        if 0 <= nx < W and 0 <= ny < H and (nx, ny) not in walls and (nx, ny) not in ipos:
            result.add((nx, ny))
    return result


# ---------------------------------------------------------------------------
# BFS navigation
# ---------------------------------------------------------------------------

def _bfs(from_pos, targets: set, blocked: set, W: int, H: int):
    """Return first action that moves toward any target. None if unreachable."""
    x0, y0 = int(from_pos[0]), int(from_pos[1])
    if (x0, y0) in targets:
        return None
    reachable = targets - blocked
    if not reachable:
        return None
    visited = {(x0, y0)}
    fm = {}
    q = deque([(x0, y0)])
    while q:
        cx, cy = q.popleft()
        if (cx, cy) in reachable:
            return fm[(cx, cy)]
        for act, dx, dy in _DIRS:
            nx, ny = cx + dx, cy + dy
            if not (0 <= nx < W and 0 <= ny < H):
                continue
            if (nx, ny) in blocked or (nx, ny) in visited:
                continue
            visited.add((nx, ny))
            fm[(nx, ny)] = act if (cx, cy) == (x0, y0) else fm[(cx, cy)]
            q.append((nx, ny))
    return None



def _base_blocked(x, y, state):
    """Walls plus spawn when bot is not at spawn (prevents oscillation loop)."""
    sp = _spawn(state)
    blocked = _walls(state)
    if (x, y) != sp:
        blocked.add(sp)
    return blocked


def _move_to(bid, x, y, tx, ty, state, claimed=None) -> dict:
    """Navigate to cell (tx, ty). Routes around other bots and claimed cells first."""
    W, H = _grid(state)
    blocked = _base_blocked(x, y, state)
    other = _other_bots(bid, state)
    cl = set(claimed) if claimed else set()
    targets = {(tx, ty)}
    step = _bfs([x, y], targets, blocked | other | cl, W, H)
    if not step:
        step = _bfs([x, y], targets, blocked | cl, W, H)
    if not step:
        step = _bfs([x, y], targets, blocked, W, H)
    if not step:
        step = _bfs([x, y], targets, _walls(state), W, H)
    return {"bot": bid, "action": step or "wait"}


def _move_adj(bid, x, y, ix, iy, state, claimed=None) -> dict:
    """Navigate to any walkable cell adjacent to item at (ix, iy).

    Prefers access cells on open horizontal corridors (y ∈ _CORRIDOR_Y) so
    that bots approach items from corridor rows rather than entering narrow
    single-file vertical aisles.  Head-on deadlocks in those aisles are the
    primary cause of order-completion failure on the Nightmare map.
    """
    W, H = _grid(state)
    adj = {(ix + dx, iy + dy) for _, dx, dy in _DIRS if 0 <= ix + dx < W and 0 <= iy + dy < H}
    blocked = _base_blocked(x, y, state) | _items_pos(state)
    other = _other_bots(bid, state)
    cl = set(claimed) if claimed else set()

    # Preferred: access cells that sit on a horizontal corridor row.
    preferred = {c for c in adj if c[1] in _CORRIDOR_Y and c not in blocked}

    if preferred:
        step = _bfs([x, y], preferred, blocked | other | cl, W, H)
        if not step:
            step = _bfs([x, y], preferred, blocked | cl, W, H)
        if not step:
            step = _bfs([x, y], preferred, blocked, W, H)
        if step:
            return {"bot": bid, "action": step}

    # Fallback: any access cell (including aisle-only items).
    step = _bfs([x, y], adj, blocked | other | cl, W, H)
    if not step:
        step = _bfs([x, y], adj, blocked | cl, W, H)
    if not step:
        step = _bfs([x, y], adj, blocked, W, H)
    if not step:
        step = _bfs([x, y], adj, _walls(state), W, H)
    return {"bot": bid, "action": step or "wait"}


# ---------------------------------------------------------------------------
# Assignment: EXACTLY one bot per needed order type
# ---------------------------------------------------------------------------

def _assign_targets(state: dict, failed_pickups: dict | None = None) -> dict:
    """
    Assign bots to items, one per still-needed order type (duplicates included).

    Critical invariant: never assign MORE bots than len(needed_types).
    Sending extra bots into the store is the root cause of all corridor
    congestion and swap-deadlock failures.

    Sole-access column protection: if an item can only be approached from
    one x-column (e.g. yogurt@[25,13] via x=24 only), that column is
    reserved so no second bot enters the same single-file aisle.
    """
    failed_pickups = failed_pickups or {}
    items = state.get("items") or []
    bots = sorted(state.get("bots") or [], key=lambda b: b["id"])
    active_ord = _active(state)
    if not active_ord:
        return {}

    needed = list(_needed_types(active_ord))
    # Subtract inventory already in team's hands
    for b in bots:
        for t in b.get("inventory") or []:
            if t in needed:
                needed.remove(t)
    if not needed:
        return {}

    sp = tuple(_spawn(state))

    def item_score(bpos, item):
        ipos = item["position"]
        nz = _nearest_zone(ipos, state)
        return manhattan(bpos, ipos) + manhattan(ipos, nz)

    # Sole-access x-column tracking
    claimed_x: set = set()

    def sole_x(item):
        ac = _access_cells(item, state)
        if len(ac) == 1:
            return next(iter(ac))[0]
        return None

    def can_assign(item):
        sx = sole_x(item)
        return sx is None or sx not in claimed_x

    def do_claim(item):
        sx = sole_x(item)
        if sx is not None:
            claimed_x.add(sx)

    assignments: dict = {}
    assigned_ids: set = set()
    types_left = list(needed)  # preserves duplicates

    # Prioritize bots already in the store (they can act faster)
    active_bots = [b for b in bots if tuple(b["position"]) != sp and len(b.get("inventory") or []) < 3]
    spawn_bots  = [b for b in bots if tuple(b["position"]) == sp and len(b.get("inventory") or []) < 3]
    ordered_bots = active_bots + spawn_bots

    for bot in ordered_bots:
        if not types_left:
            break
        bpos = bot["position"]

        # Try: items of needed types that pass access check and pickup check
        pool = [
            i for i in items
            if i["type"] in set(types_left)
            and i["id"] not in assigned_ids
            and failed_pickups.get((bot["id"], i["id"]), 0) < 1
            and can_assign(i)
        ]
        if not pool:
            # Retry without failed_pickups (don't permanently skip a type)
            pool = [
                i for i in items
                if i["type"] in set(types_left)
                and i["id"] not in assigned_ids
                and can_assign(i)
            ]
        if not pool:
            # Last resort: ignore sole-access protection for this slot
            pool = [
                i for i in items
                if i["type"] in set(types_left)
                and i["id"] not in assigned_ids
                and failed_pickups.get((bot["id"], i["id"]), 0) < 1
            ]
        if not pool:
            continue

        best = min(pool, key=lambda i: item_score(bpos, i))
        assignments[bot["id"]] = best
        assigned_ids.add(best["id"])
        do_claim(best)
        types_left.remove(best["type"])

    return assignments


def _assign_targets_small_team(state: dict, failed_pickups: dict | None = None) -> dict:
    """Same algorithm works for 2-3 bot teams."""
    return _assign_targets(state, failed_pickups)


# ---------------------------------------------------------------------------
# Per-bot decision logic
# ---------------------------------------------------------------------------

def decide(bot, state, assignments, claimed_cells=None, failed_pickups=None) -> dict[str, Any]:
    failed_pickups = failed_pickups or {}
    x, y = int(bot["position"][0]), int(bot["position"][1])
    bid = bot["id"]
    inv = bot.get("inventory") or []
    sp = tuple(_spawn(state))
    target = assignments.get(bid)

    all_zones = _all_zones(state)
    active_ord = _active(state)
    needed = _needed_types(active_ord)
    needed_set = set(needed)
    matching = [t for t in inv if t in needed_set]

    # ===== AT SPAWN =====
    # Only exit if there is real work: inventory to deliver OR assigned item.
    if (x, y) == sp:
        if not inv and not target:
            return {"bot": bid, "action": "wait"}
        # Has work: fall through to normal logic; BFS handles exit routing.

    # ===== AT DROP ZONE =====
    if [x, y] in all_zones:
        if inv:
            # Drop off; server ignores non-matching items automatically.
            return {"bot": bid, "action": "drop_off"}
        # Empty at zone: fetch assigned target or nearest needed item
        if target:
            ix, iy = int(target["position"][0]), int(target["position"][1])
            return _move_adj(bid, x, y, ix, iy, state, claimed_cells)
        if needed:
            pool = [i for i in (state.get("items") or []) if i["type"] in needed_set]
            if pool:
                nn = min(pool, key=lambda i: manhattan([x, y], i["position"]))
                return _move_adj(bid, x, y, int(nn["position"][0]), int(nn["position"][1]), state, claimed_cells)
        return {"bot": bid, "action": "wait"}

    # ===== INVENTORY FULL -> DELIVER =====
    if len(inv) >= 3:
        nz = _nearest_zone([x, y], state)
        return _move_to(bid, x, y, nz[0], nz[1], state, claimed_cells)

    # ===== HAS MATCHING ITEMS -> DELIVER =====
    if matching:
        nz = _nearest_zone([x, y], state)
        return _move_to(bid, x, y, nz[0], nz[1], state, claimed_cells)

    # ===== HAS NON-MATCHING ITEMS -> DUMP AT ZONE =====
    # Clear aisles: don't wander with useless cargo.
    if inv:
        nz = _nearest_zone([x, y], state)
        return _move_to(bid, x, y, nz[0], nz[1], state, claimed_cells)

    # ===== EMPTY WITH ASSIGNMENT -> FETCH ITEM =====
    if target:
        ix, iy = int(target["position"][0]), int(target["position"][1])
        target_exists = any(it["id"] == target["id"] for it in (state.get("items") or []))
        # Pick up if adjacent
        for it in state.get("items") or []:
            ip = it.get("position") or [0, 0]
            if abs(x - ip[0]) + abs(y - ip[1]) != 1:
                continue
            if target_exists and it["id"] == target["id"]:
                return {"bot": bid, "action": "pick_up", "item_id": it["id"]}
            if not target_exists and it["type"] == target["type"]:
                return {"bot": bid, "action": "pick_up", "item_id": it["id"]}
        # Navigate toward item
        if target_exists:
            return _move_adj(bid, x, y, ix, iy, state, claimed_cells)
        # Item gone: find nearest of same type
        alts = [i for i in (state.get("items") or []) if i["type"] == target["type"]]
        if alts:
            nn = min(alts, key=lambda i: manhattan([x, y], i["position"]))
            return _move_adj(bid, x, y, int(nn["position"][0]), int(nn["position"][1]), state, claimed_cells)
        return {"bot": bid, "action": "wait"}

    # ===== EMPTY, NO ASSIGNMENT =====
    # Bot is already in the store: opportunistically pick nearest needed item.
    # Bot is at spawn: wait (no assignment means no work to do).
    if (x, y) != sp and needed:
        pool = [i for i in (state.get("items") or []) if i["type"] in needed_set]
        if pool:
            nn = min(pool, key=lambda i: manhattan([x, y], i["position"]))
            ix, iy = int(nn["position"][0]), int(nn["position"][1])
            for it in state.get("items") or []:
                ip = it.get("position") or [0, 0]
                if abs(x - ip[0]) + abs(y - ip[1]) == 1 and it["id"] == nn["id"]:
                    return {"bot": bid, "action": "pick_up", "item_id": it["id"]}
            return _move_adj(bid, x, y, ix, iy, state, claimed_cells)

    # Preview pre-pick: one item on the way if very close (in-store bots only)
    preview_ord = _preview(state)
    if (x, y) != sp and preview_ord and len(inv) < 2 and _rounds_left(state) > 15:
        pneeded = _needed_types(preview_ord)
        premaining = _remaining(pneeded, inv)
        if premaining:
            pool = [i for i in (state.get("items") or []) if i["type"] in set(premaining)]
            if pool:
                nn = min(pool, key=lambda i: manhattan([x, y], i["position"]))
                ix, iy = int(nn["position"][0]), int(nn["position"][1])
                for it in state.get("items") or []:
                    ip = it.get("position") or [0, 0]
                    if abs(x - ip[0]) + abs(y - ip[1]) == 1 and it["id"] == nn["id"]:
                        return {"bot": bid, "action": "pick_up", "item_id": it["id"]}
                return _move_adj(bid, x, y, ix, iy, state, claimed_cells)

    return {"bot": bid, "action": "wait"}


def decide_small_team(bot, state, assignments, claimed_cells=None, failed_pickups=None) -> dict[str, Any]:
    """2-3 bot teams use the same logic."""
    return decide(bot, state, assignments, claimed_cells, failed_pickups)


# ---------------------------------------------------------------------------
# Single-bot strategy (Level 1 / Easy)
# ---------------------------------------------------------------------------

def _tsp_best_first(pos, needed_types, state):
    """Pick first item minimising full round-trip: pos->item1->item2->...->drop_off."""
    items = state.get("items") or []
    drop_off = _nearest_zone(pos, state)
    used: set = set()
    plan = []
    for t in needed_types[:3]:
        pool = [i for i in items if i["type"] == t and i.get("id") not in used]
        if not pool:
            continue
        best = min(pool, key=lambda i: manhattan(pos, i["position"]))
        plan.append(best)
        used.add(best.get("id"))
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


def decide_level1(bot, state) -> dict[str, Any]:
    """Single-bot strategy: TSP routing + opportunistic preview pre-pick."""
    x, y = int(bot["position"][0]), int(bot["position"][1])
    bid = bot["id"]
    inv = bot.get("inventory") or []
    active_ord = _active(state)
    preview_ord = _preview(state)
    needed = _needed_types(active_ord)
    preview_needed = _needed_types(preview_ord)
    matching = [t for t in inv if t in set(needed)]
    remaining = _remaining(needed, inv)
    preview_remaining = _remaining(preview_needed, inv)
    nz = _nearest_zone([x, y], state)

    if [x, y] in _all_zones(state) and matching:
        return {"bot": bid, "action": "drop_off"}

    if len(inv) >= 3:
        return _move_to(bid, x, y, nz[0], nz[1], state)

    if len(remaining) >= 2:
        target = _tsp_best_first([x, y], remaining, state)
    else:
        pool = [i for i in (state.get("items") or []) if i["type"] in set(remaining)]
        target = min(pool, key=lambda i: manhattan([x, y], i["position"])) if pool else None

    # Preview detour: pick one preview item if it barely adds to the trip
    preview_target = None
    if len(inv) < 3 and preview_remaining:
        ppool = [i for i in (state.get("items") or []) if i["type"] in set(preview_remaining)]
        if ppool:
            preview_target = min(
                ppool,
                key=lambda i: (
                    manhattan([x, y], i["position"]) + manhattan(i["position"], nz)
                    - manhattan([x, y], nz)
                ),
            )

    if matching and (not remaining or target is None):
        if preview_target and _rounds_left(state) > 10:
            px, py = int(preview_target["position"][0]), int(preview_target["position"][1])
            direct = manhattan([x, y], nz)
            detour = manhattan([x, y], [px, py]) + manhattan([px, py], nz) - direct
            if detour <= 4:
                for it in state.get("items") or []:
                    ip = it.get("position") or [0, 0]
                    if abs(x - ip[0]) + abs(y - ip[1]) == 1 and it["id"] == preview_target["id"]:
                        return {"bot": bid, "action": "pick_up", "item_id": it["id"]}
                return _move_adj(bid, x, y, px, py, state)
        return _move_to(bid, x, y, nz[0], nz[1], state)

    if target:
        ix, iy = int(target["position"][0]), int(target["position"][1])
        for it in state.get("items") or []:
            ip = it.get("position") or [0, 0]
            if abs(x - ip[0]) + abs(y - ip[1]) == 1 and it["id"] == target["id"]:
                return {"bot": bid, "action": "pick_up", "item_id": it["id"]}
        return _move_adj(bid, x, y, ix, iy, state)

    if matching or inv:
        return _move_to(bid, x, y, nz[0], nz[1], state)

    return {"bot": bid, "action": "wait"}


# ---------------------------------------------------------------------------
# Legacy entry points (kept for bot.py compatibility)
# ---------------------------------------------------------------------------

def decide_level2(bot, state, failed_pickups=None):
    return decide(bot, state, _assign_targets(state, failed_pickups), failed_pickups=failed_pickups)


def decide_level3(bot, state, bot_assignments, bots_at_drop=None,
                  claimed_next_cells=None, failed_pickups=None):
    return decide(bot, state, bot_assignments,
                  claimed_cells=claimed_next_cells, failed_pickups=failed_pickups)
