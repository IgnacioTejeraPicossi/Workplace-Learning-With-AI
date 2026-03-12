#!/usr/bin/env python3
"""
NMiAI 2026 Grocery Bot — connect to game.ainm.no and play.
Usage:
  pip install -r requirements.txt
  set GROCERY_BOT_WS_URL=wss://game.ainm.no/ws?token=...   (or GROCERY_BOT_TOKEN)
  python bot.py              # Level 2 / multi-bot play
  python bot.py --level 1    # Level 1 / single-bot baseline
"""
import argparse
import asyncio
import json
import os
import sys
from collections import Counter

try:
    import websockets
except ImportError:
    print("Install dependencies: pip install -r requirements.txt", file=sys.stderr)
    sys.exit(1)

# Load .env from grocery_bot/ then repo root (so GROCERY_BOT_* can live in either)
for _env in (
    os.path.join(os.path.dirname(__file__), ".env"),
    os.path.join(os.path.dirname(__file__), "..", ".env"),
):
    if os.path.isfile(_env):
        with open(_env, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))
        break

from config import get_ws_url
from strategy import decide_level1, decide_small_team, decide, _assign_targets_small_team, _assign_targets, manhattan


def _active_order(state: dict) -> dict | None:
    return next((o for o in state.get("orders") or [] if o.get("status") == "active"), None)


def _needed_types(order: dict | None) -> list[str]:
    if not order:
        return []
    needed = list(order.get("items_required") or [])
    for delivered in order.get("items_delivered") or []:
        if delivered in needed:
            needed.remove(delivered)
    return needed


def _merge_assignments(
    state: dict,
    previous_assignments: dict[int, dict] | None,
    failed_pickups: dict[tuple[int, str], int],
) -> dict[int, dict]:
    """
    Keep previous targets for empty bots when the target type is still needed.
    This reduces assignment thrash without changing targets for bots carrying items.
    """
    previous_assignments = previous_assignments or {}
    bots = sorted(state.get("bots") or [], key=lambda b: b["id"])
    items_by_id = {it.get("id"): it for it in (state.get("items") or [])}

    remaining_counts = Counter(_needed_types(_active_order(state)))
    for bot in bots:
        for t in bot.get("inventory") or []:
            if remaining_counts[t] > 0:
                remaining_counts[t] -= 1

    assignments: dict[int, dict] = {}
    reserved_item_ids: set[str] = set()

    # First, preserve existing targets for empty bots if the type is still needed.
    for bot in bots:
        bid = bot["id"]
        if bot.get("inventory"):
            continue
        prev = previous_assignments.get(bid)
        if not prev:
            continue
        prev_type = prev.get("type")
        prev_id = prev.get("id")
        if not prev_type or remaining_counts[prev_type] <= 0:
            continue
        if prev_id and failed_pickups.get((bid, prev_id), 0) >= 1:
            continue

        current_item = items_by_id.get(prev_id)
        kept_target = current_item or prev
        assignments[bid] = kept_target
        if current_item and prev_id:
            reserved_item_ids.add(prev_id)
        remaining_counts[prev_type] -= 1

    # Then fill the rest with fresh assignments.
    fresh_assignments = _assign_targets(state, failed_pickups)
    for bot in bots:
        bid = bot["id"]
        if bid in assignments or bot.get("inventory"):
            continue
        item = fresh_assignments.get(bid)
        if not item:
            continue
        item_id = item.get("id")
        if item_id in reserved_item_ids:
            continue
        assignments[bid] = item
        reserved_item_ids.add(item_id)

    return assignments


