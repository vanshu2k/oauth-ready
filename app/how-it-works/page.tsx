import type { Metadata } from "next";
import Icon, { type IconName } from "@/components/Icon";
import { catalogStats } from "@/lib/data";

export const metadata: Metadata = {
  title: "How it works | OAuth Ready",
  description: "What OAuth Ready does, how the live research agent builds a guide, and how the guides are kept true.",
};

const PIPELINE: { ico: IconName; title: string; text: string }[] = [
  { ico: "catalog", title: "Match Composio's catalog", text: "Finds the toolkit, its default scopes and redirect URI. Real data, not a guess." },
  { ico: "globe", title: "Search the docs", text: "Looks for the provider's own pages on registration, review, limits and cost." },
  { ico: "book", title: "Read the pages", text: "Opens each page and keeps the exact sentence behind every fact." },
  { ico: "door", title: "Try the portal", text: "Opens the developer portal and sign-up pages to see what a developer meets." },
  { ico: "pen", title: "Write the guide", text: "Fills one fixed format: verdict, two clocks, steps, blockers, evidence." },
  { ico: "shield", title: "Validate", text: "Checks the format and the evidence rules. Errors go back to the agent to fix." },
  { ico: "refresh", title: "Check quotes", text: "Re-fetches every cited page to confirm each quote is really there." },
  { ico: "link", title: "Save and share", text: "Saves the guide with its own link, marked as not yet reviewed by a person." },
];

