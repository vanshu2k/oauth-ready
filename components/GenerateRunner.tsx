"use client";

import { useEffect, useRef, useState } from "react";
import type { AgentEvent, CatalogToolkit, Guide } from "@/lib/types";
import GuideView from "./GuideView";

type LogItem = { icon: string; text: string; tone?: "note" };

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
                add({ icon: "⌕", text: `Searched: ${ev.query}` });
                break;
              case "fetch":
                add({ icon: "↓", text: `Read ${ev.url.replace(/^https?:\/\/(www\.)?/, "").slice(0, 90)}` });
                break;
              case "note":
                add({ icon: "›", text: ev.text, tone: "note" });
                break;
              case "writing":
                setWriting(ev.chars);
                break;
              case "validation":
                add({ icon: "!", text: `Validator found ${ev.errors.length} problem(s); sending them back to the agent to fix: ${ev.errors.slice(0, 2).join("; ")}` });
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
        <>
          <div className="label">Live research</div>
          <h1 style={{ marginTop: 4 }}>{query}</h1>
          <p className="muted" style={{ marginTop: 8 }}>
            The agent reads the provider's developer docs, opens the developer portal, and writes a guide in the same format as the library.
            Every fact it uses is labelled with its source. It can't log in or create accounts, so nothing it writes is marked as tested.
          </p>
        </>
      )}

      {toolkit && toolkit.managed && !guide && (
        <div className="banner" style={{ margin: "14px 0" }}>
          Composio already provides an OAuth app for <strong>{toolkit.name}</strong>. You may not need your own; the guide covers when you would.
        </div>
      )}

      {!guide && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
            <div className="row">
              {running && <span className="spinner" />}
              <strong>{running ? (writing ? `Writing the guide (${Math.round(writing / 1000)}k characters)` : "Researching") : error ? "Stopped" : "Done"}</strong>
            </div>
            <span className="faint small">{elapsed}s</span>
          </div>
          <ul className="log">
            {log.map((l, i) => (
              <li key={i}>
                <span className="ic">{l.icon}</span>
                <span className={l.tone === "note" ? "note" : undefined}>{l.text}</span>
              </li>
            ))}
          </ul>
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
          <details className="card tight no-print" style={{ marginBottom: 20 }}>
            <summary className="small">
              How the agent got here: {log.length} steps in {elapsed}s
            </summary>
            <ul className="log" style={{ marginTop: 10 }}>
              {log.map((l, i) => (
                <li key={i}>
                  <span className="ic">{l.icon}</span>
                  <span className={l.tone === "note" ? "note" : undefined}>{l.text}</span>
                </li>
              ))}
            </ul>
          </details>
          <GuideView guide={guide} shareUrl={shareUrl} />
        </>
      )}
    </div>
  );
}
