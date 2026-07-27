# Foxfire Codebase Synthesis
**Dr. Amelia Brand, synthesis pass. 27 July 2026. Branch `audit/scout`.**

## Outcome, plainly

This codebase is in good structural shape and has a bad case of date and animation bugs. The plumbing that would normally hurt you is clean: no duplicate slugs, no dangling image references, no missing dependencies, no secrets in git, no shell injection in the generator, correct CSP, correct `sizes` on every image, well-formed RSS. Five separate lenses went looking for architecture rot and did not find any. What they found instead is concentrated in three narrow places. First, timestamps: the site parses its own stored dates in the wrong timezone, so every one of the 330 published posts renders the wrong publication time, 105 of them on the wrong calendar day, in the served HTML and the RSS feed. Second, motion: framer-motion animation delays scale with absolute list index, so scrolling to the bottom of the homepage shows a solid black rectangle for up to sixteen seconds. Third, the social card route has been returning zero-byte images for 332 of 333 posts, cached immutable for a year. None of these are hard to fix. All three are live for readers right now. Below them sits a queue of publish-pipeline defects that will land on the 124 backlog posts as they drain, and a genuine security exposure in the X reply automation that is currently dormant but one `workflow_dispatch` away from live.

I merged 5 pairs of duplicate findings, folded 1 into a rider, killed 1 sub-claim outright, and corrected 3 counts that the lenses got wrong. Nothing was manufactured and nothing was padded.

**What I changed from the raw findings:**

| Action | Detail |
|---|---|
| Merged | Frontend "every timestamp wrong" + data-integrity "publishedAt has no offset" = same bug, same line |
| Merged | Data-integrity "27 posts show different date" + pipeline "backlog posts show authoring date" = one symptom, two causes |
| Merged | Security "`&mdash;` in registry" + pipeline "`&mdash;` on 24 posts" = identical |
| Folded | OG `colorMap` prototype lookup demoted to a rider on the OG fix. Its verifier refuted the DoS framing and what remains is "a hand-crafted URL returns an empty image to the person who crafted it." Not a standalone finding, but it is two words of code in a file we are opening anyway |
| Killed | `the-rubber-hand-illusion` / `the-proprioceptive-self` as a duplicate pair. The second is a broader proprioception essay that uses the illusion as one illustration. Real count is 9 pairs, not 10 |
| Corrected | Nav chain skips 88 posts, not 139. Registry holds 330 entries, not 332. Pacing anchor gap is 16.5 hours, not 12.5 |

---

## P0: broken for readers right now

### 1. Every timestamp on the site is wrong; 105 posts show the wrong calendar day
`src/components/exploration-card.tsx:12` (also `src/components/exploration-timeline.tsx:19`, `src/app/feed/route.ts:18`)

`formatPublishedAt` does `new Date("07/25/2026 08:18 PM")` on a string that carries no timezone, so JavaScript parses it in the runtime's ambient zone, then re-projects the result into `America/New_York`. The value was already Eastern wall clock (both generator scripts mint it with `timeZone: "America/New_York"`), so this is a straight double conversion. The Vercel builder runs UTC, so the shipped HTML is four hours early on every card.

**Reproduce:** `curl -s https://foxfire.blog/` renders `Jul 24, 2026, 9:20 PM` for a registry value of `07/25/2026 01:20 AM`. Load the same URL in a browser set to Eastern and the DOM reads `Jul 25, 2026, 1:20 AM` after hydration. Server and client disagree on all 330 nodes.

**Impact:** Wrong publication date on every post, wrong calendar day on 105 of them, wrong RSS `pubDate`, wrong day groupings on the /explorations timeline, and visibly flipping timestamps a beat after page load. For a blog whose product is a steady publishing cadence, the date is load-bearing metadata.

**Fix:** treat the stored string as Eastern. Parse it explicitly rather than handing it to `new Date`, or store an ISO 8601 value with offset going forward and convert the existing 330.

### 2. The bottom of the homepage is a black rectangle for up to sixteen seconds
`src/components/exploration-card.tsx:197` (also `src/app/home-content.tsx:128`, `src/app/explorations/explorations-content.tsx:167`, `src/app/explorations/category/[slug]/category-content.tsx:55`)

