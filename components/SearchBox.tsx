"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import AppLogo from "./AppLogo";

export interface SearchItem {
  slug: string;
  name: string;
  curated: boolean;
  managed: boolean;
  dcr: boolean;
}

export default function SearchBox({ items, autoFocus }: { items: SearchItem[]; autoFocus?: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  // "/" focuses search from anywhere on the page, like most developer tools.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === "/" && !/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) && !t.isContentEditable) {
        e.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const matches = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return items
      .filter((i) => i.name.toLowerCase().includes(s) || i.slug.includes(s.replace(/\s+/g, "_")))
      .sort((a, b) => Number(b.curated) - Number(a.curated) || Number(b.name.toLowerCase().startsWith(s)) - Number(a.name.toLowerCase().startsWith(s)))
      .slice(0, 7);
  }, [q, items]);

  const go = (item?: SearchItem) => {
    if (item?.curated) return router.push(`/guides/${item.slug}`);
    const query = item ? item.name : q.trim();
    if (query) router.push(`/generate?q=${encodeURIComponent(query)}`);
  };

  const options = [...matches.map((m) => ({ kind: "item" as const, item: m })), ...(q.trim() ? [{ kind: "free" as const }] : [])];

  return (
    <form
      className="search"
      onSubmit={(e) => {
        e.preventDefault();
        const o = options[active];
        go(o && o.kind === "item" ? o.item : undefined);
      }}
    >
      <input
        ref={input}
        value={q}
        autoFocus={autoFocus}
        placeholder="Type an app name or website, e.g. Xero, notion.so, Zoho Recruit"
        aria-label="App name or website"
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, options.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          }
        }}
      />
      {open && options.length > 0 && (
        <div className="suggest" role="listbox">
          {options.map((o, i) =>
            o.kind === "item" ? (
              <button type="button" key={o.item.slug} className={i === active ? "on" : ""} onMouseDown={() => go(o.item)}>
                <AppLogo slug={o.item.slug} name={o.item.name} size={22} />
                <span className="grow">{o.item.name}</span>
                {o.item.curated && <span className="chip tested">Guide ready</span>}
                {!o.item.curated && o.item.managed && <span className="chip">Composio-managed</span>}
                {!o.item.curated && o.item.dcr && <span className="chip">Self-registering MCP</span>}
                {!o.item.curated && <span className="faint small">Research →</span>}
              </button>
            ) : (
              <button type="button" key="free" className={i === active ? "on" : ""} onMouseDown={() => go()}>
                <span className="applogo fallback" style={{ width: 22, height: 22 }} aria-hidden>
                  ✦
                </span>
                <span className="grow">
                  Research <strong>{q.trim()}</strong> with the agent
                </span>
                <span className="faint small">Live · a few minutes</span>
              </button>
            ),
          )}
        </div>
      )}
      <span className="kbd" aria-hidden>/</span>
    </form>
  );
}
