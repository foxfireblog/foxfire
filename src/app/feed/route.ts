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

/**
 * `publishedAt` is minted by the generator scripts in America/New_York and
 * carries no timezone marker, so `new Date(value)` silently interprets it in
 * the runtime's ambient zone (UTC on Vercel) and lands 4 hours off. Parse the
 * components explicitly and resolve the true instant against Eastern.
 */
const ET = "America/New_York";
const PUBLISHED_AT = /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})\s*([AaPp])\.?[Mm]\.?$/;
const DATE_ONLY = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;

const etFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: ET,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

/** Milliseconds Eastern trails UTC at the given instant (negative). */
function easternOffset(instant: number): number {
  const p = Object.fromEntries(
    etFormatter.formatToParts(new Date(instant)).map((x) => [x.type, x.value])
  );
  const asUtc = Date.UTC(
    Number(p.year),
    Number(p.month) - 1,
    Number(p.day),
    Number(p.hour) % 24,
    Number(p.minute),
    Number(p.second)
  );
  return asUtc - instant;
}

/** Resolves an Eastern wall-clock string to the UTC instant it names. */
function parseEasternDate(value: string): Date | null {
  let y: number, mo: number, d: number, h: number, mi: number;

  const withTime = value.trim().match(PUBLISHED_AT);
  if (withTime) {
    y = Number(withTime[3]);
    mo = Number(withTime[1]);
    d = Number(withTime[2]);
    h = Number(withTime[4]) % 12;
    if (withTime[6].toLowerCase() === "p") h += 12;
    mi = Number(withTime[5]);
  } else {
    const dateOnly = value.trim().match(DATE_ONLY);
    if (!dateOnly) return null;
    y = Number(dateOnly[1]);
    mo = Number(dateOnly[2]);
    d = Number(dateOnly[3]);
    h = 12;
    mi = 0;
  }

  const naive = Date.UTC(y, mo - 1, d, h, mi);
  // Two passes so instants near a DST transition settle on the right offset.
  let instant = naive - easternOffset(naive);
  instant = naive - easternOffset(instant);
  const result = new Date(instant);
  return isNaN(result.getTime()) ? null : result;
}

export async function GET() {
  const items = explorations
    .filter((e) => e.publishedAt && parseEasternDate(e.publishedAt))
    .map((e) => {
      const date = parseEasternDate(e.publishedAt!)!;
      return `    <item>
      <title>${escapeXml(e.title)}</title>
      <link>${siteUrl}/explorations/${encodeURIComponent(e.slug)}</link>
      <guid isPermaLink="true">${siteUrl}/explorations/${encodeURIComponent(e.slug)}</guid>
      <description>${escapeXml(e.description || e.subtitle)}</description>
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