def _merge_small_team_assignments(
    state: dict,
    previous_assignments: dict[int, dict] | None,
    failed_pickups: dict[tuple[int, str], int],
) -> dict[int, dict]:
    """
    Keep small-team targets stable for empty bots while the assigned type is still
    needed. This avoids retargeting a bot to a different shelf type every round.
    """
    previous_assignments = previous_assignments or {}
    bots = sorted(state.get("bots") or [], key=lambda b: b["id"])
    items_by_id = {it.get("id"): it for it in (state.get("items") or [])}

    remaining_counts = Counter(_needed_types(_active_order(state)))
    for bot in bots:
        for t in bot.get("inventory") or []:
            if remaining_counts[t] > 0:
                remaining_counts[t] -= 1

    assignments: dict[int, dict] = {}
    reserved_item_ids: set[str] = set()

    # Preserve targets for empty bots if the assigned type is still needed.
    for bot in bots:
        bid = bot["id"]
        if bot.get("inventory"):
            continue
        prev = previous_assignments.get(bid)
        if not prev:
            continue
        prev_type = prev.get("type")
        prev_id = prev.get("id")
        if not prev_type or remaining_counts[prev_type] <= 0:
            continue
        if prev_id and failed_pickups.get((bid, prev_id), 0) >= 1:
            continue

        current_item = items_by_id.get(prev_id)
        kept_target = current_item or prev
        assignments[bid] = kept_target
        if current_item and prev_id:
            reserved_item_ids.add(prev_id)
        remaining_counts[prev_type] -= 1

    # Fill the rest using the simple small-team assigner.
    fresh_assignments = _assign_targets_small_team(state, failed_pickups)
    for bot in bots:
        bid = bot["id"]
        if bid in assignments or bot.get("inventory"):
            continue
        item = fresh_assignments.get(bid)
        if not item:
            continue
        item_id = item.get("id")
        item_type = item.get("type")
        if item_id in reserved_item_ids or remaining_counts[item_type] <= 0:
            continue
        assignments[bid] = item
        reserved_item_ids.add(item_id)
        remaining_counts[item_type] -= 1

    return assignments


def _next_position_after_action(bot: dict, action: dict) -> tuple[int, int] | None:
    """Cell the bot will be in after this action (for move_* only); None if no move."""
    act = action.get("action") or ""
    if act not in ("move_up", "move_down", "move_left", "move_right"):
        return None
    pos = bot.get("position") or [0, 0]
    x, y = pos[0], pos[1]
    if act == "move_left":
        return (x - 1, y)
    if act == "move_right":
        return (x + 1, y)
    if act == "move_up":
        return (x, y - 1)
    if act == "move_down":
        return (x, y + 1)
    return None


def _debug_print_state(state: dict):
    """Print a compact view of game state to verify structure (grid, walls, etc.)."""
    print("[DEBUG] Top-level keys:", list(state.keys()))
    grid = state.get("grid") or {}
    print("[DEBUG] grid keys:", list(grid.keys()), "| width:", grid.get("width"), "height:", grid.get("height"))
    walls = grid.get("walls") or []
    print("[DEBUG] walls: count =", len(walls), "| sample:", walls[:5] if len(walls) > 5 else walls)
    print("[DEBUG] drop_off:", state.get("drop_off"))
    bots = state.get("bots") or []
    print("[DEBUG] bots:", len(bots), "| positions:", [b.get("position") for b in bots])
    orders = state.get("orders") or []
    print("[DEBUG] orders:", len(orders), "| active:", next((o for o in orders if o.get("status") == "active"), None))
    items = state.get("items") or []
    print("[DEBUG] items:", len(items), "| sample:", items[:2])


