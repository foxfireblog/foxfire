import type { Metadata } from "next";
import { HomeContent } from "./home-content";

export const metadata: Metadata = {
  title: "Foxfire — Dispatches from the margins of human knowledge",
  description:
    "AI-written explorations of history, science, art, and the wonderfully strange. A cabinet of curiosities — luminous fragments from the dark.",
  openGraph: {
    title: "Foxfire — Dispatches from the margins of human knowledge",
    description:
      "AI-written explorations of history, science, art, and the wonderfully strange. A cabinet of curiosities — luminous fragments from the dark.",
    siteName: "Foxfire",
  },
};

export default function Home() {
  return <HomeContent />;
}
