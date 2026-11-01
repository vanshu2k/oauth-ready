import type { Metadata } from "next";
import { catalogStats } from "@/lib/data";

export const metadata: Metadata = {
  title: "How it works | OAuth Ready",
  description: "What OAuth Ready does, how the live research agent builds a guide, and how the guides are kept true.",
};

const PIPELINE = [
  { ico: "🔎", title: "Match Composio's catalog", text: "Finds the toolkit, its default scopes and redirect URI. Real data, not a guess." },
  { ico: "🌐", title: "Search the docs", text: "Looks for the provider's own pages on app registration, review, limits and cost." },
  { ico: "📖", title: "Read the pages", text: "Opens each page and copies the exact sentence behind every fact." },
  { ico: "🚪", title: "Try the portal", text: "Opens the developer portal and sign-up pages to see what a developer would meet." },
  { ico: "✍️", title: "Write the guide", text: "Fills in one fixed format: verdict, two clocks, steps, blockers, evidence." },
  { ico: "🛂", title: "Validator", text: "Checks the format and the evidence rules. Errors go back to the agent to fix." },
  { ico: "🔁", title: "Quote check", text: "Re-fetches every cited page to confirm each quote is really there." },
  { ico: "🔗", title: "Save and share", text: "Saves the guide and gives it its own link, marked as not yet reviewed by a person." },
];