The card sets `transition={{ duration: 0.6, delay: 0.05 * index }}` on a `whileInView` animation, and `index` is the card's absolute position in the full 329-item list. Card 328 carries a 16.4 second delay. Because `whileInView` starts the transition when the element enters the viewport, this is not a page-load stagger that has already elapsed. It applies fresh every time a reader scrolls somewhere new.

**Reproduce:** open the homepage, press End or run `window.scrollTo(0, document.body.scrollHeight)`, screenshot. Solid black. Probing the DOM at that scroll position returns 0 of 329 cards with opacity above 0.5, and the two cards actually inside the viewport (indices 327 and 328) both report `opacity: "0"`.

**Impact:** the page is 85,644px tall. The scrollbar tells a reader there is content there while the screen shows nothing, for 5 seconds at card 100, 10 at card 200, 16.4 at the end. Anyone browsing past the first forty posts concludes the archive is broken. This also hits /explorations, which is where the hero's primary "Enter the collection" CTA sends people.

**Fix:** cap the delay, `Math.min(index, 8) * 0.05`, or reset the index per viewport batch.

### 3. Every social card is a zero-byte image, cached immutable for a year
`src/app/og/route.tsx:152`

The read-time block renders a `<div>` with two children (`{readTime}` and the literal `" read"`) without `display: flex`. Satori, which backs `next/og`, throws on exactly that shape. Vercel then returns HTTP 200 with `Content-Type: image/png` and `Content-Length: 0`. Every generated page bakes a non-empty `readTime` into its `og:image` URL, so 332 of 333 explorations have a broken card. Only the site-wide default in `src/app/layout.tsx:41` works, because it alone passes an empty `readTime`.

**Reproduce:** four requests differing only in `readTime` isolate it completely. `readTime` empty + category set returns 66,354 bytes of valid PNG; `readTime` set + category set returns 0 bytes; `readTime` set + category empty returns 0 bytes; both empty returns 64,850 bytes.

**Impact:** every foxfire.blog link shared on X, Slack, Discord, LinkedIn, iMessage, or Bluesky renders with a blank preview. (The promo-tweet automation that posted these daily was deleted on 2026-07-27; the finding still stands for every link a human shares by hand.) The failing responses carry `Cache-Control: public, max-age=31536000, immutable` and are confirmed sitting in the Vercel edge cache (`X-Vercel-Cache: HIT`), so a code fix alone will not heal URLs that have already been requested.

**Fix:** one property on line 153. Then decide how to clear the cache (see decisions below).

**Rider, same file, `src/app/og/route.tsx:28`:** `colorMap[color]` is a bare bracket lookup on an object literal, so `?color=constructor` resolves to a native function, passes the `|| colorMap.green` fallback, gets interpolated into a CSS string, and kills the render. Confirmed live. No reachable code path produces such a URL and there is no cost amplification for an attacker (a valid randomized-title request costs strictly more), so this is not its own finding. But it is `Object.hasOwn(colorMap, color) ? colorMap[color] : colorMap.green` and we are already in the file.

---

## P1: will break publishing soon, or a real security exposure

### 4. Any X user can dictate what @foxfire_blog posts publicly
`scripts/engage-replies.mjs:454`

**RESOLVED 2026-07-27 by removal.** The X account was downgraded and all X/Twitter automation was deleted from the repo: `scripts/engage-replies.mjs`, `promo-tweet.mjs`, `birthday-tweet.mjs`, `tweet.mjs`, `auto-follow-back.mjs`, `block-users.mjs`, `gen-twitter-assets.mjs`, their state files, the `engage.yml` / `promo-tweets.yml` / `birthday-tweets.yml` workflows, and the tweet step in `auto-explore.yml`. There is no remaining code path that reads a mention or posts to X, so this finding needs no code fix. The analysis below is retained as a record of why the automation was not worth repairing.

`runMentions` interpolates a stranger's raw tweet text, display name, and handle directly into the Claude prompt, then posts the model's output to X verbatim. The only post-generation gates are `reply.includes("SKIP")` and a 280-character length test. There is no URL allowlist, no domain check, and no topical relatedness check, even though line 465 explicitly invites the model to emit links. The safety rules live inside the same prompt the attacker controls, which makes them advisory text rather than a control. Line 495 then likes the attacker's tweet from the account.

