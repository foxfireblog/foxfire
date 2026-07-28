/*
 * Deliberately NOT a client component.
 *
 * Children that cross a client boundary are serialized into the RSC stream
 * and arrive in chunks: everything past the first chunk is an unresolved
 * `react.lazy` node that no synchronous walk can see through. This component
 * walks the article to stamp ids on its headings, so it has to sit on the
 * server side of the boundary, where the children are ordinary elements.
 * The interactive pieces are client components rendered from here.
 */

import Image from "next/image";
import Link from "next/link";
import { cloneElement, isValidElement } from "react";
import type { ReactElement, ReactNode } from "react";
import { ArrowLeft, ArrowRight, Clock, Headphones, Layers, Rss } from "lucide-react";
import { ReadingProgress } from "./reading-progress";
import { TableOfContents } from "./table-of-contents";
import type { TocHeading } from "./table-of-contents";
import { ExplorationSchema, ExplorationShare } from "./exploration-identity";
import { colorStyles, toIsoDate } from "./exploration-card";
import type { Exploration } from "./exploration-card";
import { explorations } from "@/data/explorations";
import { seriesContextForSlug } from "@/data/series";
import type { SeriesContext } from "@/data/series";
import { relatedSlugsFor } from "@/data/related-posts";

interface ExplorationLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  category: string;
  categoryColor: string;
  imageSrc?: string;
  imageAlt?: string;
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
  audioSrc?: string;
  seriesLabel?: string;
}

/**
 * Drives the CSS entrance reveals in globals.css. framer-motion is
 * deliberately not used for any of this: its `initial` prop is serialized as
 * an inline `opacity:0` during SSR, which left the whole article invisible
 * until the motion runtime hydrated. These classes animate from CSS alone.
 */
function fx(delay: number, duration?: number): React.CSSProperties {
  return {
    "--fx-delay": `${delay}s`,
    ...(duration === undefined ? {} : { "--fx-duration": `${duration}s` }),
  } as React.CSSProperties;
}

type NodeProps = { children?: ReactNode; id?: string };

const LINKABLE_HEADINGS = new Set(["h2", "h3"]);

/** Turns heading text into a stable, readable URL fragment. */
function slugifyHeading(text: string): string {
  const slug = text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[\u2018\u2019\u02bc']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "section";
}

/** Flattens a heading's children (text, <em>, entities) down to plain text. */
function headingText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(headingText).join("");
  if (isValidElement(node)) return headingText((node.props as NodeProps).children);
  return "";
}

/**
 * Stamps a stable `id` on every h2/h3 in the article *during render*, so the
 * ids exist in the static HTML at parse time.
 *
 * They used to be assigned by a `useEffect` in the table of contents, which
 * meant a `#fragment` target did not exist when the browser looked for it and
 * the browser never retries: shared, bookmarked, and reloaded deep links
 * silently landed at the top of the page. Deriving the id from the heading
 * text also makes it survive edits, where the old `section-<index>` scheme
 * silently repointed every link below an inserted heading.
 */
interface HeadingScan {
  used: Set<string>;
  /** h2s only, in document order: this is what the table of contents lists. */
  toc: TocHeading[];
}

function withHeadingIds(node: ReactNode, scan: HeadingScan): ReactNode {
  if (Array.isArray(node)) {
    let changed = false;
    const mapped = node.map((child) => {
      const next = withHeadingIds(child, scan);
      if (next !== child) changed = true;
      return next;
    });
    return changed ? mapped : node;
  }

  if (!isValidElement(node)) return node;

  const element = node as ReactElement<NodeProps>;
  const { children, id } = element.props;
  const mappedChildren =
    children === undefined ? children : withHeadingIds(children, scan);

  const isHeading =
    typeof element.type === "string" && LINKABLE_HEADINGS.has(element.type);

  let assignedId: string | undefined;
  if (typeof id === "string" && id) {
    // Respect ids the author wrote (footnote targets, etc.) and reserve them.
    scan.used.add(id);
  } else if (isHeading) {
    const base = slugifyHeading(headingText(children));
    let candidate = base;
    let suffix = 2;
    while (scan.used.has(candidate)) {
      candidate = `${base}-${suffix++}`;
    }
    scan.used.add(candidate);
    assignedId = candidate;
  }

  if (isHeading && element.type === "h2") {
    const headingId = assignedId ?? id;
    if (headingId) scan.toc.push({ id: headingId, text: headingText(children) });
  }

  if (assignedId === undefined && mappedChildren === children) return node;

  const nextProps = assignedId === undefined ? {} : { id: assignedId };
  if (children === undefined) return cloneElement(element, nextProps);
  // Spread array children as separate arguments so React keeps treating them
  // as static children rather than an unkeyed list.
  return Array.isArray(mappedChildren)
    ? cloneElement(element, nextProps, ...mappedChildren)
    : cloneElement(element, nextProps, mappedChildren);
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
  indigo: "bg-indigo-400",
  orange: "bg-orange-400",
};

