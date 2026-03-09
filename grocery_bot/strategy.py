"""
NMiAI 2026 Grocery Bot — Nightmare-oriented decision logic.
Compatible with current bot.py.

Main ideas:
- Global greedy assignment with capped active workers
- Multiple drop zones supported (Nightmare)
- Congestion-aware delivery zone choice
- Exact pick_up rule: Manhattan distance == 1
- Unassigned bots stay out of the way instead of creating traffic
"""

from collections import deque, Counter
from typing import Any


def manhattan(a: list | tuple, b: list | tuple) -> int:
    return abs(int(a[0]) - int(b[0])) + abs(int(a[1]) - int(b[1]))


# ---------------------------------------------------------------------------
# Grid / path helpers
# ---------------------------------------------------------------------------

def _all_drop_zones(state: dict) -> list[list[int]]:
    zones = state.get("drop_off_zones")
    if zones:
        return [list(z) for z in zones]
    if state.get("drop_off") is not None:
        return [list(state["drop_off"])]
    return [[0, 0]]


def _get_blocked(
    state: dict,
    exclude_bot_id: int | None = None,
    bot_pos: tuple[int, int] | None = None,
    claimed_next_cells: set[tuple[int, int]] | None = None,
) -> set[tuple[int, int]]:
    """
    Blocked cells = walls + other bots + already claimed next cells.
    Items are assumed walkable here because current docs/examples imply shelves/items
    are on map cells and pickup occurs from adjacent cell.
    """
    blocked: set[tuple[int, int]] = set()

    for w in (state.get("grid") or {}).get("walls") or []:
        blocked.add((int(w[0]), int(w[1])))

    for b in state.get("bots") or []:
        if exclude_bot_id is not None and b.get("id") == exclude_bot_id:
            continue
        p = b.get("position") or [0, 0]
        pos_t = (int(p[0]), int(p[1]))
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
    """
    BFS distance from from_pos to nearest target cell.
    Returns a large sentinel if unreachable.
    """
    x0, y0 = int(from_pos[0]), int(from_pos[1])
    if (x0, y0) in target_cells:
        return 0

    grid = state.get("grid") or {}
    w, h = int(grid.get("width", 32)), int(grid.get("height", 24))
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
    """
    First BFS step toward any reachable target cell.
    Returns move action or None.
    """
    x0, y0 = int(from_pos[0]), int(from_pos[1])
    if (x0, y0) in target_cells:
        return None

    grid = state.get("grid") or {}
    w = int(grid.get("width", 32))
    h = int(grid.get("height", 24))

    blocked = _get_blocked(
        state,
        exclude_bot_id=exclude_bot_id,
        bot_pos=bot_pos,
        claimed_next_cells=claimed_next_cells,
    )
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

        for dx, dy, action in [
            (0, -1, "move_up"),
            (0, 1, "move_down"),
            (-1, 0, "move_left"),
            (1, 0, "move_right"),
        ]:
            nx, ny = cx + dx, cy + dy
            if not (0 <= nx < w and 0 <= ny < h):
                continue
            if (nx, ny) in blocked or (nx, ny) in visited:
                continue
            visited.add((nx, ny))
            first_move[(nx, ny)] = action if (cx, cy) == (x0, y0) else first_move[(cx, cy)]
            q.append((nx, ny))

    return None


def _move_toward(bot_id: int, x: int, y: int, target: list | tuple) -> dict[str, Any]:
    tx, ty = int(target[0]), int(target[1])
    if abs(tx - x) > abs(ty - y):
        return {"bot": bot_id, "action": "move_right" if tx > x else "move_left"}
    if ty != y:
        return {"bot": bot_id, "action": "move_down" if ty > y else "move_up"}
    return {"bot": bot_id, "action": "wait"}


def _step_toward(
    bot_id: int,
    x: int,
    y: int,
    target: list | tuple,
    state: dict,
    exclude_bot_id: int | None = None,
    claimed: set[tuple[int, int]] | None = None,
) -> dict[str, Any]:
    step = _bfs_next_step_to_any(
        state,
        [x, y],
        {(int(target[0]), int(target[1]))},
        exclude_bot_id=exclude_bot_id,
        bot_pos=(x, y),
        claimed_next_cells=claimed,
    )
    if step:
        return {"bot": bot_id, "action": step}
    return _move_toward(bot_id, x, y, target)


def _adjacent_cells(item_pos: list | tuple, grid: dict) -> set[tuple[int, int]]:
    w, h = int(grid.get("width", 32)), int(grid.get("height", 24))
    px, py = int(item_pos[0]), int(item_pos[1])
    targets: set[tuple[int, int]] = set()
    for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
        nx, ny = px + dx, py + dy
        if 0 <= nx < w and 0 <= ny < h:
            targets.add((nx, ny))
    return targets


