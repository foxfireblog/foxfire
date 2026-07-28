"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { List, GitBranch, Search, X } from "lucide-react";
import { ExplorationCard } from "@/components/exploration-card";
import { ExplorationTimeline } from "@/components/exploration-timeline";
import { explorations } from "@/data/explorations";

/*
 * Search
 * ------
 * This box used to test four metadata strings for a raw substring of whatever
 * had been typed. Two ways that fails, both real:
 *
 *   "photography" -> nothing, while an essay subtitled "the woman who made
 *                    150,000 photographs" sat in the corpus.
 *   "wolves"      -> nothing, past "The Wolf Children of East Prussia".
 *
 * Neither is a missing-body problem. Both are the same morphology problem: the
 * word is right there and the reader typed a different form of it. So the first
 * fix is free — tokenize, stem both sides, compare stems.
 *
 * The second fix is the body text, which the client genuinely does not have.
 * The registry is a static import of titles and descriptions; the 322 essays
 * are separate server-rendered pages. scripts/search-index.mjs precomputes a
 * term list per post (every proper noun, plus the 60 most frequent terms —
 * 44,921 terms over 322 posts) and commits it as src/data/search-index.ts.
 *
 * That file is 349 KB raw, 136 KB gzipped, 111 KB brotli, which is too much to
 * put in front of a reader who came to browse. It is therefore imported
 * dynamically: it becomes its own chunk, the explorations page ships zero extra
 * bytes, and the chunk is fetched once when someone shows intent to search —
 * on focus, so the fetch overlaps the typing rather than following it. Until it
 * lands, metadata search answers on its own, which is what the page did before
 * and is enough for both queries above.
 */

