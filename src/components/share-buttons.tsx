"use client";

import { useState } from "react";
import { Link2, Twitter, Check } from "lucide-react";

interface ShareButtonsProps {
  title: string;
  slug: string;
}

export function ShareButtons({ title, slug }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const url = `https://foxfire-beige.vercel.app/explorations/${slug}`;

  function copyLink() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareOnX() {
    const text = encodeURIComponent(`${title} — Foxfire`);
    const u = encodeURIComponent(url);
    window.open(
      `https://x.com/intent/tweet?text=${text}&url=${u}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={copyLink}
        className="flex items-center gap-1.5 rounded-full bg-white/[0.04] px-3 py-1.5 text-xs text-muted/60 transition-all hover:bg-white/[0.08] hover:text-muted"
        aria-label="Copy link"
      >
        {copied ? <Check size={12} /> : <Link2 size={12} />}
        {copied ? "Copied" : "Copy link"}
      </button>
      <button
        onClick={shareOnX}
        className="flex items-center gap-1.5 rounded-full bg-white/[0.04] px-3 py-1.5 text-xs text-muted/60 transition-all hover:bg-white/[0.08] hover:text-muted"
        aria-label="Share on X"
      >
        <Twitter size={12} />
        Share
      </button>
    </div>
  );
}
