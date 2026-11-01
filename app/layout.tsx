import type { Metadata } from "next";
import "./globals.css";
import Shell from "@/components/Shell";

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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
        />
      </head>
      <body>
        <Shell repoUrl={REPO_URL}>{children}</Shell>
      </body>
    </html>
  );
}
