import { runAgent } from "@/lib/agent";
import { checkQuotes } from "@/lib/quotecheck";
import { saveGuide } from "@/lib/store";
import type { AgentEvent } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Best-effort per-instance limit so a public demo link can't be used to run up the API bill.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 6;
const hits = new Map<string, number[]>();

function limited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { query?: string };
  const query = String(body.query ?? "").trim().slice(0, 200);
  if (!query) return Response.json({ error: "Enter an app name or website." }, { status: 400 });
  if (!process.env.ANTHROPIC_API_KEY)
    return Response.json({ error: "Live generation isn't configured on this deployment (ANTHROPIC_API_KEY is missing)." }, { status: 503 });

  const ip = (req.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();
  if (limited(ip)) return Response.json({ error: "Too many guides generated from your network in the last few minutes. Try again shortly." }, { status: 429 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (e: AgentEvent) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(e)}\n\n`));
      try {
        for await (const event of runAgent(query, req.signal)) {
          if (event.type === "done") {
            send({ type: "status", text: "Re-fetching cited pages to check every quote…" });
            const q = await checkQuotes(event.guide);
            send({
              type: "status",
              text: `Quote check: ${q.verified} found word for word, ${q.notFound} not found, ${q.unchecked} on pages a plain fetch can't read.`,
            });
            let id: string | null = null;
            try {
              id = await saveGuide(event.guide);
            } catch (err) {
              send({ type: "status", text: `Couldn't save a shareable copy: ${(err as Error).message}` });
            }
            send({ ...event, id, shareUrl: id ? `/g/${id}` : null });
          } else {
            send(event);
          }
        }
      } catch (err) {
        if (!req.signal.aborted) send({ type: "error", message: (err as Error).message || "Something went wrong." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
