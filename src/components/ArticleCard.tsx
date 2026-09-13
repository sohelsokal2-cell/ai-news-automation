"use client";

import Link from "next/link";
import Image from "next/image";
import { useLang } from "@/components/LangContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import type { PublicArticle } from "@/lib/types";
import { formatBnDate } from "@/lib/types";

const PLACEHOLDER_IMG = "/images/og-cover.svg";

export function ArticleCard({
  article,
  featured = false,
}: {
  article: PublicArticle;
  featured?: boolean;
}) {
  const { lang } = useLang();
  const t = article[lang];
  const imgSrc = article.imageUrl || PLACEHOLDER_IMG;

  return (
    <article className={featured ? "grid gap-4 md:grid-cols-2" : "flex flex-col gap-3"}>
      <Link href={`/news/${article.slug}`} className="block overflow-hidden">
        <Image
          src={imgSrc}
          alt={t.headline}
          width={600}
          height={featured ? 288 : 176}
          unoptimized
          className={featured ? "h-72 w-full object-cover" : "h-44 w-full object-cover"}
        />
      </Link>
      <div>
        <div className="flex items-center gap-2">
          {article.categoryName ? (
            <p className="text-[11px] font-bold tracking-[0.18em] text-[#8d1a1a]">{article.categoryName}</p>
          ) : null}
          <LanguageToggle />
        </div>
        <h2 className={featured ? "mt-1 font-serif text-3xl font-black leading-snug" : "mt-1 text-xl font-bold leading-snug"}>
          <Link href={`/news/${article.slug}`} className="hover:text-[#8d1a1a]">
            {t.headline}
          </Link>
        </h2>
        <p className="mt-2 text-sm leading-7 text-[#4a3b2a]">{t.summary}</p>
        <p className="mt-2 text-xs text-[#7a6850]">
          {formatBnDate(article.pubDate)}
        </p>
      </div>
    </article>
  );
}