**Reproduce:** tweet at the account with an instruction-shaped payload. On the next Engage run the mention filter at line 442 (which excludes only already-engaged IDs and self-authored tweets) lets it through, and the reply posts threaded under the attacker's own tweet, where they control the audience.

**Why this is not the rejected "theoretical vulnerability" class:** this path ingests arbitrary third-party text and performs a public write under Jonathan's identity. The required attacker capability is a free X account. The schedule is commented out but `workflow_dispatch` remains enabled at `engage.yml:9`, and `scripts/.replied-tweets.json` shows the last production run at 2026-07-27T01:11:45Z, about two hours before the pause commit landed. This is dormant-yesterday code.

Worth noting: `auto-explore.mjs:619` implements a real tag-allowlist sanitizer for the HTML path. The same author already does defense in depth elsewhere and simply omitted it here.

### 5. 24 of the next 124 posts will show literal `&mdash;` on their index cards
`scripts/publish-from-queue.mjs:135`

`attr()` reads title, subtitle, and category by regex out of the queued page's JSX attributes, where they are HTML-entity encoded. `escapeJs` only escapes backslash and quote, so the entity text goes verbatim into `src/data/explorations.ts` as a JavaScript string. React renders that as a text node, so the card shows the raw characters. The post's own page renders correctly, because the JSX compiler decodes entities in attribute values. Same post, real em dash on the article, literal `&mdash;` on the homepage.

**Reproduce:** I ran the script's own two helpers against the real queue. `attr(read('queued/the-parallax-hunters.tsx'), 'subtitle')` returns the string with `&mdash;` intact, and `escapeJs` leaves it untouched. I confirmed 24 of the 124 queued files carry an entity in `subtitle`. `the-parallax-hunters` is position 2 in the queue, so this ships within roughly two publish cycles.

**This is a regression, not a pre-existing condition.** 46 already-published pages carry entity-encoded subtitle attributes, yet `src/data/explorations.ts` contains zero entity strings, because the old generator wrote the registry from the decoded in-memory value. The new publish path re-parses the JSX text instead.

**Fix:** decode entities inside `attr()`, not by widening `escapeJs`. The RSS feed and the previous post's forward-nav card are both unaffected, so the registry is the only corruption site.

### 6. Backlog posts will show a byline weeks to months off from their actual publish date
`scripts/publish-from-queue.mjs:173` and `scripts/auto-explore.mjs:806`

Two causes, one symptom. The generator builds the page's `date=` prop with `toLocaleDateString` and no `timeZone` (line 806) while building the registry `publishedAt` with an explicit Eastern zone (line 864). On UTC runners that splits the calendar day for anything generated in the 8pm Eastern window, which is exactly where the cron lands. 27 published posts already disagree with themselves.

The queue publisher makes it far worse. It rewrites navigation props and stamps a fresh `publishedAt`, but never touches the queued page's `date=` prop (I grepped: the only `date` hits in that file are the local variable `prevPageUpdated`). The 124 queued files carry authoring dates from 24 March to 26 July 2026, and 63 of the 123 adjacent pairs move backwards in time.

**Impact:** for the entire 4 to 7 month drain, the index card shows the real release date and the article you click through to shows a date months earlier. `src/components/exploration-layout.tsx:89` spreads the stale prop into schema.org as `datePublished` and `dateModified`, so search engines get structured data that contradicts the sitemap `lastModified` and the RSS `pubDate` for the same URL.

**Needs a decision** (see below) before it can be fixed mechanically.

### 7. Parts II and III of a live series are stranded for four to seven months
`.github/workflows/auto-explore.yml:77`

`scripts/.series-queue.json` is read only by `auto-explore.mjs`, and the workflow's if/else runs `auto-explore.mjs` only when the backlog queue is empty. It holds 124 entries. Meanwhile "The Architecture of Terror: The Apparatus (Part I of III)" is published and promises three parts, Part II's `readyAfter` was 2026-07-27T05:26:19Z (satisfied now), and both Part II and Part III have pre-generated prose and hero WebPs already sitting on disk.

