// Renders one guide. Pure props, no Node imports, so it works on the server and in the live generator.
import { evidenceMix, weakClaims } from "@/lib/evidence";
import { ACTOR, EVIDENCE, TIER, formatDuration, host } from "@/lib/format";
import { guideToMarkdown } from "@/lib/markdown";
import type { Actor, Clock, Guide } from "@/lib/types";
import AppLogo from "./AppLogo";
import CopyButton from "./CopyButton";
import Icon from "./Icon";
import { StepCheck, StepProgress } from "./StepProgress";

export interface CheckBadge {
  status: "pass" | "fail" | "no_connection" | "error";
  tool: string;
  latencyMs?: number;
  runAt: string;
}

// Footnote-style references: [3] links to the third claim in the Evidence list.
function Refs({ g, ids }: { g: Guide; ids: string[] }) {
  if (!ids.length) return null;
  return (
    <>
      {ids.map((id) => {
        const i = g.claims.findIndex((x) => x.id === id);
        const c = g.claims[i];
        return (
          <a key={id} href={`#claim-${id}`} className="ref" title={c ? `${EVIDENCE[c.evidence.level].label}: ${c.text}` : id}>
            {i + 1}
          </a>
        );
      })}
    </>
  );
}

function ClockCell({ g, title, clock }: { g: Guide; title: string; clock: Clock }) {
  const weak = weakClaims(g, clock.claimIds);
  return (
    <div>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <span className="kicker">{title}</span>
        {weak.length > 0 && (
          <span className="pill estimate" title={`Partly based on our own estimate: ${weak.join(", ")}`}>
            Estimate
          </span>
        )}
      </div>
      <div className="clock-pair">
        <div>
          <div className="rail-big">{formatDuration(clock.effort)}</div>
          <div className="faint">hands-on work</div>
        </div>
        <div>
          <div className="rail-big">{formatDuration(clock.wait)}</div>
          <div className="faint">waiting on others</div>
        </div>
      </div>
      <p className="small muted" style={{ marginBottom: 4 }}>
        <span style={{ color: "var(--text)" }}>Done when</span> {clock.definition}
      </p>
      <p className="small" style={{ margin: 0 }}>
        {clock.summary} <Refs g={g} ids={clock.claimIds} />
      </p>
    </div>
  );
}

const ACTORS: Actor[] = ["agent", "developer", "customer_admin", "provider"];

