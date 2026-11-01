import type { Metadata } from "next";
import { curatedGuides, verificationRun } from "@/lib/data";
import { evidenceMix } from "@/lib/evidence";
import { EVIDENCE, TIER } from "@/lib/format";

export const metadata: Metadata = { title: "How we verify | OAuth Ready" };

export default function MethodPage() {
  const guides = curatedGuides();
  const run = verificationRun();
  const levels = Object.keys(EVIDENCE) as (keyof typeof EVIDENCE)[];
  const corrections = guides.flatMap((g) => g.corrections.map((c) => ({ app: g.app, ...c })));
  const open = guides.flatMap((g) => g.openQuestions.map((q) => ({ app: g.app, ...q })));
  const conflicts = guides.flatMap((g) =>
    g.claims.flatMap((c) => (c.evidence.conflicts ?? []).map((x) => ({ app: g.app, claim: c, ...x }))),
  );

  return (
    <>
      <div className="label">Method</div>
      <h1 style={{ marginTop: 4 }}>How we verify</h1>
      <p className="muted" style={{ maxWidth: 720, marginTop: 10 }}>
        Each guide is a set of claims. Each claim carries its evidence: what we tested, what the provider's own docs say (quoted), what only
        third parties say, and what is our own estimate. The text of a guide only points at claims, so every number on a page can be traced back.
      </p>

      <h2>The process</h2>
      <div className="grid2">
        <div className="card">
          <h3>Library guides</h3>
          <ol className="small" style={{ paddingLeft: 18, margin: "8px 0 0" }}>
            <li>Start from Composio's toolkit catalog: auth schemes, default scopes and redirect URI, as Composio actually configures them.</li>
            <li>Research the provider's developer docs; quote the exact sentence behind each claim.</li>
            <li>Validate every guide against a JSON Schema plus evidence rules (an "official" claim needs a provider or Composio source; a "tested" claim needs a test note).</li>
            <li>Run hands-on setup attempts where they're free, and turn estimates into tested claims.</li>
            <li>Log every correction: what we believed, what's true, and the source.</li>
          </ol>
        </div>
        <div className="card">
          <h3>Live agent</h3>
          <ol className="small" style={{ paddingLeft: 18, margin: "8px 0 0" }}>
            <li>Match the request to Composio's catalog, so scopes and the redirect URI come from data, not the model.</li>
            <li>Claude researches with web search and web fetch, opening the provider's developer portal to see what a developer would meet.</li>
            <li>It submits the guide through a tool whose input is the guide schema. The same validator runs; errors go back to the agent to fix, up to twice.</li>
            <li>It can't log in, so it may not mark anything as tested. Guides are labelled "Generated, not yet reviewed".</li>
          </ol>
        </div>
      </div>

      <h2>Verification run, {run.checkedAt}</h2>
      <p className="small muted" style={{ maxWidth: 720 }}>
        We re-checked every quote in the library and in two guides the live agent generated (Zoho Recruit and Teamtailor), against the pages as
        they are today.
      </p>
      <ol className="small" style={{ paddingLeft: 18 }}>
        {run.method.map((m, i) => (
          <li key={i}>{m}</li>
        ))}
      </ol>
      <div className="card" style={{ padding: 0, overflowX: "auto", marginTop: 10 }}>
        <table>
          <thead>
            <tr>
              <th>Guides</th>
              <th>Quotes</th>
              <th>Word for word</th>
              <th>Wording wrong</th>
              <th>Source gone</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {run.totals.map((t) => (
              <tr key={t.set}>
                <td>
                  <strong>{t.set}</strong>
                </td>
                <td>{t.quotes}</td>
                <td>{t.verbatim}</td>
                <td>{t.wordingErrors}</td>
                <td>{t.deadSources}</td>
                <td className="small muted">{t.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 14 }}>
        {run.findings.map((f, i) => (
          <div key={i} className="card tight small" style={{ marginBottom: 8 }}>
            <span className={`pill ${{ our_error: "review", agent_error: "gated", source_problem: "inferred", confirmed: "tested" }[f.kind]}`}>
              {{ our_error: "Our mistake", agent_error: "Agent mistake", source_problem: "Source problem", confirmed: "Confirmed" }[f.kind]}
            </span>{" "}
            <strong>{f.subject}:</strong> {f.text}
          </div>
        ))}
      </div>
      <div className="card" style={{ marginTop: 10 }}>
        <div className="label" style={{ marginBottom: 6 }}>
          What we learned
        </div>
        <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>
          {run.lessons.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ul>
      </div>

      <h2>Evidence across the library</h2>
      <div className="card" style={{ padding: 0, overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>App</th>
              <th>Tier</th>
              {levels.map((l) => (
                <th key={l}>{EVIDENCE[l].label}</th>
              ))}
              <th>Open</th>
              <th>Corrected</th>
            </tr>
          </thead>
          <tbody>
            {guides.map((g) => {
              const mix = evidenceMix(g);
              return (
                <tr key={g.app.slug}>
                  <td>
                    <a href={`/guides/${g.app.slug}`}>{g.app.name}</a>
                  </td>
                  <td>
                    <span className={`pill ${g.verdict.tier}`}>{TIER[g.verdict.tier].label}</span>
                  </td>
                  {levels.map((l) => (
                    <td key={l}>{mix[l] || <span className="faint">0</span>}</td>
                  ))}
                  <td>{g.openQuestions.length}</td>
                  <td>{g.corrections.length}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h2>What we corrected ({corrections.length})</h2>
      {corrections.map((c, i) => (
        <div key={i} className="card tight" style={{ marginBottom: 10 }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <a href={`/guides/${c.app.slug}`}>
              <strong>{c.app.name}</strong>
            </a>
            <span className="faint small">{c.date}</span>
          </div>
          <div className="small" style={{ marginTop: 6 }}>
            <s className="faint">{c.before}</s>
          </div>
          <div className="small">{c.after}</div>
          <div className="small muted">
            {c.why}{" "}
            <a href={c.sourceUrl} target="_blank" rel="noreferrer">
              Source ↗
            </a>
          </div>
        </div>
      ))}

      <h2>Where sources disagree ({conflicts.length})</h2>
      {conflicts.map((c, i) => (
        <div key={i} className="card tight small" style={{ marginBottom: 10 }}>
          <strong>{c.app.name}:</strong> {c.claim.text}
          <div className="muted" style={{ marginTop: 4 }}>
            Other source says “{c.otherValue}”. {c.resolution}
          </div>
        </div>
      ))}

      <h2>What we couldn't verify yet ({open.length})</h2>
      <div className="card" style={{ padding: 0, overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>App</th>
              <th>Question</th>
              <th>How to settle it</th>
            </tr>
          </thead>
          <tbody>
            {open.map((q, i) => (
              <tr key={i}>
                <td>{q.app.name}</td>
                <td>
                  <strong>{q.question}</strong>
                  <div className="muted small">{q.whyItMatters}</div>
                </td>
                <td className="small">{q.howToResolve}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Limits of this tool</h2>
      <ul className="small" style={{ paddingLeft: 18 }}>
        <li>Provider policies change. Every claim carries its retrieval date; treat older ones with care.</li>
        <li>Time estimates for waiting on reviews come from the providers' own stated targets where they exist, which aren't guarantees.</li>
        <li>The live agent works from public pages only. It can't see dashboards behind a login, so anything past sign-up is from docs, not observation.</li>
        <li>Generated guides aren't reviewed by a person until someone checks them. They're labelled that way.</li>
      </ul>
    </>
  );
}
