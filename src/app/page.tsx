import Link from "next/link";
import Image from "next/image";
import { ArticleCard } from "@/components/ArticleCard";
import { LangScope } from "@/components/LangContext";
import { BreakingTicker, SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { loadNav, loadPublished } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [stories, cats] = await Promise.all([loadPublished(18), loadNav()]);
  const [hero, second, ...rest] = stories;
  const sidebar = rest.slice(0, 5);
  const grid = rest.slice(5, 11);
  const more = rest.slice(11);

  return (
    <>
      <LangScope>
      <SiteHeader categories={cats} />
      <BreakingTicker titles={stories.slice(0, 6).map((s) => s.bn.headline)} />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {hero ? (
          <section className="paper-card p-4 sm:p-6">
            <ArticleCard article={hero} featured />
          </section>
        ) : (
          <section className="paper-card p-10 text-center">
            <h2 className="text-2xl font-bold">এখনো প্রকাশিত খবর নেই</h2>
            <p className="mt-2 text-sm text-[#5c4a34]">কালেক্টর চালু হলে যাচাইকৃত খবর এখানে আসবে।</p>
          </section>
        )}

        <section className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_0.9fr]">
          <div className="space-y-8">
            {second ? (
              <div className="paper-card p-4">
                <ArticleCard article={second} featured />
              </div>
            ) : null}
            <div className="grid gap-6 sm:grid-cols-2">
              {grid.map((article) => (
                <div key={article.id} className="paper-card p-3">
                  <ArticleCard article={article} />
                </div>
              ))}
            </div>
          </div>
          <aside className="space-y-6">
            <div className="border border-[#c9b48a] bg-[#fff8ea] p-5">
              <h2 className="border-b-2 border-[#8d1a1a] pb-2 font-serif text-2xl font-black text-[#8d1a1a]">
                পঠিত
              </h2>
              <ol className="mt-4 space-y-4">
                {sidebar.map((article, i) => (
                  <li key={article.id} className="flex gap-3">
                    <span className="font-serif text-3xl text-[#c9a44a]">{String(i + 1).padStart(2, "0")}</span>
                    <Link href={`/news/${article.slug}`} className="font-semibold leading-6 hover:text-[#8d1a1a]">
                      {article.bn.headline}
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
            <div className="bg-[#1c140c] p-5 text-[#f3ead3]">
              <p className="text-[11px] tracking-[0.25em] text-[#c9a44a]">PIPELINE</p>
              <h2 className="mt-1 text-xl font-bold">প্রকাশনা পাইপলাইন</h2>
              <ul className="mt-4 space-y-2 text-sm text-[#d9c7a4]">
                <li>১. তথ্য সংগ্রাহক (আরএসএস)</li>
                <li>২. পূর্ণাঙ্গ টেক্সট সংগ্রহ</li>
                <li>৩. ডুপ্লিকেট শনাক্তকরণ</li>
                <li>৪. এআই সংবাদ লেখক</li>
                <li>৫. রুল ইঞ্জিন যাচাই → প্রকাশ</li>
              </ul>
              <Link href="/about" className="mt-4 inline-block text-sm text-[#c9a44a]">
                নীতি পড়ুন →
              </Link>
            </div>
            <Image
              src="/images/og-cover.svg"
              alt="সংবাদচক্র"
              width={400}
              height={160}
              className="h-40 w-full object-cover"
            />
          </aside>
        </section>

        {more.length ? (
          <section className="mt-12">
            <h2 className="border-b-4 border-[#8d1a1a] pb-2 font-serif text-3xl font-black">আরও খবর</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {more.map((article) => (
                <ArticleCard key={article.id} article={article} />
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
