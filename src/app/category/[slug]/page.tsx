import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/ArticleCard";
import { LangScope } from "@/components/LangContext";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { loadByCategory, loadNav } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Next.js 16 (Turbopack) hands dynamic params over still percent-encoded.
  const data = await loadByCategory(decodeURIComponent(slug));
  if (!data) notFound();
  const cats = await loadNav();

  return (
    <>
      <LangScope>
      <SiteHeader categories={cats} />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <p className="text-xs tracking-[0.3em] text-[#8d1a1a]">বিভাগ</p>
        <h1 className="mt-1 font-serif text-4xl font-black">{data.name}</h1>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {data.articles.map((article) => (
            <div key={article.id} className="paper-card p-3">
              <ArticleCard article={article} />
            </div>
          ))}
        </div>
        {!data.articles.length ? <p className="mt-8 text-[#5c4a34]">এই বিভাগে এখনো প্রকাশিত খবর নেই।</p> : null}
      </main>
      <SiteFooter />
      </LangScope>
    </>
  );
}
