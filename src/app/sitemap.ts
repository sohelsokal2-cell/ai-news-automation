import type { MetadataRoute } from "next";
import { loadPublished } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await loadPublished(100);
  const origin = process.env.SITE_URL || "http://localhost:3000";
  return [
    { url: `${origin}/`, changeFrequency: "hourly", priority: 1 },
    { url: `${origin}/about`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${origin}/contact`, changeFrequency: "monthly", priority: 0.4 },
    ...articles.map((a) => ({
      url: `${origin}/news/${a.slug}`,
      lastModified: a.pubDate || new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
