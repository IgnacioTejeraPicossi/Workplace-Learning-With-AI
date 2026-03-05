#!/usr/bin/env python3
"""
NMiAI 2026 Grocery Bot — connect to game.ainm.no and play.
Usage:
  pip install -r requirements.txt
  set GROCERY_BOT_WS_URL=wss://game.ainm.no/ws?token=...   (or GROCERY_BOT_TOKEN)
  python bot.py              # Level 2 (play)
  python bot.py --level 1     # Level 1 (connect, wait, observe)
"""
import argparse
import asyncio
import json
import os
import sys

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
from strategy import decide_level1, decide, _assign_targets, manhattan


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
    async with websockets.connect(ws_url) as ws:
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
            if level == 1:
                assignments: dict[int, dict] = {}
            else:
                assignments = _assign_targets(state, failed_pickups)

            claimed: set[tuple[int, int]] = set()
            for bot in sorted(bots_list, key=lambda b: b["id"]):
                if level == 1:
                    action = decide_level1(bot, state)
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
                        help="1=wait only, 2=1-bot solver, 3=multi-bot (or auto when bots>1)")
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
