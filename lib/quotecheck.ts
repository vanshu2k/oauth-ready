// Server-side port of scripts/check_quotes.py, run on every live-generated guide before it's saved.
// A plain fetch can't read client-rendered docs or bot-protected pages; those come back "unreadable"
// rather than "not_found", so a badge never blames the agent for what we couldn't check.
import type { Guide, Source } from "./types";

const MIN_READABLE = 500;
const TIMEOUT_MS = 8000;

function normalise(text: string): string {
  return text
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;|&#34;/g, '"')
    .replace(/&#39;|&#x27;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/ /g, " ")
    .replace(/\|/g, " ")
    .replace(/[`*_#]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?)\]])/g, "$1")
    .replace(/([(\[])\s+/g, "$1")
    .trim()
    .toLowerCase();
}

function fragments(quote: string): string[] {
  return quote
    .split(/\.\.\.|…/)
    .map((p) => normalise(p).replace(/^[ .,;:]+|[ .,;:]+$/g, ""))
    .filter((p) => p.length >= 12);
}

async function pageText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; oauth-ready-quote-check/1.0)", Accept: "text/html,*/*" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const raw = await res.text();
    return normalise(raw.replace(/<(script|style|noscript)\b[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]+>/g, " "));
  } catch {
    return null;
  }
}

// Mutates the guide: sets source.quoteCheck on every source that carries a quote.
export async function checkQuotes(guide: Guide): Promise<{ verified: number; notFound: number; unchecked: number }> {
  const sources: Source[] = guide.claims.flatMap((c) => c.evidence.sources.filter((s) => s.quote));
  const urls = [...new Set(sources.map((s) => s.url))].slice(0, 25);
  const pages = new Map(await Promise.all(urls.map(async (u) => [u, await pageText(u)] as const)));

  const tally = { verified: 0, notFound: 0, unchecked: 0 };
  for (const s of sources) {
    const text = pages.get(s.url);
    const frags = fragments(s.quote ?? "");
    if (!text || text.length < MIN_READABLE || frags.length === 0) {
      s.quoteCheck = "unreadable";
      tally.unchecked++;
    } else if (frags.every((f) => text.includes(f))) {
      s.quoteCheck = "verified";
      tally.verified++;
    } else {
      s.quoteCheck = "not_found";
      tally.notFound++;
    }
  }
  return tally;
}
