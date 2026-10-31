# Step 1: Demo app shortlist

Fetched 2026-11-01. Data: `research/byo-oauth-apps.json`, built from Composio's public docs feed (`https://docs.composio.dev/data/toolkits.json`).

## What the data says

| | Count |
|---|---|
| Toolkits with OAuth | 387 |
| Composio provides the OAuth app | 125 |
| "Bring your own OAuth app" | 262 |
| of which **dynamic client registration only** (MCP servers, no manual app needed) | 106 |
| of which **need a manually registered OAuth app** | **156** |
| of those, also offer a server-to-server (client credentials) variant | 23 |

**Scope decision:** the real problem is the 156 apps where a developer has to register an app. The 106 DCR toolkits get a one-line "no registration needed" answer.

**Useful signal:** for every toolkit the feed lists the default scopes and redirect URI Composio requests. Scopes decide the review tier, so the guide agent can reason from what Composio *actually* asks for, not a generic guess.

## Recommended 5: one per setup archetype

| # | App | Archetype | Clock 1: first working connection | Clock 2: production | Key fact (verified source) | Can we test it free? |
|---|---|---|---|---|---|---|
| 1 | **Pipedrive** | Easy self-serve | Minutes | Minutes (private app) / review only if listing on Marketplace | "Private apps... enable you to share your integration with any user/company in Pipedrive via a direct, unlisted installation link." ([Pipedrive docs](https://pipedrive.readme.io/docs/marketplace-registering-a-private-app)) | Yes: free developer sandbox account |
| 2 | **Xero** | Self-serve with a ceiling | Minutes | Starter 5 → Core 50 connections; App Store/partner certification to go beyond | "New apps default to the starter tier with 5 connections. Moving up to Core will give you up to 50 connections." Also: max 5 uncertified apps per Xero org. ([Xero limits](https://developer.xero.com/documentation/guides/oauth2/limits/)) | Yes: free developer account + demo company |
| 3 | **Google Forms** | Security review | Minutes (Testing mode, ≤100 listed test users) | ~6 weeks per Google if restricted scopes are kept | Composio's default scopes include full `drive`, a restricted scope → restricted-scope verification + security assessment. Google FAQ: restricted verification "6 weeks"; unverified apps capped at 100 new users. ([Google FAQ](https://support.google.com/cloud/answer/13463817)) | Yes: GCP project + consent screen in Testing mode |
| 4 | **Microsoft Word (Graph)** | Enterprise trust / admin consent | Minutes (single tenant) | Publisher verification (needs Cloud Partner Program ID + Entra work account) to get user consent in other tenants; some tenants need admin consent | "users can't consent to most newly registered multitenant apps that aren't publisher verified" when risk-based step-up consent is on. ([Microsoft Learn](https://learn.microsoft.com/en-us/entra/identity-platform/publisher-verification-overview)) | Partly: needs an Entra work/school account |
| 5 | **ServiceNow** | Per-customer instance | Hours to days (request a free developer instance) | Every customer admin registers the OAuth endpoint in *their own* instance: no central app, no central approval | Application Registry → "Create an OAuth API endpoint for external clients", done per instance. ([ServiceNow docs](https://www.servicenow.com/docs/r/application-development/app-engine-management-center/create-oauth-api-endpoints-for-external-clients.html)) | Yes: free Personal Developer Instance |

Why these five: each answers "how hard / how long / who must act" differently, all are in Composio's bring-your-own list, all are B2B apps agent builders actually want, and 4 of 5 can be tested for free, so the "Tested" badge is real.

## Bench: use for live-demo rehearsal or a 6th guide

- **Shopify**: public distribution needs App Store review + a one-time registration fee; custom distribution (one store or one Plus org) needs no approval. ([Shopify docs](https://shopify.dev/docs/apps/launch/distribution))
- **Workday**: no self-serve developer tenant; the customer's admin runs "Register API Client for Integrations" in their tenant. Good test of honest "can't verify" labelling.
- **Linear MCP** (or any DCR toolkit): shows the "nothing to register" path.
- **Gusto, Spotify, X/Twitter**: production-access approval, dev-mode user caps and paid tiers.

## Corrections logged already (goes into the verification log)

1. **Xero connection limit.** Older third-party sources (Railz docs, a Retool forum post, Stack Overflow) say uncertified apps get 25 connections. Xero's own limits page now says 5 (starter) → 50 (Core). The 25 figure is out of date. I had repeated it in the gap analysis; corrected here.
2. **Google Forms is a restricted-scope app by default.** Not because of Forms itself, but because Composio's default scope set includes `https://www.googleapis.com/auth/drive`. Open question for the guide: can the Forms tools work with narrower scopes (for example `drive.file`)? Not verified yet.
