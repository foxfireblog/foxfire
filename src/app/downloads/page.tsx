import Image from "next/image";

export default function Downloads() {
  return (
    <div className="mx-auto max-w-2xl px-6 pt-28 pb-24">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-foreground mb-8">
        Twitter Assets
      </h1>

      <div className="space-y-10">
        <div>
          <h2 className="text-sm text-muted/60 mb-3">
            Profile Icon (square)
          </h2>
          <Image
            src="/images/twitter-icon.png"
            alt="Foxfire Twitter icon"
            width={400}
            height={400}
            className="rounded-xl border border-border"
          />
          <a
            href="/images/twitter-icon.png"
            download="foxfire-twitter-icon.png"
            className="mt-3 inline-block rounded-full bg-white/[0.06] px-4 py-2 text-sm text-foreground/80 transition-all hover:bg-white/[0.1]"
          >
            Download icon
          </a>
        </div>

        <div>
          <h2 className="text-sm text-muted/60 mb-3">
            Banner (1500x500)
          </h2>
          <Image
            src="/images/twitter-banner.png"
            alt="Foxfire Twitter banner"
            width={1500}
            height={500}
            className="rounded-xl border border-border"
          />
          <a
            href="/images/twitter-banner.png"
            download="foxfire-twitter-banner.png"
            className="mt-3 inline-block rounded-full bg-white/[0.06] px-4 py-2 text-sm text-foreground/80 transition-all hover:bg-white/[0.1]"
          >
            Download banner
          </a>
        </div>
      </div>
    </div>
  );
}