async def play(ws_url: str, level: int = 2, verbose: bool = True, debug: bool = False, trace: bool = False):
    async with websockets.connect(
        ws_url,
        ping_interval=None,
        ping_timeout=None,
        close_timeout=5,
    ) as ws:
        round_count = 0
        while True:
            raw = await ws.recv()
            msg = json.loads(raw)
            msg_type = msg.get("type", "game_state")

            if msg_type == "game_over":
                score = msg.get("score", 0)
                reason = msg.get("reason") or msg.get("message") or ""
                print(f"Game over. Score: {score} | Rounds played: {round_count}")
                if reason:
                    print(f"  Reason: {reason}")
                break

            state = msg
            round_count += 1
            if debug and round_count == 1:
                _debug_print_state(state)
                try:
                    with open(os.path.join(os.path.dirname(__file__), "debug_first_state.json"), "w", encoding="utf-8") as f:
                        json.dump(state, f, indent=2)
                    print("[DEBUG] Full state saved to grocery_bot/debug_first_state.json")
                except Exception as e:
                    print("[DEBUG] Could not save state file:", e)
            if verbose:
                r = state.get("round", "?")
                if round_count <= 3 or round_count % 50 == 0:
                    print(f"Round {r}/{state.get('max_rounds', 300)} "
                          f"| bots: {len(state.get('bots', []))} | orders: {len(state.get('orders', []))}")

            actions = []
            bots_list = state.get("bots") or []
            use_single_bot_solver = len(bots_list) == 1 and level != 3
            use_small_team_solver = 1 < len(bots_list) <= 3 and level != 3
            # Detect failed pick_ups: last round we sent pick_up but inventory didn't change
            failed_pickups: dict[tuple[int, str], int] = getattr(play, "_failed_pickups", None) or {}
            last_round = getattr(play, "_last_round", None)
            if last_round:
                for b in bots_list:
                    bid = b["id"]
                    pos = tuple(b.get("position") or [0, 0])
                    inv = tuple(b.get("inventory") or [])
                    prev = last_round.get(bid)
                    if prev and prev.get("action") == "pick_up":
                        item_id = prev.get("item_id", "")
                        if prev.get("pos") == pos and prev.get("inv") == inv and item_id:
                            key = (bid, item_id)
                            failed_pickups[key] = failed_pickups.get(key, 0) + 1
                    elif prev and len(inv) > len(prev.get("inv") or []):
                        for k in list(failed_pickups):
                            if k[0] == bid:
                                del failed_pickups[k]
            play._failed_pickups = failed_pickups

            # Compute assignments ONCE per round (not per bot)
            if use_single_bot_solver or level == 1:
                assignments: dict[int, dict] = {}
            elif use_small_team_solver:
                previous_assignments: dict[int, dict] = getattr(play, "_assignments", None) or {}
                assignments = _merge_small_team_assignments(state, previous_assignments, failed_pickups)
            else:
                previous_assignments: dict[int, dict] = getattr(play, "_assignments", None) or {}
                assignments = _merge_assignments(state, previous_assignments, failed_pickups)
            play._assignments = assignments

            claimed: set[tuple[int, int]] = set()
            for bot in sorted(bots_list, key=lambda b: b["id"]):
                if use_single_bot_solver or level == 1:
                    action = decide_level1(bot, state)
                elif use_small_team_solver:
                    action = decide_small_team(
                        bot,
                        state,
                        assignments,
                        claimed_cells=claimed if len(bots_list) > 1 else None,
                        failed_pickups=failed_pickups,
                    )
                else:
                    action = decide(
                        bot, state, assignments,
                        claimed_cells=claimed if len(bots_list) > 1 else None,
                        failed_pickups=failed_pickups,
                    )
                actions.append(action)
                next_pos = _next_position_after_action(bot, action)
                if next_pos:
                    claimed.add(next_pos)

            sorted_bots = sorted(bots_list, key=lambda x: x["id"])
            play._last_round = {}
            for i, b in enumerate(sorted_bots):
                if i >= len(actions):
                    break
                act = actions[i]
                play._last_round[b["id"]] = {
                    "pos": tuple(b.get("position") or [0, 0]),
                    "action": act.get("action"),
                    "item_id": act.get("item_id", "") if act.get("action") == "pick_up" else "",
                    "inv": tuple(b.get("inventory") or []),
                }

            if trace and round_count <= 10:
                for bot, action in zip(sorted(bots_list, key=lambda b: b["id"]), actions):
                    pos = bot.get("position", [0, 0])
                    inv = bot.get("inventory") or []
                    act = action.get("action", "?")
                    extra = ""
                    if action.get("item_id"):
                        item_id = action["item_id"]
                        item_obj = next((i for i in (state.get("items") or []) if i.get("id") == item_id), None)
                        item_pos = item_obj["position"] if item_obj else "?"
                        dist = manhattan(pos, item_pos) if item_obj else "?"
                        extra = f" item={item_id} at {item_pos} dist={dist}"
                    inv_str = f" inv={inv}" if inv else ""
                    print(f"  [Trace] Round {round_count} bot {bot['id']} pos={pos}{inv_str} -> {act}{extra}")
                if round_count == 1:
                    for bid, item in assignments.items():
                        print(f"  [Trace] Assignment: bot {bid} -> {item.get('type')} at {item.get('position')}")

            await ws.send(json.dumps({"actions": actions}))


def main():
    parser = argparse.ArgumentParser(description="NMiAI 2026 Grocery Bot")
    parser.add_argument("--level", type=int, default=2, choices=(1, 2, 3),
                        help="1=single-bot baseline, 2=auto single/multi, 3=force multi-bot strategy")
    parser.add_argument("--quiet", action="store_true", help="Less console output")
    parser.add_argument("--debug", action="store_true", help="Print first game state (grid, walls, etc.) to fix strategy")
    parser.add_argument("--trace", action="store_true", help="Print each bot position+action for first 10 rounds (to see why score is low)")
    args = parser.parse_args()

    try:
        ws_url = get_ws_url()
    except SystemExit as e:
        print(e.args[0] if e.args else "Missing GROCERY_BOT_WS_URL or GROCERY_BOT_TOKEN", file=sys.stderr)
        sys.exit(1)

    if not args.quiet:
        print(f"Connecting (level={args.level})...")
    asyncio.run(play(ws_url, level=args.level, verbose=not args.quiet, debug=args.debug, trace=args.trace))


if __name__ == "__main__":
    main()
