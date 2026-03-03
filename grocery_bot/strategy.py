"""
NMiAI 2026 Grocery Bot — decision logic.
Unified strategy for 1-10 bots. BFS pathfinding around walls/bots.

Key design:
 - Items sit on floor cells and do NOT block movement.
 - pick_up works at Manhattan distance <= 1.
 - Fill inventory before delivering; deliver when all needed items in transit.
 - Smart assignment accounts for items already in transit.
 - Idle bots pre-pick preview items or scatter toward center to clear spawn.
"""
from collections import deque
from typing import Any


def manhattan(a: list, b: list) -> int:
    return abs(a[0] - b[0]) + abs(a[1] - b[1])


# ---------------------------------------------------------------------------
# Pathfinding
# ---------------------------------------------------------------------------

def _get_blocked(
    state: dict,
    exclude_bot_id: int | None = None,
    bot_pos: tuple[int, int] | None = None,
    claimed_next_cells: set[tuple[int, int]] | None = None,
) -> set[tuple[int, int]]:
    """Walls + other bots + claimed cells.
    Items do NOT block movement.
    bot_pos: skip other bots at the same position (spawn cohabitation).
    """
    blocked: set[tuple[int, int]] = set()
    for w in (state.get("grid") or {}).get("walls") or []:
        blocked.add((w[0], w[1]))
    for b in state.get("bots") or []:
        if exclude_bot_id is not None and b.get("id") == exclude_bot_id:
            continue
        p = b.get("position") or [0, 0]
        pos_t = (p[0], p[1])
        if bot_pos is not None and pos_t == bot_pos:
            continue
        blocked.add(pos_t)
    if claimed_next_cells:
        blocked |= claimed_next_cells
    return blocked


def _bfs_distance_to_any(
    state: dict,
    from_pos: list | tuple,
    target_cells: set[tuple[int, int]],
    exclude_bot_id: int | None = None,
) -> int:
    """BFS path length from from_pos to nearest target cell; 999_999 if unreachable."""
    x0, y0 = from_pos[0], from_pos[1]
    if (x0, y0) in target_cells:
        return 0
    grid = state.get("grid") or {}
    w, h = grid.get("width", 32), grid.get("height", 24)
    blocked = _get_blocked(state, exclude_bot_id=exclude_bot_id)
    reachable = target_cells - blocked
    if not reachable:
        return 999_999
    visited = {(x0, y0)}
    dist: dict[tuple[int, int], int] = {(x0, y0): 0}
    q: deque[tuple[int, int]] = deque([(x0, y0)])
    while q:
        cx, cy = q.popleft()
        d = dist[(cx, cy)]
        if (cx, cy) in reachable:
            return d
        for dx, dy in [(0, -1), (0, 1), (-1, 0), (1, 0)]:
            nx, ny = cx + dx, cy + dy
            if not (0 <= nx < w and 0 <= ny < h):
                continue
            if (nx, ny) in blocked or (nx, ny) in visited:
                continue
            visited.add((nx, ny))
            dist[(nx, ny)] = d + 1
            q.append((nx, ny))
    return 999_999


def _bfs_next_step_to_any(
    state: dict,
    from_pos: list | tuple,
    target_cells: set[tuple[int, int]],
    exclude_bot_id: int | None = None,
    bot_pos: tuple[int, int] | None = None,
    claimed_next_cells: set[tuple[int, int]] | None = None,
) -> str | None:
    """First BFS step toward any reachable target cell."""
    x0, y0 = from_pos[0], from_pos[1]
    if (x0, y0) in target_cells:
        return None
    grid = state.get("grid") or {}
    w = grid.get("width", 32)
    h = grid.get("height", 24)
    blocked = _get_blocked(state, exclude_bot_id=exclude_bot_id,
                           bot_pos=bot_pos,
                           claimed_next_cells=claimed_next_cells)
    reachable = target_cells - blocked
    if not reachable:
        return None
    visited = {(x0, y0)}
    first_move: dict[tuple[int, int], str] = {}
    q: deque[tuple[int, int]] = deque([(x0, y0)])
    while q:
        cx, cy = q.popleft()
        if (cx, cy) in reachable:
            return first_move[(cx, cy)]
        for dx, dy, action in [(0, -1, "move_up"), (0, 1, "move_down"),
                                (-1, 0, "move_left"), (1, 0, "move_right")]:
            nx, ny = cx + dx, cy + dy
            if not (0 <= nx < w and 0 <= ny < h):
                continue
            if (nx, ny) in blocked or (nx, ny) in visited:
                continue
            visited.add((nx, ny))
            first_move[(nx, ny)] = action if (cx, cy) == (x0, y0) else first_move[(cx, cy)]
            q.append((nx, ny))
    return None


