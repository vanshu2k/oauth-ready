// The live research agent: Claude with server-side web search/fetch researches a provider,
// then submits a guide through the `submit_guide` tool. The guide is validated with the same
// rules as the curated library; validation errors go back to the model to fix.
import Anthropic from "@anthropic-ai/sdk";
import { curatedGuide, findToolkit, guideSchema } from "./data";
import type { AgentEvent, CatalogToolkit, Guide } from "./types";
import { validateGuide } from "./validate";

export const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5-5";
const COMPOSIO_REDIRECT = "https://backend.composio.dev/api/v1/auth-apps/add";
const MAX_TURNS = 14;
const TIME_BUDGET_MS = 270_000;

const SYSTEM = `You research what it takes for a developer to get an OAuth app ready with a provider, so the users of their AI agent can connect accounts through Composio. You then write a guide the developer can follow and share without anyone explaining it.

## Context
- A provider OAuth app is the developer's registration with the provider (client ID, secret, redirect URI, scopes). Every end-user connection goes through it.
- Composio provides ("manages") the OAuth app for some toolkits. For the rest the developer must register their own app and paste its client ID and secret into a Composio custom auth config. Composio's redirect URI is ${COMPOSIO_REDIRECT}.
- Toolkits whose only scheme is DCR_OAUTH are MCP servers with dynamic client registration: nothing to register by hand.

## How to work
1. Find the provider's official developer docs on: app registration; the OAuth flow (redirect URI rules, token lifetimes); scopes and which ones trigger review; app review, verification, marketplace or partner requirements; limits on unreviewed apps (user caps, connection caps, dev/test mode); costs; and anything each customer's admin has to do.
2. Attempt the setup as far as you can without an account: fetch the developer portal, app registration or sign-up page and note what you observe (sign-up gate, partner application form, waitlist, required fields). Record observations as claims with that page as the source. You cannot create accounts or log in, so never mark anything as "tested".
3. Prefer the provider's own docs. Use third-party sources only to fill gaps, label them third_party, and record disagreements with official sources in evidence.conflicts (newer official docs win).
4. Budget: about 6 searches and 8 page fetches. When you can fill the guide, stop. Anything you couldn't establish goes in openQuestions instead of more searching.
5. Before each search or fetch, write one short sentence saying what you're checking.
6. Finish by calling submit_guide exactly once with the complete guide. Don't write the guide as plain text.

## Rules for the guide
- verdict.tier: instant = register and serve any number of users with no review or fee. limited = self-serve start, then a user/connection cap, a paid tier, or a light review. review = production needs a provider review or third-party assessment measured in weeks. gated = can't start without something the developer doesn't control (partner invitation, paid membership, each customer's tenant). customerAdminRequired is separate: true when each customer's admin must act before their users can connect.
- clocks: firstConnection = the developer connects their own account in dev/test mode. production = intended customers can connect without the developer stepping in. Give each a one-line definition specific to this app. effort = hands-on work; wait = calendar time waiting on someone else. Estimates you make yourself are claims with level "inferred".
- Every factual statement is a claim, referenced by id wherever it's used. Quotes are copied exactly from the page and kept short. retrievedAt and checkedAt are today's date.
- Evidence level "official" only when the source page is published by the provider (publisher "provider") or Composio (publisher "composio"). Blogs, forums, aggregators and other vendors are third_party/community. Your own estimates are "inferred". Things you looked for and couldn't find are "unknown".
- Step actors: "agent" only for work software can do without credentials (choosing scopes, prefilling values, drafting text, checking a build against a published checklist). Anything involving accounts, secrets, accepting terms, payment, identity checks or legal sign-off is a human step (developer, customer_admin or provider) with whyHuman saying why.
- Gotchas are phrased as the developer meets them: symptom, cause, fix.
- Keep it tight: verdict.summary under 280 characters, 2–4 stages, 8–20 claims. Ids are lowercase with hyphens.
- If the provider offers no OAuth for third-party apps, say so plainly in the verdict, use tier "gated", and list alternatives under openQuestions.
- corrections: only when an official source contradicts something widely repeated elsewhere; otherwise an empty array.
- composioSetup: use the Composio facts given in the request when present; scopeNotes explain what each risky scope triggers and what to drop.

## Example
A complete, hand-checked guide for Xero follows. Match its structure, tone and evidence discipline, not its facts.
`;

