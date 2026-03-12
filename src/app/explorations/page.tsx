"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { List, GitBranch, Search, X } from "lucide-react";
import { ExplorationCard } from "@/components/exploration-card";
import { ExplorationTimeline } from "@/components/exploration-timeline";
import { explorations } from "@/data/explorations";

export default function Explorations() {
  const [view, setView] = useState<"list" | "timeline">("list");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of explorations) {
      counts.set(e.category, (counts.get(e.category) || 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);
  }, []);

  const filtered = useMemo(() => {
    let items = explorations;
    if (activeCategory) {
      items = items.filter((e) => e.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.subtitle.toLowerCase().includes(q) ||
          (e.description && e.description.toLowerCase().includes(q)) ||
          e.category.toLowerCase().includes(q)
      );
    }
    return items;
  }, [search, activeCategory]);

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
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted/40"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search explorations..."
              className="w-full rounded-xl border border-border bg-surface/80 py-2.5 pl-9 pr-9 text-sm text-foreground placeholder:text-muted/30 outline-none transition-colors focus:border-white/20 focus:bg-surface"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted/40 hover:text-muted"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory(null)}
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
