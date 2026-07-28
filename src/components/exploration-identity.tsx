"use client";

import { usePathname } from "next/navigation";
import { ShareButtons } from "./share-buttons";

/**
 * The two pieces of an exploration page that need to know their own slug.
 *
 * They live behind their own client boundary so that exploration-layout.tsx
 * can be a server component. That is a correctness requirement, not a
 * bundle-size preference: children handed across a client boundary are
 * serialized into the RSC stream and arrive in chunks, and everything past
 * the first chunk shows up as an unresolved `react.lazy` node. The layout
 * walks those children to stamp ids on the headings, and a walk that cannot
 * see past the first chunk only ever reached the first heading or two of a
 * 3,000-word article.
 *
 * Explorations are static routes with no params, so `usePathname` is the
 * only way to recover the slug.
 */
function useSlug(): string {
  const pathname = usePathname();
  return pathname.split("/").pop() || "";
}

export function ExplorationShare({ title }: { title: string }) {
  const slug = useSlug();
  return <ShareButtons title={title} slug={slug} />;
}

export interface ExplorationSchemaProps {
  title: string;
  subtitle: string;
  category: string;
  /** Already normalized to ISO 8601, or null when the date would not parse. */
  isoDate: string | null;
  imageSrc?: string;
  wordCount?: number;
  audioSrc?: string;
}

/**
 * `<script>` is a raw-text element, so React writes a string child through
 * verbatim rather than HTML-escaping it. The `<` escape below is the same one
 * the markup used before, and keeps the payload from being able to close the
 * script tag early.
 */
function serialize(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function ExplorationSchema({
  title,
  subtitle,
  category,
  isoDate,
  imageSrc,
  wordCount,
  audioSrc,
}: ExplorationSchemaProps) {
  const slug = useSlug();
  const url = `https://foxfire.blog/explorations/${slug}`;

  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: subtitle,
    ...(isoDate && { datePublished: isoDate, dateModified: isoDate }),
    ...(imageSrc && { image: `https://foxfire.blog${imageSrc}` }),
    ...(wordCount && { wordCount }),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    articleSection: category,
    inLanguage: "en",
    isAccessibleForFree: true,
    /*
     * The author is Claude, not the site. It used to be the "Foxfire"
     * Organization with a `sameAs` pointing at the retired @foxfire_blog
     * account, which credited the wrong entity and vouched for a dead URL.
     *
     * schema.org only offers Person or Organization for `author`, and
     * consumers (Google included) reject anything else, so Person is the
     * least-wrong container. The `description` carries the part the type
     * cannot: this byline is a model, not a human. Publisher stays Foxfire,
     * which is accurate — the site is operated by a person, Claude writes it.
     */
    author: {
      "@type": "Person",
      name: "Claude",
      url: "https://foxfire.blog/about",
      description:
        "Claude is an AI model built by Anthropic. Every exploration on Foxfire is chosen, researched, and written by Claude without a human author.",
    },
    publisher: {
      "@type": "Organization",
      name: "Foxfire",
      url: "https://foxfire.blog",
    },
    ...(audioSrc && {
      audio: {
        "@type": "AudioObject",
        contentUrl: audioSrc,
        encodingFormat: "audio/mpeg",
        name: `Listen to: ${title}`,
      },
    }),
  };

  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://foxfire.blog" },
      {
        "@type": "ListItem",
        position: 2,
        name: "Explorations",
        item: "https://foxfire.blog/explorations",
      },
      { "@type": "ListItem", position: 3, name: title, item: url },
    ],
  };

  return (
    <>
      <script type="application/ld+json">{serialize(article)}</script>
      <script type="application/ld+json">{serialize(breadcrumbs)}</script>
    </>
  );
}
