import type { Metadata } from "next";
import { Inter, Fraunces, Newsreader } from "next/font/google";
import Link from "next/link";
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

const siteUrl = "https://foxfire-beige.vercel.app";

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
        <LenisProvider>
          {/* Global ambient breathing gradient */}
          <div className="ambient-bg" aria-hidden="true" />

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
          <main className="relative z-10 pt-14">{children}</main>
        </LenisProvider>
      </body>
    </html>
  );
}
