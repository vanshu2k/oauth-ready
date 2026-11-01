"""Re-fetch every quoted source and check the quote still appears on the page.

Usage: python scripts/check_quotes.py [guide.json ...] [--out data/quote-check.json]
Defaults to data/guides/*.json. A quote with "..." is split into fragments; each fragment
must appear (after normalising whitespace, quotes and HTML). Statuses:
  verified   every fragment found on the live page
  partial    some fragments found
  not_found  none found on a readable page (the page changed, or the quote is wrong)
  unreadable the page renders client-side, so plain HTML can't be checked; needs a browser
  fetch_failed  the page couldn't be fetched (often bot protection)
"""
import html
import json
import re
import sys
import urllib.request
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
UA = "Mozilla/5.0 (compatible; oauth-ready-quote-check/1.0)"
MIN_READABLE = 500
_cache: dict[str, tuple[int, str]] = {}


def normalise(text: str) -> str:
    text = html.unescape(text)
    text = (text.replace("’", "'").replace("‘", "'").replace("“", '"').replace("”", '"')
            .replace("–", "-").replace("—", "-").replace(" ", " ").replace("|", " "))
    text = re.sub(r"[`*_#]", "", text)
    text = re.sub(r"\s+", " ", text)
    # Removing inline tags (links, <code>) leaves gaps around punctuation: "scopes , you".
    text = re.sub(r"\s+([,.;:!?)\]])", r"\1", text)
    text = re.sub(r"([(\[])\s+", r"\1", text)
    return text.strip().lower()


def page_text(url: str) -> tuple[int, str]:
    if url not in _cache:
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html,*/*"})
            with urllib.request.urlopen(req, timeout=25) as res:
                raw = res.read().decode("utf-8", errors="replace")
                status = res.status
        except Exception as exc:  # network errors, 4xx/5xx
            _cache[url] = (getattr(exc, "code", 0) or 0, "")
            return _cache[url]
        raw = re.sub(r"(?is)<(script|style|noscript)\b.*?</\1>", " ", raw)
        raw = re.sub(r"(?s)<[^>]+>", " ", raw)
        _cache[url] = (status, normalise(raw))
    return _cache[url]


def fragments(quote: str) -> list[str]:
    parts = re.split(r"\.\.\.|…", quote)
    return [normalise(p).strip(" .,;:") for p in parts if len(normalise(p).strip(" .,;:")) >= 12]


def check_guide(path: Path) -> list[dict]:
    guide = json.loads(path.read_text(encoding="utf-8"))
    rows = []
    for claim in guide["claims"]:
        for src in claim["evidence"]["sources"]:
            quote = src.get("quote")
            if not quote:
                continue
            status_code, text = page_text(src["url"])
            frags = fragments(quote)
            if not text:
                status = "fetch_failed"
                found = 0
            elif len(text) < MIN_READABLE:
                # Client-rendered page: plain HTML holds little more than the title.
                status = "unreadable"
                found = 0
            else:
                found = sum(1 for f in frags if f in text)
                status = "verified" if frags and found == len(frags) else "partial" if found else "not_found"
            rows.append({
                "guide": guide["app"]["slug"],
                "generatedBy": guide["meta"]["generatedBy"],
                "claim": claim["id"],
                "level": claim["evidence"]["level"],
                "url": src["url"],
                "httpStatus": status_code,
                "status": status,
                "fragmentsFound": found,
                "fragmentsTotal": len(frags),
            })
    return rows


def main(argv: list[str]) -> None:
    out = None
    if "--out" in argv:
        i = argv.index("--out")
        out = Path(argv[i + 1])
        argv = argv[:i] + argv[i + 2:]
    paths = [Path(p) for p in argv] or sorted((ROOT / "data" / "guides").glob("*.json"))
    rows = [r for p in paths for r in check_guide(p)]
    summary: dict[str, dict[str, int]] = {}
    for r in rows:
        s = summary.setdefault(r["guide"], {"verified": 0, "partial": 0, "not_found": 0, "unreadable": 0, "fetch_failed": 0})
        s[r["status"]] += 1
    for guide, s in summary.items():
        print(f"{guide:16} " + "  ".join(f"{k}={v}" for k, v in s.items()))
    for r in rows:
        if r["status"] != "verified":
            print(f"  {r['status']:12} {r['guide']}/{r['claim']} ({r['fragmentsFound']}/{r['fragmentsTotal']}) {r['url']}")
    if out:
        out.write_text(json.dumps({"checkedAt": date.today().isoformat(), "summary": summary, "results": rows}, indent=1), encoding="utf-8")


if __name__ == "__main__":
    main(sys.argv[1:])
