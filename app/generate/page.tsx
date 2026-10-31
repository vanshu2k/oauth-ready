import { redirect } from "next/navigation";
import GenerateRunner from "@/components/GenerateRunner";
import { curatedGuides, findToolkit } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function GeneratePage({ searchParams }: { searchParams: Promise<{ q?: string; fresh?: string }> }) {
  const { q, fresh } = await searchParams;
  const query = (q ?? "").trim().slice(0, 200);
  if (!query) redirect("/");

  // A hand-checked guide beats a fresh generation, unless the visitor asks for one.
  const match = findToolkit(query);
  const curated = match && curatedGuides().find((g) => g.app.slug === match.slug);
  if (curated && !fresh) redirect(`/guides/${curated.app.slug}`);

  return <GenerateRunner key={query} query={query} />;
}
