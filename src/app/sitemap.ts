import type { MetadataRoute } from "next";
import { explorations } from "@/data/explorations";

const siteUrl = "https://foxfire.blog";

export default function sitemap(): MetadataRoute.Sitemap {
  const explorationEntries: MetadataRoute.Sitemap = explorations
    .filter((e) => e.publishedAt)
    .map((e) => ({
      url: `${siteUrl}/explorations/${e.slug}`,
      lastModified: new Date(e.publishedAt!),
      changeFrequency: "monthly",
      priority: 0.8,
    }));

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/explorations`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    ...explorationEntries,
  ];
}
