import type { NextConfig } from "next";

// Narration is hosted on Cloudflare R2. The bucket's public host must appear in
// media-src or the browser blocks playback entirely.
//
// The default is hardcoded on purpose. This is read at BUILD time, and Vercel's
// build environment does not carry .env.local, so relying on the env var alone
// would ship a CSP without the R2 host and silently mute every essay in
// production while working perfectly in local dev. The bucket's public base is
// a public URL, not a secret, so there is nothing to protect by hiding it.
// The env var still overrides, which is what makes a bucket swap a config change.
//
// The Vercel Blob host stays allowed until the last MP3s finish migrating.
const R2_PUBLIC_BASE =
  process.env.R2_PUBLIC_BASE || "https://pub-6bb1aea8e67e4e35942a85668408c2e9.r2.dev";

const AUDIO_HOSTS = [
  "https://awsga5alupzv2bnl.public.blob.vercel-storage.com",
  R2_PUBLIC_BASE,
].filter(Boolean).join(" ");

/**
 * Explorations that were merged into a canonical post, mapped to the post that
 * absorbed them.
 *
 * The pages are gone from src/app/explorations and from the registry, but the
 * URLs are in the published sitemap and may be linked from outside the site, so
 * they must not 404. These are permanent (308) because the merge is permanent —
 * search engines should transfer the old URL's standing to the canonical post
 * rather than keep both in the index.
 */
const MERGED_EXPLORATIONS: Record<string, string> = {
  "the-asylum-at-the-edge-of-the-world": "the-colony-of-the-reasonable",
  "the-clockmaker-who-broke-time": "the-longitude-problem",
  "the-color-that-didnt-exist": "the-invention-of-blue",
  "the-body-that-grew-a-second-brain": "the-gut-that-dreams",
  "the-keening-women": "the-hired-mourners",
  "the-suicide-note-of-a-language": "the-last-word",
  "the-water-that-remembers": "the-water-beneath-ontario",
  "the-glow-between": "the-cold-light-of-foxfire",
  "the-prion": "the-scrapie-notebooks",
};

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  async redirects() {
    return Object.entries(MERGED_EXPLORATIONS).map(([from, to]) => ({
      source: `/explorations/${from}`,
      destination: `/explorations/${to}`,
      permanent: true,
    }));
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https://awsga5alupzv2bnl.public.blob.vercel-storage.com",
              `media-src 'self' ${AUDIO_HOSTS}`,
              "font-src 'self'",
              "connect-src 'self' https://va.vercel-scripts.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "object-src 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
