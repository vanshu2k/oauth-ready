import { curatedGuide } from "@/lib/data";
import { OG_SIZE, guideCard } from "@/lib/og";

export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "OAuth app setup guide";

// params is a Promise in newer Next.js versions and a plain object in older ones.
export default async function Image({ params }: { params: Promise<{ slug: string }> | { slug: string } }) {
  const { slug } = await params;
  return guideCard(curatedGuide(slug) ?? null);
}
