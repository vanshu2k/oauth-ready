// Pure helpers (no Node imports) shared by the validator and the browser.
import type { Claim, Guide } from "./types";

const STRONG = new Set(["tested", "official"]);

// Claim ids (from the given list) whose evidence is below tested/official. The UI labels these "estimate".
export function weakClaims(g: Guide, ids: string[]): string[] {
  return ids.filter((id) => {
    const c = g.claims.find((x) => x.id === id);
    return c && !STRONG.has(c.evidence.level);
  });
}

export function evidenceMix(g: Guide): Record<Claim["evidence"]["level"], number> {
  const mix = { tested: 0, official: 0, third_party: 0, inferred: 0, unknown: 0 };
  for (const c of g.claims) mix[c.evidence.level]++;
  return mix;
}
