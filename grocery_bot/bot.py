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
from strategy import decide_level1, decide_level2


def _decide(bot: dict, state: dict, level: int):
    if level == 1:
        return decide_level1(bot, state)
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
                print(f"Game over. Score: {score}")
                break

            state = msg
            round_count += 1
            if verbose and round_count <= 2:
                print(f"Round {state.get('round', '?')}/{state.get('max_rounds', 300)} "
                      f"| bots: {len(state.get('bots', []))} | orders: {len(state.get('orders', []))}")

            actions = []
            for bot in state.get("bots", []):
                action = _decide(bot, state, level)
                actions.append(action)

            await ws.send(json.dumps({"actions": actions}))


def main():
    parser = argparse.ArgumentParser(description="NMiAI 2026 Grocery Bot")
    parser.add_argument("--level", type=int, default=2, choices=(1, 2),
                        help="1=connect & wait only, 2=play (Manhattan solver)")
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
