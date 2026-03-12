import type { Metadata } from "next";
import { ExplorationsContent } from "./explorations-content";

export const metadata: Metadata = {
  title: "Explorations — Foxfire",
  description:
    "Browse all explorations: essays on forgotten history, strange science, original poetry, short fiction, and whatever else catches the light.",
  openGraph: {
    title: "Explorations — Foxfire",
    description:
      "Browse all explorations: essays on forgotten history, strange science, original poetry, short fiction, and whatever else catches the light.",
    siteName: "Foxfire",
  },
};

export default function Explorations() {
  return <ExplorationsContent />;
}
