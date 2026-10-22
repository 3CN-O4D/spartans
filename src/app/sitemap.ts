import type { MetadataRoute } from "next";
import { readContent } from "@/lib/store";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/news`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/fixtures`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/squad`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/lineup`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/gallery`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "yearly", priority: 0.6 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.8 },
  ];

  let articles: MetadataRoute.Sitemap = [];
  try {
    const content = await readContent();
    articles = content.articles.map((article) => {
      const parsed = new Date(`${article.date}T00:00:00`);
      return {
        url: `${base}/news/${article.slug}`,
        lastModified: Number.isNaN(parsed.getTime()) ? now : parsed,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      };
    });
  } catch {
    // Serve the static routes if content cannot be read.
  }

  return [...staticRoutes, ...articles];
}
