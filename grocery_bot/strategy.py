"""
NMiAI 2026 Grocery Bot — decision logic.
Level 2: single-bot. Level 3: multi-bot coordination. BFS to avoid walls.
"""
from collections import deque
from typing import Any


def manhattan(a: list, b: list) -> int:
    return abs(a[0] - b[0]) + abs(a[1] - b[1])


def _get_blocked(
    state: dict,
    exclude_bot_id: int | None = None,
    claimed_next_cells: set[tuple[int, int]] | None = None,
    block_item_cells: bool = False,
) -> set[tuple[int, int]]:
    """Cells that are walls, other bots, claimed; optionally item cells (so we never step on shelf)."""
    blocked = set()
    grid = state.get("grid") or {}
    for w in grid.get("walls") or []:
        blocked.add((w[0], w[1]))
    for b in state.get("bots") or []:
        if exclude_bot_id is not None and b.get("id") == exclude_bot_id:
            continue
        p = b.get("position") or [0, 0]
        blocked.add((p[0], p[1]))
    if claimed_next_cells:
        blocked |= claimed_next_cells
    if block_item_cells:
        for it in state.get("items") or []:
            p = it.get("position") or [0, 0]
            blocked.add((p[0], p[1]))
    return blocked


def _dir_from_to(fr: list | tuple, to: list | tuple) -> str:
    """One step from fr toward to (Manhattan). Returns action name."""
    fx, fy = fr[0], fr[1]
    tx, ty = to[0], to[1]
    if tx > fx:
        return "move_right"
    if tx < fx:
        return "move_left"
    if ty > fy:
        return "move_down"
    if ty < fy:
        return "move_up"
    return "wait"


def _bfs_next_step(
    state: dict,
    from_pos: list | tuple,
    to_pos: list | tuple,
    exclude_bot_id: int | None = None,
    claimed_next_cells: set[tuple[int, int]] | None = None,
    block_item_cells: bool = False,
) -> str | None:
    """
    First step (action name) along a shortest path from from_pos to to_pos.
    If block_item_cells=True, never step onto item cells (stay adjacent for pick_up).
    """
    return _bfs_next_step_to_any(
        state,
        from_pos,
        {(to_pos[0], to_pos[1])},
        exclude_bot_id=exclude_bot_id,
        claimed_next_cells=claimed_next_cells,
        block_item_cells=block_item_cells,
    )


def _bfs_next_step_to_any(
    state: dict,
    from_pos: list | tuple,
    target_cells: set[tuple[int, int]],
    exclude_bot_id: int | None = None,
    claimed_next_cells: set[tuple[int, int]] | None = None,
    block_item_cells: bool = False,
) -> str | None:
    """
    First step toward any cell in target_cells (e.g. cells adjacent to an item/shelf).
    If block_item_cells=True, item positions are blocked so we only reach adjacent cells.
    """
    x0, y0 = from_pos[0], from_pos[1]
    if (x0, y0) in target_cells:
        return None
    grid = state.get("grid") or {}
    w = grid.get("width", 32)
    h = grid.get("height", 24)
    blocked = _get_blocked(
        state,
        exclude_bot_id=exclude_bot_id,
        claimed_next_cells=claimed_next_cells,
        block_item_cells=block_item_cells,
    )
    # Don't consider target cells that are blocked (e.g. shelf)
    target_cells = target_cells - blocked
    if not target_cells:
        return None
    visited = set()
    first_move: dict[tuple[int, int], str | None] = {}
    first_move[(x0, y0)] = None
    q: deque[tuple[int, int]] = deque([(x0, y0)])
    while q:
        x, y = q.popleft()
        if (x, y) in target_cells:
            return first_move.get((x, y))
        for dx, dy, action in [(0, -1, "move_up"), (0, 1, "move_down"), (-1, 0, "move_left"), (1, 0, "move_right")]:
            nx, ny = x + dx, y + dy
            if nx < 0 or nx >= w or ny < 0 or ny >= h:
                continue
            if (nx, ny) in blocked or (nx, ny) in visited:
                continue
            visited.add((nx, ny))
            first_move[(nx, ny)] = first_move[(x, y)] if (x, y) != (x0, y0) else action
            q.append((nx, ny))
    return None


def _adjacent_cells(pos: list | tuple) -> set[tuple[int, int]]:
    """Four cells adjacent to pos (for pathfinding to stand next to an item)."""
    px, py = pos[0], pos[1]
    return {(px - 1, py), (px + 1, py), (px, py - 1), (px, py + 1)}


