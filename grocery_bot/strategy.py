"""
NMiAI 2026 Grocery Bot — decision logic.
Level 2: single-bot Manhattan. Level 3: multi-bot coordination (assign distinct targets).
"""
from typing import Any


def manhattan(a: list, b: list) -> int:
    return abs(a[0] - b[0]) + abs(a[1] - b[1])


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


def decide_level2(bot: dict, state: dict) -> dict[str, Any]:
    """
    Level 2: one bot, Manhattan movement, no pathfinding.
    - Deliver at drop_off if holding items and on drop_off.
    - Else take active order, collect needed items (nearest first), then deliver.
    """
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
        return move_toward(bot["id"], x, y, drop_off)

    # Nearest needed item
    items = state.get("items") or []
    candidates = [i for i in items if i.get("type") in needed]
    if candidates:
        candidates.sort(key=lambda i: manhattan(pos, i.get("position", [0, 0])))
        target = candidates[0]
        ix, iy = target.get("position", [0, 0])
        if manhattan([x, y], [ix, iy]) == 1:
            return {"bot": bot["id"], "action": "pick_up", "item_id": target["id"]}
        return move_toward(bot["id"], x, y, [ix, iy])

    # Holding items but no needed items in sight → deliver
    if bot.get("inventory"):
        return move_toward(bot["id"], x, y, drop_off)

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
    bot: dict, state: dict, bot_assignments: dict[int, dict], bots_at_drop: set | None = None
) -> dict[str, Any]:
    """
    Level 3: multiple bots, distinct targets. Only pick_up if item still on map.
    bots_at_drop: bot ids that are already on drop_off this round (only one should deliver).
    """
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
        return move_toward(bot_id, x, y, drop_off)

    target_item = bot_assignments.get(bot_id)
    if target_item and _item_still_on_map(state, target_item.get("id", "")):
        ix, iy = target_item.get("position", [0, 0])
        if manhattan([x, y], [ix, iy]) == 1:
            return {"bot": bot_id, "action": "pick_up", "item_id": target_item["id"]}
        return move_toward(bot_id, x, y, [ix, iy])

    if bot.get("inventory"):
        return move_toward(bot_id, x, y, drop_off)
    return {"bot": bot_id, "action": "wait"}


def decide_level1(_bot: dict, _state: dict) -> dict[str, Any]:
    """Level 1: always wait (connect and observe only)."""
    return {"bot": _bot["id"], "action": "wait"}
