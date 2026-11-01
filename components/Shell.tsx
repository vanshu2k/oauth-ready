"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV = [
  { href: "/", label: "Overview", icon: "M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z" },
  { href: "/#library", label: "Library", icon: "M4 4h6v16H4zM14 4h6v16h-6z" },
  { href: "/method", label: "How we verify", icon: "M9 12l2 2 4-4M12 3l8 4v5c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V7z" },
];

function Icon({ d }: { d: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

function crumb(path: string): string {
  if (path === "/") return "Overview";
  if (path.startsWith("/method")) return "How we verify";
  if (path.startsWith("/guides/")) return "Library";
  if (path.startsWith("/generate") || path.startsWith("/g/")) return "Agent guides";
  return "";
}

export default function Shell({ repoUrl, children }: { repoUrl?: string; children: React.ReactNode }) {
  const path = usePathname() || "/";
  const [hash, setHash] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const read = () => setHash(window.location.hash);
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, [path]);
  useEffect(() => setOpen(false), [path, hash]);

  const isActive = (href: string) => {
    if (href === "/#library") return (path === "/" && hash === "#library") || path.startsWith("/guides/");
    if (href === "/") return path === "/" && hash !== "#library";
    return path.startsWith(href);
  };

  return (
    <div className={`shell${open ? " nav-open" : ""}`}>
      <aside className="side">
        <a href="/" className="brand">
          <span className="logo" aria-hidden>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <circle cx="8" cy="12" r="4" />
              <path d="M12 12h9M18 12v3M21 12v3" />
            </svg>
          </span>
          <span>
            OAuth Ready
            <span className="brand-sub">Setup guides</span>
          </span>
        </a>
        <div className="side-label">Platform</div>
        <nav className="side-nav">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className={isActive(n.href) ? "on" : undefined}>
              <Icon d={n.icon} />
              {n.label}
            </a>
          ))}
        </nav>
        <div className="side-foot">
          {repoUrl && (
            <a href={repoUrl} target="_blank" rel="noreferrer">
              <Icon d="M9 19c-4 1.5-4-2-6-2.5M15 21v-3.5a3 3 0 0 0-.9-2.4c3-.3 6-1.4 6-6.5a5 5 0 0 0-1.4-3.5 4.7 4.7 0 0 0-.1-3.5s-1.1-.3-3.6 1.4a12.4 12.4 0 0 0-6.6 0C5.9 1.3 4.8 1.6 4.8 1.6a4.7 4.7 0 0 0-.1 3.5A5 5 0 0 0 3.3 8.6c0 5.1 3 6.2 6 6.5a3 3 0 0 0-.9 2.4V21" />
              Source
            </a>
          )}
          <div className="side-note">Not affiliated with Composio or any provider.</div>
        </div>
      </aside>
      <div className="side-scrim" onClick={() => setOpen(false)} />
      <div className="main-col">
        <header className="topbar">
          <button type="button" className="menu-btn" aria-label="Open navigation" onClick={() => setOpen((o) => !o)}>
            <Icon d="M4 7h16M4 12h16M4 17h16" />
          </button>
          <div className="crumbs">
            <span className="faint">OAuth Ready</span>
            <span className="sep">/</span>
            <span>{crumb(path)}</span>
          </div>
          <span className="spacer" />
          <a className="btn" href="/method">
            Docs
          </a>
        </header>
        <main>
          <div className="wrap">{children}</div>
        </main>
        <footer>
          <div className="wrap">
            Guides describe provider policies as of the dates shown on each claim. Policies change, so check the linked sources before you rely on a
            number. Not affiliated with Composio or any provider.
          </div>
        </footer>
      </div>
    </div>
  );
}
