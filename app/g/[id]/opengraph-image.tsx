import { OG_SIZE, guideCard } from "@/lib/og";
import { loadGuide } from "@/lib/store";

export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "OAuth app setup guide";

export default async function Image({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const { id } = await params;
  return guideCard(await loadGuide(id).catch(() => null));
}