function Feature({ ico, title, children }: { ico: IconName; title: string; children: React.ReactNode }) {
  return (
    <div className="feature">
      <div className="ico">
        <Icon name={ico} />
      </div>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}

export default function HowItWorks() {
  const stats = catalogStats();
  return (
    <>
      <section className="hero" style={{ paddingTop: 8 }}>
        <div className="kicker">How it works</div>
        <h1 className="display" style={{ fontSize: 40, marginTop: 10 }}>
          Type an app. Get the path to a working OAuth app, <span className="hl">with proof.</span>
        </h1>
        <p className="lead" style={{ marginTop: 16 }}>
          Before your AI agent&apos;s users can connect an app like Xero or Google Forms, you usually need your own OAuth app registered with that
          provider, and sometimes approved. This site tells you how hard that is, how long it takes, and who has to do what.
        </p>
      </section>

      <h2>For you, it&apos;s three steps</h2>
      <div className="feature-grid">
        <Feature ico="search" title="1 · Look it up">
          Type an app name or website. Five apps have hand-checked guides; anything else is researched live.
        </Feature>
        <Feature ico="gauge" title="2 · Read one page">
          A one-sentence verdict, two clocks (when you can try it, when customers can use it), and the steps in order.
        </Feature>
        <Feature ico="link" title="3 · Share it, act on it">
          Copy the link or Markdown for your team, tick off steps as you go, and see exactly where you take over.
        </Feature>
      </div>

      <h2>What happens when the agent researches a new app</h2>
      <p className="small muted" style={{ maxWidth: 720, marginTop: -4 }}>
        Claude does the research with web search and page reading, then has to pass the same checks as the hand-written guides. The highlight
        walks through the order; a real run takes a few minutes and streams each step to your screen.
      </p>
      <div className="flow" style={{ marginTop: 14 }}>
        {PIPELINE.map((s, i) => (
          <div key={s.title} className="flow-step" style={{ ["--i" as string]: i } as React.CSSProperties}>
            <div className="n">{String(i + 1).padStart(2, "0")}</div>
            <div className="ico">
              <Icon name={s.ico} />
            </div>
            <h3>{s.title}</h3>
            <p>{s.text}</p>
          </div>
        ))}
      </div>
      <div className="loopback">
        <Icon name="refresh" size={14} /> If validation fails, the guide goes back to step 05 with the list of errors, up to twice.
      </div>

      <h2>What&apos;s on every guide</h2>
      <div className="feature-grid four">
        <Feature ico="gauge" title="Verdict">
          Instant, self-serve with limits, provider review, or gated. Plus cost, and whether each customer&apos;s admin must act.
        </Feature>
        <Feature ico="clock" title="Two clocks">
          When you can try it vs. when customers can use it, each split into hands-on work and waiting on someone else.
        </Feature>
        <Feature ico="users" title="Steps with an owner">
          Each step says who does it (agent, you, customer&apos;s admin, provider) and why a person is needed.
        </Feature>
        <Feature ico="file" title="Evidence">
          Every fact links to its source and quote. Numbers resting on weak evidence say &ldquo;Estimate&rdquo;.</Feature>
      </div>

      <h2>How much to trust each fact</h2>
      <div className="ladder">
        <div className="rung">
          <span className="status tested">Tested</span>
          <span className="muted">We did it and recorded what happened, with times.</span>
        </div>
        <div className="rung">
          <span className="status official">Official</span>
          <span className="muted">The provider&apos;s or Composio&apos;s own docs, quoted word for word.</span>
        </div>
        <div className="rung">
          <span className="status third_party">Third-party</span>
          <span className="muted">Blogs, forums, other vendors. Useful, but labelled.</span>
        </div>
        <div className="rung">
          <span className="status inferred">Inferred</span>
          <span className="muted">Our own estimate or reasoning. Never shown as fact.</span>
        </div>
        <div className="rung">
          <span className="status unknown">Unknown</span>
          <span className="muted">We looked and couldn&apos;t find out. Said out loud, not guessed.</span>
        </div>
      </div>

      <h2>How the guides stay true</h2>
      <div className="cycle">
        <svg viewBox="0 0 260 260" role="img" aria-label="A loop of four checks: research, quote check, hands-on test, daily connection check">
          <circle cx="130" cy="130" r="92" fill="none" stroke="var(--border-strong)" strokeWidth="1" strokeDasharray="3 5" />
          <g className="spin">
            <path d="M130 38 A92 92 0 0 1 222 130" fill="none" stroke="var(--brand)" strokeWidth="3" strokeLinecap="round" />
          </g>
          {[
            { x: 130, y: 38, label: "Research" },
            { x: 222, y: 130, label: "Quotes" },
            { x: 130, y: 222, label: "Hands-on" },
            { x: 38, y: 130, label: "Daily" },
          ].map((n) => (
            <g key={n.label}>
              <rect x={n.x - 34} y={n.y - 13} width="68" height="26" rx="4" fill="var(--surface)" stroke="var(--border-strong)" />
              <text x={n.x} y={n.y + 4} textAnchor="middle">
                {n.label}
              </text>
            </g>
          ))}
        </svg>
        <div className="feature-grid two">
          <Feature ico="book" title="Research">
            Every fact is quoted from the provider&apos;s own docs, or labelled as weaker evidence.
          </Feature>
          <Feature ico="refresh" title="Quote check">
            A script re-fetches every cited page. It caught 3 of our own quote errors and 1 of the agent&apos;s.
          </Feature>
          <Feature ico="check" title="Hands-on test">
            A person runs the guide for real. Pipedrive: sandbox to a working API call in about 10 minutes.
          </Feature>
          <Feature ico="terminal" title="Daily connection check">
            Every day, a read-only call through Composio on a real connection proves it still works.
          </Feature>
        </div>
      </div>

      <h2>What an agent can automate, and what stays human</h2>
      <div className="split">
        <div className="card">
          <span className="status agent">Automated</span>
          <ul>
            <li>Researching the provider and writing the guide.</li>
            <li>Choosing and trimming scopes, prefilling the redirect URI.</li>
            <li>Drafting review answers, privacy wording and customer-admin runbooks.</li>
            <li>Re-checking every quote, and the daily connection check.</li>
            <li>
              <strong>Registering the OAuth app itself, where the provider has an API.</strong> Microsoft Graph can create an app registration (
              <code>POST /applications</code>) and Slack can create an app from a manifest (<code>apps.manifest.create</code>), which returns the client
              ID and secret.
            </li>
          </ul>
        </div>
        <div className="card">
          <span className="status customer_admin">A person</span>
          <ul>
            <li>
              <strong>Creating the provider account.</strong> Sign-ups involve terms, email or phone checks, CAPTCHAs and 2FA. They exist to confirm a
              real person or company, so automating them is fragile and often against the provider&apos;s terms.
            </li>
            <li>Handling client secrets, payment, and legal or security attestations.</li>
            <li>Provider reviews, and each customer&apos;s admin approving your app.</li>
          </ul>
          <p className="small muted" style={{ marginTop: 12, marginBottom: 0 }}>
            <strong style={{ color: "var(--text)" }}>One-time cost per provider, not per test.</strong> One test account per provider is enough;
            every check after that reuses the same connection automatically.
          </p>
        </div>
      </div>

      <h2>Why these apps</h2>
      <p className="small muted" style={{ maxWidth: 760 }}>
        Composio supports {stats.total} OAuth toolkits. For {stats.managed} it already provides the OAuth app. Of the other {stats.byo}, {stats.dcrOnly}{" "}
        are MCP servers that register themselves. That leaves{" "}
        <strong style={{ color: "var(--text)" }}>{stats.manual} apps where a developer has to register an app by hand</strong>, and those are what these
        guides are for. The five library guides cover every kind of difficulty, from instant (Pipedrive) to gated (ServiceNow).
      </p>
      <div className="row" style={{ marginTop: 18 }}>
        <a className="btn primary" href="/#library">
          Browse the guides <Icon name="arrow" size={13} />
        </a>
        <a className="btn" href="/method">
          How we verify
        </a>
      </div>
    </>
  );
}
