import type { Metadata } from "next";
import { notFound } from "next/navigation";
import GuideView from "@/components/GuideView";
import { loadGuide } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const g = await loadGuide((await params).id).catch(() => null);
  return g ? { title: `${g.app.name} OAuth app setup | OAuth Ready`, description: g.verdict.summary } : {};
}

export default async function GeneratedGuidePage({ params }: { params: Promise<{ id: string }> }) {
  const g = await loadGuide((await params).id).catch(() => null);
  if (!g) notFound();
  return <GuideView guide={g} />;
}
