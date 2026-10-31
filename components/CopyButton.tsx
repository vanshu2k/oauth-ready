"use client";

import { useState } from "react";

// Copies `text`, or the current page URL when `useLocation` is set.
export default function CopyButton({ label, text, useLocation, small }: { label: string; text: string; useLocation?: boolean; small?: boolean }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="btn"
      style={small ? { padding: "2px 8px", fontSize: 12 } : undefined}
      onClick={async () => {
        const value = useLocation ? window.location.href : text.startsWith("/") ? window.location.origin + text : text;
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          window.prompt("Copy this:", value);
        }
      }}
    >
      {done ? "Copied" : label}
    </button>
  );
}