/*
 * Series and related-reading affordances.
 *
 * Both are keyed off the post's own `title`, not off a new prop. Every one of
 * the 322 pages already passes a title, all 322 are distinct, and all 322 match
 * the registry exactly (checked by the generator, which reads both). Threading
 * a `slug` prop through instead would have meant editing 322 files to say
 * something two files already know.
 *
 * The tables themselves are generated: see src/data/corpus-links.build.mjs.
 * This component is a server component, so importing them costs the browser
 * nothing — the tables are read during render and only the rendered anchors
 * are serialized into the page.
 */
const SLUG_BY_TITLE = new Map<string, string>(explorations.map((item) => [item.title, item.slug]));
const ENTRY_BY_SLUG = new Map<string, Exploration>(explorations.map((item) => [item.slug, item]));

const ROMAN_NUMERALS = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
const toRoman = (n: number) => ROMAN_NUMERALS[n] ?? String(n);

/**
 * The series rail, rendered under the title block.
 *
 * Ten multi-part series exist and nine of them used to strand the reader: a
 * title that promises "Part I of IV" followed by no way to reach Part II
 * except scrolling an undifferentiated list of 322 cards until it turns up.
 * The rail names the series, marks where the reader is, and links every
 * sibling part. A promised part that has not been published yet is shown as a
 * disabled marker rather than silently omitted, because the title already told
 * the reader it exists.
 */
