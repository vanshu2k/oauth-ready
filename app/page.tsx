import AppLogo from "@/components/AppLogo";
import Icon from "@/components/Icon";
import SearchBox, { type SearchItem } from "@/components/SearchBox";
import { catalog, catalogStats, connectionCheck, curatedGuides } from "@/lib/data";
import { evidenceMix } from "@/lib/evidence";
import { TIER, formatDuration } from "@/lib/format";
import { recentGuides } from "@/lib/store";
import type { Clock } from "@/lib/types";

export const dynamic = "force-dynamic";

function ClockTd({ c }: { c: Clock }) {
  return (
    <td style={{ whiteSpace: "nowrap" }}>
      <div className="mono small">{formatDuration(c.effort)}</div>
      {c.wait.max > 0 && <div className="faint" style={{ fontSize: 12 }}>+ {formatDuration(c.wait)} wait</div>}
    </td>
  );
}
const nameFromId = (id: string) => id.replace(/-[a-z0-9]+$/, "").replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());

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
      <section className="hero">
        <h1 className="display">
          How long until your users can <span className="hl">connect?</span>
        </h1>
        <p className="lead" style={{ margin: "18px 0 24px" }}>
          Before your agent&apos;s users can connect an app, you may need your own OAuth app, approved by the provider. Look one up to see how hard
          that is, how long it takes, what can block you, and which steps an agent can do for you.
        </p>
        <div id="search">
          <SearchBox items={items} autoFocus />
        </div>
        <div className="try">
          <span>Try</span>
          {[
            { slug: "xero", name: "Xero", href: "/guides/xero" },
            { slug: "googleforms", name: "Google Forms", href: "/guides/googleforms" },
            { slug: "zoho_recruit", name: "Zoho Recruit", href: "/generate?q=Zoho%20Recruit" },
            { slug: "teamtailor", name: "teamtailor.com", href: "/generate?q=teamtailor.com" },
          ].map((t) => (
            <a key={t.slug} href={t.href}>
              <AppLogo slug={t.slug} name={t.name} size={18} />
              {t.name}
            </a>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 36 }}>
        <div className="stats">
          <div className="stat">
            <div className="stat-v">{stats.total}</div>
            <div className="stat-k">Composio toolkits with OAuth</div>
          </div>
          <div className="stat">
            <div className="stat-v">{stats.managed}</div>
            <div className="stat-k">Composio already provides the app</div>
          </div>
          <div className="stat">
            <div className="stat-v">{stats.dcrOnly}</div>
            <div className="stat-k">Self-registering MCP servers</div>
          </div>
          <div className="stat">
            <div className="stat-v on">{stats.manual}</div>
            <div className="stat-k">Need a hand-registered app: these guides</div>
          </div>
        </div>
      </section>

      <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline", marginTop: 44 }}>
        <h2 id="library" style={{ margin: 0 }}>
          Library
        </h2>
        <span className="small faint">Hand-checked guides, easiest first</span>
      </div>
      <div className="table-wrap" style={{ marginTop: 14 }}>
        <table>
          <thead>
            <tr>
              <th>App</th>
              <th>Difficulty</th>
              <th>You can try it</th>
              <th>Customers can connect</th>
              <th>Customer admin</th>
              <th>Evidence</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {guides.map((g) => {
              const mix = evidenceMix(g);
              const total = g.claims.length || 1;
              const check = connectionCheck(g.app.slug);
              return (
                <tr key={g.app.slug}>
                  <td>
                    <a className="app" href={`/guides/${g.app.slug}`}>
                      <AppLogo slug={g.composioSetup.toolkitSlug || g.app.slug} name={g.app.name} />
                      <span>
                        {g.app.name.replace(/ \(.*\)$/, "")}
                        <span className="faint small" style={{ display: "block", fontWeight: 400 }}>
                          {g.app.category}
                        </span>
                      </span>
                    </a>
                  </td>
                  <td>
                    <span className={`status ${g.verdict.tier}`}>{TIER[g.verdict.tier].label}</span>
                  </td>
                  <ClockTd c={g.clocks.firstConnection} />
                  <ClockTd c={g.clocks.production} />
                  <td className="small">{g.verdict.customerAdminRequired ? "Required" : <span className="faint">No</span>}</td>
                  <td style={{ minWidth: 130 }}>
                    <div className="mixbar" title={`${mix.tested} tested, ${mix.official} official, ${mix.third_party} third-party, ${mix.inferred} inferred`}>
                      {(Object.keys(mix) as (keyof typeof mix)[]).map((k) =>
                        mix[k] ? <span key={k} className={k} style={{ width: `${(mix[k] / total) * 100}%` }} /> : null,
                      )}
                    </div>
                    <div className="faint" style={{ fontSize: 11.5, marginTop: 5 }}>
                      {mix.tested > 0 ? (
                        <span style={{ color: "var(--green)" }}>
                          {mix.tested} tested{check?.status === "pass" ? " · live" : ""}
                        </span>
                      ) : (
                        `${mix.official} official`
                      )}{" "}
                      · {g.claims.length} claims
                    </div>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <a href={`/guides/${g.app.slug}`} aria-label={`Open ${g.app.name} guide`} className="faint">
                      <Icon name="arrow" />
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {recent.length > 0 && (
        <>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline", marginTop: 44 }}>
            <h2 style={{ margin: 0 }}>Researched live by the agent</h2>
            <span className="small faint">Not yet reviewed by a person</span>
          </div>
          <div className="table-wrap" style={{ marginTop: 14 }}>
            <table>
              <thead>
                <tr>
                  <th>App</th>
                  <th>Generated</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => {
                  const slug = r.id.replace(/-[a-z0-9]+$/, "");
                  return (
                    <tr key={r.id}>
                      <td>
                        <a className="app" href={`/g/${r.id}`}>
                          <AppLogo slug={slug} name={nameFromId(r.id)} size={24} />
                          {nameFromId(r.id)}
                        </a>
                      </td>
                      <td className="mono small faint">{r.uploadedAt.toISOString().slice(0, 16).replace("T", " ")} UTC</td>
                      <td style={{ textAlign: "right" }}>
                        <a href={`/g/${r.id}`} aria-label="Open guide" className="faint">
                          <Icon name="arrow" />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="card row" style={{ marginTop: 44, justifyContent: "space-between" }}>
        <div>
          <h3>New here?</h3>
          <p className="small muted" style={{ margin: "4px 0 0" }}>
            See how a guide is built, what each label means, and how every fact is checked.
          </p>
        </div>
        <div className="row">
          <a className="btn" href="/how-it-works">
            How it works
          </a>
          <a className="btn" href="/method">
            How we verify
          </a>
        </div>
      </div>
    </>
  );
}
