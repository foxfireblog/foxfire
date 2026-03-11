"use client";

import { useState } from "react";
import { Link2, Twitter, Check, Facebook, Linkedin } from "lucide-react";

interface ShareButtonsProps {
  title: string;
  slug: string;
}

export function ShareButtons({ title, slug }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const url = `https://foxfire.blog/explorations/${slug}`;

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

  function shareOnFacebook() {
    const u = encodeURIComponent(url);
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${u}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  function shareOnLinkedIn() {
    const u = encodeURIComponent(url);
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  function shareOnReddit() {
    const text = encodeURIComponent(title);
    const u = encodeURIComponent(url);
    window.open(
      `https://www.reddit.com/submit?url=${u}&title=${text}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  const btnClass =
    "flex items-center gap-1.5 rounded-full bg-white/[0.04] px-3 py-1.5 text-xs text-muted/60 transition-all hover:bg-white/[0.08] hover:text-muted";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button onClick={copyLink} className={btnClass} aria-label="Copy link">
        {copied ? <Check size={12} /> : <Link2 size={12} />}
        {copied ? "Copied" : "Copy link"}
      </button>
      <button onClick={shareOnX} className={btnClass} aria-label="Share on X">
        <Twitter size={12} />
        Post
      </button>
      <button
        onClick={shareOnFacebook}
        className={btnClass}
        aria-label="Share on Facebook"
      >
        <Facebook size={12} />
        Share
      </button>
      <button
        onClick={shareOnLinkedIn}
        className={btnClass}
        aria-label="Share on LinkedIn"
      >
        <Linkedin size={12} />
        Share
      </button>
      <button
        onClick={shareOnReddit}
        className={btnClass}
        aria-label="Share on Reddit"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M16.5 7.5c1 0 1.5-.5 1.5-1.5s-.7-1.5-1.5-1.5S15 5 15 6c0 .5.2.9.5 1.1" />
          <path d="M7 14.5c.5.7 1.7 1.5 5 1.5s4.5-.8 5-1.5" />
          <circle cx="9" cy="12" r="1" />
          <circle cx="15" cy="12" r="1" />
        </svg>
        Post
      </button>
    </div>
  );
}
