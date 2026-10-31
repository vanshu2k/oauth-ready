# Step 2: Guide design

Files: `schema/guide.schema.json` (the contract), `guides/xero.json` (worked example), `scripts/validate_guides.py` (schema plus evidence rules).

The same schema serves three uses: the curated library, the live agent's structured output, and the page renderer. A live-generated guide and a hand-checked one look the same and get checked by the same rules.

## The questions a developer asks, and the field that answers each

| Developer question | Field |
|---|---|
| How hard is this? | `verdict.tier` + `verdict.summary` |
| When can I try it? | `clocks.firstConnection` |
| When can my customers use it? | `clocks.production` |
| Will it cost me money? | `verdict.cost` |
| Who has to do something? | `verdict.whoMustAct`, `verdict.customerAdminRequired`, `step.actor` |
| What exactly do I do next? | `stages[].steps[]`, in order, each ending at a gate (`unlocks`) |
| What will block me? | `requirements`, `limits`, `gotchas` (symptom → cause → fix) |
| What can the agent do for me? | `step.actor = agent`, `step.agentHelp` |
| Where must I take over, and why? | `step.whyHuman` |
| Can I trust this? | `claims[].evidence`, `openQuestions`, `corrections` |
| What do I paste into Composio? | `composioSetup` (redirect URI, default scopes, scope notes) |

## Decisions

**1. Two clocks, each split into effort and wait.**
"How long does it take?" has two answers: when *I* can try it and when *my customers* can use it. Docs blur them. Effort (hands-on hours) and wait (calendar time on someone else) are separate because "6 weeks" with 2 hours of work is a very different plan from 2 weeks of building. Each clock carries a `definition`, because "production" means different things per app (Xero: up to 50 orgs; Google: any user without the unverified warning).

**2. Four tiers with rules, not vibes.**
- `instant`: no review and no fee for any number of users.
- `limited`: self-serve start, then a cap, a paid plan or a light review.
- `review`: a provider review or third-party assessment measured in weeks.
- `gated`: you can't start without something you don't control.

Kept separate from the tier: the **cost** of each step up, and **`customerAdminRequired`**. An app can be instant for you and still need every customer's admin to act (ServiceNow, Microsoft admin consent). Those are different problems, so they get different fields.

**3. Every fact is a claim with evidence. The prose only points at claim ids.**
Evidence levels, strongest first:
- `tested`: we did it, and `testNote` says what we saw.
- `official`: the provider's or Composio's own docs, quoted.
- `third_party`: blogs, forums, aggregators.
- `inferred`: our own reasoning, never shown as fact.
- `unknown`: we looked and couldn't find it.

The validator enforces the rules:
- `official` needs a provider or Composio source.
- `tested` needs a test note.
- Every reference must resolve.
- Headline numbers backed by weak evidence get a warning, so the UI can label them "estimate".

**4. Conflicts and corrections are stored, not hidden.**
A claim can record a conflicting value from another source and how it was resolved. The guide also keeps a `corrections` log. That log is the raw material for the "what we learned, corrected, or couldn't verify" part of the submission.

**5. The actor on every step says where the agent stops.**
The agent researches, prefills values (redirect URI, scopes), drafts text (support docs, scope justifications) and checks your build against published checklists. Humans handle anything involving credentials, accepting terms, payment, identity or legal attestations. `whyHuman` gives the reason on each step, so the line isn't arbitrary.

**6. Composio-specific grounding.**
`composioSetup` comes from Composio's own toolkit feed: the exact redirect URI and the default scopes it requests. Scopes drive review tiers (see Google Forms and the full `drive` scope), so `scopeNotes` explains what each risky scope triggers and what to drop.

## What the Xero example taught us

Writing one real guide against the schema changed two things:

- **Correction:** Xero's model is now paid tiers. Starter is free for 5 connections, Core is $35 AUD/mo for 50, and Plus is $245 AUD/mo for 1,000 with certification included. The "25 connections" and "3 connections in 30 days" figures were out of date. *Schema change: added `verdict.cost`, because for Xero cost matters more than review time.*
- **Gotcha that only shows up from the customer's side:** each Xero org can connect at most 5 uncertified apps. You can be under your own cap and still be blocked by your customer's. *This is why `gotchas` are phrased as symptoms.*

Evidence mix for Xero: 12 official, 1 inferred (the first-connection time, until we time a real attempt in step 3), 2 open questions, 2 corrections.