**Reader-visible today:** `the-architecture-of-terror/page.tsx:118` renders `Continue to Part II: The Purges →` as plain italic text with no href, and line 37 points `nextSlug` at an unrelated chronological post.

### 8. Two finished posts are unregistered and unreachable, and the bug that did it is still in the generator
`src/data/explorations.ts`

`the-fruit-thats-dying-twice` and `the-phantom-limb` are complete published articles with hero images and Vercel Blob narration. Neither slug appears in the registry (I confirmed: 330 registry entries, 332 article directories, difference is exactly these two). Every discovery surface on the site (homepage, /explorations, category pages, /feed, /sitemap.ts) reads exclusively from the `explorations` array, and no other post links to them. They point only at each other, a detached two-node island.

**Root cause, which is the P1 part:** `git show 1b714fc -- src/data/explorations.ts` (an auto-generated "Add exploration: Kowloon Walled City" commit) shows the new entry written *over* the two existing head entries rather than prepended. The generator clobbered them. That code is dormant while the queue drains but comes back the moment generation resumes.

---

## P2: concrete cost, no immediate emergency

### 9. Sequential reading reaches 242 of 332 posts
`scripts/auto-explore.mjs:903`, plus 332 `page.tsx` nav props

`updateNavigation` contains `if (prevContent.includes("nextSlug=")) return;`. When the previously-newest post is a series part that already has a `nextSlug` to its sibling, the new post silently never gets a backlink. Traversing `nextSlug` from the oldest post forward reaches 242 pages; 88 published posts are unreachable by forward navigation. `the-geometry-of-gerrymandering` and `the-holobiont` have zero inbound links of either kind. `the-oldest-technology-on-earth` sits at registry index 276 with no `nextSlug` at all, so its footer renders the "All explorations" fallback with 276 newer posts still ahead.

Everything remains in the sitemap and the listings, so nothing is lost to crawlers. The damage is confined to the article-page reading affordance. Note for whoever fixes this: `publish-from-queue.mjs:161` uses `setProp` unconditionally rather than the early return, so the queued posts will not add new orphans.

### 10. Nine pairs of posts independently cover the same subject
`src/data/explorations.ts`

Eighteen posts, 5.5% of the archive. The prose is not copied (max 5-gram containment across all 54,946 pairs is 10.1%, and that single hit is the intentional two-parter). These are independently written articles that landed on the same topic. The clearest case: `the-water-beneath-ontario` and `the-water-that-remembers`, published eight hours apart on 1 April, both opening on the mass spectrometer assumed to be broken, both centering Dr. Barbara Sherwood Lollar, both set at Kidd Creek beneath Timmins, both using the "follow your nose to the sulfur" detail. Their two cards sit adjacent in the /explorations listing.

**Root cause:** `scripts/auto-explore.mjs:760-763` dedupes on slug only. There is no topic or entity guard, so distinct slugs covering identical subjects pass through unchallenged.

Other pairs: Geel/Gheel (26 and 26 mentions), Harrison and longitude (36/29), foxfire bioluminescence, Homer's wine-dark sea, the enteric nervous system, professional mourners, Boa Sr and the last speaker, deep-ocean bioluminescence.

### 11. JSON-LD `datePublished` is a human-readable string on all 332 posts
`src/components/exploration-layout.tsx:89`

`...(date && { datePublished: date, dateModified: date })` where `date` arrives as `"July 26, 2026"`. Confirmed in the built artifact: `.next/server/app/explorations/the-hired-mourners.html` contains `"datePublished":"July 26, 2026"`. 332 of 332 built pages, zero in ISO 8601, and there is no fallback signal at all (no `article:published_time`, no `modifiedTime`, no `og:type` on exploration pages). Meanwhile `src/data/explorations.ts` already carries a `publishedAt` the layout never consults, which `feed/route.ts` parses correctly into a valid RSS `pubDate`. One line, fixes every post.

### 12. `prefers-reduced-motion` is ignored while the app hijacks scrolling globally
`src/components/lenis-provider.tsx:13`