def _step_toward_item(
    bot_id: int,
    x: int,
    y: int,
    item_pos: list | tuple,
    state: dict,
    exclude_bot_id: int | None = None,
    claimed: set[tuple[int, int]] | None = None,
) -> dict[str, Any]:
    """
    Move toward a cell adjacent to the item, never requiring standing on item cell.
    """
    grid = state.get("grid") or {}
    targets = _adjacent_cells(item_pos, grid)
    step = _bfs_next_step_to_any(
        state,
        [x, y],
        targets,
        exclude_bot_id=exclude_bot_id,
        bot_pos=(x, y),
        claimed_next_cells=claimed,
    )
    if step:
        return {"bot": bot_id, "action": step}
    return _move_toward(bot_id, x, y, item_pos)


# ---------------------------------------------------------------------------
# Order helpers
# ---------------------------------------------------------------------------

def _active_order(state: dict) -> dict | None:
    return next((o for o in state.get("orders") or [] if o.get("status") == "active"), None)


def _preview_order(state: dict) -> dict | None:
    return next((o for o in state.get("orders") or [] if o.get("status") == "preview"), None)


def _needed_types(order: dict | None) -> list[str]:
    if not order:
        return []
    needed = list(order.get("items_required") or [])
    for d in order.get("items_delivered") or []:
        if d in needed:
            needed.remove(d)
    return needed


def _remaining_to_pick(state: dict, needed: list[str]) -> list[str]:
    """
    Types still needed from the map after discounting all bots' current inventories.
    """
    remaining = list(needed)
    for bot in state.get("bots") or []:
        for t in bot.get("inventory") or []:
            if t in remaining:
                remaining.remove(t)
    return remaining


def _item_on_map(state: dict, item_id: str) -> bool:
    return any(it.get("id") == item_id for it in state.get("items") or [])


def _rounds_left(state: dict) -> int:
    return int(state.get("max_rounds", 300)) - int(state.get("round", 0))


# ---------------------------------------------------------------------------
# Drop zone logic
# ---------------------------------------------------------------------------

def _zone_loads(state: dict, needed_types: set[str] | None = None) -> dict[tuple[int, int], int]:
    """
    Approximate congestion per zone:
    count bots carrying relevant inventory that are naturally closest to that zone.
    """
    zones = [tuple(z) for z in _all_drop_zones(state)]
    loads = {z: 0 for z in zones}
    if not zones:
        return loads

    needed_types = needed_types or set()

    for b in state.get("bots") or []:
        inv = b.get("inventory") or []
        if needed_types and not any(t in needed_types for t in inv):
            continue
        pos = b.get("position") or [0, 0]
        best = min(zones, key=lambda z: manhattan(pos, z))
        loads[best] += 1

    return loads


def _best_zone_for_pos(
    pos: list | tuple,
    state: dict,
    needed_types: set[str] | None = None,
    congestion_weight: int = 2,
) -> list[int]:
    zones = _all_drop_zones(state)
    if not zones:
        return [0, 0]

    loads = _zone_loads(state, needed_types)
    best = min(
        zones,
        key=lambda z: manhattan(pos, z) + congestion_weight * loads.get((z[0], z[1]), 0),
    )
    return [int(best[0]), int(best[1])]


def _best_zone_for_item(
    item_pos: list | tuple,
    state: dict,
    needed_types: set[str] | None = None,
    congestion_weight: int = 2,
) -> list[int]:
    return _best_zone_for_pos(item_pos, state, needed_types, congestion_weight)


# ---------------------------------------------------------------------------
# Assignment
# ---------------------------------------------------------------------------

