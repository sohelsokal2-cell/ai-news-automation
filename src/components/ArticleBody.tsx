"use client";

import Image from "next/image";
import Link from "next/link";
import { useLang } from "@/components/LangContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import type { PublicArticle } from "@/lib/types";
import { formatBnDate } from "@/lib/types";

const PLACEHOLDER_IMG = "/images/og-cover.svg";

export function ArticleBody({ article }: { article: PublicArticle }) {
  const { lang } = useLang();
  const t = article[lang];
  const imgSrc = article.imageUrl || PLACEHOLDER_IMG;

  return (
    <>
      {article.categoryName ? (
        <Link href={`/category/${article.categorySlug}`} className="text-xs font-bold tracking-[0.2em] text-[#8d1a1a]">
          {article.categoryName}
        </Link>
      ) : null}
      <h1 className="mt-2 font-serif text-4xl font-black leading-tight">{t.headline}</h1>
      <p className="mt-3 text-lg leading-8 text-[#4a3b2a]">{t.summary}</p>
      <div className="flex items-center gap-3">
        <LanguageToggle />
        <p className="mt-3 text-sm text-[#7a6850]">
          {formatBnDate(article.pubDate)}
          {article.sourceName ? ` · ${article.sourceName}` : ""}
        </p>
      </div>
      <figure className="mt-6">
        <Image
          src={imgSrc}
          alt={t.headline}
          width={800}
          height={450}
          unoptimized
          className="w-full object-cover"
        />
      </figure>
      <div className="prose-bn mt-8">
        {t.body.split(/\n{2,}/).map((para, i) =>
          para.trim() ? <p key={i}>{para}</p> : null,
        )}
      </div>
      {article.sourceUrl ? (
        <p className="mt-8 text-sm">
          {lang === "bn" ? "উৎস:" : "Source:"}{" "}
          <a className="text-[#8d1a1a] underline" href={article.sourceUrl} rel="noopener noreferrer">
            {article.sourceName || (lang === "bn" ? "মূল প্রতিবেদন" : "Original report")}
          </a>
        </p>
      ) : null}
    </>
  );
}
