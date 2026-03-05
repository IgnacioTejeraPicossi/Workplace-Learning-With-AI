"""
NMiAI 2026 Grocery Bot — decision logic.
Unified strategy for 1-10 bots. BFS pathfinding around walls/bots.

Key design:
 - Items not blocked in BFS (paths may cross item cells; fallback avoids blocked steps).
 - Single bot: deliver-early when dist≤8 or order nearly done.
 - Multi-bot: courier (bot 0) delivers early; pickers fill to 3, backpressure near drop_off.
 - Smart assignment accounts for items in transit; idle bots pre-pick preview.
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
    claimed_next_cells: set[tuple[int, int]] | None = None,
    block_items: bool = False,
) -> set[tuple[int, int]]:
    """Walls + other bots + claimed; optionally items (when pathfinding to drop_off)."""
    blocked: set[tuple[int, int]] = set()
    for w in (state.get("grid") or {}).get("walls") or []:
        blocked.add((w[0], w[1]))
    if block_items:
        for it in state.get("items") or []:
            p = it.get("position") or [0, 0]
            blocked.add((p[0], p[1]))
    for b in state.get("bots") or []:
        if exclude_bot_id is not None and b.get("id") == exclude_bot_id:
            continue
        p = b.get("position") or [0, 0]
        blocked.add((p[0], p[1]))
    if claimed_next_cells:
        blocked |= claimed_next_cells
    return blocked


def _bfs_next_step_to_any(
    state: dict,
    from_pos: list | tuple,
    target_cells: set[tuple[int, int]],
    exclude_bot_id: int | None = None,
    claimed_next_cells: set[tuple[int, int]] | None = None,
    block_items: bool = False,
) -> str | None:
    """First BFS step toward any reachable target cell."""
    x0, y0 = from_pos[0], from_pos[1]
    if (x0, y0) in target_cells:
        return None
    grid = state.get("grid") or {}
    w = grid.get("width", 32)
    h = grid.get("height", 24)
    blocked = _get_blocked(state, exclude_bot_id=exclude_bot_id,
                           claimed_next_cells=claimed_next_cells, block_items=block_items)
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


def _move_toward_safe(bot_id: int, x: int, y: int, target: list, state: dict,
                      exclude_bot_id: int | None = None,
                      claimed: set[tuple[int, int]] | None = None) -> dict[str, Any]:
    """Try each direction toward target; return first that steps into non-blocked cell."""
    blocked = _get_blocked(state, exclude_bot_id=exclude_bot_id,
                           claimed_next_cells=claimed, block_items=True)
    grid = state.get("grid") or {}
    w, h = grid.get("width", 32), grid.get("height", 24)
    tx, ty = target[0], target[1]
    candidates = []
    if tx > x and x + 1 < w:
        candidates.append(("move_right", x + 1, y))
    if tx < x and x - 1 >= 0:
        candidates.append(("move_left", x - 1, y))
    if ty > y and y + 1 < h:
        candidates.append(("move_down", x, y + 1))
    if ty < y and y - 1 >= 0:
        candidates.append(("move_up", x, y - 1))
    candidates.sort(key=lambda c: manhattan([c[1], c[2]], target))
    for action, nx, ny in candidates:
        if (nx, ny) not in blocked:
            return {"bot": bot_id, "action": action}
    return {"bot": bot_id, "action": "wait"}


def _step_toward(bot_id: int, x: int, y: int, target: list,
                 state: dict, exclude_bot_id: int | None = None,
                 claimed: set[tuple[int, int]] | None = None) -> dict[str, Any]:
    """BFS one step toward target cell; fallback to first valid step toward target."""
    step = _bfs_next_step_to_any(
        state, [x, y], {(target[0], target[1])},
        exclude_bot_id=exclude_bot_id, claimed_next_cells=claimed,
        block_items=True,
    )
    if step:
        return {"bot": bot_id, "action": step}
    return _move_toward_safe(bot_id, x, y, target, state, exclude_bot_id, claimed)


def _step_toward_item(bot_id: int, x: int, y: int, item_pos: list | tuple,
                      state: dict, exclude_bot_id: int | None = None,
                      claimed: set[tuple[int, int]] | None = None) -> dict[str, Any]:
    """BFS one step toward a walkable cell adjacent to the item (for pick_up at dist 1)."""
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
        exclude_bot_id=exclude_bot_id, claimed_next_cells=claimed,
        block_items=True,
    )
    if step:
        return {"bot": bot_id, "action": step}
    return _move_toward_safe(bot_id, x, y, list(item_pos), state,
                             exclude_bot_id=exclude_bot_id, claimed=claimed)


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

def _assign_targets(state: dict, failed_pickups: dict | None = None) -> dict[int, dict]:
    """
    Each bot with room in inventory gets the nearest needed item (active order).
    Accounts for items in transit (in bots' inventories) to avoid over-collecting.
    Idle bots pre-pick preview order items.
    """
    failed_pickups = failed_pickups or {}
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
            if failed_pickups.get((bot["id"], item["id"]), 0) >= 1:
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
                if failed_pickups.get((bot["id"], item["id"]), 0) >= 1:
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
# Decision
# ---------------------------------------------------------------------------

def decide(
    bot: dict,
    state: dict,
    assignments: dict[int, dict],
    claimed_cells: set[tuple[int, int]] | None = None,
    failed_pickups: dict | None = None,
) -> dict[str, Any]:
    """
    Universal decide for 1-10 bots.
    Single bot: deliver-early when close to drop_off or order nearly done.
    Multi-bot: courier (bot 0) delivers early; pickers fill to 3 first to reduce congestion.
    """
    failed_pickups = failed_pickups or {}
    pos = bot["position"]
    x, y = pos
    drop_off = state.get("drop_off") or [0, 0]
    bid = bot["id"]
    inv = bot.get("inventory") or []
    bots_list = state.get("bots") or []
    is_courier = len(bots_list) > 1 and bid == 0

    active = _active_order(state)
    needed = _needed_types(active)
    remaining = _remaining_to_pick(state, needed)
    matching = [t for t in inv if t in needed]
    dist_drop = manhattan(pos, drop_off)

    # 1. At drop_off with inventory → deliver
    if inv and [x, y] == drop_off:
        return {"bot": bid, "action": "drop_off"}

    # 2. Inventory full → go deliver
    if len(inv) >= 3:
        return _step_toward(bid, x, y, drop_off, state,
                            exclude_bot_id=bid, claimed=claimed_cells)

    # 3. Deliver early: courier or single bot when close / order nearly done
    if matching:
        if len(bots_list) <= 1:
            if dist_drop <= 8 or len(remaining) <= 2:
                return _step_toward(bid, x, y, drop_off, state,
                                    exclude_bot_id=bid, claimed=claimed_cells)
        elif is_courier and (dist_drop <= 6 or len(remaining) <= 1):
            return _step_toward(bid, x, y, drop_off, state,
                                exclude_bot_id=bid, claimed=claimed_cells)

    # 4. All remaining needed items collected → deliver
    if matching and not remaining:
        return _step_toward(bid, x, y, drop_off, state,
                            exclude_bot_id=bid, claimed=claimed_cells)

    # 5. Has assigned target → pick or move toward
    target = assignments.get(bid)
    if target and _item_on_map(state, target["id"]):
        ix, iy = target["position"]
        if manhattan([x, y], [ix, iy]) == 1:
            return {"bot": bid, "action": "pick_up", "item_id": target["id"]}
        return _step_toward_item(bid, x, y, [ix, iy], state,
                                 exclude_bot_id=bid, claimed=claimed_cells)

    # 6. Has inventory but no assignment → go deliver (or wait if picker + congestion)
    if inv:
        if len(bots_list) > 1 and not is_courier:
            bots_near = sum(1 for b in bots_list
                            if manhattan(b.get("position") or [0, 0], drop_off) <= 2)
            if bots_near >= 2:
                return {"bot": bid, "action": "wait"}
        return _step_toward(bid, x, y, drop_off, state,
                            exclude_bot_id=bid, claimed=claimed_cells)

    return {"bot": bid, "action": "wait"}


# ---------------------------------------------------------------------------
# Backward-compatible wrappers (used by bot.py)
# ---------------------------------------------------------------------------

def decide_level1(_bot: dict, _state: dict) -> dict[str, Any]:
    """Level 1: always wait."""
    return {"bot": _bot["id"], "action": "wait"}


def decide_level2(bot: dict, state: dict, failed_pickups: dict | None = None) -> dict[str, Any]:
    assignments = _assign_targets(state, failed_pickups)
    return decide(bot, state, assignments, failed_pickups=failed_pickups)


def decide_level3(
    bot: dict, state: dict, bot_assignments: dict[int, dict],
    bots_at_drop: set | None = None,
    claimed_next_cells: set[tuple[int, int]] | None = None,
    failed_pickups: dict | None = None,
) -> dict[str, Any]:
    return decide(bot, state, bot_assignments,
                  claimed_cells=claimed_next_cells, failed_pickups=failed_pickups)