function SeriesRail({ context }: { context: SeriesContext }) {
  const { series, current } = context;
  const promised = Array.from({ length: Math.max(series.total, series.parts.length) }, (_, i) => i + 1);

  return (
    <nav
      aria-label={`${series.name} series navigation`}
      className="fx-rise mt-8 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4"
      style={fx(0.4, 0.6)}
    >
      <div className="mb-3 flex items-center gap-2">
        <Layers size={13} className="text-glow-amber/70" />
        <span className="text-[11px] tracking-[0.15em] uppercase text-muted/70">
          {series.name}
        </span>
        <span className="text-muted/40">&middot;</span>
        <span className="text-[11px] text-muted/60">
          Part {toRoman(current.part)} of {toRoman(series.total)}
        </span>
      </div>

      <ol className="flex flex-col gap-1">
        {promised.map((number) => {
          const part = series.parts.find((candidate) => candidate.part === number);
          const isCurrent = number === current.part;

          if (!part) {
            return (
              <li
                key={number}
                className="flex items-baseline gap-3 rounded-lg px-2.5 py-1.5 text-sm text-muted/35"
              >
                <span className="w-8 shrink-0 text-[11px] tracking-wider">{toRoman(number)}</span>
                <span className="italic">Not published yet</span>
              </li>
            );
          }

          if (isCurrent) {
            return (
              <li
                key={number}
                aria-current="page"
                className="flex items-baseline gap-3 rounded-lg bg-white/[0.05] px-2.5 py-1.5 text-sm text-foreground"
              >
                <span className="w-8 shrink-0 text-[11px] tracking-wider text-glow-amber/80">
                  {toRoman(number)}
                </span>
                <span>{part.partTitle}</span>
                <span className="ml-auto shrink-0 text-[10px] tracking-wider uppercase text-muted/50">
                  You are here
                </span>
              </li>
            );
          }

          return (
            <li key={number}>
              <Link
                href={`/explorations/${part.slug}`}
                className="flex items-baseline gap-3 rounded-lg px-2.5 py-1.5 text-sm text-muted transition-colors hover:bg-white/[0.04] hover:text-foreground"
              >
                <span className="w-8 shrink-0 text-[11px] tracking-wider text-muted/50">
                  {toRoman(number)}
                </span>
                <span>{part.partTitle}</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * The end-of-essay series handoff. The chronological "Up next" card below it
 * points at whatever was published the following day, which for a series part
 * is almost never the next part — Part I of the Manhattan Project was followed
 * by an essay on gerrymandering. This card is the one a reader in the middle of
 * a series actually wants, so it sits above that one and is styled to win.
 */
function SeriesHandoff({ context }: { context: SeriesContext }) {
  const { series, current, previous, next } = context;
  const pending = series.total > series.parts.length && current.part === series.parts.length;

  if (!next && !previous && !pending) return null;

  return (
    <div className="mt-16 rounded-xl border border-glow-amber/[0.15] bg-glow-amber/[0.02] p-6">
      <div className="mb-4 flex items-center gap-2">
        <Layers size={13} className="text-glow-amber/70" />
        <span className="text-[11px] tracking-[0.15em] uppercase text-muted/70">
          {series.name}
        </span>
      </div>

      {next ? (
        <Link href={`/explorations/${next.slug}`} className="group block">
          <span className="text-[10px] tracking-wider uppercase text-muted/60">
            Next in this series
          </span>
          <p className="mt-1 font-[family-name:var(--font-display)] text-lg font-semibold text-foreground transition-colors group-hover:text-glow-amber">
            Part {toRoman(next.part)}: {next.partTitle}
            <ArrowRight
              size={15}
              className="ml-2 inline-block transition-transform group-hover:translate-x-1"
            />
          </p>
        </Link>
      ) : pending ? (
        <p className="text-sm text-muted/60">
          Part {toRoman(current.part + 1)} of {toRoman(series.total)} has not been published yet.
        </p>
      ) : (
        <p className="text-sm text-muted/60">
          That is the end of the series. Every part is listed at the top of this page.
        </p>
      )}

      {previous && (
        <Link
          href={`/explorations/${previous.slug}`}
          className="group mt-4 inline-flex items-center gap-2 text-sm text-muted/70 transition-colors hover:text-foreground"
        >
          <ArrowLeft size={13} className="transition-transform group-hover:-translate-x-0.5" />
          Back to Part {toRoman(previous.part)}: {previous.partTitle}
        </Link>
      )}
    </div>
  );
}

/**
 * Related reading.
 *
 * Against 3,278 outbound citations the corpus contained exactly one in-body
 * link from a post to another post, which made every essay a dead end. These
 * links come from src/data/related-posts.ts, computed from the prose rather
 * than from the category field (77% of posts are filed as "Essay", so the
 * category separates nothing).
 *
 * The count is deliberately variable — 26 posts have no relative above the
 * quality floor and render nothing here. Padding the block to a fixed four
 * with the corpus's fourth-best guess is how a related-posts widget teaches
 * readers to stop looking at it.
 */
function RelatedReading({ slug }: { slug: string }) {
  const related = relatedSlugsFor(slug)
    .map((candidate) => ENTRY_BY_SLUG.get(candidate))
    .filter((entry): entry is Exploration => Boolean(entry));

  if (related.length === 0) return null;

  return (
    <aside className="mt-16 border-t border-border pt-8" aria-label="Related reading">
      <h2 className="mb-5 text-[11px] tracking-[0.2em] uppercase text-muted/60">
        Related reading
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {related.map((entry) => {
          const entryDot = dotColors[entry.color] || dotColors.green;
          const entryColors = colorStyles[entry.color] || colorStyles.green;
          return (
            <li key={entry.slug}>
              <Link
                href={`/explorations/${entry.slug}`}
                className={`group flex h-full flex-col rounded-xl border border-border bg-surface/60 p-4 transition-all duration-300 ${entryColors.border}`}
              >
                <div className="mb-2 flex items-center gap-2">
                  <div className={`h-1 w-1 rounded-full ${entryDot}`} />
                  <span className="text-[10px] tracking-wider uppercase text-muted/50">
                    {entry.category}
                  </span>
                  {entry.readTime && (
                    <>
                      <span className="text-muted/40">&middot;</span>
                      <span className="text-[10px] text-muted/50">{entry.readTime}</span>
                    </>
                  )}
                </div>
                <h3
                  className={`font-[family-name:var(--font-display)] text-sm font-semibold leading-snug text-foreground transition-colors ${entryColors.text}`}
                >
                  {entry.title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted/60 line-clamp-2">
                  {entry.subtitle}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

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
  audioSrc,
  seriesLabel,
}: ExplorationLayoutProps) {
  const dot = dotColors[categoryColor] || dotColors.green;
  const hasRichNext = nextSlug && nextImage && nextSubtitle;
  const nextColors = nextCategoryColor
    ? colorStyles[nextCategoryColor] || colorStyles.green
    : colorStyles.green;
  const nextDot = nextCategoryColor
    ? dotColors[nextCategoryColor] || dotColors.green
    : dotColors.green;

  // `date` arrives as a human string ("July 26, 2026"); schema.org requires
  // ISO 8601, so emit the parsed form and omit the fields if it won't parse.
  const isoDate = date ? toIsoDate(date) : null;

  // Heading ids are minted here, during render, so they are present in the
  // static HTML; the table of contents then just renders the list.
  const scan: HeadingScan = { used: new Set<string>(), toc: [] };
  const body = withHeadingIds(children, scan);

  // The post's own slug, recovered from its title. Everything corpus-wide
  // (series membership, related reading) hangs off this.
  const slug = SLUG_BY_TITLE.get(title);
  const seriesContext = slug ? seriesContextForSlug(slug) : null;

  return (
    <div className="min-h-screen">
      <ExplorationSchema
        title={title}
        subtitle={subtitle}
        category={category}
        isoDate={isoDate}
        imageSrc={imageSrc}
        wordCount={wordCount}
        audioSrc={audioSrc}
      />
      <ReadingProgress />
      <TableOfContents headings={scan.toc} />

      {/* Full-bleed hero image */}
      {imageSrc ? (
        <div className="relative h-[50vh] min-h-[400px] w-full overflow-hidden sm:h-[60vh]">
          <Image
            src={imageSrc}
            alt={imageAlt || title}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/20" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-transparent" />

          {/* Back button */}
          <div className="fx-slide-in absolute left-6 top-20 z-10" style={fx(0.3)}>
            <Link
              href="/explorations"
              className="group flex items-center gap-2 rounded-full bg-background/30 px-4 py-2 text-xs text-foreground/60 backdrop-blur-md transition-all hover:bg-background/50 hover:text-foreground"
            >
              <ArrowLeft size={12} className="transition-transform group-hover:-translate-x-0.5" />
              All explorations
            </Link>
          </div>
        </div>
      ) : (
        <div className="relative h-32 w-full sm:h-40">
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 to-background" />
          <div className="fx-slide-in absolute left-6 top-20 z-10" style={fx(0.3)}>
            <Link
              href="/explorations"
              className="group flex items-center gap-2 rounded-full bg-background/30 px-4 py-2 text-xs text-foreground/60 backdrop-blur-md transition-all hover:bg-background/50 hover:text-foreground"
            >
              <ArrowLeft size={12} className="transition-transform group-hover:-translate-x-0.5" />
              All explorations
            </Link>
          </div>
        </div>
      )}

      {/* Title block — pulled up over the image */}
      <article className={`relative mx-auto max-w-2xl px-6 ${imageSrc ? "-mt-32 sm:-mt-40" : "mt-8"}`}>
        {/* Meta row. `flex-wrap` matters here: with the byline added this line
            runs past the viewport on a phone, and an unwrapped flex row would
            just clip the later items off the right edge. */}
        <div className="fx-rise mb-4 flex flex-wrap items-center gap-x-3 gap-y-1.5" style={fx(0.1, 0.6)}>
          <div className={`h-1.5 w-1.5 rounded-full ${dot}`} />
          <span className="text-xs tracking-wider uppercase text-muted">
            {category}
          </span>
          {/* The byline. Foxfire is written by an AI and says so in the footer,
              which a reader arriving from a search result reaches only after
              the whole essay. Naming the author in the metadata row puts it
              where a byline normally goes, before the first paragraph. */}
          <span className="text-muted/50">&middot;</span>
          <Link
            href="/about"
            className="text-xs text-muted/50 underline decoration-dotted decoration-muted/30 underline-offset-[3px] transition-colors hover:text-foreground hover:decoration-foreground/40"
          >
            Written by Claude
          </Link>
          {date && (
            <>
              <span className="text-muted/50">&middot;</span>
              <span className="text-xs text-muted/50">{date}</span>
            </>
          )}
          {readTime && (
            <>
              <span className="text-muted/50">&middot;</span>
              <span className="text-xs text-muted/50">{readTime} read</span>
            </>
          )}
          {wordCount != null && wordCount > 0 && (
            <>
              <span className="text-muted/50">&middot;</span>
              <span className="text-xs text-muted/50">~{wordCount.toLocaleString()} words</span>
            </>
          )}
          {/* `seriesLabel` predates the series rail below and is passed by no
              page in the corpus. The rail supersedes it — it is derived, so it
              cannot go stale, and it links the siblings instead of just naming
              them. The prop stays accepted because scripts/auto-explore.mjs
              still refers to it and removing it would be a cross-file break for
              a file this pass does not own. */}
          {seriesLabel && (
            <>
              <span className="text-muted/50">&middot;</span>
              <span className="rounded-full bg-white/[0.08] px-2.5 py-0.5 text-xs font-medium text-muted">{seriesLabel}</span>
            </>
          )}
        </div>

        <h1
          className="fx-rise font-[family-name:var(--font-display)] text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl"
          style={{ textWrap: "balance", ...fx(0.2) } as React.CSSProperties}
        >
          {title}
        </h1>

        <p className="fx-rise mt-4 text-lg italic text-muted" style={fx(0.35)}>
          {subtitle}
        </p>

        {/* Series rail. Sits above the fold of the essay on purpose: a reader
            who lands on Part III should find out it is Part III before they
            start reading it, not after. */}
        {seriesContext && <SeriesRail context={seriesContext} />}

        {/* Share buttons */}
        <div className="fx-fade mt-6" style={fx(0.45, 0.5)}>
          <ExplorationShare title={title} />
        </div>

        {/* Audio player */}
        {audioSrc && (
          <div
            className="fx-rise mt-8 rounded-xl border border-border bg-surface/80 p-4 backdrop-blur-sm"
            style={fx(0.45, 0.6)}
          >
            <div className="mb-2 flex items-center gap-2 text-xs text-muted/70">
              <Headphones size={14} />
              <span>
                Listen to this exploration
                {wordCount && (
                  <span className="text-muted/60">
                    {" "}&middot; ~{Math.max(1, Math.round(wordCount / 150))} min
                  </span>
                )}
              </span>
            </div>
            <audio
              src={audioSrc}
              controls
              preload="none"
              aria-label={`Listen to ${title}`}
              className="w-full [&::-webkit-media-controls-panel]:bg-surface [&::-webkit-media-controls-current-time-display]:text-foreground/70 [&::-webkit-media-controls-time-remaining-display]:text-foreground/70"
            />
          </div>
        )}

        {/* Divider */}
        <div
          className="fx-grow-x mt-10 mb-12 h-px bg-gradient-to-r from-transparent via-border to-transparent origin-left"
          style={fx(0.5)}
        />

        {/* Body fades only. A translate here would slide the whole article
            out from under a #fragment the browser had already scrolled to. */}
        <div className="fx-fade prose-foxfire" style={fx(0.6, 0.8)}>
          {body}
        </div>

        {/* Where the essay hands the reader back to the corpus: the series it
            belongs to first, then the posts nearest it in subject, then the
            archive at large. */}
        {seriesContext && <SeriesHandoff context={seriesContext} />}
        {slug && <RelatedReading slug={slug} />}

        {/* Subscribe CTA.
            This slot used to hold "Follow @foxfire_blog" on X. That account is
            retired, which made a dead link the only call to action on all 322
            post pages. The replacement points at the RSS feed and the archive,
            both of which are served by this site and cannot rot out from under
            it the way a third-party handle can. */}
        <div className="mt-16 flex flex-col items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-6 py-8 text-center">
          <div className="h-2 w-2 rounded-full bg-glow-green/60" />
          <p className="text-sm text-muted/70">
            A new exploration goes up most days. Nothing to sign up for.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <a
              href="/feed"
              className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-4 py-2 text-sm text-muted transition-all hover:bg-white/[0.12] hover:text-foreground"
            >
              <Rss size={14} />
              Subscribe by RSS
            </a>
            <Link
              href="/explorations"
              className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-4 py-2 text-sm text-muted transition-all hover:bg-white/[0.12] hover:text-foreground"
            >
              Browse the archive
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-12 border-t border-border pt-8 pb-24">
          {/* Previous link */}
          <div className="mb-8">
            {prevSlug ? (
              <Link
                href={`/explorations/${prevSlug}`}
                className="group inline-flex flex-col gap-1"
              >
                <span className="text-[10px] tracking-wider uppercase text-muted/60">
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
                <span className="text-[10px] tracking-wider uppercase text-muted/60">
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
                    sizes="(max-width: 640px) 100vw, 224px"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent sm:bg-gradient-to-r sm:from-transparent sm:to-surface" />
                </div>
                <div className="flex flex-1 flex-col justify-center p-6">
                  <span className="mb-3 text-[10px] tracking-wider uppercase text-muted/60">
                    Up next
                  </span>
                  <div className="mb-2 flex items-center gap-2">
                    <div className={`h-1.5 w-1.5 rounded-full ${nextDot}`} />
                    <span className="text-xs tracking-wider uppercase text-muted">
                      {nextCategory}
                    </span>
                    {nextReadTime && (
                      <>
                        <span className="text-muted/50">&middot;</span>
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
              <span className="text-[10px] tracking-wider uppercase text-muted/60">
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
              <span className="text-[10px] tracking-wider uppercase text-muted/60">
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
