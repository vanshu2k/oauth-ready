# OAuth Ready

Look up an app and get a guide you can follow and share: how hard it is to get your OAuth app ready, how long it takes (hands-on work vs. waiting on someone), what can block approval, and which steps an agent can do for you.

- **Library:** five hand-checked guides chosen to cover different kinds of setup: Pipedrive, Xero, Google Forms, Microsoft Word, ServiceNow.
- **Live generation:** type any app name or website. An agent researches it in about two minutes, shows its work, and saves a guide with its own link.
- **How we verify:** `/method` lists every correction, every conflict between sources, and every question still open.

## The problem, as I understood it

A developer's agent can't act in a user's Xero or Google account until that user connects it. The connection runs through an **OAuth app**: the developer's registration with the provider (client ID, secret, redirect URI, scopes). For some apps Composio provides that OAuth app. For the rest, the developer registers their own and sometimes has to get it approved first.

The hard part isn't the OAuth flow. It's what nobody tells you up front:
- Is there a review?
- How long does it take?
- Does it cost money?
- Will my *customers'* admins have to approve it?
- What will make my app fail approval?

## Scope: the 156 apps that need hands-on setup

Composio's toolkit catalog (`docs.composio.dev/data/toolkits.json`) lists 387 toolkits with OAuth:

| Group | Count |
|---|---|
| Toolkits with OAuth | 387 |
| Composio provides the OAuth app | 125 |
| Listed as "bring your own OAuth app" | 262 |
| ...of which are MCP servers using **dynamic client registration** (they register themselves; nothing to do by hand) | 106 |
| ...of which **need a developer to register an app with the provider** | **156** |

This tool is built for those 156. Apps that Composio already manages or that register themselves are flagged as such in search.

## Key decisions

1. **Two clocks, not one estimate.** "When can I try it?" and "when can my customers use it?" have very different answers. For Google Forms it's minutes vs. about 6 weeks. Each clock is split into hands-on effort and waiting on others, because 6 weeks of waiting with 2 hours of work is a different plan from 2 weeks of building.
2. **Four tiers with written rules:** instant, limited, review, gated. Two things are tracked separately because they're different problems: **cost** (Xero is self-serve but paid past 5 connections) and **whether each customer's admin must act** (ServiceNow, Microsoft).
3. **Every fact is a claim with evidence.**
   - Levels: tested, official (the provider's or Composio's own docs, quoted), third-party, inferred, unknown.
   - The guide's text only points at claim ids, so every number can be traced back to its source.
   - Numbers that rest on weak evidence are labelled **Estimate** on the page.
4. **Composio's own data as ground truth.** The default scopes and redirect URI come from Composio's catalog, not from the model. This matters because scopes decide which review a developer faces. Composio's default Google Forms scopes include full Drive access, which Google treats as *restricted*: that means an annual third-party security assessment and about 6 weeks of review. Trimming those scopes is the developer's biggest lever, and the guide says so.
5. **Every step names who does it:** the agent, the developer, the customer's admin, or the provider. Agent steps are limited to work that needs no credentials: choosing scopes, prefilling values, drafting justifications and admin runbooks, checking against published checklists. Every human step says *why* a person is needed.
6. **One schema for everything.** Library guides, live-generated guides and the page renderer share `data/guide.schema.json`, and the same validator checks both kinds of guide.

## How the live agent works (`lib/agent.ts`)

1. It matches the request to Composio's catalog, so it knows the toolkit's auth schemes, default scopes and redirect URI before it starts.
2. Claude Opus 5.5 researches with Anthropic's server-side `web_search` and `web_fetch` tools. Its progress notes stream to the page as it works.
3. It "attempts" setup the only way it safely can: by opening the provider's developer portal and sign-up pages and recording what a developer would see.
4. It submits the guide through a `submit_guide` tool whose input is the guide schema.
5. The validator checks the schema and the evidence rules:
   - "official" claims need a provider or Composio source;
   - the live agent may not mark anything "tested", since it can't log in.

   Errors go back to the agent to fix, up to twice.
6. The finished guide is saved to Vercel Blob and gets a shareable `/g/<id>` link.

Server-side refusal fallback (`fallbacks: "default"`) is enabled, so a false-positive safety decline is retried on a fallback model instead of failing the demo.

## What was verified

**Quote check (2026-11-01).** Every quote was re-checked against the live page, using a plain fetch first and a real browser for pages that render client-side or block bots (`docs/04-verification-log.md`):
- **Library:** 35 of 38 quotes are word for word. The other 3 were our mistakes: two quotes taken from search snippets, one with added punctuation. All are fixed and logged.
- **Two agent-generated guides:** 24 of 29 word for word. One paraphrased quote, and 4 quotes cite a support article that has since disappeared.
- **As a result,** every live-generated guide now gets an automatic quote check (`lib/quotecheck.ts`), shown as a badge on each source.

See `/method` in the app and the notes in `docs/`:
- `docs/01-demo-app-shortlist.md`: how the 5 apps were picked from Composio's catalog.
- `docs/02-guide-design.md`: schema and design decisions, and what the first guide changed.
- `docs/03-hands-on-checklist.md`: research results and the hands-on test plan.
- `docs/04-verification-log.md`: the quote check, the mistakes it found (ours and the agent's), and what changed as a result.

**Corrections found while researching:**
- **Xero:** older third-party pages say 25 free connections; Xero's current pricing says **5**, then paid tiers.
- **Google Forms:** "about 6 weeks" is only true with Composio's default scopes.
- **Pipedrive:** private apps must be switched from draft to live before other companies can install them.

**Sources that disagree:** Microsoft's Graph permission reference says the file permissions don't need admin consent, but from mid-2025 Microsoft's tenant defaults ask for admin consent anyway. The guide records both and explains why both can be true.

## Run it

```bash
npm install
cp .env.example .env.local   # add ANTHROPIC_API_KEY
npm run dev
```

On Vercel:
1. Import the repository.
2. Add `ANTHROPIC_API_KEY`.
3. Connect a Blob store, which sets `BLOB_READ_WRITE_TOKEN`. Without Blob, generated guides still render but don't get a shareable link.
4. Optionally set `NEXT_PUBLIC_REPO_URL` to show a source link in the header.

Check the library guides against the schema and evidence rules:

```bash
pip install jsonschema
python scripts/validate_guides.py
```

## Repository map

| Path | What |
|---|---|
| `data/guides/*.json` | Library guides |
| `data/guide.schema.json` | Guide schema (also the agent's tool input) |
| `data/composio-oauth-catalog.json` | Composio's 387 OAuth toolkits: managed flag, auth schemes, default scopes |
| `lib/agent.ts` | Live research agent |
| `lib/validate.ts`, `scripts/validate_guides.py` | Schema and evidence-rule validation (TypeScript at runtime, Python for the library) |
| `components/GuideView.tsx` | Guide page |
| `app/api/generate/route.ts` | Streams agent progress to the browser |

## Limitations

- **Nothing in the library is hands-on tested yet.** Those claims say "official" or "inferred", never "tested", until a real setup attempt is recorded (`docs/03-hands-on-checklist.md`).
- **Policies change.** Every claim carries its retrieval date. There's no automatic re-check yet; the obvious next step is a scheduled job that re-fetches each claim's source and flags quotes that no longer appear.
- **The agent only sees public pages.** Anything behind a provider login comes from docs, not observation.
- **Live guides are labelled "not yet reviewed by a person".** Generation takes about 2 minutes and is rate-limited per visitor.
- **No credentials are stored or handled.** The agent never touches client secrets; those steps are always marked as human.
