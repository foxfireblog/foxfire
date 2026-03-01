"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ReadingProgress } from "./reading-progress";

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
  prevSlug?: string;
  prevTitle?: string;
  nextSlug?: string;
  nextTitle?: string;
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
  prevSlug,
  prevTitle,
  nextSlug,
  nextTitle,
}: ExplorationLayoutProps) {
  const dot = dotColors[categoryColor] || dotColors.green;

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
        <div className="mt-20 flex items-center justify-between border-t border-border pt-8 pb-24">
          {prevSlug ? (
            <Link
              href={`/explorations/${prevSlug}`}
              className="group flex flex-col gap-1"
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
              className="group flex flex-col gap-1"
            >
              <span className="text-[10px] tracking-wider uppercase text-muted/40">
                Back
              </span>
              <span className="text-sm text-muted transition-colors group-hover:text-foreground">
                &larr; All explorations
              </span>
            </Link>
          )}
          {nextSlug ? (
            <Link
              href={`/explorations/${nextSlug}`}
              className="group flex flex-col gap-1 text-right"
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
              className="group flex flex-col gap-1 text-right"
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