def _move_toward(bot_id: int, x: int, y: int, target: list) -> dict[str, Any]:
    """Simple Manhattan step (fallback when BFS finds no path)."""
    tx, ty = target[0], target[1]
    if abs(tx - x) > abs(ty - y):
        return {"bot": bot_id, "action": "move_right" if tx > x else "move_left"}
    elif ty != y:
        return {"bot": bot_id, "action": "move_down" if ty > y else "move_up"}
    return {"bot": bot_id, "action": "wait"}


def _step_toward(bot_id: int, x: int, y: int, target: list,
                 state: dict, exclude_bot_id: int | None = None,
                 claimed: set[tuple[int, int]] | None = None) -> dict[str, Any]:
    """BFS one step toward target cell; fallback to Manhattan."""
    step = _bfs_next_step_to_any(
        state, [x, y], {(target[0], target[1])},
        exclude_bot_id=exclude_bot_id,
        bot_pos=(x, y),
        claimed_next_cells=claimed,
    )
    if step:
        return {"bot": bot_id, "action": step}
    return _move_toward(bot_id, x, y, target)


def _step_toward_item(bot_id: int, x: int, y: int, item_pos: list | tuple,
                      state: dict, exclude_bot_id: int | None = None,
                      claimed: set[tuple[int, int]] | None = None) -> dict[str, Any]:
    """BFS one step toward a walkable cell adjacent to the item (for pick_up)."""
    grid = state.get("grid") or {}
    w, h = grid.get("width", 32), grid.get("height", 24)
    px, py = item_pos[0], item_pos[1]
    targets: set[tuple[int, int]] = set()
    for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
        nx, ny = px + dx, py + dy
        if 0 <= nx < w and 0 <= ny < h:
            targets.add((nx, ny))
    step = _bfs_next_step_to_any(
        state, [x, y], targets,
        exclude_bot_id=exclude_bot_id,
        bot_pos=(x, y),
        claimed_next_cells=claimed,
    )
    if step:
        return {"bot": bot_id, "action": step}
    return _move_toward(bot_id, x, y, list(item_pos))


# ---------------------------------------------------------------------------
# Order helpers
# ---------------------------------------------------------------------------

def _active_order(state: dict) -> dict | None:
    return next((o for o in state.get("orders") or [] if o.get("status") == "active"), None)


def _preview_order(state: dict) -> dict | None:
    return next((o for o in state.get("orders") or [] if o.get("status") == "preview"), None)


def _needed_types(order: dict | None) -> list[str]:
    """Item types still needed: required minus delivered."""
    if not order:
        return []
    needed = list(order.get("items_required") or [])
    for d in order.get("items_delivered") or []:
        if d in needed:
            needed.remove(d)
    return needed


def _remaining_to_pick(state: dict, needed: list[str]) -> list[str]:
    """Needed types not yet in any bot's inventory (still must be picked from map)."""
    remaining = list(needed)
    for bot in state.get("bots") or []:
        for t in bot.get("inventory") or []:
            if t in remaining:
                remaining.remove(t)
    return remaining


def _item_on_map(state: dict, item_id: str) -> bool:
    return any(it.get("id") == item_id for it in state.get("items") or [])


# ---------------------------------------------------------------------------
# Assignment
# ---------------------------------------------------------------------------

