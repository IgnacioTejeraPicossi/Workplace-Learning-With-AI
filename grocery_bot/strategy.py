"""
NMiAI 2026 Grocery Bot — decision logic (Level 2: single-bot Manhattan).
Easily swappable for Level 3/4 (multi-bot coordination, pathfinding).
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


def decide_level1(_bot: dict, _state: dict) -> dict[str, Any]:
    """Level 1: always wait (connect and observe only)."""
    return {"bot": _bot["id"], "action": "wait"}