def _assign_targets(state: dict, failed_pickups: dict | None = None) -> dict[int, dict]:
    """
    Global greedy assignment with capped active workers.

    Strategy:
    - Assign only a limited number of bots to the active order
    - Use full-trip proxy cost = bot->item + item->best zone
    - Reserve only as many items of each type as still needed
    - Assign a few empty idle bots to preview items
    """
    failed_pickups = failed_pickups or {}
    items = state.get("items") or []
    bots = sorted(state.get("bots") or [], key=lambda b: b["id"])

    active = _active_order(state)
    preview = _preview_order(state)

    active_needed = _needed_types(active)
    preview_needed = _needed_types(preview) if preview else []

    active_remaining = _remaining_to_pick(state, active_needed)
    active_needed_set = set(active_needed)
    preview_needed_set = set(preview_needed)

    remaining_counts = Counter(active_remaining)

    # Cap active workers: key anti-congestion control
    # For Nightmare this usually keeps traffic manageable.
    active_cap = min(len(bots), max(8, min(12, len(active_remaining) + 5)))
    preview_cap = min(2, max(0, len(bots) - active_cap))

    active_candidates = [it for it in items if remaining_counts[it["type"]] > 0]
    candidate_bots = [b for b in bots if len(b.get("inventory") or []) < 3]

    pairs = []
    for b in candidate_bots:
        bid = b["id"]
        bpos = b.get("position") or [0, 0]

        for it in active_candidates:
            iid = it["id"]
            if failed_pickups.get((bid, iid), 0) >= 1:
                continue

            d_pick = max(1, manhattan(bpos, it["position"]) - 1)
            zone = _best_zone_for_item(it["position"], state, active_needed_set)
            d_deliver = manhattan(it["position"], zone)

            trip_cost = d_pick + d_deliver
            pairs.append((trip_cost, bid, iid, it))

    pairs.sort(key=lambda x: (x[0], x[1], x[2]))

    assignments: dict[int, dict] = {}
    used_bots: set[int] = set()
    used_items: set[str] = set()
    reserved_counts = Counter()

    # Active order assignments
    for cost, bid, iid, it in pairs:
        if len(assignments) >= active_cap:
            break
        if bid in used_bots or iid in used_items:
            continue

        t = it["type"]
        if reserved_counts[t] >= remaining_counts[t]:
            continue

        assignments[bid] = it
        used_bots.add(bid)
        used_items.add(iid)
        reserved_counts[t] += 1

    # Limited preview assignments for a few EMPTY bots only
    if preview and preview_cap > 0:
        preview_candidates = [
            it for it in items
            if it["type"] in preview_needed_set and it["id"] not in used_items
        ]

        preview_pairs = []
        for b in candidate_bots:
            bid = b["id"]
            if bid in assignments:
                continue
            if b.get("inventory"):
                continue
            bpos = b.get("position") or [0, 0]

            for it in preview_candidates:
                iid = it["id"]
                d_pick = max(1, manhattan(bpos, it["position"]) - 1)
                preview_pairs.append((d_pick, bid, iid, it))

        preview_pairs.sort(key=lambda x: (x[0], x[1], x[2]))

        used_preview_bots = 0
        for _, bid, iid, it in preview_pairs:
            if used_preview_bots >= preview_cap:
                break
            if bid in assignments or iid in used_items:
                continue
            assignments[bid] = it
            used_items.add(iid)
            used_preview_bots += 1

    return assignments


# ---------------------------------------------------------------------------
# Decision helpers
# ---------------------------------------------------------------------------

def _delivery_step(
    bot_id: int,
    x: int,
    y: int,
    zone: list | tuple,
    state: dict,
    claimed: set[tuple[int, int]] | None = None,
) -> dict[str, Any]:
    return _step_toward(bot_id, x, y, zone, state, exclude_bot_id=bot_id, claimed=claimed)


def _picking_step(
    bot_id: int,
    x: int,
    y: int,
    item_pos: list | tuple,
    state: dict,
    claimed: set[tuple[int, int]] | None = None,
) -> dict[str, Any]:
    return _step_toward_item(bot_id, x, y, item_pos, state, exclude_bot_id=bot_id, claimed=claimed)


# ---------------------------------------------------------------------------
# Main decision
# ---------------------------------------------------------------------------

