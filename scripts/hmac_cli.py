#!/usr/bin/env python3
"""
Compute/verify HMAC-SHA256 for AgentOps callbacks.

Usage:
  # Compute signature for a JSON file
  AGENTOPS_HMAC_SECRET=changeme python scripts/hmac_cli.py sign --file payload.json

  # Compute signature from stdin
  echo '{"hello":"world"}' | AGENTOPS_HMAC_SECRET=changeme python scripts/hmac_cli.py sign

  # Verify provided signature against body
  echo '{"hello":"world"}' | AGENTOPS_HMAC_SECRET=changeme python scripts/hmac_cli.py verify --sig 0123abcd...
"""
import sys
import os
import json
import argparse
from backend.services.agentops.security import compute_hmac_hex, verify_hmac

def read_body_from_args(args):
    if args.file:
        with open(args.file, "rb") as f:
            return f.read()
    return sys.stdin.buffer.read()

def main():
    p = argparse.ArgumentParser()
    sub = p.add_subparsers(dest="cmd", required=True)

    s1 = sub.add_parser("sign", help="Compute signature hex for a body")
    s1.add_argument("--file", help="Path to file (defaults to stdin)")

    s2 = sub.add_parser("verify", help="Verify signature for a body")
    s2.add_argument("--sig", required=True, help="Signature hex to verify against")
    s2.add_argument("--file", help="Path to file (defaults to stdin)")

    args = p.parse_args()
    secret = os.getenv("AGENTOPS_HMAC_SECRET", "")
    if not secret:
        print("ERROR: Set AGENTOPS_HMAC_SECRET in environment.", file=sys.stderr)
        sys.exit(2)

    if args.cmd == "sign":
        body = read_body_from_args(args)
        print(compute_hmac_hex(secret, body))
    elif args.cmd == "verify":
        body = read_body_from_args(args)
        ok = verify_hmac(args.sig, body, secret)
        print("OK" if ok else "FAIL")
        sys.exit(0 if ok else 1)

if __name__ == "__main__":
    main()
