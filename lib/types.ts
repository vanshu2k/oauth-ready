// Mirrors data/guide.schema.json. The schema is the source of truth; lib/validate.ts enforces it.

export type Tier = "instant" | "limited" | "review" | "gated";
export type Actor = "agent" | "developer" | "customer_admin" | "provider";
export type EvidenceLevel = "tested" | "official" | "third_party" | "inferred" | "unknown";
export type Unit = "minutes" | "hours" | "days" | "weeks";

export interface Duration {
  min: number;
  max: number;
  unit: Unit;
}

export interface Clock {
  definition: string;
  effort: Duration;
  wait: Duration;
  summary: string;
  claimIds: string[];
}

export interface Step {
  id: string;
  title: string;
  actor: Actor;
  instructions: string;
  agentHelp?: string;
  whyHuman?: string;
  links?: string[];
  estimate?: Duration;
  claimIds: string[];
}

export interface Stage {
  id: string;
  name: string;
  unlocks: string;
  steps: Step[];
}

export interface Source {
  url: string;
  title?: string;
  publisher: "provider" | "composio" | "third_party" | "community";
  quote?: string;
  retrievedAt: string;
  quoteCheck?: "verified" | "not_found" | "unreadable";
}

export interface Claim {
  id: string;
  text: string;
  evidence: {
    level: EvidenceLevel;
    sources: Source[];
    testNote?: string;
    conflicts?: { otherValue: string; sourceUrl: string; resolution: string }[];
  };
  checkedAt: string;
}

export interface Guide {
  schemaVersion: "1.0";
  app: { slug: string; name: string; website: string; developerPortal: string; category?: string };
  verdict: {
    tier: Tier;
    summary: string;
    whoMustAct: Actor[];
    customerAdminRequired: boolean;
    cost: { summary: string; claimIds: string[] };
    claimIds: string[];
  };
  clocks: { firstConnection: Clock; production: Clock };
  stages: Stage[];
  requirements: { id: string; kind: string; description: string; neededFor: "first_connection" | "production" | "scale"; claimIds: string[] }[];
  limits: { id: string; what: string; value: string; appliesWhen: string; claimIds: string[] }[];
  gotchas: { id: string; symptom: string; cause: string; fix: string; claimIds: string[] }[];
  composioSetup: {
    toolkitSlug: string;
    managedOAuthAvailable: boolean;
    authSchemes: string[];
    redirectUri: string;
    defaultScopes: string[];
    scopeNotes: { scope: string; sensitivity: "basic" | "sensitive" | "restricted" | "admin_consent" | "unknown"; note: string }[];
    claimIds: string[];
  };
  claims: Claim[];
  openQuestions: { question: string; whyItMatters: string; howToResolve: string }[];
  corrections: { date: string; before: string; after: string; why: string; sourceUrl: string }[];
  meta: { generatedBy: "curated" | "live_agent"; generatedAt: string; model?: string; humanReviewed: boolean };
}

export interface CatalogToolkit {
  slug: string;
  name: string;
  category: string;
  managed: boolean;
  authSchemes: string[];
  defaultScopes: string[];
}

// Events streamed from /api/generate to the browser.
export type AgentEvent =
  | { type: "status"; text: string }
  | { type: "catalog"; toolkit: CatalogToolkit | null }
  | { type: "search"; query: string }
  | { type: "fetch"; url: string }
  | { type: "note"; text: string }
  | { type: "writing"; chars: number }
  | { type: "validation"; errors: string[] }
  | { type: "done"; guide: Guide; id: string | null; shareUrl: string | null }
  | { type: "error"; message: string };
