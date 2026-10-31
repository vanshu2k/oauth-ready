import SearchBox, { type SearchItem } from "@/components/SearchBox";
import { evidenceMix } from "@/lib/evidence";
import { EVIDENCE, TIER, formatDuration } from "@/lib/format";
import { catalog, catalogStats, curatedGuides } from "@/lib/data";
import { recentGuides } from "@/lib/store";
import type { Tier } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  const guides = curatedGuides();
  const stats = catalogStats();
  const curatedSlugs = new Set(guides.map((g) => g.app.slug));
  const items: SearchItem[] = [
    ...guides.map((g) => ({ slug: g.app.slug, name: g.app.name, curated: true, managed: g.composioSetup.managedOAuthAvailable, dcr: false })),
    ...catalog()
      .filter((t) => !curatedSlugs.has(t.slug))
      .map((t) => ({
        slug: t.slug,
        name: t.name,
        curated: false,
        managed: t.managed,
        dcr: t.authSchemes.length === 1 && t.authSchemes[0] === "DCR_OAUTH",
      })),
  ];
  const recent = await recentGuides(8).catch(() => []);

  return (
    <>
      <section style={{ padding: "28px 0 8px" }}>
        <h1 style={{ fontSize: 36, maxWidth: 720 }}>How long until your users can connect?</h1>
        <p className="muted" style={{ fontSize: 17, maxWidth: 680, margin: "12px 0 22px" }}>
          Before your agent's users can connect an app, you may need your own OAuth app, approved by the provider. Look up an app to see how hard
          that is, how long it takes, what can block you, and which steps an agent can do for you.
        </p>
        <SearchBox items={items} autoFocus />
        <p className="small faint" style={{ marginTop: 10 }}>
          Five apps have hand-checked guides. Anything else is researched live by an agent in about two minutes and gets its own shareable page.
        </p>
      </section>

      <section className="card" style={{ marginTop: 24 }}>
        <div className="label">Where the work is</div>
        <div className="grid3" style={{ marginTop: 10 }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 650 }}>{stats.total}</div>
            <div className="small muted">Composio toolkits support OAuth. For {stats.managed} of them Composio already provides the OAuth app.</div>
          </div>
          <div>
            <div style={{ fontSize: 26, fontWeight: 650 }}>{stats.byo}</div>
            <div className="small muted">
              say "bring your own OAuth app", but {stats.dcrOnly} of those are MCP servers that register themselves. Nothing to set up by hand.
            </div>
          </div>
          <div>
            <div style={{ fontSize: 26, fontWeight: 650, color: "var(--accent)" }}>{stats.manual}</div>
            <div className="small muted">need a developer to register an app with the provider. These guides are for them.</div>
          </div>
        </div>
      </section>

      <h2 id="library">Library</h2>
      <div className="grid2">
        {guides.map((g) => {
          const mix = evidenceMix(g);
          return (
            <a key={g.app.slug} href={`/guides/${g.app.slug}`} className="card" style={{ color: "inherit", textDecoration: "none" }}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <h3 style={{ fontSize: 17 }}>{g.app.name}</h3>
                <span className={`pill ${g.verdict.tier}`}>{TIER[g.verdict.tier].label}</span>
              </div>
              <p className="small muted" style={{ margin: "8px 0 12px" }}>
                {g.verdict.summary}
              </p>
              <div className="row small">
                <span>
                  <span className="faint">Try it:</span> {formatDuration(g.clocks.firstConnection.effort)}
                  {g.clocks.firstConnection.wait.max > 0 ? ` + ${formatDuration(g.clocks.firstConnection.wait)} wait` : ""}
                </span>
                <span>
                  <span className="faint">Customers:</span> {formatDuration(g.clocks.production.effort)}
                  {g.clocks.production.wait.max > 0 ? ` + ${formatDuration(g.clocks.production.wait)} wait` : ""}
                </span>
              </div>
              <div className="faint small" style={{ marginTop: 10 }}>
                {g.claims.length} claims: {(Object.keys(mix) as (keyof typeof mix)[]).filter((k) => mix[k]).map((k) => `${mix[k]} ${EVIDENCE[k].label.toLowerCase()}`).join(", ")}
              </div>
            </a>
          );
        })}
        <a href="/generate?q=Zoho%20Recruit" className="card" style={{ color: "inherit", textDecoration: "none", borderStyle: "dashed" }}>
          <h3 style={{ fontSize: 17 }}>Any other app</h3>
          <p className="small muted" style={{ margin: "8px 0 0" }}>
            Type a name or website in the search box. The agent researches it live, shows its work, and saves a guide you can share. Example: Zoho Recruit →
          </p>
        </a>
      </div>

      {recent.length > 0 && (
        <>
          <h2>Recently generated by the agent</h2>
          <div className="row">
            {recent.map((r) => (
              <a key={r.id} className="btn" href={`/g/${r.id}`}>
                {r.id.replace(/-[a-z0-9]+$/, "")} <span className="faint small">{r.uploadedAt.toISOString().slice(0, 10)}</span>
              </a>
            ))}
          </div>
        </>
      )}

      <h2>How to read a guide</h2>
      <div className="grid2">
        <div className="card">
          <div className="label" style={{ marginBottom: 10 }}>
            Difficulty
          </div>
          {(Object.keys(TIER) as Tier[]).map((t) => (
            <div key={t} className="small" style={{ marginBottom: 8 }}>
              <span className={`pill ${t}`}>{TIER[t].label}</span> <span className="muted">{TIER[t].blurb}</span>
            </div>
          ))}
          <p className="small muted" style={{ marginTop: 10 }}>
            Every guide has two clocks: when <em>you</em> can try it, and when <em>your customers</em> can connect. Each is split into hands-on work and
            time spent waiting on someone else.
          </p>
        </div>
        <div className="card">
          <div className="label" style={{ marginBottom: 10 }}>
            Evidence
          </div>
          {(Object.keys(EVIDENCE) as (keyof typeof EVIDENCE)[]).map((k) => (
            <div key={k} className="small" style={{ marginBottom: 8 }}>
              <span className={`pill ${k}`}>{EVIDENCE[k].label}</span> <span className="muted">{EVIDENCE[k].blurb}</span>
            </div>
          ))}
          <p className="small muted" style={{ marginTop: 10 }}>
            Any number that rests on less than official or tested evidence is labelled <span className="pill estimate">Estimate</span>.
          </p>
        </div>
      </div>
    </>
  );
}
