"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ExplorationCard } from "@/components/exploration-card";
import type { Exploration } from "@/components/exploration-card";

export function CategoryContent({
  slug,
  name,
  items,
}: {
  slug: string;
  name: string;
  items: Exploration[];
}) {
  return (
    <div className="min-h-screen">
      <section className="relative mx-auto max-w-4xl px-6 pt-28 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link
            href="/explorations"
            className="inline-flex items-center gap-2 text-sm text-muted/60 transition-colors hover:text-muted"
          >
            <ArrowLeft size={14} />
            All explorations
          </Link>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mt-6 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-foreground sm:text-5xl"
        >
          {name}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-4 text-lg text-muted"
        >
          {items.length} exploration{items.length === 1 ? "" : "s"}
        </motion.p>
      </section>

      <section className="relative mx-auto max-w-4xl px-6 pb-24">
        <div className="flex flex-col gap-5">
          {items.map((item, i) => (
            <ExplorationCard key={item.slug} item={item} index={i} />
          ))}
        </div>
      </section>
    </div>
  );
}
