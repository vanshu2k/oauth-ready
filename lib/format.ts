import type { Actor, Duration, EvidenceLevel, Tier } from "./types";

const UNIT_SHORT: Record<Duration["unit"], [string, string]> = {
  minutes: ["min", "min"],
  hours: ["hour", "hours"],
  days: ["day", "days"],
  weeks: ["week", "weeks"],
};

export function formatDuration(d: Duration): string {
  if (d.max === 0) return "None";
  const [one, many] = UNIT_SHORT[d.unit];
  if (d.min === d.max) return `${d.max} ${d.max === 1 ? one : many}`;
  return `${d.min}–${d.max} ${many}`;
}

export const TIER: Record<Tier, { label: string; blurb: string }> = {
  instant: { label: "Instant", blurb: "Register and serve any number of users. No review, no fee." },
  limited: { label: "Self-serve, with limits", blurb: "Starts self-serve, then hits a cap, a paid plan, or a light review." },
  review: { label: "Provider review", blurb: "Going live needs a provider review or assessment measured in weeks." },
  gated: { label: "Gated", blurb: "Needs something you don't control: a partnership, a paid membership, or each customer's tenant." },
};

export const ACTOR: Record<Actor, string> = {
  agent: "Agent can do this",
  developer: "You",
  customer_admin: "Your customer's admin",
  provider: "Provider",
};

export const EVIDENCE: Record<EvidenceLevel, { label: string; blurb: string }> = {
  tested: { label: "Tested", blurb: "We did it and recorded what happened." },
  official: { label: "Official", blurb: "Stated in the provider's or Composio's own docs, quoted." },
  third_party: { label: "Third-party", blurb: "Blogs, forums or aggregators. Treat with care." },
  inferred: { label: "Inferred", blurb: "Our reasoning or estimate. Never shown as fact." },
  unknown: { label: "Unknown", blurb: "We looked and couldn't find out." },
};

export function host(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
