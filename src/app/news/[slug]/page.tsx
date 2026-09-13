import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/ArticleCard";
import { LangScope } from "@/components/LangContext";
import { ArticleBody } from "@/components/ArticleBody";
import { AdSlot } from "@/components/AdSlot";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { loadBySlug, loadNav, loadRelated } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await loadBySlug(decodeURIComponent(slug));
  if (!article) return { title: "খবর পাওয়া যায়নি" };
  return {
    title: article.seoTitle || article.bn.headline,
    description: article.metaDescription || article.bn.summary,
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Next.js 16 (Turbopack) hands dynamic params over still percent-encoded,
  // e.g. "%E0%A6%AB..." for "ফ...". Decode before querying the DB; decodeURIComponent
  // is a no-op for slugs that are already decoded (safe across Next versions).
  const article = await loadBySlug(decodeURIComponent(slug));
  if (!article) notFound();
  const [related, cats] = await Promise.all([loadRelated(article), loadNav()]);

  return (
    <>
      <LangScope>
      <SiteHeader categories={cats} />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <AdSlot slot="header" className="mb-6" />
        <ArticleBody article={article} />
        <AdSlot slot="in-article" className="mt-8" />
        {related.length ? (
          <section className="mt-12 border-t border-[#c9b48a] pt-8">
            <h2 className="text-2xl font-bold">সম্পর্কিত</h2>
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              {related.map((item) => (
                <ArticleCard key={item.id} article={item} />
              ))}
            </div>
          </section>
        ) : null}
      </main>
      <SiteFooter />
      </LangScope>
    </>
  );
}