export default function HowItWorks() {
  const stats = catalogStats();
  return (
    <>
      <div className="label">How it works</div>
      <h1 style={{ marginTop: 4, maxWidth: 760 }}>Type an app. Get the path to a working OAuth app, and proof for every step.</h1>
      <p className="muted" style={{ maxWidth: 720, marginTop: 12, fontSize: 16 }}>
        Before your AI agent's users can connect an app like Xero or Google Forms, you usually need your own &quot;OAuth app&quot; registered with that
        provider, and sometimes approved. This site tells you how hard that is, how long it takes, and who has to do what.
      </p>

      {/* 1. The three things a visitor does */}
      <h2>For you, it's three steps</h2>
      <div className="hiw-tiles">
        <div className="hiw-tile">
          <span className="num">1</span>
          <div className="ico">⌨️</div>
          <h3>Look it up</h3>
          <p>Type an app name or website. Five apps have hand-checked guides; anything else is researched live.</p>
        </div>
        <div className="hiw-tile">
          <span className="num">2</span>
          <div className="ico">🧭</div>
          <h3>Read one page</h3>
          <p>A verdict in one sentence, two clocks (when you can try it, when customers can use it), and the steps in order.</p>
        </div>
        <div className="hiw-tile">
          <span className="num">3</span>
          <div className="ico">📤</div>
          <h3>Share it, act on it</h3>
          <p>Copy the link or Markdown for your team, tick off steps as you go, and see exactly where you have to take over.</p>
        </div>
      </div>

      {/* 2. The live agent pipeline */}
      <h2>What happens when the agent researches a new app</h2>
      <p className="small muted" style={{ maxWidth: 720 }}>
        Claude does the research with web search and page reading, then has to pass the same checks as the hand-written guides. The highlight shows the
        order; a real run takes a few minutes.
      </p>
      <div className="pipe-track" aria-hidden="true">
        <span />
      </div>
      <div className="pipe">
        {PIPELINE.map((s, i) => (
          <div key={s.title} className="hiw-tile" style={{ ["--i" as string]: i } as React.CSSProperties}>
            <span className="num">{i + 1}</span>
            <div className="ico">{s.ico}</div>
            <h3>{s.title}</h3>
            <p>{s.text}</p>
          </div>
        ))}
      </div>
      <div className="loopback">↩ If the validator finds a problem, the guide goes back to step 5 with the list of errors, up to twice.</div>

      {/* 3. What a guide contains */}
      <h2>What's on every guide</h2>
      <div className="hiw-tiles four">
        <div className="hiw-tile">
          <div className="ico">🚦</div>
          <h3>Verdict</h3>
          <p>Instant, self-serve with limits, provider review, or gated. Plus cost, and whether each customer's admin must act.</p>
        </div>
        <div className="hiw-tile">
          <div className="ico">⏱️</div>
          <h3>Two clocks</h3>
          <p>When you can try it vs. when customers can use it, each split into hands-on work and waiting on someone else.</p>
        </div>
        <div className="hiw-tile">
          <div className="ico">👣</div>
          <h3>Steps with an owner</h3>
          <p>Each step says who does it (agent, you, customer's admin, provider) and why a person is needed.</p>
        </div>
        <div className="hiw-tile">
          <div className="ico">🧾</div>
          <h3>Evidence</h3>
          <p>Every fact links to its source and quote. Numbers resting on weak evidence say &quot;Estimate&quot;.</p>
        </div>
      </div>

      {/* 4. Evidence ladder */}
      <h2>How much to trust each fact</h2>
      <div className="ladder">
        <div className="rung pill tested">
          <strong>Tested</strong> We did it and recorded what happened, with times.
        </div>
        <div className="rung pill official">
          <strong>Official</strong> The provider's or Composio's own docs, quoted word for word.
        </div>
        <div className="rung pill third_party">
          <strong>Third-party</strong> Blogs, forums, other vendors. Useful, but labelled.
        </div>
        <div className="rung pill inferred">
          <strong>Inferred</strong> Our own estimate or reasoning. Never shown as fact.
        </div>
        <div className="rung pill unknown">
          <strong>Unknown</strong> We looked and couldn't find out. Said out loud, not guessed.
        </div>
      </div>

      {/* 5. Keeping it true */}
      <h2>How the guides stay true</h2>
      <div className="cycle">
        <svg viewBox="0 0 280 280" role="img" aria-label="A loop of four checks: research, quote check, hands-on test, daily connection check">
          <circle cx="140" cy="140" r="100" fill="none" stroke="var(--border)" strokeWidth="2" />
          <g className="spin">
            <path d="M140 40 A100 100 0 0 1 240 140" fill="none" stroke="var(--accent)" strokeWidth="5" strokeLinecap="round" />
          </g>
          {[
            { x: 140, y: 40, label: "Research" },
            { x: 240, y: 140, label: "Quote check" },
            { x: 140, y: 240, label: "Hands-on test" },
            { x: 40, y: 140, label: "Daily check" },
          ].map((n) => (
            <g key={n.label}>
              <circle cx={n.x} cy={n.y} r="30" fill="var(--surface)" stroke="var(--accent)" strokeWidth="2" />
              <text x={n.x} y={n.y + 4} textAnchor="middle">
                {n.label.split(" ")[0]}
              </text>
            </g>
          ))}
        </svg>
        <div className="hiw-tiles two">
          <div className="hiw-tile">
            <h3>Research</h3>
            <p>Every fact is quoted from the provider's own docs, or labelled as weaker evidence.</p>
          </div>
          <div className="hiw-tile">
            <h3>Quote check</h3>
            <p>A script re-fetches every cited page. It caught 3 of our own quote errors and 1 of the agent's.</p>
          </div>
          <div className="hiw-tile">
            <h3>Hands-on test</h3>
            <p>A person runs the guide for real. Pipedrive: sandbox to working API call in about 10 minutes.</p>
          </div>
          <div className="hiw-tile">
            <h3>Daily check</h3>
            <p>Every day, a read-only call through Composio on a real connection proves it still works.</p>
          </div>
        </div>
      </div>

      {/* 6. Automation vs human */}
      <h2>What an agent can automate, and what stays human</h2>
      <div className="split">
        <div className="card">
          <span className="pill agent">Automated</span>
          <ul>
            <li>Researching the provider and writing the guide.</li>
            <li>Choosing and trimming scopes, prefilling the redirect URI.</li>
            <li>Drafting review answers, privacy wording and customer-admin runbooks.</li>
            <li>Re-checking every quote, and the daily connection check.</li>
            <li>
              <strong>Registering the OAuth app itself, where the provider has an API for it.</strong> Microsoft Graph can create an app registration (
              <code>POST /applications</code>) and Slack can create an app from a manifest (<code>apps.manifest.create</code>), which returns the client
              ID and secret.
            </li>
          </ul>
        </div>
        <div className="card">
          <span className="pill customer_admin">A person</span>
          <ul>
            <li>
              <strong>Creating the provider account.</strong> Sign-ups involve accepting terms, email or phone checks, CAPTCHAs and 2FA. They exist to
              confirm a real person or company, so automating them is fragile and often against the provider's terms.
            </li>
            <li>Handling client secrets, payment, and legal or security attestations.</li>
            <li>Provider reviews, and each customer's admin approving your app.</li>
          </ul>
          <p className="small muted" style={{ marginTop: 10, marginBottom: 0 }}>
            The good news: <strong>this is a one-time cost per provider, not per test.</strong> One test account per provider is enough. Every check after
            that reuses the same connection automatically.
          </p>
        </div>
      </div>

      <h2>Why these apps</h2>
      <p className="small muted" style={{ maxWidth: 760 }}>
        Composio supports {stats.total} OAuth toolkits. For {stats.managed} it already provides the OAuth app. Of the other {stats.byo}, {stats.dcrOnly} are
        MCP servers that register themselves. That leaves <strong>{stats.manual} apps where a developer has to register an app by hand</strong>, and those
        are what these guides are for. The five library guides were picked to cover every kind of difficulty, from instant (Pipedrive) to gated
        (ServiceNow).
      </p>
      <div className="row" style={{ marginTop: 16 }}>
        <a className="btn primary" href="/#library">
          Browse the guides
        </a>
        <a className="btn" href="/method">
          See how we verify
        </a>
      </div>
    </>
  );
}
