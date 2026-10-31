// Same rules as scripts/validate_guides.py: JSON Schema first, then the evidence rules a schema can't express.
import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";
import { guideSchema } from "./data";
import { weakClaims } from "./evidence";
import type { Claim, Guide } from "./types";

let compiled: ReturnType<Ajv2020["compile"]> | null = null;
function schemaValidator() {
  if (!compiled) {
    const ajv = new Ajv2020({ allErrors: true, strict: false });
    addFormats(ajv);
    compiled = ajv.compile(guideSchema());
  }
  return compiled;
}

function referencedClaimIds(guide: Guide): [string, string][] {
  const out: [string, string][] = [];
  const walk = (node: unknown, where: string) => {
    if (Array.isArray(node)) node.forEach((n, i) => walk(n, `${where}[${i}]`));
    else if (node && typeof node === "object") {
      for (const [k, v] of Object.entries(node)) {
        if (k === "claims") continue;
        if (k === "claimIds" && Array.isArray(v)) v.forEach((id) => out.push([where, String(id)]));
        else walk(v, `${where}.${k}`);
      }
    }
  };
  walk(guide, "");
  return out;
}

export function validateGuide(guide: unknown, opts: { live?: boolean } = {}): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  const check = schemaValidator();
  if (!check(guide)) {
    for (const e of check.errors ?? []) errors.push(`schema ${e.instancePath || "/"}: ${e.message}`);
    return { errors: errors.slice(0, 25), warnings };
  }
  const g = guide as Guide;

  const claims = new Map<string, Claim>();
  for (const c of g.claims) {
    if (claims.has(c.id)) errors.push(`duplicate claim id ${c.id}`);
    claims.set(c.id, c);
    const ev = c.evidence;
    if ((ev.level === "official" || ev.level === "third_party") && ev.sources.length === 0)
      errors.push(`claim ${c.id} is ${ev.level} but cites no source`);
    if (ev.level === "official" && !ev.sources.some((s) => s.publisher === "provider" || s.publisher === "composio"))
      errors.push(`claim ${c.id} is official but no source is from the provider or Composio`);
    if (ev.level === "tested" && !ev.testNote) errors.push(`claim ${c.id} is tested but has no testNote`);
    if (opts.live && ev.level === "tested")
      errors.push(`claim ${c.id} is marked tested, but the live agent cannot run setup steps; use official, third_party or inferred`);
  }

  const used = new Set<string>();
  for (const [where, id] of referencedClaimIds(g)) {
    used.add(id);
    if (!claims.has(id)) errors.push(`${where || "/"} references missing claim ${id}`);
  }
  for (const id of claims.keys()) if (!used.has(id)) warnings.push(`claim ${id} is not referenced anywhere`);

  const stepIds = g.stages.flatMap((s) => s.steps.map((st) => st.id));
  for (const id of new Set(stepIds.filter((s, i) => stepIds.indexOf(s) !== i))) errors.push(`duplicate step id ${id}`);

  for (const name of ["firstConnection", "production"] as const)
    for (const part of ["effort", "wait"] as const) {
      const d = g.clocks[name][part];
      if (d.min > d.max) errors.push(`clocks.${name}.${part}: min > max`);
    }

  for (const [where, ids] of [
    ["verdict", g.verdict.claimIds],
    ["clocks.firstConnection", g.clocks.firstConnection.claimIds],
    ["clocks.production", g.clocks.production.claimIds],
  ] as const) {
    if (ids.length === 0) warnings.push(`${where} has no supporting claims`);
    const weak = weakClaims(g, ids);
    if (weak.length) warnings.push(`${where} rests partly on weak evidence: ${weak.join(", ")}`);
  }

  return { errors, warnings };
}