def decide(
    bot: dict,
    state: dict,
    assignments: dict[int, dict],
    claimed_cells: set[tuple[int, int]] | None = None,
    failed_pickups: dict | None = None,
) -> dict[str, Any]:
    failed_pickups = failed_pickups or {}

    pos = bot["position"]
    x, y = int(pos[0]), int(pos[1])
    bid = int(bot["id"])
    inv = list(bot.get("inventory") or [])
    rounds_remaining = _rounds_left(state)

    active = _active_order(state)
    needed = _needed_types(active)
    needed_set = set(needed)
    matching = [t for t in inv if t in needed_set]

    all_zones = _all_drop_zones(state)
    near_zone = _best_zone_for_pos(pos, state, needed_set)
    dist_drop = manhattan(pos, near_zone)

    # 1. Standing on any drop zone with useful inventory -> deliver
    if matching and [x, y] in all_zones:
        return {"bot": bid, "action": "drop_off"}

    # 2. Full inventory -> deliver
    if len(inv) >= 3:
        return _delivery_step(bid, x, y, near_zone, state, claimed_cells)

    # 3. Carrying useful items and reasonably close -> deliver
    if matching and dist_drop <= 6:
        return _delivery_step(bid, x, y, near_zone, state, claimed_cells)

    # 4. Endgame logic -> deliver before timeout
    if matching and rounds_remaining <= dist_drop + 6:
        return _delivery_step(bid, x, y, near_zone, state, claimed_cells)

    # 5. If all needed items are already in inventories, deliver all useful carriers
    remaining = _remaining_to_pick(state, needed)
    if matching and not remaining:
        return _delivery_step(bid, x, y, near_zone, state, claimed_cells)

    # 6. Assigned target -> pick or move toward it
    target = assignments.get(bid)
    if target and _item_on_map(state, target["id"]):
        ix, iy = int(target["position"][0]), int(target["position"][1])

        # Exact rule: pick only when adjacent
        if manhattan([x, y], [ix, iy]) == 1:
            preview = _preview_order(state)
            preview_types = set(_needed_types(preview)) if preview else set()
            if target["type"] in (needed_set | preview_types):
                return {"bot": bid, "action": "pick_up", "item_id": target["id"]}
            return {"bot": bid, "action": "wait"}

        return _picking_step(bid, x, y, [ix, iy], state, claimed_cells)

    # 7. If carrying something useful but lost target, deliver
    if matching:
        return _delivery_step(bid, x, y, near_zone, state, claimed_cells)

    # 8. Unassigned empty bots stay still to avoid traffic
    if not inv:
        return {"bot": bid, "action": "wait"}

    # 9. Non-matching inventory: hold until it becomes useful
    return {"bot": bid, "action": "wait"}


# ---------------------------------------------------------------------------
# Single-bot strategy
# ---------------------------------------------------------------------------

def decide_single_bot(bot: dict, state: dict) -> dict[str, Any]:
    """
    Simple dedicated strategy for Easy/solo mode.
    """
    pos = bot["position"]
    x, y = int(pos[0]), int(pos[1])
    bid = int(bot["id"])
    inv = list(bot.get("inventory") or [])

    active = _active_order(state)
    needed = _needed_types(active)
    remaining = _remaining_to_pick(state, needed)
    matching = [t for t in inv if t in set(needed)]
    zone = _best_zone_for_pos(pos, state, set(needed))

    # Deliver if standing on drop zone
    if matching and [x, y] in _all_drop_zones(state):
        return {"bot": bid, "action": "drop_off"}

    # Full or all needed in transit -> deliver
    if len(inv) >= 3 or (matching and not remaining):
        return _step_toward(bid, x, y, zone, state, exclude_bot_id=bid)

    items = state.get("items") or []
    candidates = [i for i in items if i["type"] in remaining]

    if not candidates:
        preview = _preview_order(state)
        if preview:
            preview_needed = _needed_types(preview)
            candidates = [i for i in items if i["type"] in preview_needed]

    if candidates:
        grid = state.get("grid") or {}

        def bfs_dist_to_item(item: dict) -> int:
            targets = _adjacent_cells(item["position"], grid)
            return _bfs_distance_to_any(state, [x, y], targets, exclude_bot_id=bid)

        best = min(candidates, key=bfs_dist_to_item)
        ix, iy = best["position"]

        if manhattan([x, y], [ix, iy]) == 1:
            return {"bot": bid, "action": "pick_up", "item_id": best["id"]}

        return _step_toward_item(bid, x, y, [ix, iy], state, exclude_bot_id=bid)

    if inv:
        return _step_toward(bid, x, y, zone, state, exclude_bot_id=bid)

    return {"bot": bid, "action": "wait"}


# ---------------------------------------------------------------------------
# Backward-compatible wrappers
# ---------------------------------------------------------------------------

def decide_level1(_bot: dict, _state: dict) -> dict[str, Any]:
    return {"bot": _bot["id"], "action": "wait"}


def decide_level2(bot: dict, state: dict, **_kw) -> dict[str, Any]:
    # Single-bot optimized path
    if len(state.get("bots") or []) <= 1:
        return decide_single_bot(bot, state)
    assignments = _assign_targets(state)
    return decide(bot, state, assignments)


def decide_level3(
    bot: dict,
    state: dict,
    bot_assignments: dict[int, dict] | None = None,
    claimed_next_cells: set[tuple[int, int]] | None = None,
    failed_pickups: dict | None = None,
    **_kw,
) -> dict[str, Any]:
    # Recompute assignments each round using the global capped planner
    assignments = _assign_targets(state, failed_pickups=failed_pickups)
    return decide(
        bot,
        state,
        assignments,
        claimed_cells=claimed_next_cells,
        failed_pickups=failed_pickups,
    )