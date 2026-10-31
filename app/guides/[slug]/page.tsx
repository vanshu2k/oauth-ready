import type { Metadata } from "next";
import { notFound } from "next/navigation";
import GuideView from "@/components/GuideView";
import { curatedGuide, curatedGuides } from "@/lib/data";

export function generateStaticParams() {
  return curatedGuides().map((g) => ({ slug: g.app.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const g = curatedGuide((await params).slug);
  return g ? { title: `${g.app.name} OAuth app setup | OAuth Ready`, description: g.verdict.summary } : {};
}

export default async function CuratedGuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const g = curatedGuide((await params).slug);
  if (!g) notFound();
  return <GuideView guide={g} />;
}
