"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Clock } from "lucide-react";
import { colorStyles, type Exploration } from "./exploration-card";

interface DateGroup {
  label: string;
  entries: (Exploration & { time: string })[];
}

function groupByDate(explorations: Exploration[]): DateGroup[] {
  const groups: Map<string, (Exploration & { time: string })[]> = new Map();

  for (const item of explorations) {
    if (!item.publishedAt) continue;
    const d = new Date(item.publishedAt);
    if (isNaN(d.getTime())) continue;

    const dateKey = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const time = d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    if (!groups.has(dateKey)) groups.set(dateKey, []);
    groups.get(dateKey)!.push({ ...item, time });
  }

  return Array.from(groups.entries()).map(([label, entries]) => ({
    label,
    entries,
  }));
}

export function ExplorationTimeline({
  explorations,
}: {
  explorations: Exploration[];
}) {
  const groups = groupByDate(explorations);

  return (
    <div className="relative">
      {groups.map((group, gi) => (
        <div key={group.label} className="relative">
          {/* Date header */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="mb-4 flex items-center gap-3 pl-8 sm:pl-10"
          >
            <span className="text-sm font-medium text-foreground/80">
              {group.label}
            </span>
            <div className="h-px flex-1 bg-border/50" />
          </motion.div>

          {/* Entries */}
          <div className="relative ml-3 sm:ml-4 border-l border-border/40 pl-5 sm:pl-6 pb-8">
            {group.entries.map((item, ei) => {
              const colors = colorStyles[item.color] || colorStyles.green;
              const globalIndex = gi * 100 + ei;

              return (
                <motion.div
                  key={item.slug}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.5,
                    delay: 0.08 * ei,
                  }}
                  className="relative mb-5 last:mb-0"
                >
                  {/* Dot on the timeline */}
                  <div
                    className={`absolute -left-[calc(1.25rem+0.5px)] sm:-left-[calc(1.5rem+0.5px)] top-3 h-2.5 w-2.5 rounded-full ${colors.dot} ring-4 ring-background`}
                  />

                  {/* Horizontal connector */}
                  <div className="absolute -left-5 sm:-left-6 top-[17px] w-5 sm:w-6 h-px bg-border/30" />

                  {/* Card */}
                  <Link
                    href={`/explorations/${item.slug}`}
                    className={`group relative flex overflow-hidden rounded-xl border border-border bg-surface transition-all duration-500 ${colors.border} ${colors.glow}`}
                  >
                    {item.image && (
                      <div className="relative hidden w-28 flex-shrink-0 overflow-hidden sm:block">
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-surface" />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col justify-center p-4 sm:p-5">
                      <div className="mb-1.5 flex items-center gap-2">
                        <span className="text-xs tracking-wider uppercase text-muted">
                          {item.category}
                        </span>
                        <span className="text-muted/30">&middot;</span>
                        <span className="text-[11px] text-muted/50">
                          {item.time}
                        </span>
                        {item.readTime && (
                          <>
                            <span className="text-muted/30">&middot;</span>
                            <span className="flex items-center gap-1 text-[11px] text-muted/50">
                              <Clock size={9} />
                              {item.readTime}
                            </span>
                          </>
                        )}
                      </div>
                      <h3
                        className={`font-[family-name:var(--font-display)] text-base font-semibold text-foreground transition-colors ${colors.text}`}
                      >
                        {item.title}
                      </h3>
                      <p className="mt-0.5 text-sm text-muted/60 line-clamp-1">
                        {item.subtitle}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