function derefSchema(schema: Record<string, unknown>): Record<string, unknown> {
  const defs = (schema.$defs ?? {}) as Record<string, unknown>;
  const walk = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map(walk);
    if (node && typeof node === "object") {
      const obj = node as Record<string, unknown>;
      if (typeof obj.$ref === "string" && obj.$ref.startsWith("#/$defs/")) {
        const { $ref, ...rest } = obj;
        return { ...(walk(defs[($ref as string).slice(8)]) as object), ...rest };
      }
      return Object.fromEntries(
        Object.entries(obj)
          .filter(([k]) => !["$schema", "$id", "$defs"].includes(k))
          .map(([k, v]) => [k, walk(v)]),
      );
    }
    return node;
  };
  return walk(schema) as Record<string, unknown>;
}

function composioFacts(t: CatalogToolkit | null): string {
  if (!t) return "This app is not in Composio's OAuth toolkit catalog. Set composioSetup.toolkitSlug to the app's slug, managedOAuthAvailable to false, authSchemes to [\"OAUTH2\"] and defaultScopes to the scopes you'd recommend.";
  return [
    `Composio toolkit: ${t.name} (slug "${t.slug}", category ${t.category || "n/a"}).`,
    `Composio-managed OAuth app available: ${t.managed ? "yes - the developer only needs their own app for custom branding, custom scopes or a separate rate-limit quota" : "no - the developer must bring their own"}.`,
    `Auth schemes: ${t.authSchemes.join(", ")}.`,
    `Default scopes Composio requests: ${t.defaultScopes.length ? t.defaultScopes.join(", ") : "(none)"}.`,
    `Redirect URI: ${COMPOSIO_REDIRECT}.`,
    "Source for these facts: https://docs.composio.dev/data/toolkits.json (publisher composio).",
  ].join("\n");
}

