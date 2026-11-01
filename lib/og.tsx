// Link-preview card (Slack, email, WhatsApp) for a guide: app, verdict and both clocks.
import { ImageResponse } from "next/og";
import { TIER, formatDuration } from "./format";
import type { Guide } from "./types";

export const OG_SIZE = { width: 1200, height: 630 };

const TIER_COLOR: Record<Guide["verdict"]["tier"], string> = {
  instant: "#12784a",
  limited: "#1f5fbf",
  review: "#9a5b00",
  gated: "#b42318",
};

function clock(c: Guide["clocks"]["firstConnection"]) {
  return `${formatDuration(c.effort)} work${c.wait.max > 0 ? ` + ${formatDuration(c.wait)} wait` : ""}`;
}

export function guideCard(g: Guide | null) {
  if (!g) return siteCard();
  const tested = g.claims.filter((c) => c.evidence.level === "tested").length;
  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", background: "#111214", color: "#ececec", padding: 64, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", fontSize: 28, color: "#8b85ff" }}>OAuth Ready · OAuth app setup guide</div>
        <div style={{ display: "flex", fontSize: 76, fontWeight: 700, marginTop: 18 }}>{g.app.name}</div>
        <div style={{ display: "flex", marginTop: 18 }}>
          <div style={{ display: "flex", fontSize: 30, padding: "8px 22px", borderRadius: 999, background: TIER_COLOR[g.verdict.tier], color: "#fff" }}>
            {TIER[g.verdict.tier].label}
          </div>
          {tested > 0 && (
            <div style={{ display: "flex", fontSize: 30, padding: "8px 22px", borderRadius: 999, background: "#12784a", color: "#fff", marginLeft: 14 }}>
              Hands-on tested
            </div>
          )}
        </div>
        <div style={{ display: "flex", marginTop: "auto" }}>
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div style={{ display: "flex", fontSize: 26, color: "#a3a6ad" }}>You can try it</div>
            <div style={{ display: "flex", fontSize: 40, fontWeight: 700 }}>{clock(g.clocks.firstConnection)}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div style={{ display: "flex", fontSize: 26, color: "#a3a6ad" }}>Customers can connect</div>
            <div style={{ display: "flex", fontSize: 40, fontWeight: 700 }}>{clock(g.clocks.production)}</div>
          </div>
        </div>
      </div>
    ),
    OG_SIZE,
  );
}

export function siteCard() {
  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", background: "#111214", color: "#ececec", padding: 72, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", fontSize: 34, color: "#8b85ff" }}>OAuth Ready</div>
        <div style={{ display: "flex", fontSize: 72, fontWeight: 700, marginTop: 24, lineHeight: 1.1 }}>How long until your users can connect?</div>
        <div style={{ display: "flex", fontSize: 32, color: "#a3a6ad", marginTop: "auto" }}>
          Setup guides for provider OAuth apps: difficulty, time, blockers, and proof for every step.
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