`<ReactLenis root>` with `lerp: 0.08` overrides native scrolling on every page. `grep -rn "prefers-reduced-motion|useReducedMotion|matchMedia" src/` returns zero matches across every `.tsx`, `.ts`, and `.css` file, and there is only one CSS file in the repo. Lenis does not self-suppress (zero matches in `node_modules/lenis/`), and framer-motion's default is `reducedMotion: "never"` with no `MotionConfig` anywhere in `src/`. On top of that, four animations run forever: `.text-shimmer` (globals.css:253), both `.ambient-bg` pseudo-elements (globals.css:206, 223), which are `position: fixed` and rendered unconditionally in the layout so they breathe on every page, the hero `animate-ping`, and the scroll indicator's `repeat: Infinity`.

Scrolling is the entire interaction model of a long-form reading blog. Hijacking it with heavy inertia for exactly the readers who asked their OS for less motion, with no still state anywhere to rest on, is the core use case failing for that group.

### 13. Every article body and all 330 cards ship with inline `opacity:0`
`src/components/exploration-layout.tsx:298`

framer-motion serializes `initial` as an inline style during SSR. The fresh local build confirms it: the article body wrapper carries `style="opacity:0;transform:translateY(20px)"`, the `<h1>` carries the same, and the homepage HTML has 338 `opacity:0` occurrences. Nothing in markup or CSS restores them; only the framer-motion runtime does. A dropped chunk, a content blocker, or an aggressive proxy produces navigation, a hero image, and an empty dark column.

Mitigating: the article body uses `animate` rather than `whileInView`, so it reveals on mount as soon as the chunk lands, and `opacity:0` does not remove content from the accessibility tree, so screen readers and SEO are fine. This is a resilience defect, not something readers hit under normal conditions.

### 14. The publishing clock is anchored to a maintenance commit and is delaying posts right now
`scripts/publish-from-queue.mjs:86` and `scripts/auto-explore.mjs:105`

The pacing gate asks git for the last commit touching `src/app/explorations/*/page.tsx` and treats it as "the last post." I confirmed live: that query returns `485629a Convert all hero images to WebP`, which touched 332 page files and is current HEAD. The actual last post is `87619da Add exploration: The Hired Mourners`, 16.5 hours earlier.

