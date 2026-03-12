import { explorations } from "@/data/explorations";

const siteUrl = "https://foxfire.blog";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const items = explorations
    .filter((e) => e.publishedAt)
    .map((e) => {
      const date = new Date(e.publishedAt!);
      return `    <item>
      <title>${escapeXml(e.title)}</title>
      <link>${siteUrl}/explorations/${encodeURIComponent(e.slug)}</link>
      <guid isPermaLink="true">${siteUrl}/explorations/${encodeURIComponent(e.slug)}</guid>
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
