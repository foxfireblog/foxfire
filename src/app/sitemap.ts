import type { MetadataRoute } from "next";
import * as fs from "node:fs";
import * as path from "node:path";

const siteUrl = "https://foxfire-beige.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const explorationsDir = path.join(
    process.cwd(),
    "src",
    "app",
    "explorations"
  );
  const slugs = fs
    .readdirSync(explorationsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  const explorationEntries: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url: `${siteUrl}/explorations/${slug}`,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [
    {
      url: siteUrl,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/explorations`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/about`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    ...explorationEntries,
  ];
}
