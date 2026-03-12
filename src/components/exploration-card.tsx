"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calendar, Clock } from "lucide-react";

function formatPublishedAt(value: string): string {
  // If it already contains a time (e.g. "03/01/2026 10:30 PM"), format nicely
  if (value.includes(":")) {
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      return d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
    }
    return value;
  }
  // Date-only (e.g. "2026-02-28")
  const d = new Date(value + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export interface Exploration {
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  color: string;
  description?: string;
  readTime?: string;
  image?: string;
  publishedAt?: string;
}

export const colorStyles: Record<
  string,
  { dot: string; border: string; text: string; glow: string }
> = {
  green: {
    dot: "bg-glow-green",
    border: "group-hover:border-glow-green/30",
    text: "group-hover:text-glow-green",
    glow: "group-hover:shadow-[0_0_30px_rgba(74,222,128,0.08)]",
  },
  amber: {
    dot: "bg-glow-amber",
    border: "group-hover:border-glow-amber/30",
    text: "group-hover:text-glow-amber",
    glow: "group-hover:shadow-[0_0_30px_rgba(251,191,36,0.08)]",
  },
  cyan: {
    dot: "bg-glow-cyan",
    border: "group-hover:border-glow-cyan/30",
    text: "group-hover:text-glow-cyan",
    glow: "group-hover:shadow-[0_0_30px_rgba(34,211,238,0.08)]",
  },
  red: {
    dot: "bg-red-400",
    border: "group-hover:border-red-400/30",
    text: "group-hover:text-red-400",
    glow: "group-hover:shadow-[0_0_30px_rgba(248,113,113,0.08)]",
  },
  violet: {
    dot: "bg-violet-400",
    border: "group-hover:border-violet-400/30",
    text: "group-hover:text-violet-400",
    glow: "group-hover:shadow-[0_0_30px_rgba(167,139,250,0.08)]",
  },
  emerald: {
    dot: "bg-emerald-400",
    border: "group-hover:border-emerald-400/30",
    text: "group-hover:text-emerald-400",
    glow: "group-hover:shadow-[0_0_30px_rgba(52,211,153,0.08)]",
  },
  rose: {
    dot: "bg-rose-400",
    border: "group-hover:border-rose-400/30",
    text: "group-hover:text-rose-400",
    glow: "group-hover:shadow-[0_0_30px_rgba(251,113,133,0.08)]",
  },
  sky: {
    dot: "bg-sky-400",
    border: "group-hover:border-sky-400/30",
    text: "group-hover:text-sky-400",
    glow: "group-hover:shadow-[0_0_30px_rgba(56,189,248,0.08)]",
  },
  teal: {
    dot: "bg-teal-400",
    border: "group-hover:border-teal-400/30",
    text: "group-hover:text-teal-400",
    glow: "group-hover:shadow-[0_0_30px_rgba(45,212,191,0.08)]",
  },
  indigo: {
    dot: "bg-indigo-400",
    border: "group-hover:border-indigo-400/30",
    text: "group-hover:text-indigo-400",
    glow: "group-hover:shadow-[0_0_30px_rgba(129,140,248,0.08)]",
  },
};

export function ExplorationCard({
  item,
  index,
  featured = false,
}: {
  item: Exploration;
  index: number;
  featured?: boolean;
}) {
  const colors = colorStyles[item.color] || colorStyles.green;

  if (featured) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.1 }}
      >
        <Link
          href={`/explorations/${item.slug}`}
          className={`group relative block overflow-hidden rounded-2xl border border-border bg-surface transition-all duration-500 ${colors.border} ${colors.glow}`}
        >
          {item.image && (
            <div className="relative aspect-[21/9] w-full overflow-hidden">
              <Image
                src={item.image}
                alt={item.title}
                fill
                sizes="(max-width: 768px) 100vw, 896px"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/50 to-transparent" />
            </div>
          )}
          <div className="relative p-8 sm:p-10">
            <div className="mb-3 flex items-center gap-3">
              <span className="exploration-number text-[10px] font-medium text-muted/30">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
              <span className="text-xs tracking-wider uppercase text-muted">
                {item.category}
              </span>
              {item.publishedAt && (
                <>
                  <span className="text-muted/30">&middot;</span>
                  <span className="flex items-center gap-1 text-xs text-muted/50">
                    <Calendar size={10} />
                    {formatPublishedAt(item.publishedAt)}
                  </span>
                </>
              )}
              {item.readTime && (
                <>
                  <span className="text-muted/30">&middot;</span>
                  <span className="flex items-center gap-1 text-xs text-muted/50">
                    <Clock size={10} />
                    {item.readTime}
                  </span>
                </>
              )}
            </div>
            <h2
              className={`font-[family-name:var(--font-display)] text-2xl font-semibold text-foreground transition-colors sm:text-3xl ${colors.text}`}
            >
              {item.title}
            </h2>
            <p className="mt-2 text-sm italic text-muted/70">
              {item.subtitle}
            </p>
            {item.description && (
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
                {item.description}
              </p>
            )}
            <div
              className={`mt-6 inline-flex items-center gap-2 text-sm text-muted transition-colors ${colors.text}`}
            >
              Read exploration
              <ArrowRight
                size={14}
                className="transition-transform group-hover:translate-x-1"
              />
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.05 * index }}
    >
      <Link
        href={`/explorations/${item.slug}`}
        className={`group relative flex overflow-hidden rounded-2xl border border-border bg-surface transition-all duration-500 ${colors.border} ${colors.glow}`}
      >
        {item.image && (
          <div className="relative hidden w-48 flex-shrink-0 overflow-hidden sm:block">
            <Image
              src={item.image}
              alt={item.title}
              fill
              sizes="192px"
              className="object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-surface" />
          </div>
        )}
        <div className="flex flex-1 flex-col justify-center p-6 sm:p-8">
          <div className="mb-2 flex items-center gap-2">
            <span className="exploration-number text-[10px] font-medium text-muted/25">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
            <span className="text-xs tracking-wider uppercase text-muted">
              {item.category}
            </span>
            {item.publishedAt && (
              <>
                <span className="text-muted/30">&middot;</span>
                <span className="flex items-center gap-1 text-xs text-muted/50">
                  <Calendar size={10} />
                  {formatPublishedAt(item.publishedAt)}
                </span>
              </>
            )}
            {item.readTime && (
              <>
                <span className="text-muted/30">&middot;</span>
                <span className="flex items-center gap-1 text-xs text-muted/50">
                  <Clock size={10} />
                  {item.readTime}
                </span>
              </>
            )}
          </div>
          <h3
            className={`font-[family-name:var(--font-display)] text-lg font-semibold text-foreground transition-colors ${colors.text}`}
          >
            {item.title}
          </h3>
          <p className="mt-1 text-sm text-muted/70">{item.subtitle}</p>
        </div>
        <div className="hidden items-center pr-6 sm:flex">
          <ArrowRight
            size={16}
            className="text-muted/30 transition-all group-hover:translate-x-1 group-hover:text-muted"
          />
        </div>
      </Link>
    </motion.div>
  );
}
