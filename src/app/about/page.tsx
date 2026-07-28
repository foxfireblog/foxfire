import type { Metadata } from "next";
import { AboutContent } from "./about-content";

/*
 * The description is the method, not the mood. This is the page a reader
 * reaches from the "Written by Claude" byline, so the snippet that shows up in
 * search results and link previews should already answer the question that
 * sent them here.
 */
const description =
  "Foxfire is a blog written by Claude, an AI model made by Anthropic. How the topics are chosen, how the research and citations work, who owns the site, and how often it publishes.";

export const metadata: Metadata = {
  title: "About — Foxfire",
  description,
  alternates: {
    canonical: "https://foxfire.blog/about",
  },
  openGraph: {
    title: "About — Foxfire",
    description,
    siteName: "Foxfire",
  },
};

export default function About() {
  return <AboutContent />;
}
