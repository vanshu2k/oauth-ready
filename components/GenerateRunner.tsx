"use client";

import { useEffect, useRef, useState } from "react";
import type { AgentEvent, CatalogToolkit, Guide } from "@/lib/types";
import AppLogo from "./AppLogo";
import GuideView from "./GuideView";

type LogItem = { icon: string; text: string; tone?: "note" | "search-l" | "fetch-l" | "warn-l" };

export default function GenerateRunner({ query }: { query: string }) {
  const [log, setLog] = useState<LogItem[]>([]);
  const [toolkit, setToolkit] = useState<CatalogToolkit | null | undefined>(undefined);
  const [writing, setWriting] = useState(0);
  const [guide, setGuide] = useState<Guide | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const t0 = Date.now();
    const timer = setInterval(() => setElapsed(Math.round((Date.now() - t0) / 1000)), 1000);
    const add = (item: LogItem) => setLog((l) => [...l, item]);

    (async () => {
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });
        if (!res.ok || !res.body) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Request failed (${res.status})`);
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const parts = buf.split("\n\n");
          buf = parts.pop() ?? "";
          for (const part of parts) {
            if (!part.startsWith("data: ")) continue;
            const ev = JSON.parse(part.slice(6)) as AgentEvent;
            switch (ev.type) {
              case "catalog":
                setToolkit(ev.toolkit);
                break;
              case "status":
                add({ icon: "•", text: ev.text });
                break;
              case "search":
                add({ icon: "⌕", text: `search  ${ev.query}`, tone: "search-l" });
                break;
              case "fetch":
                add({ icon: "↓", text: `read    ${ev.url.replace(/^https?:\/\/(www\.)?/, "").slice(0, 90)}`, tone: "fetch-l" });
                break;
              case "note":
                add({ icon: "›", text: ev.text, tone: "note" });
                break;
              case "writing":
                setWriting(ev.chars);
                break;
              case "validation":
                add({ tone: "warn-l", icon: "!", text: `Validator found ${ev.errors.length} problem(s); sending them back to the agent to fix: ${ev.errors.slice(0, 2).join("; ")}` });
                break;
              case "done":
                setGuide(ev.guide);
                setShareUrl(ev.shareUrl);
                if (ev.shareUrl) window.history.replaceState(null, "", ev.shareUrl);
                break;
              case "error":
                setError(ev.message);
                break;
            }
          }
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        clearInterval(timer);
        setRunning(false);
      }
    })();
    return () => clearInterval(timer);
  }, [query]);

  return (
    <div>
      {!guide && (
        <section className="hero" style={{ paddingTop: 8 }}>
          <div className="kicker">Live research</div>
          <div className="row" style={{ gap: 14, marginTop: 10 }}>
            <AppLogo slug={toolkit?.slug ?? ""} name={query} size={40} />
            <h1>{query}</h1>
          </div>
          <p className="lead" style={{ marginTop: 14 }}>
            The agent reads the provider&apos;s developer docs, opens the developer portal, and writes a guide in the same format as the library. Every
            fact is labelled with its source. It can&apos;t log in or create accounts, so nothing it writes is marked as tested.
          </p>
        </section>
      )}

      {toolkit && toolkit.managed && !guide && (
        <div className="banner" style={{ margin: "14px 0" }}>
          Composio already provides an OAuth app for <strong>{toolkit.name}</strong>. You may not need your own; the guide covers when you would.
        </div>
      )}

      {!guide && (
        <div className="terminal" style={{ marginTop: 18 }}>
          <div className="terminal-bar">
            <span className="dots">
              <i />
              <i />
              <i />
            </span>
            <span>agent · {query}</span>
            <span style={{ flex: 1 }} />
            {running && <span className="spinner" />}
            <span>{running ? (writing ? `writing guide · ${Math.round(writing / 1000)}k chars` : "researching") : error ? "stopped" : "done"}</span>
            <span>{elapsed}s</span>
          </div>
          <LogList log={log} />
        </div>
      )}

      {error && (
        <div className="banner err" style={{ marginTop: 14 }}>
          {error}
        </div>
      )}

      {guide && (
        <>
          {!shareUrl && (
            <div className="banner warn no-print" style={{ marginBottom: 16 }}>
              This guide wasn't saved, so it has no shareable link. Use Copy as Markdown to keep it.
            </div>
          )}
          <details className="terminal no-print" style={{ marginBottom: 24 }}>
            <summary className="terminal-bar" style={{ cursor: "pointer" }}>
              <span>How the agent got here · {log.length} steps in {elapsed}s</span>
            </summary>
            <LogList log={log} />
          </details>
          <GuideView guide={guide} shareUrl={shareUrl} />
        </>
      )}
    </div>
  );
}

function LogList({ log }: { log: LogItem[] }) {
  return (
    <ul className="log">
      {log.map((l, i) => (
        <li key={i} className={l.tone}>
          <span className="ic">{l.icon}</span>
          <span className={l.tone === "note" ? "note" : undefined}>{l.text}</span>
        </li>
      ))}
    </ul>
  );
}