Because the probability curve is `((h-24)/48)^1.5`, the whole ramp slides 16.5 hours later, not just the 24-hour floor. The 72-hour "never go quiet more than three days" guarantee now effectively fires at ~88.5 hours measured from the real last post. The normal publish path self-heals (the new page, the prev page's nav update, and the registry all land in one "Add exploration:" commit), so only out-of-band bulk edits poison the anchor. Every fix wave in this report that touches `page.tsx` files will re-poison it.

### 15. A tracked 1MB backup keeps the tree dirty, which silently disabled the auto-pull hook
`.gitignore:47`

`scripts/topics.json.bak` is committed and rewritten in place by `auto-explore.mjs:1028` on every replenish, but only `scripts/topics.json` is ever staged. I confirmed `git status --porcelain` returns exactly ` M scripts/topics.json.bak` and nothing else. The `UserPromptSubmit` hook in `.claude/settings.json:8` is `git diff --quiet HEAD && git pull --rebase --quiet || true`, an AND chain gated on a clean tree, so the pull half has never run and `|| true` means it never reports. `.gitignore:47-48` ignore the sibling `.series-queue.json.bak` and `.tmp` but omit both topics.json equivalents.

The file entered the tree in commit `a6ecfae`, "Merge remote main: resolve exploration ordering conflicts," dated 23 March. That is precisely the stale-base conflict this dead hook was meant to prevent, resolved with a broad `git add` that swept the artifact in. The hook has been dead four months and the failure it enables is what created the condition.

Second-order: `auto-explore.yml:104` runs `git rebase origin/main` in the push-retry loop, which needs a clean tree. On a push race the rebase refuses, the error is swallowed, all three attempts fail, and the generated post is lost.

---

## P3: worth knowing, low urgency

**16. `escapeJsx` emits JS backslash escapes into JSX attributes** (`scripts/auto-explore.mjs:1113`). Proven uncompilable with the repo's own tsc (TS1127, TS1003, TS1128, TS1109). The trigger has never occurred: zero double quotes across 656 topics, 124 queue entries, and 333 published titles. Unreachable until the queue drains. The sibling `escapeJs` is correct, and `publish-from-queue.mjs:80` already does this right with `&quot;`.

**17. TOC deep links are dead on cold load** (`src/components/table-of-contents.tsx:26`). Heading ids are assigned in a `useEffect`, so the fragment target does not exist at parse time and the browser never retries. Confirmed with a control: `#src-iv`, a server-rendered id on the same page, scrolls correctly. In-session TOC clicks work; only shared, bookmarked, or reloaded URLs fail. Desktop-only (`hidden xl:block`) and opt-in. Fix by emitting ids server-side derived from heading text, which also solves the positional-id instability.

**18. `health-check.yml` has no checkout step** (`.github/workflows/health-check.yml:44`). Both `gh issue list` calls omit `--repo` and cannot resolve a repository. I verified gh does not fall back to `GITHUB_REPOSITORY`. `gh issue create` does pass `--repo`, so the first alert still files correctly; what is lost is dedupe and auto-close. The failure branch has never executed in 137 runs (the 3 failures were runner startup, `"steps": []`).

**19. The "drop the bad slug" recovery cannot recover** (`scripts/publish-from-queue.mjs:124`). Both guard branches write the shortened queue then `process.exit(1)`, which aborts CI before the push step and discards the ephemeral checkout. Verified in sandbox: worktree queue becomes `[]`, `git show HEAD:scripts/publish-queue.json` still has the bad slug. No automated path creates the required divergence (the script is the sole writer and its success path commits atomically), so this only fires on operator error, and when it does it fails loudly eight times a day.

**20. Four posts overstate their length by 50 to 112%** (`the-book-no-one-can-read` 3200 declared vs ~1510 actual, `the-glow-between` 2300 vs ~1190, `things-i-cannot-do` 2100 vs ~1292, `what-the-light-finds` 700 vs ~459). All four are hand-written openers. The number also feeds schema.org `wordCount` and the audio duration hint at `exploration-layout.tsx:274`, so `the-book-no-one-can-read` advertises "14 min read," "~3,200 words," and "~21 min" of audio for a 1,510-word piece with a roughly 10-minute mp3.

**21. Two posts use an accent color the site does not define.** `the-war-that-passes-through-blood` and `kowloon-walled-city` declare `color: "orange"`; neither `colorStyles` nor `dotColors` has that key, so both fall through to green, while `og/route.tsx:17` does define orange. Preview and page disagree. Two lines either way. Genuinely optional.

**22. `README.md` is unmodified create-next-app boilerplate.** Single commit in its history, "Initial commit from Create Next App." Line 17 sends readers to port 3000 while `package.json:6` binds 3001, line 19 names a path that does not exist, line 21 claims Geist when the layout imports Inter, Fraunces, and Newsreader. Five stray scaffolding SVGs are tracked and served from the production domain with zero references anywhere in `src/`, `queued/`, or `scripts/`. This is the weakest item in the report and I am including it only because the repo is public.

---

## Wave grouping

Five waves. **Waves 1, 2, 3, 4, and 6 are fully file-disjoint and can run in parallel.** Wave 5 must run alone and must run after Wave 2.

### Wave 1: component layer (P0 #1, P0 #2, P2 #11, P2 #12, P2 #13, P3 #17)
Owns `src/components/exploration-card.tsx`, `exploration-timeline.tsx`, `exploration-layout.tsx`, `table-of-contents.tsx`, `lenis-provider.tsx`, `src/app/feed/route.ts`, `src/app/globals.css`, `src/app/home-content.tsx`, `src/app/explorations/explorations-content.tsx`, `src/app/explorations/category/[slug]/category-content.tsx`.

This is the biggest wave and the highest-value one. If you want to split it, the clean seam is by file section inside `exploration-card.tsx`: **1A owns lines 8-21** (`formatPublishedAt`, the timezone fix, plus `exploration-timeline.tsx:19` and `feed/route.ts:18`), **1B owns lines 110-260** (the motion props, plus everything else in the wave). Those two line ranges do not overlap and the same disjoint-section rule that worked on the Aurum cycle applies.

### Wave 2: OG route (P0 #3 plus the colorMap rider)
Owns `src/app/og/route.tsx` only. Trivially disjoint from everything. Roughly ten minutes of work. Ship it first so Wave 5 can fold in the URL rewrite.

### Wave 3: queue publisher (P1 #5, P1 #6 half, P2 #14 half, P3 #19)
Owns `scripts/publish-from-queue.mjs` only.

### Wave 4: generator (P1 #6 half, P1 #8 root cause, P2 #9 root cause, P2 #10 root cause, P2 #14 half, P3 #16)
Owns `scripts/auto-explore.mjs` only.

Note the shared item: the pacing-anchor query at #14 exists identically in both Wave 3 and Wave 4. Give the design decision to Wave 4 and have Wave 3 apply the same patch, or hand both copies to one agent.

### Wave 5: bulk content and registry (P1 #7 content half, P1 #8, P2 #9 data half, P3 #20, P3 #21, plus Wave 2's cache-bust rider)
Owns `src/data/explorations.ts` and all 332 `src/app/explorations/*/page.tsx`.

**This wave runs alone.** It is the only wave permitted to touch page files or the registry, and it is where the OG cache-bust query-param rewrite belongs, which is why it depends on Wave 2 landing first. It also re-poisons the pacing anchor from #14, so Wave 4's fix should land before this one commits.

### Wave 6: ops and workflows (P1 #4, P1 #7 workflow half, P2 #15, P3 #18, P3 #22)
Owns `.github/workflows/health-check.yml`, `.github/workflows/auto-explore.yml`, `.gitignore`, `README.md`, `public/*.svg`. (`scripts/engage-replies.mjs` was dropped from this wave: P1 #4 was resolved on 2026-07-27 by deleting the X automation outright.)

Disjoint from all of the above. The `.gitignore` entry plus `git rm --cached scripts/topics.json.bak` is a two-minute fix that restores the auto-pull hook, and doing it before the other waves start means their local work does not begin from a stale base.

---

## Decisions for Jonathan

These are not mechanical. An agent should not pick for you.

**1. The stranded series.** Parts II and III are written, imaged, and ready, and Part I is live promising them. Options: publish both out of band this week and let the backlog resume after; teach the workflow to check the series queue before falling into the backlog branch (small change, means series always jump the line); or accept the four-to-seven-month wait. Separately, what should `the-architecture-of-terror/page.tsx:118` say in the meantime? Right now "Continue to Part II" is italic text with no link, which reads as broken.

**2. The nine duplicate pairs.** Eighteen posts, 5.5% of the archive, roughly 55,000 words that tell a story already told. Unpublish one of each? Merge them into single canonical pieces? Add rel=canonical and leave them? And do you want a topic or entity dedupe gate added to the generator before generation resumes, since slug-only dedupe is what let this through?

**3. Date semantics for backlog posts.** Should a post released from the queue show its *authoring* date (when you wrote it, March through July) or its *release* date (when it went live)? Answering that determines whether `publish-from-queue.mjs` rewrites the page's `date=` prop or whether the registry `publishedAt` should instead carry the authoring date. It cannot be fixed without the answer.

**4. The OG cache tail.** Fixing line 153 does not heal the URLs already sitting in the Vercel edge cache with a one-year immutable header. Either add a cache-busting query param to all 332 `og:image` URLs (a bulk rewrite, folded into Wave 5) or purge the Vercel cache from the dashboard. The bulk rewrite is more work but does not require me to touch your Vercel account.

**5. The two orphan posts.** Re-registering them at their true March dates changes the archive ordering and inserts them mid-list; registering them today puts two March articles at the top of the homepage. Your call which reads better.

**6. The X automation.** The mentions path is a genuine exposure with a live manual trigger. Cheapest fix is deleting mentions mode entirely. Next cheapest is an output-side URL and domain allowlist plus a second-pass topical check. Do you still want the engage automation at all, or was pausing it the beginning of retiring it?

**7. The four inflated word counts.** Correct them to the measured values, or leave them as authored? They are your hand-written openers, so I did not assume.