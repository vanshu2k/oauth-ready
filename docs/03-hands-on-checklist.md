# Step 3: Research results and hands-on test checklist

## What the research found (2026-11-01)

| App | Tier | First connection | Production | Biggest finding |
|---|---|---|---|---|
| Pipedrive | instant | 20–45 min | minutes (set app live) | Draft private apps only work inside your own company; must be switched to **live**. One callback URL per app. |
| Xero | limited | 15–45 min | minutes up to 50 (paid Core) | Now **paid tiers**: free for 5, $35 AUD/mo for 50, $245 AUD/mo for 1,000 plus certification. |
| Google Forms | review | 20–45 min | ~6 weeks (default scopes) / ~10 business days (trimmed) | Composio's defaults include **restricted** `drive` + `drive.readonly`, which means an annual paid CASA assessment. |
| Microsoft Word | review | 20–45 min | days, plus each customer's admin | Composio's defaults use `.All` file/site permissions; tenant policy changes in 2025 push these toward **admin consent**. Publisher verification needs a partner program account. |
| ServiceNow | gated | 30–60 min + wait for a dev instance | per customer, days–weeks | **No central app**: every customer's admin registers your client in their instance, and each instance means a separate Composio auth config. |

Evidence across 5 guides: 39 official · 4 third-party · 11 inferred · 12 open questions · 4 corrections.

## Hands-on tests: what each one proves

Each test turns specific `inferred` or `third_party` claims into `tested`. Ordered by value per minute. **Pipedrive + Google Forms is the minimum** (about 1h15m); Xero adds a third if you have 30 more minutes.

### Before you start
- [ ] A free Composio account (you'll create custom auth configs there). **Keep its API key out of this repo.**
- [ ] A timer. Note the start and end time for every step.
- [ ] Screenshots of each provider screen you pass through (crop out client secrets).
- [ ] Never paste secrets into chat or into this repo. Report only what you saw.

### Test 1: Pipedrive (~30 min). **Done 2026-11-01:** passed end to end, results in `docs/04-verification-log.md`
Proves: `first-connection-time`, the draft/live behaviour, sandbox fee and expiry.
- [ ] Sign up for a developer sandbox at developers.pipedrive.com. Note: free? any expiry or trial wording? → ______
- [ ] Developer Hub → create a **private app**. Callback URL = `https://backend.composio.dev/api/v1/auth-apps/add`. Tick read-only deals/persons scopes.
- [ ] Composio: create a Pipedrive auth config with your client ID and secret (scopes empty).
- [ ] Connect via Connect Link and run a "list deals" tool. Worked? Errors? → ______
- [ ] Note the app's status label (draft/live) and what switching to live asks for → ______
- [ ] *Optional:* invite a second, non-admin user to the sandbox company and see if they can install → ______
- [ ] **Total time:** ______ min

### Test 2: Google Forms (~45 min)
Proves: scope classification in the console, Testing-mode behaviour, and **whether Composio's tools work without the restricted Drive scopes** (the open question that matters most).
- [ ] Create a GCP project and enable the **Google Forms API**.
- [ ] Google Auth Platform → Audience: **External**, status **Testing**, add yourself as a test user.
- [ ] Data Access → add all six Composio default scopes. **Screenshot which section each lands in** (non-sensitive / sensitive / restricted) → forms.body: ____ forms.responses.readonly: ____ drive: ____ drive.file: ____
- [ ] Create a **Web application** OAuth client with Composio's redirect URI.
- [ ] Composio auth config with **only** `forms.body`, `forms.body.readonly`, `forms.responses.readonly`, `drive.file`.
- [ ] Connect. Note the exact warning text on the unverified-app screen → ______
- [ ] Run: get a form (one you created), list responses, create a form. Which work, which fail, with what error? → ______
- [ ] **Total time:** ______ min
- (The 7-day expiry can't be tested today. It stays "official", not "tested".)

### Test 3: Xero (~30 min)
Proves: `first-connection-time`, and whether the demo company counts toward the 5 free connections.
- [ ] Sign in at developer.xero.com → My Apps → New app (web app). Note the app type labels shown → ______
- [ ] Redirect URI = Composio's; generate a secret.
- [ ] Composio auth config with a **read-only** subset of scopes plus `offline_access`.
- [ ] Connect the **Demo Company** and run "list contacts".
- [ ] In My Apps, check the connection count and plan shown. Does the demo company count? → ______
- [ ] **Total time:** ______ min

### Test 4: ServiceNow (only if a PDI arrives in time)
Proves: the current Application Registry labels, the "(Deprecated UI)" question, and whether a Composio connection works.
- [ ] Request a PDI. Time from request to usable instance → ______
- [ ] Application Registry → New. Copy the **exact option labels** shown → ______
- [ ] Create the client with Composio's redirect URI; connect with your instance subdomain; read an incident → ______

### Skip unless you already have one: Microsoft Word
Needs an Entra work/school tenant you can register apps in. If you have one: register a multitenant app, connect, and note whether you get a consent screen or "Need admin approval".

## After testing
Send me your filled-in notes (no secrets). I'll:
1. Turn each result into a `tested` claim with your note and the date.
2. Update clocks with measured times instead of estimates.
3. Log anything that contradicts the docs as a correction. Those are the most valuable lines in the submission.
