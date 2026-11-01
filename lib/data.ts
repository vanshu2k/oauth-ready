import fs from "node:fs";
import path from "node:path";
import type { CatalogToolkit, Guide } from "./types";

const DATA = path.join(process.cwd(), "data");

let guidesCache: Guide[] | null = null;
let catalogCache: CatalogToolkit[] | null = null;

export function curatedGuides(): Guide[] {
  if (!guidesCache) {
    const dir = path.join(DATA, "guides");
    guidesCache = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf-8")) as Guide)
      .sort((a, b) => tierRank(a.verdict.tier) - tierRank(b.verdict.tier));
  }
  return guidesCache;
}

export function curatedGuide(slug: string): Guide | undefined {
  return curatedGuides().find((g) => g.app.slug === slug);
}

export function catalog(): CatalogToolkit[] {
  if (!catalogCache) {
    const raw = JSON.parse(fs.readFileSync(path.join(DATA, "composio-oauth-catalog.json"), "utf-8"));
    catalogCache = raw.toolkits as CatalogToolkit[];
  }
  return catalogCache;
}

export interface VerificationRun {
  checkedAt: string;
  method: string[];
  totals: { set: string; quotes: number; verbatim: number; wordingErrors: number; deadSources: number; note: string }[];
  findings: { kind: "our_error" | "agent_error" | "source_problem" | "confirmed"; subject: string; text: string }[];
  lessons: string[];
}

export function verificationRun(): VerificationRun {
  return JSON.parse(fs.readFileSync(path.join(DATA, "verification.json"), "utf-8"));
}

export function guideSchema(): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(path.join(DATA, "guide.schema.json"), "utf-8"));
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

// Match free text ("Xero", "xero.com", "https://www.xero.com/") to a Composio toolkit.
export function findToolkit(query: string): CatalogToolkit | null {
  let q = query.trim().toLowerCase();
  try {
    if (/^https?:\/\//.test(q) || /\.[a-z]{2,}(\/|$)/.test(q)) {
      const host = new URL(q.startsWith("http") ? q : `https://${q}`).hostname.replace(/^www\./, "");
      q = host.split(".").slice(0, -1).join(" ") || host;
    }
  } catch {
    // not a URL; use as typed
  }
  const target = norm(q);
  if (!target) return null;
  const all = catalog();
  return (
    all.find((t) => norm(t.slug) === target) ??
    all.find((t) => norm(t.name) === target) ??
    all.find((t) => !t.name.endsWith("MCP") && (norm(t.name).startsWith(target) || target.startsWith(norm(t.name)))) ??
    null
  );
}

export function catalogStats() {
  const all = catalog();
  const managed = all.filter((t) => t.managed).length;
  const byo = all.filter((t) => !t.managed);
  const dcrOnly = byo.filter((t) => t.authSchemes.length === 1 && t.authSchemes[0] === "DCR_OAUTH").length;
  return { total: all.length, managed, byo: byo.length, dcrOnly, manual: byo.length - dcrOnly };
}

function tierRank(t: Guide["verdict"]["tier"]) {
  return { instant: 0, limited: 1, review: 2, gated: 3 }[t];
}
