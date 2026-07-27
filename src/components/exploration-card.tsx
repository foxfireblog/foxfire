/*
 * No "use client": with the reveal moved to CSS this file has no hooks, no
 * event handlers, and nothing else that needs the client runtime. The card
 * still ends up in the client bundle through its client-component callers,
 * but the shared date helpers below are now callable from server components
 * too.
 */

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calendar, Clock } from "lucide-react";

/**
 * `publishedAt` values are minted by the generator scripts with
 * `timeZone: "America/New_York"`, so the stored string is ALREADY Eastern
 * wall-clock. Handing it to `new Date()` re-parses it in whatever zone the
 * runtime happens to be in (UTC on the Vercel builder, local in the browser)
 * and a second `toLocaleString({ timeZone: "America/New_York" })` then shifts
 * it again — a double conversion that rendered every timestamp 4 hours early
 * and made the server and client markup disagree.
 *
 * The fix: never build a Date for display. Parse the components and format
 * them directly, so the release date renders identically in every runtime.
 */

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const MONTH_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export interface EasternParts {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number; // 0-23
  minute: number;
  hasTime: boolean;
}

const WITH_TIME = /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})\s*([AaPp])\.?[Mm]\.?$/;
const DATE_ONLY = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
const LONG_FORM = /^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})$/;

/**
 * Parses the shapes used across the site into plain Eastern wall-clock parts.
 * Supported: "MM/DD/YYYY HH:MM AM/PM", "YYYY-MM-DD", and "July 26, 2026".
 * Returns null for anything unrecognized so callers can fall back to the raw
 * string rather than rendering "Invalid Date".
 */
export function parseEasternParts(value: string): EasternParts | null {
  const withTime = value.trim().match(WITH_TIME);
  if (withTime) {
    let hour = Number(withTime[4]) % 12;
    if (withTime[6].toLowerCase() === "p") hour += 12;
    return {
      year: Number(withTime[3]),
      month: Number(withTime[1]),
      day: Number(withTime[2]),
      hour,
      minute: Number(withTime[5]),
      hasTime: true,
    };
  }

  const dateOnly = value.trim().match(DATE_ONLY);
  if (dateOnly) {
    return {
      year: Number(dateOnly[1]),
      month: Number(dateOnly[2]),
      day: Number(dateOnly[3]),
      hour: 12,
      minute: 0,
      hasTime: false,
    };
  }

  const longForm = value.trim().match(LONG_FORM);
  if (longForm) {
    const name = longForm[1].toLowerCase();
    const month = MONTH_LONG.findIndex((m) => m.toLowerCase() === name);
    if (month >= 0) {
      return {
        year: Number(longForm[3]),
        month: month + 1,
        day: Number(longForm[2]),
        hour: 12,
        minute: 0,
        hasTime: false,
      };
    }
  }

  return null;
}

/** "5:28 PM" */
export function formatEasternTime(parts: EasternParts): string {
  const h = parts.hour % 12 === 0 ? 12 : parts.hour % 12;
  const suffix = parts.hour < 12 ? "AM" : "PM";
  return `${h}:${String(parts.minute).padStart(2, "0")} ${suffix}`;
}

/** "Jul 26" — the timeline's day header. */
export function formatEasternDayLabel(value: string): string | null {
  const parts = parseEasternParts(value);
  if (!parts) return null;
  return `${MONTH_SHORT[parts.month - 1]} ${parts.day}`;
}

/** "2026-07-26" — schema.org / RSS need ISO 8601, not a human string. */
export function toIsoDate(value: string): string | null {
  const parts = parseEasternParts(value);
  if (!parts) return null;
  const mm = String(parts.month).padStart(2, "0");
  const dd = String(parts.day).padStart(2, "0");
  return `${parts.year}-${mm}-${dd}`;
}

export function formatPublishedAt(value: string): string {
  const parts = parseEasternParts(value);
  if (!parts) return value;
  const day = `${MONTH_SHORT[parts.month - 1]} ${parts.day}, ${parts.year}`;
  return parts.hasTime ? `${day}, ${formatEasternTime(parts)}` : day;
}

/**
 * The reveal used to be a framer-motion `whileInView`, whose index-scaled
 * delay taken from a card's absolute position in a 330-item list left
 * deep-scroll readers staring at blank cards for up to 16 seconds. Cap the
 * stagger so it stays a flourish for the first few cards and never a wait.
 *
 * It is now a CSS animation (`.fx-card` in globals.css) driven by a scroll
 * timeline where supported. That matters for more than motion preferences:
 * framer-motion serialized `initial` as an inline `opacity:0` during SSR, so
 * all 330 cards shipped invisible and stayed that way if the motion runtime
 * never arrived. The stagger only applies to the time-based fallback, since
 * a scroll timeline ignores animation-delay.
 */
export const MAX_STAGGER_STEPS = 6;

export function staggerDelay(index: number, step = 0.05): number {
  return Math.min(Math.max(index, 0), MAX_STAGGER_STEPS) * step;
}

function revealStyle(index: number): React.CSSProperties {
  return { "--fx-delay": `${staggerDelay(index)}s` } as React.CSSProperties;
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
  orange: {
    dot: "bg-orange-400",
    border: "group-hover:border-orange-400/30",
    text: "group-hover:text-orange-400",
    glow: "group-hover:shadow-[0_0_30px_rgba(251,146,60,0.08)]",
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
      <div className="fx-card" style={{ "--fx-delay": "0.1s" } as React.CSSProperties}>
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
              <span className="exploration-number text-[10px] font-medium text-muted/50">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
              <span className="text-xs tracking-wider uppercase text-muted">
                {item.category}
              </span>
              {item.publishedAt && (
                <>
                  <span className="text-muted/50">&middot;</span>
                  <span className="flex items-center gap-1 text-xs text-muted/50">
                    <Calendar size={10} />
                    {formatPublishedAt(item.publishedAt)}
                  </span>
                </>
              )}
              {item.readTime && (
                <>
                  <span className="text-muted/50">&middot;</span>
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
      </div>
    );
  }

  return (
    <div className="fx-card" style={revealStyle(index)}>
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
                <span className="text-muted/50">&middot;</span>
                <span className="flex items-center gap-1 text-xs text-muted/50">
                  <Calendar size={10} />
                  {formatPublishedAt(item.publishedAt)}
                </span>
              </>
            )}
            {item.readTime && (
              <>
                <span className="text-muted/50">&middot;</span>
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
            className="text-muted/50 transition-all group-hover:translate-x-1 group-hover:text-muted"
          />
        </div>
      </Link>
    </div>
  );
}