/** Word-ish runs, for both queries and metadata. Apostrophes and hyphens stay. */
const WORD_RE = /[a-z0-9][a-z0-9'-]*/g;

/**
 * Reduce a word to a comparable root.
 *
 * Deliberately small, and deliberately the only stemmer in the codebase. The
 * index ships raw terms precisely so this function runs on both sides of every
 * comparison: a build-time stemmer and a runtime stemmer that drift apart would
 * degrade search silently, with nothing to fail.
 *
 * Length guards everywhere, because the damage is all at the short end —
 * without them "gas" stems to "ga" and "king" to "k".
 */
function stem(word: string): string {
  let s = word;
  if (s.length > 4) s = s.replace(/ly$/, "");
  if (s.length > 3) {
    if (/ves$/.test(s)) s = s.replace(/ves$/, "f");           // wolves -> wolf
    else if (/ies$/.test(s)) s = s.replace(/ies$/, "y");      // stories -> story
    else if (/(x|ch|sh|ss|z)es$/.test(s)) s = s.replace(/es$/, ""); // boxes -> box
    else if (/[^s]s$/.test(s)) s = s.replace(/s$/, "");       // photographs -> photograph
  }
  if (s.length > 6) s = s.replace(/ing$/, "");
  if (s.length > 5) s = s.replace(/ed$/, "");
  if (s.length > 4) s = s.replace(/y$/, "");                  // photography -> photograph
  return s;
}

const tokenize = (text: string): string[] => text.toLowerCase().match(WORD_RE) ?? [];

/**
 * Metadata for one post, prepared once at mount rather than per keystroke:
 * each field lowercased for substring tests, and its stems as a set for
 * morphological ones. Kept per field, not pooled, because where a word was
 * found is what ranks the result.
 */
interface MetaEntry {
  title: string;
  titleStems: Set<string>;
  subtitle: string;
  subtitleStems: Set<string>;
  description: string;
  descriptionStems: Set<string>;
  category: string;
  slug: string;
}

/** One post's body terms: a blob for prefix matching, a set for stem matching. */
interface BodyEntry {
  blob: string;
  stems: Set<string>;
}

// Where a term was found, in descending order of how much it should count.
// A title hit is the reader recognising the thing they were looking for; a body
// hit is a word the essay happens to contain.
const W_TITLE = 8;
const W_SUBTITLE = 5;
const W_CATEGORY = 4;
const W_DESCRIPTION = 3;
const W_SLUG = 2;
const W_BODY = 1;

function parseBodyIndex(payload: string): Map<string, BodyEntry> {
  const map = new Map<string, BodyEntry>();
  for (const line of payload.split("\n")) {
    const tab = line.indexOf("\t");
    if (tab === -1) continue;
    const slug = line.slice(0, tab);
    const terms = line.slice(tab + 1);
    if (!terms) continue;
    const stems = new Set<string>();
    for (const term of terms.split(" ")) {
      stems.add(term);
      stems.add(stem(term));
    }
    // Leading and trailing spaces so `includes(" " + token)` is a match at a
    // term boundary: "war" finds "warsaw" only if the essay says Warsaw, not
    // because "toward" contains it.
    map.set(slug, { blob: ` ${terms} `, stems });
  }
  return map;
}

export function ExplorationsContent() {
  const [view, setView] = useState<"list" | "timeline">("list");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [bodyIndex, setBodyIndex] = useState<Map<string, BodyEntry> | null>(null);
  const [indexLoading, setIndexLoading] = useState(false);
  const indexRequested = useRef(false);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of explorations) {
      counts.set(e.category, (counts.get(e.category) || 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);
  }, []);

  const metaIndex = useMemo(() => {
    const stemsOf = (text: string) => {
      const set = new Set<string>();
      for (const token of tokenize(text)) {
        set.add(token);
        set.add(stem(token));
      }
      return set;
    };
    const map = new Map<string, MetaEntry>();
    for (const e of explorations) {
      const description = e.description ?? "";
      map.set(e.slug, {
        title: e.title.toLowerCase(),
        titleStems: stemsOf(e.title),
        subtitle: e.subtitle.toLowerCase(),
        subtitleStems: stemsOf(e.subtitle),
        description: description.toLowerCase(),
        descriptionStems: stemsOf(description),
        category: e.category.toLowerCase(),
        slug: e.slug.replace(/-/g, " "),
      });
    }
    return map;
  }, []);

  const loadBodyIndex = useCallback(() => {
    if (indexRequested.current) return;
    indexRequested.current = true;
    setIndexLoading(true);
    import("@/data/search-index")
      .then(({ searchIndex }) => setBodyIndex(parseBodyIndex(searchIndex)))
      .catch(() => {
        // Metadata search keeps working; let a later attempt retry.
        indexRequested.current = false;
      })
      .finally(() => setIndexLoading(false));
  }, []);

  // Anyone arriving with a query already typed (autofill, a restored form,
  // browser back) never fires the focus handler.
  useEffect(() => {
    if (search.trim()) loadBodyIndex();
  }, [search, loadBodyIndex]);

  const filtered = useMemo(() => {
    let items = explorations;
    if (activeCategory) {
      items = items.filter((e) => e.category === activeCategory);
    }

    const query = search.trim().toLowerCase();
    if (!query) return items;

    const tokens = tokenize(query);
    if (tokens.length === 0) return items;

    const scored: { item: (typeof explorations)[number]; score: number; order: number }[] = [];

    items.forEach((item, order) => {
      const meta = metaIndex.get(item.slug);
      if (!meta) return;
      const body = bodyIndex?.get(item.slug);
      let total = 0;

      for (const token of tokens) {
        const root = stem(token);
        // Substring as well as stem, so a half-typed word still narrows the
        // list the way it always has: "photo" before the reader gets to "graphs".
        const hit = (text: string, stems: Set<string>) => text.includes(token) || stems.has(root);

        let best = 0;
        if (hit(meta.title, meta.titleStems)) best = W_TITLE;
        else if (hit(meta.subtitle, meta.subtitleStems)) best = W_SUBTITLE;
        else if (meta.category.includes(token)) best = W_CATEGORY;
        else if (hit(meta.description, meta.descriptionStems)) best = W_DESCRIPTION;
        else if (meta.slug.includes(token)) best = W_SLUG;
        else if (body && (body.blob.includes(` ${token}`) || body.stems.has(root))) best = W_BODY;

        // Every word has to land somewhere. Two words that each match a
        // different half of the archive are not a result.
        if (best === 0) return;
        total += best;
      }

      // The whole phrase in one field beats the same words scattered across three.
      if (
        tokens.length > 1 &&
        (meta.title.includes(query) || meta.subtitle.includes(query) || meta.description.includes(query))
      ) {
        total += W_TITLE;
      }

      scored.push({ item, score: total, order });
    });

    // Timeline view groups by publication date in iteration order, so handing
    // it a relevance-sorted list would shuffle the dates. It keeps registry
    // order; only the list view reorders.
    if (view === "timeline") return scored.map((s) => s.item);

    scored.sort((a, b) => b.score - a.score || a.order - b.order);
    return scored.map((s) => s.item);
  }, [search, activeCategory, metaIndex, bodyIndex, view]);

  const searching = search.trim().length > 0;

  return (
    <div className="min-h-screen">
      <section className="relative mx-auto max-w-4xl px-6 pt-28 pb-12">
        <div className="flex items-start justify-between gap-4">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-foreground sm:text-5xl"
            >
              Explorations
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="mt-4 max-w-lg text-lg text-muted"
            >
              Each entry is a deep dive into something that caught my attention.
              History, science, art, fiction — whatever glows.
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1"
          >
            <button
              onClick={() => setView("list")}
              className={`rounded-md p-2 transition-colors ${
                view === "list"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted/50 hover:text-muted"
              }`}
              aria-label="List view"
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setView("timeline")}
              className={`rounded-md p-2 transition-colors ${
                view === "timeline"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted/50 hover:text-muted"
              }`}
              aria-label="Timeline view"
            >
              <GitBranch size={16} />
            </button>
          </motion.div>
        </div>

        {/* Search and filter */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="mt-8 space-y-4"
        >
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted/60"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={loadBodyIndex}
              placeholder="Search titles and essay text..."
              aria-label="Search explorations"
              className="w-full rounded-xl border border-border bg-surface/80 py-2.5 pl-9 pr-9 text-sm text-foreground placeholder:text-muted/50 outline-none transition-colors focus:border-white/20 focus:bg-surface"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted/60 hover:text-muted"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {searching && (
            <p className="text-xs text-muted/50" aria-live="polite">
              {filtered.length} {filtered.length === 1 ? "exploration" : "explorations"}
              {bodyIndex
                ? " (titles and essay text)"
                : indexLoading
                  ? " — still loading the essay text"
                  : " (titles only)"}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory(null)}
              aria-pressed={!activeCategory}
              className={`rounded-full px-3 py-1 text-xs transition-colors ${
                !activeCategory
                  ? "bg-white/[0.1] text-foreground"
                  : "bg-white/[0.03] text-muted/50 hover:text-muted"
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() =>
                  setActiveCategory(activeCategory === cat ? null : cat)
                }
                aria-pressed={activeCategory === cat}
                className={`rounded-full px-3 py-1 text-xs transition-colors ${
                  activeCategory === cat
                    ? "bg-white/[0.1] text-foreground"
                    : "bg-white/[0.03] text-muted/50 hover:text-muted"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="relative mx-auto max-w-4xl px-6 pb-24">
        {filtered.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted/50">
            No explorations match your search.
          </p>
        ) : view === "list" ? (
          <div className="flex flex-col gap-5">
            {filtered.map((item, i) => (
              <ExplorationCard key={item.slug} item={item} index={i} />
            ))}
          </div>
        ) : (
          <ExplorationTimeline explorations={filtered} />
        )}
      </section>
    </div>
  );
}
