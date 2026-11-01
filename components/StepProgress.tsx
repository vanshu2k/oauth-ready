"use client";

import { useEffect, useState } from "react";

// Step checklist state lives in this browser only (localStorage), keyed by guide slug.
const EVENT = "oauth-ready-steps";
const key = (slug: string) => `oauth-ready:steps:${slug}`;

function read(slug: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(key(slug)) ?? "[]");
  } catch {
    return [];
  }
}

function write(slug: string, ids: string[]) {
  try {
    localStorage.setItem(key(slug), JSON.stringify(ids));
  } catch {
    /* private mode: progress just isn't remembered */
  }
  window.dispatchEvent(new Event(EVENT));
}

function useDone(slug: string): string[] {
  const [done, setDone] = useState<string[]>([]);
  useEffect(() => {
    const sync = () => setDone(read(slug));
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [slug]);
  return done;
}

export function StepCheck({ slug, id, title }: { slug: string; id: string; title: string }) {
  const done = useDone(slug);
  const checked = done.includes(id);
  return (
    <input
      type="checkbox"
      className="step-check no-print"
      checked={checked}
      aria-label={`Mark "${title}" as done`}
      onChange={() => write(slug, checked ? done.filter((x) => x !== id) : [...done, id])}
    />
  );
}

export function StepProgress({ slug, steps }: { slug: string; steps: { id: string; title: string }[] }) {
  const done = useDone(slug).filter((id) => steps.some((s) => s.id === id));
  const next = steps.find((s) => !done.includes(s.id));
  const pct = Math.round((done.length / Math.max(steps.length, 1)) * 100);
  return (
    <div className="card tight no-print" style={{ marginBottom: 16 }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <span className="small">
          {next ? (
            <>
              <span className="faint">Your next step:</span>{" "}
              <a href={`#step-${next.id}`}>
                <strong>{next.title}</strong>
              </a>
            </>
          ) : (
            <strong>All steps done 🎉</strong>
          )}
        </span>
        <span className="faint small">
          {done.length} of {steps.length} done
          {done.length > 0 && (
            <button type="button" className="btn" style={{ marginLeft: 8, padding: "1px 8px", fontSize: 12 }} onClick={() => write(slug, [])}>
              Reset
            </button>
          )}
        </span>
      </div>
      <div className="mixbar" style={{ marginTop: 8 }}>
        <span className="tested" style={{ width: `${pct}%` }} />
      </div>
      <div className="faint small" style={{ marginTop: 6 }}>
        Tick steps as you go. Progress is saved in this browser only.
      </div>
    </div>
  );
}
