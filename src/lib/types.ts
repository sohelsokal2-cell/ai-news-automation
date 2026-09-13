export type PublicArticle = {
  id: number;
  bn: { headline: string; summary: string; body: string };
  en: { headline: string; summary: string; body: string };
  slug: string;
  seoTitle: string | null;
  metaDescription: string | null;
  imageUrl: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
  pubDate: Date | null;
  categoryId: number | null;
  categorySlug: string | null;
  categoryName: string | null;
};

export function formatBnDate(value: Date | string | null | undefined): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString("bn-BD", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
