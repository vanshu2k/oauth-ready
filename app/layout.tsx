import type { Metadata } from "next";
import "./globals.css";

const SITE = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: "OAuth Ready: setup guides for provider OAuth apps",
  description:
    "Look up an app and get a shareable guide: how hard it is to get your OAuth app approved, how long it takes, what can block you, and what an agent can do for you.",
};

const REPO_URL = process.env.NEXT_PUBLIC_REPO_URL;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="nav">
          <div className="wrap">
            <a href="/" className="brand">
              OAuth <span>Ready</span>
            </a>
            <a className="link" href="/#library">
              Library
            </a>
            <a className="link" href="/how-it-works">
              How it works
            </a>
            <a className="link" href="/method">
              How we verify
            </a>
            <span className="spacer" />
            {REPO_URL && (
              <a className="link" href={REPO_URL} target="_blank" rel="noreferrer">
                Source ↗
              </a>
            )}
          </div>
        </nav>
        <main>
          <div className="wrap">{children}</div>
        </main>
        <footer>
          <div className="wrap">
            Guides describe provider policies as of the dates shown on each claim. Policies change, so check the linked sources before you rely on a
            number. Not affiliated with Composio or any provider.
          </div>
        </footer>
      </body>
    </html>
  );
}
