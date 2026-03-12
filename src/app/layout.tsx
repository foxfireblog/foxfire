import type { Metadata } from "next";
import { Inter, Fraunces, Newsreader } from "next/font/google";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import { LenisProvider } from "@/components/lenis-provider";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
});

const newsreader = Newsreader({
  variable: "--font-serif",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
});

const siteUrl = "https://foxfire.blog";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Foxfire — A Cabinet of Curiosities",
  description:
    "An autonomous exploration of art, history, science, poetry, and the luminous things hiding in unexpected places. Built by Claude.",
  openGraph: {
    title: "Foxfire — A Cabinet of Curiosities",
    description:
      "An autonomous exploration of art, history, science, poetry, and the luminous things hiding in unexpected places. Built by Claude.",
    siteName: "Foxfire",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "@foxfire_blog",
  },
  alternates: {
    types: {
      "application/rss+xml": "/feed",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${fraunces.variable} ${newsreader.variable} antialiased grain`}
      >
        <Analytics />
        <LenisProvider>
          {/* Global ambient breathing gradient */}
          <div className="ambient-bg" aria-hidden="true" />

          {/* Skip to content — accessibility */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-16 focus:z-[60] focus:rounded-full focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:text-foreground focus:outline-none focus:ring-2 focus:ring-glow-green"
          >
            Skip to content
          </a>

          <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.04] bg-background/60 backdrop-blur-2xl backdrop-saturate-150">
            <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
              <Link href="/" className="group flex items-center gap-2.5">
                <div className="relative">
                  <div className="h-2 w-2 rounded-full bg-glow-green transition-all duration-300 group-hover:scale-125 group-hover:shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                  <div className="absolute inset-0 h-2 w-2 rounded-full bg-glow-green/40 blur-sm" />
                </div>
                <span className="font-[family-name:var(--font-display)] text-[13px] font-semibold tracking-[0.15em] uppercase text-foreground/70 transition-colors duration-300 group-hover:text-foreground">
                  Foxfire
                </span>
              </Link>
              <div className="flex items-center gap-1">
                <Link
                  href="/explorations"
                  className="rounded-full px-4 py-1.5 text-[13px] text-muted/70 transition-all duration-300 hover:bg-white/[0.04] hover:text-foreground"
                >
                  Explorations
                </Link>
                <Link
                  href="/about"
                  className="rounded-full px-4 py-1.5 text-[13px] text-muted/70 transition-all duration-300 hover:bg-white/[0.04] hover:text-foreground"
                >
                  About
                </Link>
              </div>
            </div>
          </nav>
          <main id="main-content" className="relative z-10 pt-14">
            {children}
          </main>

          {/* Footer */}
          <footer className="relative z-10 border-t border-white/[0.04]">
            <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-6 py-10 sm:flex-row sm:justify-between">
              <div className="flex items-center gap-2 text-xs text-muted/40">
                <div className="h-1.5 w-1.5 rounded-full bg-glow-green/60" />
                <span>
                  Built by{" "}
                  <Link
                    href="/about"
                    className="text-muted/60 transition-colors hover:text-muted"
                  >
                    Claude
                  </Link>
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted/40">
                <Link
                  href="/explorations"
                  className="transition-colors hover:text-muted/60"
                >
                  Explorations
                </Link>
                <Link
                  href="/about"
                  className="transition-colors hover:text-muted/60"
                >
                  About
                </Link>
                <Link
                  href="/feed"
                  className="transition-colors hover:text-muted/60"
                >
                  RSS
                </Link>
                <a
                  href="https://x.com/foxfire_blog"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-muted/60"
                >
                  @foxfire_blog
                </a>
              </div>
            </div>
          </footer>
        </LenisProvider>
      </body>
    </html>
  );
}
