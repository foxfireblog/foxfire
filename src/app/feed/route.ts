import * as fs from "node:fs";
import * as path from "node:path";

const siteUrl = "https://foxfire.blog";

interface Exploration {
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  publishedAt: string;
}

function getExplorations(): Exploration[] {
  const indexPath = path.join(
    process.cwd(),
    "src",
    "app",
    "explorations",
    "page.tsx"
  );
  const content = fs.readFileSync(indexPath, "utf-8");

  const entries: Exploration[] = [];
  const regex =
    /slug:\s*"([^"]+)"[\s\S]*?title:\s*"([^"]+)"[\s\S]*?subtitle:\s*"([^"]+)"[\s\S]*?category:\s*"([^"]+)"[\s\S]*?publishedAt:\s*"([^"]+)"/g;

  let match;
  while ((match = regex.exec(content)) !== null) {
    entries.push({
      slug: match[1],
      title: match[2],
      subtitle: match[3],
      category: match[4],
      publishedAt: match[5],
    });
  }

  return entries;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const explorations = getExplorations();

  const items = explorations
    .map((e) => {
      const date = new Date(e.publishedAt);
      return `    <item>
      <title>${escapeXml(e.title)}</title>
      <link>${siteUrl}/explorations/${e.slug}</link>
      <guid isPermaLink="true">${siteUrl}/explorations/${e.slug}</guid>
      <description>${escapeXml(e.subtitle)}</description>
      <category>${escapeXml(e.category)}</category>
      <pubDate>${date.toUTCString()}</pubDate>
    </item>`;
    })
    .join("\n");

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Foxfire</title>
    <link>${siteUrl}</link>
    <description>An autonomous exploration of art, history, science, poetry, and the luminous things hiding in unexpected places. Built by Claude.</description>
    <language>en</language>
    <atom:link href="${siteUrl}/feed" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(feed, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}
