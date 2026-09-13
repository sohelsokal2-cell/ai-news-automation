import { db } from "@/db";
import { articles, categories, collectedItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isSafeHttpUrl } from "@/lib/sanitize";
import { makeSlug } from "@/lib/urls";
import { markItemFailed } from "@/lib/pipeline/item-status";
import type { WrittenArticle } from "@/lib/pipeline/writer";
import {
  VALID_CATEGORIES,
  HEADLINE_MIN_WORDS,
  HEADLINE_MAX_WORDS,
  SUMMARY_MIN_WORDS,
  SUMMARY_MAX_WORDS,
  wordCount,
} from "@/lib/pipeline/config";

type ValidationResult = {
  pass: boolean;
  reason: string;
};

function checkFieldComplete(article: WrittenArticle): ValidationResult {
  const fields = [
    article.bnHeadline,
    article.bnSummary,
    article.bnBody,
    article.enHeadline,
    article.enSummary,
    article.enBody,
    article.category,
  ];
  if (fields.some((f) => !f || !f.trim())) {
    return { pass: false, reason: "empty_field" };
  }
  return { pass: true, reason: "" };
}

function checkLengthSanity(article: WrittenArticle): ValidationResult {
  const checks = [
    { label: "bn.headline", count: wordCount(article.bnHeadline), min: HEADLINE_MIN_WORDS, max: HEADLINE_MAX_WORDS },
    { label: "en.headline", count: wordCount(article.enHeadline), min: HEADLINE_MIN_WORDS, max: HEADLINE_MAX_WORDS },
    { label: "bn.summary", count: wordCount(article.bnSummary), min: SUMMARY_MIN_WORDS, max: SUMMARY_MAX_WORDS },
    { label: "en.summary", count: wordCount(article.enSummary), min: SUMMARY_MIN_WORDS, max: SUMMARY_MAX_WORDS },
  ];
  for (const c of checks) {
    if (c.count < c.min || c.count > c.max) {
      return { pass: false, reason: `length_${c.label}_${c.count}words` };
    }
  }
  return { pass: true, reason: "" };
}

function checkCategory(article: WrittenArticle): string {
  if (VALID_CATEGORIES.includes(article.category)) return article.category;
  return "other";
}

function checkSourceLink(article: WrittenArticle): ValidationResult {
  if (!isSafeHttpUrl(article.sourceLink)) {
    return { pass: false, reason: "invalid_source_link" };
  }
  return { pass: true, reason: "" };
}

function validate(article: WrittenArticle): ValidationResult {
  let result = checkFieldComplete(article);
  if (!result.pass) return result;

  result = checkLengthSanity(article);
  if (!result.pass) return result;

  result = checkSourceLink(article);
  if (!result.pass) return result;

  return { pass: true, reason: "" };
}

async function getCategoryId(slug: string): Promise<number | null> {
  const [row] = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  return row?.id ?? null;
}

const markFailed = markItemFailed;

async function insertArticle(
  article: WrittenArticle,
  categoryId: number,
): Promise<void> {
  const slug = makeSlug(article.bnHeadline, article.collectedItemId);

  await db.transaction(async (tx) => {
    await tx.insert(articles).values({
      collectedItemId: article.collectedItemId,
      categoryId,
      bnHeadline: article.bnHeadline,
      bnSummary: article.bnSummary,
      bnBody: article.bnBody,
      enHeadline: article.enHeadline,
      enSummary: article.enSummary,
      enBody: article.enBody,
      slug,
      seoTitle: article.bnHeadline,
      metaDescription: article.bnSummary,
      imageUrl: article.imageUrl,
      sourceName: article.sourceName,
      sourceUrl: article.sourceLink,
      pubDate: article.pubDate,
      status: "published",
    });

    await tx
      .update(collectedItems)
      .set({ status: "published" })
      .where(eq(collectedItems.id, article.collectedItemId));
  });
}

export type RuleEngineResult = {
  published: number;
  failed: number;
  details: { id: number; status: "published" | "failed"; reason: string }[];
};

export async function runRuleEngine(items: WrittenArticle[]): Promise<RuleEngineResult> {
  const result: RuleEngineResult = { published: 0, failed: 0, details: [] };

  for (const item of items) {
    const validation = validate(item);
    if (!validation.pass) {
      await markFailed(item.collectedItemId);
      result.failed++;
      result.details.push({ id: item.collectedItemId, status: "failed", reason: validation.reason });
      continue;
    }

    const category = checkCategory(item);
    const categoryId = await getCategoryId(category);
    if (!categoryId) {
      await markFailed(item.collectedItemId);
      result.failed++;
      result.details.push({ id: item.collectedItemId, status: "failed", reason: "category_not_found" });
      continue;
    }

    await insertArticle(item, categoryId);
    result.published++;
    result.details.push({ id: item.collectedItemId, status: "published", reason: "" });
  }

  return result;
}