def move_toward(bot_id: int, x: int, y: int, target: list) -> dict[str, Any]:
    tx, ty = target
    if tx > x:
        return {"bot": bot_id, "action": "move_right"}
    if tx < x:
        return {"bot": bot_id, "action": "move_left"}
    if ty > y:
        return {"bot": bot_id, "action": "move_down"}
    if ty < y:
        return {"bot": bot_id, "action": "move_up"}
    return {"bot": bot_id, "action": "wait"}


def step_toward(
    bot_id: int,
    x: int,
    y: int,
    target: list,
    state: dict,
    exclude_bot_id: int | None = None,
    claimed_next_cells: set[tuple[int, int]] | None = None,
    block_item_cells: bool = False,
) -> dict[str, Any]:
    """Move one step toward target, using BFS around walls; fallback to Manhattan."""
    to_pos = [target[0], target[1]]
    step = _bfs_next_step(
        state, [x, y], to_pos,
        exclude_bot_id=exclude_bot_id,
        claimed_next_cells=claimed_next_cells,
        block_item_cells=block_item_cells,
    )
    if step and step != "wait":
        return {"bot": bot_id, "action": step}
    return move_toward(bot_id, x, y, to_pos)


def step_toward_adjacent_to_item(
    bot_id: int,
    x: int,
    y: int,
    item_pos: list | tuple,
    state: dict,
    exclude_bot_id: int | None = None,
    claimed_next_cells: set[tuple[int, int]] | None = None,
) -> dict[str, Any]:
    """Move one step toward a cell adjacent to the item (shelves are not walkable; we pick when adjacent)."""
    grid = state.get("grid") or {}
    w, h = grid.get("width", 32), grid.get("height", 24)
    adjacent = _adjacent_cells(item_pos)
    adjacent = {(a, b) for a, b in adjacent if 0 <= a < w and 0 <= b < h}
    step = _bfs_next_step_to_any(
        state, [x, y], adjacent,
        exclude_bot_id=exclude_bot_id,
        claimed_next_cells=claimed_next_cells,
        block_item_cells=True,
    )
    if step and step != "wait":
        return {"bot": bot_id, "action": step}
    return move_toward(bot_id, x, y, list(item_pos))


def decide_level2(bot: dict, state: dict, failed_pickups: dict | None = None) -> dict[str, Any]:
    """
    Level 2: one bot, Manhattan movement, no pathfinding.
    - Deliver at drop_off if holding items and on drop_off.
    - Else take active order, collect needed items (nearest first), then deliver.
    - After 2 failed pick_ups for same item, skip that item (deliver or next candidate).
    """
    failed_pickups = failed_pickups or {}
    pos = bot["position"]
    x, y = pos
    drop_off = state.get("drop_off") or [0, 0]

    # Deliver if at drop-off with inventory
    if bot.get("inventory") and [x, y] == drop_off:
        return {"bot": bot["id"], "action": "drop_off"}

    # Active order
    orders = state.get("orders") or []
    active = next((o for o in orders if o.get("status") == "active"), None)
    if not active:
        return {"bot": bot["id"], "action": "wait"}

    needed = list(active.get("items_required") or [])
    for delivered in active.get("items_delivered") or []:
        if delivered in needed:
            needed.remove(delivered)

    # Inventory full → go deliver
    if len(bot.get("inventory") or []) >= 3:
        return step_toward(bot["id"], x, y, drop_off, state)

    # Deliver early: if we have ≥1 item for active order and are close to drop_off or order nearly done
    inv = bot.get("inventory") or []
    if inv and (manhattan(pos, drop_off) <= 6 or len(needed) <= 1):
        return step_toward(bot["id"], x, y, drop_off, state)

    # Nearest needed item — pick ONLY when adjacent; skip item after 2 failed pick_ups
    items = state.get("items") or []
    candidates = [i for i in items if i.get("type") in needed]
    if candidates:
        candidates.sort(key=lambda i: manhattan(pos, i.get("position", [0, 0])))
        bot_id = bot["id"]
        for target in candidates:
            if failed_pickups.get((bot_id, target["id"]), 0) >= 2:
                continue
            ix, iy = target.get("position", [0, 0])
            if manhattan([x, y], [ix, iy]) == 1:
                return {"bot": bot["id"], "action": "pick_up", "item_id": target["id"]}
            # Always path to a cell adjacent to the item (never to the item cell)
            return step_toward_adjacent_to_item(bot["id"], x, y, [ix, iy], state)
        # All candidates skipped due to failed_pickups → deliver if we have items, else wait
        if bot.get("inventory"):
            return step_toward(bot["id"], x, y, drop_off, state)
        return {"bot": bot["id"], "action": "wait"}

    # Holding items but no needed items in sight → deliver
    if bot.get("inventory"):
        return step_toward(bot["id"], x, y, drop_off, state)

    return {"bot": bot["id"], "action": "wait"}


