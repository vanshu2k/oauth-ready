# Step 5: Verification log (2026-11-01)

What was checked, against which sources, and what we found. This is also shown on `/method` in the app (data: `data/verification.json`).

## Method

1. **Automated quote check** (`scripts/check_quotes.py`): re-fetch every cited page and check each quote appears word for word, after normalising whitespace, punctuation and HTML.
2. **Real-browser check** for pages a plain fetch can't read. Xero, Teamtailor and ServiceNow docs render client-side, and Zoho blocks bots. A script in the built-in browser checked the same quotes against the rendered page text and returned only true/false per quote.
3. **Hand spot-checks** that a claim says what its quote supports, not just that the quote exists.

Sample: every quote in the 5 library guides, plus two guides the live agent generated on the deployed site:
- [Zoho Recruit](https://oauth-ready-ochre.vercel.app/g/zoho_recruit-mvwvyl9p): in Composio's catalog.
- [Teamtailor](https://oauth-ready-ochre.vercel.app/g/teamtailor-mvww8952): not in the catalog, entered as a website.

## Results

| Guides | Quotes | Word for word | Wording wrong | Source gone |
|---|---|---|---|---|
| Library (5) | 38 | 35 | 3 (all ours) | 0 |
| Agent-generated (2) | 29 | 24 | 1 | 4 |

### Our mistakes (fixed, logged as corrections in each guide)

- **Google Forms:** the quote showing the Forms scopes as SENSITIVE came from a search snippet that had reflowed a table. The table does say SENSITIVE; the quote now uses the real row.
- **ServiceNow:** we quoted "On your *development* instance"; the live page says "On your *production* instance". The claim (OAuth clients are created per instance) is unaffected.
- **Xero:** the rate-limit quote added full stops between list items. The numbers were right.

### Agent mistakes

- **Teamtailor:** the agent quoted Nango's page as "Teamtailor uses API_KEY auth mode". The page says "Pre-built authorization (API Key)". The fact is supported, but the quote is a paraphrase, which its instructions forbid.

### Source problems

- **Teamtailor:** the agent cited the support article "Integrate your HR/recruitment tool with Teamtailor" for 4 claims. Today the URL shows "page doesn't exist" in a browser.
  - Teamtailor's own Partner Integrations index still links to it.
  - A search-index copy contains the quoted text.
  - So the quotes were real, but the source is unstable.

### Confirmed

- **Teamtailor has no OAuth for third-party apps.** "OAuth" appears nowhere in its roughly 20,000-character API docs, which document API-key auth only. The agent labelled "no OAuth found" as *unknown*, not as fact, which is the right call for an absence.
- **Zoho Recruit** (12 quotes Zoho blocks from plain fetch, all checked in a browser): 12 of 12 verbatim.
  - The page says "Each access token is valid for only an hour", matching the agent's claim.
  - The "20 refresh tokens per user" limit is not on Zoho's official token page, which is why the agent labelled it third-party.
- **Xero:** the phrase "ten active customer connections" is on the partner guide. That settles part of an open question; the exact rule is still unclear.

## What changed because of this

1. **Live guides are now quote-checked automatically** (`lib/quotecheck.ts`). After the agent submits, the server re-fetches each cited page and marks each source "Quote found on page", "Quote not found on page" or "Couldn't auto-check". Pages it can't read are never counted against the agent.
2. **Library quotes are re-run with** `python scripts/check_quotes.py`.

## Lessons

- **Quotes from search snippets aren't quotes.** They get reflowed, and they can come from older versions of a page. Quote from the page itself.
- **A plain HTTP fetch can't read most modern docs sites.** Serious verification needs a real browser. The automated check is a first pass, not the last word.
- **The agent is reliable at quoting, but not perfect.** It got 24 of 25 quotes right on pages that still exist, so checking has to be automatic rather than trusted.

## Hands-on test: Pipedrive (2026-11-01)

A person followed the Pipedrive guide end to end with free accounts, timing each step:

| Step | What we saw | Time |
|---|---|---|
| Sandbox sign-up | Free with a personal Gmail address. No card, no verification email, no expiry wording. Lands straight on Developer Hub. | ~20 s |
| Private app | One Callback URL field; app type PRIVATE; starts as **DRAFT** with "Change to live", "Install and test" and "Share app". Scopes set per area, read-only or full. | a few min |
| Composio auth config | Only "your own OAuth2 app" or "static API key"; no managed app. Client ID and secret required, scopes optional, redirect URI prefilled and matching. | a few min |
| Connect + test call | Connection **Active** while the app was still Draft (same company). "List my Pipedrive deals" ran the deals API in 1.9 s and returned no deals, which is correct for an empty sandbox. | ~10 min from app to Active |

Result: the Pipedrive guide went from 8 official and 2 inferred claims to **9 tested and 3 official, with no estimates left**. The "20–45 min" estimate became a measured ~10 minutes.

## Not verified yet

- **Hands-on attempts for the other four library apps.** Google Forms and Xero are free to try (`docs/03-hands-on-checklist.md`). Microsoft needs a work tenant, and ServiceNow needs a developer instance.
- **Whether a live Pipedrive app installs for another company's non-admin user.** This needs a second Pipedrive company.
- **Open questions per guide** are listed on `/method`. Examples: whether Composio's Google Forms tools work with only `drive.file`, and what Microsoft's 2025 consent change covers exactly.
