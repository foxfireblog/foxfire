"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { List } from "lucide-react";

interface TocItem {
  id: string;
  text: string;
}

export function TableOfContents() {
  const [headings, setHeadings] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const article = document.querySelector(".prose-foxfire");
    if (!article) return;

    const h2s = article.querySelectorAll("h2");
    const items: TocItem[] = [];

    h2s.forEach((h2, i) => {
      if (!h2.id) {
        h2.id = `section-${i}`;
      }
      items.push({ id: h2.id, text: h2.textContent || "" });
    });

    setHeadings(items);
  }, []);

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -70% 0px" }
    );

    for (const { id } of headings) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 3) return null;

  return (
    <div className="fixed right-6 top-20 z-40 hidden xl:block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="table-of-contents-nav"
        aria-label="Toggle table of contents"
        className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs transition-all ${
          isOpen
            ? "bg-surface border border-border text-foreground"
            : "bg-background/30 backdrop-blur-md text-muted/50 hover:text-muted hover:bg-background/50"
        }`}
      >
        <List size={12} />
        <span>Contents</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.nav
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            id="table-of-contents-nav"
            aria-label="Table of contents"
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === "Escape") setIsOpen(false);
            }}
            className="mt-2 w-56 rounded-xl border border-border bg-surface/95 p-3 backdrop-blur-sm"
          >
            <ul className="space-y-1">
              {headings.map(({ id, text }) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    onClick={() => setIsOpen(false)}
                    className={`block rounded-md px-2.5 py-1.5 text-xs transition-colors ${
                      activeId === id
                        ? "bg-white/[0.06] text-foreground"
                        : "text-muted/60 hover:text-muted"
                    }`}
                  >
                    {text}
                  </a>
                </li>
              ))}
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  );
}
