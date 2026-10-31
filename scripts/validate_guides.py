"""Validate guides/*.json against the schema plus the evidence rules the schema can't express.

Usage: python scripts/validate_guides.py [data/guides/xero.json ...]
Errors fail the run. Warnings are what the UI should flag (e.g. a clock backed only by an inference).
"""
import json
import sys
from pathlib import Path

from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parent.parent
SCHEMA = json.loads((ROOT / "data" / "guide.schema.json").read_text(encoding="utf-8"))
STRONG = {"tested", "official"}


def referenced_claim_ids(guide):
    """Yield (where, claim_id) for every claimIds list in the guide."""
    def walk(node, path):
        if isinstance(node, dict):
            for key, value in node.items():
                if key == "claimIds":
                    for cid in value:
                        yield path, cid
                else:
                    yield from walk(value, f"{path}.{key}")
        elif isinstance(node, list):
            for i, item in enumerate(node):
                yield from walk(item, f"{path}[{i}]")
    yield from walk({k: v for k, v in guide.items() if k != "claims"}, "")


def check(guide):
    errors, warnings = [], []

    for err in Draft202012Validator(SCHEMA).iter_errors(guide):
        errors.append(f"schema: {'/'.join(map(str, err.path))}: {err.message}")
    if errors:
        return errors, warnings

    claims = {}
    for c in guide["claims"]:
        if c["id"] in claims:
            errors.append(f"duplicate claim id {c['id']}")
        claims[c["id"]] = c
        ev = c["evidence"]
        if ev["level"] in {"official", "third_party"} and not ev["sources"]:
            errors.append(f"claim {c['id']} is {ev['level']} but cites no source")
        if ev["level"] == "official" and not any(s["publisher"] in {"provider", "composio"} for s in ev["sources"]):
            errors.append(f"claim {c['id']} is official but no source is from the provider or Composio")
        if ev["level"] == "tested" and not ev.get("testNote"):
            errors.append(f"claim {c['id']} is tested but has no testNote")

    used = set()
    for where, cid in referenced_claim_ids(guide):
        used.add(cid)
        if cid not in claims:
            errors.append(f"{where} references missing claim {cid}")

    for cid in claims.keys() - used:
        warnings.append(f"claim {cid} is not referenced anywhere")

    step_ids = [s["id"] for st in guide["stages"] for s in st["steps"]]
    for sid in {s for s in step_ids if step_ids.count(s) > 1}:
        errors.append(f"duplicate step id {sid}")

    # Headline numbers should rest on strong evidence; otherwise the UI labels them as estimates.
    headline = [("verdict", guide["verdict"]["claimIds"]),
                ("clocks.firstConnection", guide["clocks"]["firstConnection"]["claimIds"]),
                ("clocks.production", guide["clocks"]["production"]["claimIds"])]
    for where, ids in headline:
        if not ids:
            warnings.append(f"{where} has no supporting claims")
        weak = [i for i in ids if i in claims and claims[i]["evidence"]["level"] not in STRONG]
        if weak:
            warnings.append(f"{where} rests partly on weak evidence: {', '.join(weak)} (show as estimate)")

    for name in ("firstConnection", "production"):
        for part in ("effort", "wait"):
            d = guide["clocks"][name][part]
            if d["min"] > d["max"]:
                errors.append(f"clocks.{name}.{part}: min > max")

    return errors, warnings


def main(paths):
    paths = [Path(p) for p in paths] or sorted((ROOT / "data" / "guides").glob("*.json"))
    failed = False
    for path in paths:
        guide = json.loads(path.read_text(encoding="utf-8"))
        errors, warnings = check(guide)
        levels = {}
        for c in guide.get("claims", []):
            lvl = c["evidence"]["level"]
            levels[lvl] = levels.get(lvl, 0) + 1
        print(f"{path.name}: {len(errors)} errors, {len(warnings)} warnings, claims by evidence {levels}")
        for e in errors:
            print(f"  ERROR   {e}")
        for w in warnings:
            print(f"  WARN    {w}")
        failed |= bool(errors)
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main(sys.argv[1:])