def _assign_targets(state: dict) -> dict[int, dict]:
    """
    Each bot with room in inventory gets the nearest needed item (active order).
    Accounts for items in transit (in bots' inventories) to avoid over-collecting.
    Idle bots pre-pick preview order items.
    """
    active = _active_order(state)
    needed = _needed_types(active)
    remaining = _remaining_to_pick(state, needed)

    items = state.get("items") or []
    active_candidates = [i for i in items if i["type"] in remaining]
    bots = sorted(state.get("bots") or [], key=lambda b: b["id"])

    assigned_ids: set[str] = set()
    assignments: dict[int, dict] = {}
    types_left = list(remaining)

    for bot in bots:
        if len(bot.get("inventory") or []) >= 3:
            continue
        if not types_left:
            break
        best, best_dist = None, 999_999
        for item in active_candidates:
            if item["id"] in assigned_ids:
                continue
            if item["type"] not in types_left:
                continue
            d = manhattan(bot["position"], item["position"])
            if d < best_dist:
                best_dist = d
                best = item
        if best:
            assignments[bot["id"]] = best
            assigned_ids.add(best["id"])
            types_left.remove(best["type"])

    # Idle bots: pre-pick preview order items
    preview = _preview_order(state)
    if preview:
        preview_needed = _needed_types(preview)
        preview_cands = [i for i in items
                         if i["type"] in preview_needed and i["id"] not in assigned_ids]
        for bot in bots:
            if bot["id"] in assignments:
                continue
            inv = bot.get("inventory") or []
            if len(inv) >= 3 or inv:
                continue
            best, best_dist = None, 999_999
            for item in preview_cands:
                if item["id"] in assigned_ids:
                    continue
                d = manhattan(bot["position"], item["position"])
                if d < best_dist:
                    best_dist = d
                    best = item
            if best:
                assignments[bot["id"]] = best
                assigned_ids.add(best["id"])

    return assignments


# ---------------------------------------------------------------------------
# Three-bot helpers
# ---------------------------------------------------------------------------

def _select_courier_id(state: dict) -> int:
    """
    Pick one courier for 3-bot mode.
    Priority:
    1) bot carrying most items matching active order
    2) nearest to drop_off
    3) lowest bot id
    """
    bots = sorted(state.get("bots") or [], key=lambda b: b["id"])
    if not bots:
        return 0
    drop_off = state.get("drop_off") or [0, 0]
    needed = _needed_types(_active_order(state))

    def rank(bot: dict) -> tuple[int, int, int]:
        inv = bot.get("inventory") or []
        matching = sum(1 for t in inv if t in needed)
        dist_drop = manhattan(bot.get("position") or [0, 0], drop_off)
        # Higher matching is better; lower dist and id are better.
        return (matching, -dist_drop, -bot["id"])

    best = max(bots, key=rank)
    return best["id"]


def _assign_targets_three_bots(state: dict, courier_id: int) -> dict[int, dict]:
    """
    Global assignment for 3 bots (Medium):
    - Active order only (no preview pre-pick).
    - Build global bot-item pairs with BFS distance.
    - Greedy globally by minimum cost (not per-bot local).
    - Prefer distinct item types first to complete orders faster.
    """
    active = _active_order(state)
    needed = _needed_types(active)
    remaining = _remaining_to_pick(state, needed)
    items = state.get("items") or []
    bots = sorted(state.get("bots") or [], key=lambda b: b["id"])
    grid = state.get("grid") or {}

    active_candidates = [i for i in items if i["type"] in remaining]
    workers = [b for b in bots if len(b.get("inventory") or []) < 3]
    if not workers or not active_candidates or not remaining:
        return {}

    want = min(len(remaining), len(workers))
    pairs: list[tuple[int, int, str, dict]] = []
    for bot in workers:
        bid = bot["id"]
        for item in active_candidates:
            targets = _adjacent_cells(item["position"], grid)
            d = _bfs_distance_to_any(state, bot["position"], targets, exclude_bot_id=bid)
            # courier_id used only as stable tie-breaker to keep behavior deterministic
            tie = 0 if bid != courier_id else 1
            pairs.append((d * 10 + tie, bid, item["id"], item))

    pairs.sort(key=lambda x: x[0])

    assignments: dict[int, dict] = {}
    used_bots: set[int] = set()
    used_items: set[str] = set()
    covered_types: set[str] = set()

    # Pass 1: maximize distinct needed types.
    for cost, bid, item_id, item in pairs:
        if cost >= 9_999_990:
            continue
        if bid in used_bots or item_id in used_items:
            continue
        item_type = item.get("type")
        if item_type in covered_types:
            continue
        assignments[bid] = item
        used_bots.add(bid)
        used_items.add(item_id)
        covered_types.add(item_type)
        if len(assignments) >= want or len(covered_types) >= len(set(remaining)):
            break

    # Pass 2: fill remaining slots by lowest global cost.
    if len(assignments) < want:
        for cost, bid, item_id, item in pairs:
            if cost >= 9_999_990:
                continue
            if bid in used_bots or item_id in used_items:
                continue
            assignments[bid] = item
            used_bots.add(bid)
            used_items.add(item_id)
            if len(assignments) >= want:
                break

    return assignments


