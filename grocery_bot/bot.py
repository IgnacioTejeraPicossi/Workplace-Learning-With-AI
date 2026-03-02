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
from strategy import decide_level1, decide_level2, decide_level3, _assign_targets


def _bots_at_drop(state: dict) -> set:
    """Bot ids that are on drop_off and have inventory (for collision avoidance)."""
    drop = state.get("drop_off") or [0, 0]
    out = set()
    for b in state.get("bots") or []:
        pos = b.get("position") or [0, 0]
        if pos[0] == drop[0] and pos[1] == drop[1] and (b.get("inventory") or []):
            out.add(b["id"])
    return out


def _decide(bot: dict, state: dict, level: int, bots_at_drop: set | None = None):
    if level == 1:
        return decide_level1(bot, state)
    bots = state.get("bots") or []
    if level >= 3 or len(bots) > 1:
        assignments = _assign_targets(state)
        return decide_level3(bot, state, assignments, bots_at_drop=bots_at_drop or set())
    return decide_level2(bot, state)


async def play(ws_url: str, level: int = 2, verbose: bool = True):
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
            if verbose:
                r = state.get("round", "?")
                if round_count <= 3 or round_count % 50 == 0:
                    print(f"Round {r}/{state.get('max_rounds', 300)} "
                          f"| bots: {len(state.get('bots', []))} | orders: {len(state.get('orders', []))}")

            actions = []
            bots_list = state.get("bots") or []
            at_drop = _bots_at_drop(state) if (level >= 3 or len(bots_list) > 1) else None
            for bot in bots_list:
                action = _decide(bot, state, level, bots_at_drop=at_drop)
                actions.append(action)

            await ws.send(json.dumps({"actions": actions}))


def main():
    parser = argparse.ArgumentParser(description="NMiAI 2026 Grocery Bot")
    parser.add_argument("--level", type=int, default=2, choices=(1, 2, 3),
                        help="1=wait only, 2=1-bot solver, 3=multi-bot (or auto when bots>1)")
    parser.add_argument("--quiet", action="store_true", help="Less console output")
    args = parser.parse_args()

    try:
        ws_url = get_ws_url()
    except SystemExit as e:
        print(e.args[0] if e.args else "Missing GROCERY_BOT_WS_URL or GROCERY_BOT_TOKEN", file=sys.stderr)
        sys.exit(1)

    if not args.quiet:
        print(f"Connecting (level={args.level})...")
    asyncio.run(play(ws_url, level=args.level, verbose=not args.quiet))


if __name__ == "__main__":
    main()
