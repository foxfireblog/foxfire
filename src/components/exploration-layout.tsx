"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";
import { ReadingProgress } from "./reading-progress";
import { colorStyles } from "./exploration-card";

interface ExplorationLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  category: string;
  categoryColor: string;
  imageSrc: string;
  imageAlt: string;
  date?: string;
  readTime?: string;
  wordCount?: number;
  prevSlug?: string;
  prevTitle?: string;
  nextSlug?: string;
  nextTitle?: string;
  nextSubtitle?: string;
  nextCategory?: string;
  nextCategoryColor?: string;
  nextImage?: string;
  nextReadTime?: string;
}

const dotColors: Record<string, string> = {
  green: "bg-glow-green",
  amber: "bg-glow-amber",
  cyan: "bg-glow-cyan",
  red: "bg-red-400",
  violet: "bg-violet-400",
  emerald: "bg-emerald-400",
  rose: "bg-rose-400",
  sky: "bg-sky-400",
  teal: "bg-teal-400",
};

export function ExplorationLayout({
  children,
  title,
  subtitle,
  category,
  categoryColor,
  imageSrc,
  imageAlt,
  date,
  readTime,
  wordCount,
  prevSlug,
  prevTitle,
  nextSlug,
  nextTitle,
  nextSubtitle,
  nextCategory,
  nextCategoryColor,
  nextImage,
  nextReadTime,
}: ExplorationLayoutProps) {
  const dot = dotColors[categoryColor] || dotColors.green;
  const hasRichNext = nextSlug && nextImage && nextSubtitle;
  const nextColors = nextCategoryColor
    ? colorStyles[nextCategoryColor] || colorStyles.green
    : colorStyles.green;
  const nextDot = nextCategoryColor
    ? dotColors[nextCategoryColor] || dotColors.green
    : dotColors.green;

  return (
    <div className="min-h-screen">
      <ReadingProgress />

      {/* Full-bleed hero image */}
      <div className="relative h-[50vh] min-h-[400px] w-full overflow-hidden sm:h-[60vh]">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/20" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-transparent" />

        {/* Back button */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="absolute left-6 top-20 z-10"
        >
          <Link
            href="/explorations"
            className="group flex items-center gap-2 rounded-full bg-background/30 px-4 py-2 text-xs text-foreground/60 backdrop-blur-md transition-all hover:bg-background/50 hover:text-foreground"
          >
            <ArrowLeft size={12} className="transition-transform group-hover:-translate-x-0.5" />
            All explorations
          </Link>
        </motion.div>
      </div>

      {/* Title block — pulled up over the image */}
      <article className="relative mx-auto max-w-2xl px-6 -mt-32 sm:-mt-40">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-4 flex items-center gap-3"
        >
          <div className={`h-1.5 w-1.5 rounded-full ${dot}`} />
          <span className="text-xs tracking-wider uppercase text-muted">
            {category}
          </span>
          {date && (
            <>
              <span className="text-muted/30">&middot;</span>
              <span className="text-xs text-muted/50">{date}</span>
            </>
          )}
          {readTime && (
            <>
              <span className="text-muted/30">&middot;</span>
              <span className="text-xs text-muted/50">{readTime} read</span>
            </>
          )}
          {wordCount && (
            <>
              <span className="text-muted/30">&middot;</span>
              <span className="text-xs text-muted/50">~{wordCount.toLocaleString()} words</span>
            </>
          )}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="font-[family-name:var(--font-display)] text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl"
          style={{ textWrap: "balance" } as React.CSSProperties}
        >
          {title}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35 }}
          className="mt-4 text-lg italic text-muted"
        >
          {subtitle}
        </motion.p>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-10 mb-12 h-px bg-gradient-to-r from-transparent via-border to-transparent origin-left"
        />

        {/* Body */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="prose-foxfire"
        >
          {children}
        </motion.div>

        {/* Navigation */}
        <div className="mt-20 border-t border-border pt-8 pb-24">
          {/* Previous link */}
          <div className="mb-8">
            {prevSlug ? (
              <Link
                href={`/explorations/${prevSlug}`}
                className="group inline-flex flex-col gap-1"
              >
                <span className="text-[10px] tracking-wider uppercase text-muted/40">
                  Previous
                </span>
                <span className="text-sm text-muted transition-colors group-hover:text-foreground">
                  &larr; {prevTitle}
                </span>
              </Link>
            ) : (
              <Link
                href="/explorations"
                className="group inline-flex flex-col gap-1"
              >
                <span className="text-[10px] tracking-wider uppercase text-muted/40">
                  Back
                </span>
                <span className="text-sm text-muted transition-colors group-hover:text-foreground">
                  &larr; All explorations
                </span>
              </Link>
            )}
          </div>

          {/* Rich Up Next card */}
          {hasRichNext ? (
            <Link
              href={`/explorations/${nextSlug}`}
              className={`group relative block overflow-hidden rounded-2xl border border-border bg-surface transition-all duration-500 ${nextColors.border} ${nextColors.glow}`}
            >
              <div className="flex flex-col sm:flex-row">
                <div className="relative h-48 w-full overflow-hidden sm:h-auto sm:w-56 sm:flex-shrink-0">
                  <Image
                    src={nextImage!}
                    alt={nextTitle || ""}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent sm:bg-gradient-to-r sm:from-transparent sm:to-surface" />
                </div>
                <div className="flex flex-1 flex-col justify-center p-6">
                  <span className="mb-3 text-[10px] tracking-wider uppercase text-muted/40">
                    Up next
                  </span>
                  <div className="mb-2 flex items-center gap-2">
                    <div className={`h-1.5 w-1.5 rounded-full ${nextDot}`} />
                    <span className="text-xs tracking-wider uppercase text-muted">
                      {nextCategory}
                    </span>
                    {nextReadTime && (
                      <>
                        <span className="text-muted/30">&middot;</span>
                        <span className="flex items-center gap-1 text-xs text-muted/50">
                          <Clock size={10} />
                          {nextReadTime}
                        </span>
                      </>
                    )}
                  </div>
                  <h3
                    className={`font-[family-name:var(--font-display)] text-lg font-semibold text-foreground transition-colors ${nextColors.text}`}
                  >
                    {nextTitle}
                  </h3>
                  <p className="mt-1 text-sm text-muted/70 line-clamp-2">
                    {nextSubtitle}
                  </p>
                  <div
                    className={`mt-4 inline-flex items-center gap-2 text-sm text-muted transition-colors ${nextColors.text}`}
                  >
                    Continue reading
                    <ArrowRight
                      size={14}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </div>
                </div>
              </div>
            </Link>
          ) : nextSlug ? (
            <Link
              href={`/explorations/${nextSlug}`}
              className="group flex flex-col gap-1 text-right ml-auto w-fit"
            >
              <span className="text-[10px] tracking-wider uppercase text-muted/40">
                Next
              </span>
              <span className="text-sm text-muted transition-colors group-hover:text-foreground">
                {nextTitle} &rarr;
              </span>
            </Link>
          ) : (
            <Link
              href="/explorations"
              className="group flex flex-col gap-1 text-right ml-auto w-fit"
            >
              <span className="text-[10px] tracking-wider uppercase text-muted/40">
                Browse
              </span>
              <span className="text-sm text-muted transition-colors group-hover:text-foreground">
                All explorations &rarr;
              </span>
            </Link>
          )}
        </div>
      </article>
    </div>
  );
}