# ---------------------------------------------------------------------------
# Decision
# ---------------------------------------------------------------------------

def decide(
    bot: dict,
    state: dict,
    assignments: dict[int, dict],
    claimed_cells: set[tuple[int, int]] | None = None,
) -> dict[str, Any]:
    """Universal decide for 1-10 bots."""
    pos = bot["position"]
    x, y = pos
    drop_off = state.get("drop_off") or [0, 0]
    bid = bot["id"]
    inv = bot.get("inventory") or []

    active = _active_order(state)
    needed = _needed_types(active)

    # 1. At drop_off with inventory -> deliver
    if inv and [x, y] == drop_off:
        return {"bot": bid, "action": "drop_off"}

    # 2. Inventory full -> go deliver
    if len(inv) >= 3:
        return _step_toward(bid, x, y, drop_off, state,
                            exclude_bot_id=bid, claimed=claimed_cells)

    # 3. All remaining needed items are in transit -> deliver matching
    remaining = _remaining_to_pick(state, needed)
    matching = [t for t in inv if t in needed]
    if matching and not remaining:
        return _step_toward(bid, x, y, drop_off, state,
                            exclude_bot_id=bid, claimed=claimed_cells)

    # 4. Has assigned target -> pick or move toward
    target = assignments.get(bid)
    if target and _item_on_map(state, target["id"]):
        ix, iy = target["position"]
        if manhattan([x, y], [ix, iy]) == 1:
            return {"bot": bid, "action": "pick_up", "item_id": target["id"]}
        return _step_toward_item(bid, x, y, [ix, iy], state,
                                 exclude_bot_id=bid, claimed=claimed_cells)

    # 5. Has inventory but no assignment -> go deliver
    if inv:
        return _step_toward(bid, x, y, drop_off, state,
                            exclude_bot_id=bid, claimed=claimed_cells)

    # 6. Idle: scatter toward map center to clear spawn
    grid = state.get("grid") or {}
    center = [grid.get("width", 16) // 2, grid.get("height", 12) // 2]
    if manhattan([x, y], center) > 3:
        return _step_toward(bid, x, y, center, state,
                            exclude_bot_id=bid, claimed=claimed_cells)

    return {"bot": bid, "action": "wait"}


def decide_three_bots(
    bot: dict,
    state: dict,
    assignments: dict[int, dict],
    courier_id: int,
    claimed_cells: set[tuple[int, int]] | None = None,
) -> dict[str, Any]:
    """
    Strategy dedicated to 3 bots:
    - global pickup assignment for active order
    - delivery wave when order almost complete
    """
    pos = bot["position"]
    x, y = pos
    drop_off = state.get("drop_off") or [0, 0]
    bid = bot["id"]
    inv = bot.get("inventory") or []
    active = _active_order(state)
    needed = _needed_types(active)
    remaining = _remaining_to_pick(state, needed)
    matching = [t for t in inv if t in needed]

    if inv and [x, y] == drop_off:
        return {"bot": bid, "action": "drop_off"}

    if len(inv) >= 3:
        return _step_toward(bid, x, y, drop_off, state, exclude_bot_id=bid, claimed=claimed_cells)

    # Delivery wave: once almost complete, push useful inventory to drop_off.
    if matching and (not remaining or len(remaining) <= 1):
        return _step_toward(bid, x, y, drop_off, state, exclude_bot_id=bid, claimed=claimed_cells)

    target = assignments.get(bid)
    if target and _item_on_map(state, target["id"]):
        tx, ty = target["position"]
        if manhattan([x, y], [tx, ty]) == 1:
            return {"bot": bid, "action": "pick_up", "item_id": target["id"]}
        return _step_toward_item(bid, x, y, [tx, ty], state, exclude_bot_id=bid, claimed=claimed_cells)

    if inv:
        return _step_toward(bid, x, y, drop_off, state, exclude_bot_id=bid, claimed=claimed_cells)

    return {"bot": bid, "action": "wait"}


# ---------------------------------------------------------------------------
# Single-bot strategy (Easy difficulty)
# ---------------------------------------------------------------------------

def _adjacent_cells(item_pos: list | tuple, grid: dict) -> set[tuple[int, int]]:
    """Cells adjacent to item (for pick_up at dist 1)."""
    w, h = grid.get("width", 32), grid.get("height", 24)
    px, py = item_pos[0], item_pos[1]
    targets: set[tuple[int, int]] = set()
    for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
        nx, ny = px + dx, py + dy
        if 0 <= nx < w and 0 <= ny < h:
            targets.add((nx, ny))
    return targets


def decide_single_bot(bot: dict, state: dict) -> dict[str, Any]:
    """
    Dedicated strategy for 1 bot. Optimized for Easy difficulty.
    - BFS distance for item selection (real steps, not Manhattan).
    - Deliver early when we have all needed items and are close to drop_off.
    - Pre-pick preview items when going to drop if very close (en route).
    - No claimed_cells, no scatter logic.
    """
    pos = bot["position"]
    x, y = pos
    drop_off = state.get("drop_off") or [0, 0]
    bid = bot["id"]
    inv = bot.get("inventory") or []
    grid = state.get("grid") or {}

    active = _active_order(state)
    needed = _needed_types(active)
    remaining = _remaining_to_pick(state, needed)
    matching = [t for t in inv if t in needed]
    dist_drop = manhattan([x, y], drop_off)

    # 1. At drop_off with inventory -> deliver
    if inv and [x, y] == drop_off:
        return {"bot": bid, "action": "drop_off"}

    # 2. Inventory full -> go deliver
    if len(inv) >= 3:
        return _step_toward(bid, x, y, drop_off, state, exclude_bot_id=bid)

    # 3. All needed items in transit (we have them) -> deliver
    if matching and not remaining:
        return _step_toward(bid, x, y, drop_off, state, exclude_bot_id=bid)

    # 4. Pick nearest needed item by BFS distance (active order first)
    items = state.get("items") or []
    candidates = [i for i in items if i["type"] in remaining]
    if not candidates and active:
        preview = _preview_order(state)
        if preview:
            preview_needed = _needed_types(preview)
            candidates = [i for i in items if i["type"] in preview_needed]

    if candidates:
        def bfs_dist_to_item(item: dict) -> int:
            targets = _adjacent_cells(item["position"], grid)
            return _bfs_distance_to_any(state, [x, y], targets, exclude_bot_id=bid)

        best = min(candidates, key=bfs_dist_to_item)
        ix, iy = best["position"]
        if manhattan([x, y], [ix, iy]) == 1:
            return {"bot": bid, "action": "pick_up", "item_id": best["id"]}
        return _step_toward_item(bid, x, y, [ix, iy], state, exclude_bot_id=bid)

    # 5. Pre-pick en ruta: going to drop, have room, preview item very close
    if inv and len(inv) < 3:
        preview = _preview_order(state)
        if preview:
            preview_needed = _needed_types(preview)
            preview_items = [i for i in items if i["type"] in preview_needed]
            for pi in preview_items:
                d = _bfs_distance_to_any(state, [x, y], _adjacent_cells(pi["position"], grid), exclude_bot_id=bid)
                if d <= 2 and d < dist_drop:
                    if manhattan([x, y], pi["position"]) == 1:
                        return {"bot": bid, "action": "pick_up", "item_id": pi["id"]}
                    return _step_toward_item(bid, x, y, pi["position"], state, exclude_bot_id=bid)

    # 6. Has inventory -> go deliver
    if inv:
        return _step_toward(bid, x, y, drop_off, state, exclude_bot_id=bid)

    return {"bot": bid, "action": "wait"}


# ---------------------------------------------------------------------------
# Backward-compatible wrappers
# ---------------------------------------------------------------------------

def decide_level1(_bot: dict, _state: dict) -> dict[str, Any]:
    """Level 1: always wait."""
    return {"bot": _bot["id"], "action": "wait"}


def decide_level2(bot: dict, state: dict, **_kw) -> dict[str, Any]:
    assignments = _assign_targets(state)
    return decide(bot, state, assignments)


def decide_level3(bot: dict, state: dict, bot_assignments: dict[int, dict],
                  claimed_next_cells: set[tuple[int, int]] | None = None,
                  **_kw) -> dict[str, Any]:
    return decide(bot, state, bot_assignments,
                  claimed_cells=claimed_next_cells)