def _assign_targets(state: dict) -> dict[int, dict]:
    """
    Greedy assignment: each bot gets the nearest needed item not yet assigned.
    Returns bot_id -> item (or empty dict for that bot).
    """
    orders = state.get("orders") or []
    active = next((o for o in orders if o.get("status") == "active"), None)
    if not active:
        return {}
    needed = list(active.get("items_required") or [])
    for d in active.get("items_delivered") or []:
        if d in needed:
            needed.remove(d)
    items = state.get("items") or []
    candidates = [i for i in items if i.get("type") in needed]
    bots = state.get("bots") or []
    assigned_item_ids: set = set()
    bot_assignments: dict[int, dict] = {}
    remaining_needed = list(needed)
    for bot in sorted(bots, key=lambda b: b["id"]):
        if not remaining_needed:
            break
        best_item = None
        best_dist = 1_000_000
        pos = bot.get("position", [0, 0])
        for item in candidates:
            if item.get("id") in assigned_item_ids:
                continue
            if item.get("type") not in remaining_needed:
                continue
            d = manhattan(pos, item.get("position", [0, 0]))
            if d < best_dist:
                best_dist = d
                best_item = item
        if best_item:
            bot_assignments[bot["id"]] = best_item
            assigned_item_ids.add(best_item["id"])
            remaining_needed.remove(best_item["type"])
    return bot_assignments


def _item_still_on_map(state: dict, item_id: str) -> bool:
    """True if item_id is still in state['items'] (not yet picked)."""
    for it in state.get("items") or []:
        if it.get("id") == item_id:
            return True
    return False


def decide_level3(
    bot: dict,
    state: dict,
    bot_assignments: dict[int, dict],
    bots_at_drop: set | None = None,
    claimed_next_cells: set[tuple[int, int]] | None = None,
    failed_pickups: dict | None = None,
) -> dict[str, Any]:
    """
    Level 3: multiple bots, distinct targets. Only pick_up if item still on map.
    After 2 failed pick_ups for same item, go to drop_off or wait (replan next round).
    """
    failed_pickups = failed_pickups or {}
    pos = bot["position"]
    x, y = pos
    drop_off = list(state.get("drop_off") or [0, 0])
    bot_id = bot["id"]
    at_drop = (x == drop_off[0] and y == drop_off[1])

    if bot.get("inventory") and at_drop:
        # If another bot is already delivering here, wait to avoid collision
        if bots_at_drop and len(bots_at_drop) > 1 and bot_id != min(bots_at_drop):
            return {"bot": bot_id, "action": "wait"}
        return {"bot": bot_id, "action": "drop_off"}
    if len(bot.get("inventory") or []) >= 3:
        return step_toward(
            bot_id, x, y, drop_off, state,
            exclude_bot_id=bot_id, claimed_next_cells=claimed_next_cells,
        )

    # Deliver early: ≥1 item and close to drop_off or order nearly done
    inv = bot.get("inventory") or []
    active = next((o for o in (state.get("orders") or []) if o.get("status") == "active"), None)
    remaining_needed = list(active.get("items_required") or []) if active else []
    for d in (active.get("items_delivered") or []) if active else []:
        if d in remaining_needed:
            remaining_needed.remove(d)
    if inv and (manhattan(pos, drop_off) <= 6 or len(remaining_needed) <= 1):
        return step_toward(
            bot_id, x, y, drop_off, state,
            exclude_bot_id=bot_id, claimed_next_cells=claimed_next_cells,
        )

    target_item = bot_assignments.get(bot_id)
    if target_item and _item_still_on_map(state, target_item.get("id", "")):
        item_id = target_item.get("id", "")
        if failed_pickups.get((bot_id, item_id), 0) >= 2:
            # Replan: don't spam pick_up; deliver if we have items, else wait
            if bot.get("inventory"):
                return step_toward(
                    bot_id, x, y, drop_off, state,
                    exclude_bot_id=bot_id, claimed_next_cells=claimed_next_cells,
                )
            return {"bot": bot_id, "action": "wait"}
        ix, iy = target_item.get("position", [0, 0])
        if manhattan([x, y], [ix, iy]) == 1:
            return {"bot": bot_id, "action": "pick_up", "item_id": item_id}
        return step_toward_adjacent_to_item(
            bot_id, x, y, [ix, iy], state,
            exclude_bot_id=bot_id, claimed_next_cells=claimed_next_cells,
        )

    if bot.get("inventory"):
        return step_toward(
            bot_id, x, y, drop_off, state,
            exclude_bot_id=bot_id, claimed_next_cells=claimed_next_cells,
        )
    return {"bot": bot_id, "action": "wait"}


def decide_level1(_bot: dict, _state: dict) -> dict[str, Any]:
    """Level 1: always wait (connect and observe only)."""
    return {"bot": _bot["id"], "action": "wait"}
