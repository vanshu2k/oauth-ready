// Generated guides are saved to Vercel Blob so they get a shareable URL.
// Without BLOB_READ_WRITE_TOKEN the app still works; guides just aren't persisted.
import { list, put } from "@vercel/blob";
import type { Guide } from "./types";

const PREFIX = "guides/";

export const storageEnabled = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

export async function saveGuide(guide: Guide): Promise<string | null> {
  if (!storageEnabled()) return null;
  const id = `${guide.app.slug}-${Date.now().toString(36)}`;
  await put(`${PREFIX}${id}.json`, JSON.stringify(guide), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
  });
  return id;
}

export async function loadGuide(id: string): Promise<Guide | null> {
  if (!storageEnabled() || !/^[a-z0-9_-]+$/.test(id)) return null;
  const { blobs } = await list({ prefix: `${PREFIX}${id}.json`, limit: 1 });
  if (!blobs.length) return null;
  const res = await fetch(blobs[0].url, { cache: "no-store" });
  return res.ok ? ((await res.json()) as Guide) : null;
}

export async function recentGuides(limit = 12): Promise<{ id: string; uploadedAt: Date }[]> {
  if (!storageEnabled()) return [];
  const { blobs } = await list({ prefix: PREFIX, limit: 100 });
  return blobs
    .sort((a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt))
    .slice(0, limit)
    .map((b) => ({ id: b.pathname.slice(PREFIX.length).replace(/\.json$/, ""), uploadedAt: new Date(b.uploadedAt) }));
}
