"use client";

import { useState } from "react";

// App logos come from Composio's public logo CDN, keyed by toolkit slug.
// Falls back to the app's initial when a logo doesn't exist.
export default function AppLogo({ slug, name, size = 28 }: { slug: string; name: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  const style = { width: size, height: size };
  if (failed || !slug) {
    return (
      <span className="applogo fallback" style={style} aria-hidden>
        {name.trim().charAt(0).toUpperCase()}
      </span>
    );
  }
  return (
    <span className="applogo" style={style}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`https://logos.composio.dev/api/${slug}`} alt="" loading="lazy" onError={() => setFailed(true)} />
    </span>
  );
}