export async function* runAgent(query: string, signal?: AbortSignal): AsyncGenerator<AgentEvent> {
  const started = Date.now();
  const client = new Anthropic();
  const toolkit = findToolkit(query);
  yield { type: "catalog", toolkit };
  yield { type: "status", text: toolkit ? `Matched Composio toolkit "${toolkit.name}".` : "Not in Composio's OAuth catalog; researching from scratch." };

  const example = curatedGuide("xero");
  const tools = [
    { type: "web_search_20260209", name: "web_search", max_uses: 8 },
    { type: "web_fetch_20260209", name: "web_fetch", max_uses: 10, max_content_tokens: 20000 },
    {
      name: "submit_guide",
      description: "Submit the finished OAuth setup guide. Call exactly once, at the end, with the complete guide object.",
      input_schema: derefSchema(guideSchema()),
      eager_input_streaming: true,
    },
  ];
  const today = new Date().toISOString().slice(0, 10);
  const messages: Anthropic.Beta.BetaMessageParam[] = [
    {
      role: "user",
      content: `App to research: ${query}\nToday's date: ${today}\n\n${composioFacts(toolkit)}`,
    },
  ];

  let nudges = 0;
  let repairs = 0;

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    if (Date.now() - started > TIME_BUDGET_MS) {
      yield { type: "error", message: "The research ran past its time budget. Try again, or try a more specific app name or website." };
      return;
    }

    // Typed loosely: fallbacks, display "updates" and the 20260209 web tools are newer than some SDK type definitions.
    const params: any = {
      model: MODEL,
      max_tokens: 64000,
      betas: ["server-side-fallback-2026-07-01", "thinking-display-updates-2026-08-18"],
      fallbacks: "default",
      thinking: { type: "adaptive", display: "updates" },
      output_config: { effort: "medium" },
      system: [{ type: "text", text: `${SYSTEM}\n${JSON.stringify(example)}`, cache_control: { type: "ephemeral" } }],
      tools,
      messages,
    };
    const stream = client.beta.messages.stream(params, { signal });

    const blocks = new Map<number, { type: string; name?: string; json: string; seeded: boolean; text: string }>();
    let writtenChars = 0;
    let lastReported = 0;

    for await (const ev of stream as AsyncIterable<any>) {
      if (ev.type === "content_block_start") {
        const cb = ev.content_block;
        // Server tool calls can arrive with their input already set on the start event.
        const initial = cb.input && Object.keys(cb.input).length ? JSON.stringify(cb.input) : "";
        blocks.set(ev.index, { type: cb.type, name: cb.name, json: initial, seeded: Boolean(initial), text: "" });
        if (cb.type === "tool_use" && cb.name === "submit_guide") yield { type: "status", text: "Writing the guide…" };
      } else if (ev.type === "content_block_delta") {
        const b = blocks.get(ev.index);
        if (!b) continue;
        if (ev.delta.type === "input_json_delta") {
          if (b.seeded) {
            b.json = "";
            b.seeded = false;
          }
          b.json += ev.delta.partial_json;
          if (b.type === "tool_use") {
            writtenChars += ev.delta.partial_json.length;
            if (writtenChars - lastReported > 1500) {
              lastReported = writtenChars;
              yield { type: "writing", chars: writtenChars };
            }
          }
        } else if (ev.delta.type === "thinking_delta") {
          b.text += ev.delta.thinking;
        } else if (ev.delta.type === "text_delta") {
          b.text += ev.delta.text;
        }
      } else if (ev.type === "content_block_stop") {
        const b = blocks.get(ev.index);
        if (!b) continue;
        if (b.type === "server_tool_use") {
          let input: any = {};
          try {
            input = JSON.parse(b.json || "{}");
          } catch {
            /* partial input; skip the label */
          }
          // Match on the input shape too: with dynamic filtering the call can be wrapped under another tool name.
          if (input.query) yield { type: "search", query: String(input.query) };
          else if (input.url) yield { type: "fetch", url: String(input.url) };
        } else if ((b.type === "thinking" || b.type === "text") && b.text.trim()) {
          yield { type: "note", text: b.text.trim() };
        }
      }
    }

    const message = (await stream.finalMessage()) as any;

    if (message.stop_reason === "refusal") {
      yield { type: "error", message: "The model declined this request. Try rephrasing the app name." };
      return;
    }
    if (message.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: message.content });
      continue;
    }

    const submit = message.content.find((b: any) => b.type === "tool_use" && b.name === "submit_guide");
    if (!submit) {
      if (message.stop_reason === "max_tokens" || nudges >= 2) {
        yield { type: "error", message: "The agent stopped before submitting a guide." };
        return;
      }
      nudges++;
      messages.push({ role: "assistant", content: message.content });
      messages.push({ role: "user", content: "Now call submit_guide with the complete guide." });
      continue;
    }
    if (message.stop_reason === "max_tokens") {
      yield { type: "error", message: "The guide was cut off before it was complete. Please try again." };
      return;
    }

    const guide = normalize(submit.input as Guide, toolkit);
    const { errors } = validateGuide(guide, { live: true });
    if (errors.length === 0) {
      yield { type: "status", text: "Guide passed validation." };
      yield { type: "done", guide, id: null, shareUrl: null };
      return;
    }

    yield { type: "validation", errors };
    if (repairs >= 2) {
      yield { type: "error", message: `The guide still failed validation after two repairs: ${errors.slice(0, 3).join("; ")}` };
      return;
    }
    repairs++;
    messages.push({ role: "assistant", content: message.content });
    messages.push({
      role: "user",
      content: [
        {
          type: "tool_result",
          tool_use_id: submit.id,
          is_error: true,
          content: `The guide failed validation. Fix these and call submit_guide again with the full corrected guide:\n- ${errors.join("\n- ")}`,
        },
      ],
    });
  }

  yield { type: "error", message: "The agent used all its turns without a valid guide." };
}

// Ground the guide in facts we hold locally, and stamp provenance.
function normalize(input: Guide, toolkit: CatalogToolkit | null): Guide {
  const g = structuredClone(input ?? ({} as Guide));
  if (g.app?.slug) g.app.slug = g.app.slug.toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "app";
  if (g.composioSetup && toolkit) {
    g.composioSetup.toolkitSlug = toolkit.slug;
    g.composioSetup.managedOAuthAvailable = toolkit.managed;
    g.composioSetup.authSchemes = toolkit.authSchemes;
    g.composioSetup.defaultScopes = toolkit.defaultScopes;
    g.composioSetup.redirectUri = COMPOSIO_REDIRECT;
  }
  g.meta = { generatedBy: "live_agent", generatedAt: new Date().toISOString(), model: MODEL, humanReviewed: false };
  return g;
}
