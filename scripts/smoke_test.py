"""Daily connection check: run one read-only tool per tested guide through Composio.

Usage: COMPOSIO_API_KEY=... python scripts/smoke_test.py
Reads data/smoke-tests.json and writes data/smoke-status.json. For each check it finds an
ACTIVE connected account for the toolkit, executes the tool, and records pass/fail and latency.
The tool's response data is never stored (it can contain account details).
"""
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
API = "https://backend.composio.dev/api/v3"


def call(method: str, path: str, key: str, body: dict | None = None) -> tuple[int, dict]:
    req = urllib.request.Request(
        API + path,
        method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={"x-api-key": key, "Content-Type": "application/json", "Accept": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as res:
            return res.status, json.loads(res.read() or b"{}")
    except urllib.error.HTTPError as exc:
        try:
            return exc.code, json.loads(exc.read() or b"{}")
        except ValueError:
            return exc.code, {}


def short(err) -> str:
    text = err if isinstance(err, str) else json.dumps(err)
    return text[:200]


def run_check(check: dict, key: str) -> dict:
    result = {"guide": check["guide"], "toolkit": check["toolkit"], "tool": check["tool"]}
    query = urllib.parse.urlencode({"toolkit_slugs": check["toolkit"], "statuses": "ACTIVE", "limit": 5})
    status, listing = call("GET", f"/connected_accounts?{query}", key)
    if status != 200:
        return {**result, "status": "error", "detail": f"Listing connected accounts failed (HTTP {status}): {short(listing)}"}
    accounts = [a for a in listing.get("items", []) if a.get("status") == "ACTIVE"]
    if not accounts:
        return {**result, "status": "no_connection", "detail": "No ACTIVE connected account for this toolkit."}

    account = accounts[0]
    started = time.monotonic()
    status, out = call(
        "POST",
        f"/tools/execute/{check['tool']}",
        key,
        {"connected_account_id": account["id"], "user_id": account.get("user_id"), "arguments": check.get("arguments", {})},
    )
    latency = round((time.monotonic() - started) * 1000)
    if status == 200 and out.get("successful"):
        return {**result, "status": "pass", "latencyMs": latency}
    return {**result, "status": "fail", "latencyMs": latency, "detail": short(out.get("error") or out or f"HTTP {status}")}


def main() -> None:
    key = os.environ.get("COMPOSIO_API_KEY")
    if not key:
        sys.exit("COMPOSIO_API_KEY is not set")
    config = json.loads((ROOT / "data" / "smoke-tests.json").read_text(encoding="utf-8"))
    results = [run_check(c, key) for c in config["checks"]]
    for r in results:
        print(f"{r['status']:14} {r['guide']:12} {r['tool']} {r.get('latencyMs', '')} {r.get('detail', '')}")
    status = {"runAt": datetime.now(timezone.utc).isoformat(timespec="seconds"), "results": results}
    (ROOT / "data" / "smoke-status.json").write_text(json.dumps(status, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
