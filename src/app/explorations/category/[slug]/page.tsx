import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getCategories,
  categoryFromSlug,
  getExplorationsByCategory,
} from "@/data/explorations";
import { CategoryContent } from "./category-content";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getCategories().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const name = categoryFromSlug(slug);
  if (!name) return {};

  const count = getExplorationsByCategory(name).length;
  const title = `${name} — Foxfire`;
  const description = `Browse ${count} exploration${count === 1 ? "" : "s"} in ${name}: deep dives into the strange, forgotten, and beautiful.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://foxfire.blog/explorations/category/${slug}`,
    },
    openGraph: {
      title,
      description,
      siteName: "Foxfire",
      url: `https://foxfire.blog/explorations/category/${slug}`,
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const name = categoryFromSlug(slug);
  if (!name) notFound();

  const items = getExplorationsByCategory(name);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${name} — Foxfire`,
    description: `Explorations in the category: ${name}`,
    url: `https://foxfire.blog/explorations/category/${slug}`,
    numberOfItems: items.length,
    hasPart: items.map((item) => ({
      "@type": "Article",
      name: item.title,
      url: `https://foxfire.blog/explorations/${item.slug}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <CategoryContent slug={slug} name={name} items={items} />
    </>
  );
}