export default function GuideView({ guide: g, shareUrl, check }: { guide: Guide; shareUrl?: string | null; check?: CheckBadge | null }) {
  const allSteps = g.stages.flatMap((s) => s.steps);
  const byActor = (a: Actor) => allSteps.filter((s) => s.actor === a).length;
  const assisted = allSteps.filter((s) => s.actor !== "agent" && s.agentHelp).length;
  const mix = evidenceMix(g);
  const total = g.claims.length || 1;
  const live = g.meta.generatedBy === "live_agent";
  const logoSlug = g.composioSetup.toolkitSlug || g.app.slug;
  let stepNo = 0;

  return (
    <article>
      <header className="guide-head">
        <div className="title">
          <AppLogo slug={logoSlug} name={g.app.name} size={46} />
          <div>
            <div className="kicker">{g.app.category ? `${g.app.category} · ` : ""}OAuth app setup</div>
            <h1 style={{ marginTop: 4 }}>{g.app.name}</h1>
            <div className="small faint" style={{ marginTop: 4 }}>
              {live ? "Researched by the agent" : "Hand-checked guide"} · {g.meta.generatedAt.slice(0, 10)}
              {g.meta.model ? ` · ${g.meta.model}` : ""}
              {live && !g.meta.humanReviewed ? " · not yet reviewed by a person" : ""}
            </div>
          </div>
        </div>
        <div className="row no-print">
          {shareUrl !== null && <CopyButton label="Copy link" text={shareUrl ?? ""} useLocation={!shareUrl} />}
          <CopyButton label="Copy Markdown" text={guideToMarkdown(g)} />
          <a className="btn" href={g.app.developerPortal} target="_blank" rel="noreferrer">
            Developer portal <Icon name="external" size={13} />
          </a>
        </div>
      </header>

      <div className="guide-grid">
        <div style={{ minWidth: 0 }}>
          <p className="verdict-text">
            {g.verdict.summary} <Refs g={g} ids={g.verdict.claimIds} />
          </p>
          {g.composioSetup.managedOAuthAvailable && (
            <div className="banner" style={{ marginBottom: 16 }}>
              Composio already provides an OAuth app for this toolkit. You only need your own for your app name on the consent screen, custom scopes,
              or a separate rate-limit quota.
            </div>
          )}

          <div className="clocks" style={{ marginTop: 18 }}>
            <ClockCell g={g} title="You can try it" clock={g.clocks.firstConnection} />
            <ClockCell g={g} title="Customers can connect" clock={g.clocks.production} />
          </div>

          <h2>What to do, in order</h2>
          <StepProgress slug={g.app.slug} steps={allSteps.map((s) => ({ id: s.id, title: s.title }))} />
          {g.stages.map((stage, si) => (
            <section key={stage.id} className="stage">
              <div className="stage-head">
                <h3>
                  <span className="faint mono" style={{ fontSize: 12, marginRight: 8 }}>
                    {String(si + 1).padStart(2, "0")}
                  </span>
                  {stage.name}
                </h3>
                <span className="small faint">Unlocks: {stage.unlocks}</span>
              </div>
              <ol className="steps">
                {stage.steps.map((s) => {
                  stepNo++;
                  return (
                    <li key={s.id} id={`step-${s.id}`} className={`step ${s.actor}`}>
                      <div className="num">{stepNo}</div>
                      <div className="step-body">
                        <div className="step-top">
                          <span className="step-title">
                            <StepCheck slug={g.app.slug} id={s.id} title={s.title} />
                            {s.title}
                          </span>
                          <span className="row" style={{ gap: 12, flexWrap: "nowrap" }}>
                            {s.estimate && <span className="faint small mono">{formatDuration(s.estimate)}</span>}
                            <span className={`status ${s.actor}`}>{ACTOR[s.actor]}</span>
                          </span>
                        </div>
                        <p className="small muted" style={{ margin: "6px 0 0" }}>
                          {s.instructions} <Refs g={g} ids={s.claimIds} />
                        </p>
                        {s.agentHelp && (
                          <div className="aside agent">
                            <Icon name="spark" size={14} />
                            <span>
                              <span style={{ color: "var(--text)" }}>Agent prepares</span> {s.agentHelp}
                            </span>
                          </div>
                        )}
                        {s.whyHuman && (
                          <div className="aside human">
                            <Icon name="user" size={14} />
                            <span>
                              <span style={{ color: "var(--text)" }}>Why a person</span> {s.whyHuman}
                            </span>
                          </div>
                        )}
                        {s.links && s.links.length > 0 && (
                          <div className="row small" style={{ marginTop: 8, gap: 14 }}>
                            {s.links.map((l) => (
                              <a key={l} href={l} target="_blank" rel="noreferrer" className="row" style={{ gap: 5 }}>
                                {host(l)} <Icon name="external" size={12} />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}

          {g.gotchas.length > 0 && (
            <>
              <h2>If you get stuck</h2>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>You see</th>
                      <th>Why</th>
                      <th>Do this</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.gotchas.map((x) => (
                      <tr key={x.id}>
                        <td className="top" style={{ fontWeight: 500 }}>
                          {x.symptom}
                        </td>
                        <td className="top muted">{x.cause}</td>
                        <td className="top">
                          {x.fix} <Refs g={g} ids={x.claimIds} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {(g.requirements.length > 0 || g.limits.length > 0) && (
            <>
              <h2>Requirements and limits</h2>
              <div className="kv">
                {(["first_connection", "production", "scale"] as const).flatMap((when) => {
                  const reqs = g.requirements.filter((r) => r.neededFor === when);
                  if (!reqs.length) return [];
                  return [
                    <div key={`${when}-k`} className="k">
                      {{ first_connection: "To start", production: "To go live", scale: "To scale" }[when]}
                    </div>,
                    <div key={`${when}-v`}>
                      {reqs.map((r) => (
                        <div key={r.id} style={{ marginBottom: 4 }}>
                          {r.description} <Refs g={g} ids={r.claimIds} />
                        </div>
                      ))}
                    </div>,
                  ];
                })}
                {g.limits.flatMap((l) => [
                  <div key={`${l.id}-k`} className="k">
                    {l.what}
                  </div>,
                  <div key={`${l.id}-v`}>
                    <span className="mono" style={{ fontSize: 13 }}>
                      {l.value}
                    </span>{" "}
                    <span className="faint small">({l.appliesWhen})</span> <Refs g={g} ids={l.claimIds} />
                  </div>,
                ])}
              </div>
            </>
          )}

          <h2>Composio setup</h2>
          <div className="kv">
            <div className="k">Toolkit</div>
            <div>
              <code>{g.composioSetup.toolkitSlug}</code>
            </div>
            <div className="k">Auth scheme</div>
            <div className="row" style={{ gap: 6 }}>
              {g.composioSetup.authSchemes.map((a) => (
                <span key={a} className="chip">
                  {a}
                </span>
              ))}
              <span className="faint small">{g.composioSetup.managedOAuthAvailable ? "Composio-managed app available" : "Bring your own app"}</span>
            </div>
            <div className="k">Redirect URI</div>
            <div className="row" style={{ gap: 8 }}>
              <code>{g.composioSetup.redirectUri}</code>
              <CopyButton label="Copy" text={g.composioSetup.redirectUri} small />
            </div>
            <div className="k">Default scopes</div>
            <div className="row" style={{ gap: 6 }}>
              {g.composioSetup.defaultScopes.length ? (
                g.composioSetup.defaultScopes.map((s) => <code key={s}>{s.replace("https://www.googleapis.com/auth/", "")}</code>)
              ) : (
                <span className="small muted">None. Access is set on the provider app.</span>
              )}
            </div>
            {g.composioSetup.scopeNotes.length > 0 && (
              <>
                <div className="k">Scope notes</div>
                <div>
                  {g.composioSetup.scopeNotes.map((n) => (
                    <div key={n.scope} style={{ marginBottom: 8 }}>
                      <span
                        className={`status ${{ basic: "instant", sensitive: "review", restricted: "gated", admin_consent: "customer_admin", unknown: "neutral" }[n.sensitivity]}`}
                      >
                        {n.sensitivity.replace("_", " ")}
                      </span>{" "}
                      <code>{n.scope.replace(/https:\/\/www\.googleapis\.com\/auth\//g, "")}</code>
                      <div className="small muted" style={{ marginTop: 2 }}>
                        {n.note}
                      </div>
                    </div>
                  ))}
                  <Refs g={g} ids={g.composioSetup.claimIds} />
                </div>
              </>
            )}
          </div>

          <h2 id="evidence">Evidence</h2>
          <div className="claims">
            {g.claims.map((c, i) => (
              <div key={c.id} id={`claim-${c.id}`} className="claim">
                <div className="n">{i + 1}</div>
                <div style={{ minWidth: 0 }}>
                  <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", flexWrap: "nowrap" }}>
                    <span style={{ flex: 1, minWidth: 0, overflowWrap: "anywhere" }}>{c.text}</span>
                    <span className={`status ${c.evidence.level}`} style={{ flex: "none" }} title={EVIDENCE[c.evidence.level].blurb}>
                      {EVIDENCE[c.evidence.level].label}
                    </span>
                  </div>
                  {c.evidence.sources.map((s, si) => (
                    <div key={si} className="small" style={{ marginTop: 6 }}>
                      {s.quote && <blockquote>“{s.quote}”</blockquote>}
                      <span className="row" style={{ gap: 8 }}>
                        <a href={s.url} target="_blank" rel="noreferrer">
                          {s.title || host(s.url)}
                        </a>
                        <span className="faint">
                          {s.publisher.replace("_", " ")} · {s.retrievedAt}
                        </span>
                        {s.quoteCheck && (
                          <span
                            className={`chip ${{ verified: "tested", not_found: "unknown", unreadable: "inferred" }[s.quoteCheck]}`}
                            title="Automated re-fetch of the page after the guide was generated"
                          >
                            {{ verified: "quote found on page", not_found: "quote not found", unreadable: "not auto-checkable" }[s.quoteCheck]}
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                  {c.evidence.testNote && (
                    <div className="aside">
                      <Icon name={c.evidence.level === "tested" ? "check" : "file"} size={14} />
                      <span>{c.evidence.testNote}</span>
                    </div>
                  )}
                  {c.evidence.conflicts?.map((x, xi) => (
                    <div key={xi} className="aside human">
                      <Icon name="alert" size={14} />
                      <span>
                        <span style={{ color: "var(--text)" }}>Another source says</span> “{x.otherValue}” (
                        <a href={x.sourceUrl} target="_blank" rel="noreferrer">
                          {host(x.sourceUrl)}
                        </a>
                        ). {x.resolution}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {(g.openQuestions.length > 0 || g.corrections.length > 0) && (
            <div className="grid2" style={{ marginTop: 24 }}>
              {g.openQuestions.length > 0 && (
                <div className="card">
                  <div className="kicker" style={{ marginBottom: 10 }}>
                    Still open
                  </div>
                  {g.openQuestions.map((q, i) => (
                    <div key={i} className="small" style={{ marginBottom: 12 }}>
                      <div style={{ fontWeight: 500 }}>{q.question}</div>
                      <div className="muted">{q.whyItMatters}</div>
                      <div className="faint">To settle it: {q.howToResolve}</div>
                    </div>
                  ))}
                </div>
              )}
              {g.corrections.length > 0 && (
                <div className="card">
                  <div className="kicker" style={{ marginBottom: 10 }}>
                    What we corrected
                  </div>
                  {g.corrections.map((c, i) => (
                    <div key={i} className="small" style={{ marginBottom: 12 }}>
                      <div className="faint">
                        <s>{c.before}</s>
                      </div>
                      <div>{c.after}</div>
                      <div className="muted">
                        {c.why}{" "}
                        <a href={c.sourceUrl} target="_blank" rel="noreferrer">
                          Source
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* At a glance */}
        <aside className="rail">
          <div className="rail-card">
            <div className="rail-row">
              <div className="rail-k">Difficulty</div>
              <span className={`status ${g.verdict.tier}`}>{TIER[g.verdict.tier].label}</span>
              <div className="small faint" style={{ marginTop: 4 }}>
                {TIER[g.verdict.tier].blurb}
              </div>
            </div>
            <div className="rail-row">
              <div className="rail-k">You can try it</div>
              <div className="rail-big">{formatDuration(g.clocks.firstConnection.effort)}</div>
              {g.clocks.firstConnection.wait.max > 0 && <div className="small muted">+ {formatDuration(g.clocks.firstConnection.wait)} waiting</div>}
            </div>
            <div className="rail-row">
              <div className="rail-k">Customers can connect</div>
              <div className="rail-big">{formatDuration(g.clocks.production.effort)}</div>
              {g.clocks.production.wait.max > 0 && <div className="small muted">+ {formatDuration(g.clocks.production.wait)} waiting</div>}
            </div>
            <div className="rail-row">
              <div className="rail-k">Cost</div>
              <div className="rail-v">{g.verdict.cost.summary.split(/(?<=\.)\s/)[0]}</div>
            </div>
            <div className="rail-row">
              <div className="rail-k">Each customer&apos;s admin must act</div>
              <div className="rail-v">{g.verdict.customerAdminRequired ? "Yes" : "No"}</div>
            </div>
            <div className="rail-row">
              <div className="rail-k">Who does the steps</div>
              {ACTORS.filter((a) => byActor(a) > 0).map((a) => (
                <div key={a} className="row" style={{ justifyContent: "space-between" }}>
                  <span className={`status ${a}`}>{ACTOR[a]}</span>
                  <span className="mono small faint">{byActor(a)}</span>
                </div>
              ))}
              {assisted > 0 && (
                <div className="small faint" style={{ marginTop: 6 }}>
                  The agent also prepares material for {assisted} of the human steps.
                </div>
              )}
            </div>
            {check && (
              <div className="rail-row">
                <div className="rail-k">Daily connection check</div>
                <span
                  className={`status ${check.status === "pass" ? "pass" : check.status === "fail" ? "fail" : "neutral"}`}
                  title={`Runs ${check.tool} through Composio on a real connection`}
                >
                  {{ pass: "Connection works", fail: "Check failed", no_connection: "No test connection", error: "Check couldn't run" }[check.status]}
                </span>
                <div className="small faint mono" style={{ marginTop: 3 }}>
                  {check.runAt.slice(0, 10)}
                  {check.latencyMs ? ` · ${check.latencyMs} ms` : ""}
                </div>
              </div>
            )}
            <div className="rail-row">
              <div className="rail-k">Evidence · {g.claims.length} claims</div>
              <div className="mixbar" style={{ margin: "6px 0 8px" }}>
                {(Object.keys(mix) as (keyof typeof mix)[]).map((k) =>
                  mix[k] ? <span key={k} className={k} style={{ width: `${(mix[k] / total) * 100}%` }} /> : null,
                )}
              </div>
              {(Object.keys(mix) as (keyof typeof mix)[])
                .filter((k) => mix[k])
                .map((k) => (
                  <div key={k} className="row" style={{ justifyContent: "space-between" }}>
                    <span className={`status ${k}`}>{EVIDENCE[k].label}</span>
                    <span className="mono small faint">{mix[k]}</span>
                  </div>
                ))}
            </div>
          </div>
        </aside>
      </div>
    </article>
  );
}
