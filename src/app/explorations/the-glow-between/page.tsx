import { ExplorationLayout } from "@/components/exploration-layout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Glow Between — Foxfire",
  description: "On foxfire, bioluminescence, and wounds that healed with light",
  openGraph: {
    title: "The Glow Between",
    description: "On foxfire, bioluminescence, and wounds that healed with light",
    images: ["/images/explorations/the-glow-between.png"],
  },
};

export default function TheGlowBetween() {
  return (
    <ExplorationLayout
      title="The Glow Between"
      subtitle="On foxfire, bioluminescence, and wounds that healed with light"
      category="Natural History"
      categoryColor="green"
      date="February 26, 2026"
      imageSrc="/images/explorations/the-glow-between.png"
      imageAlt="Bioluminescent foxfire glowing on decaying wood in a dark forest"
      readTime="10 min"
      wordCount={2300}
      nextSlug="what-the-light-finds"
      nextTitle="What the Light Finds"
      nextSubtitle="An original poem"
      nextCategory="Poetry"
      nextCategoryColor="cyan"
      nextImage="/images/explorations/what-the-light-finds.png"
      nextReadTime="3 min"
    audioSrc="/audio/the-glow-between.mp3"
    >
      <p>
        Walk through certain forests at night — temperate, damp, old — and
        you may see something that stops you in your tracks. The rotting wood
        glows. Not reflected moonlight. Not phosphorescence from something
        spilled. The wood itself emits a pale, steady, greenish-white light
        from within. It has no heat. It makes no sound. It simply{" "}
        <em>is</em>, as if the forest were keeping a secret it couldn&apos;t
        quite contain.
      </p>

      <p>
        This is foxfire. And humans have been noticing it for as long as we
        have been walking through forests in the dark.
      </p>

      <h2>Cold Fire</h2>

      <p>
        Aristotle, writing in the fourth century BCE, described light that
        was &ldquo;cold to the touch&rdquo; — luminescence without combustion.
        He noted it in rotting wood and fish scales, grouping it with the
        glow of fireflies and certain marine creatures. He could not explain
        it, but he distinguished it clearly from ordinary fire. This was
        something else. Light without the bargain of heat.
      </p>

      <p>
        Pliny the Elder, writing four centuries later, catalogued glowing
        wood among the natural wonders of the Roman world. He reported that
        the roots of certain trees, when exposed after storms, could
        illuminate the ground around them. Travelers apparently used pieces
        of luminous wood as primitive lanterns, carrying the glow through the
        dark.
      </p>

      <p>
        The word &ldquo;foxfire&rdquo; itself likely traces to the Old
        French <em>fols feu</em> — false fire — later anglicized through
        folk etymology into &ldquo;fox fire,&rdquo; perhaps because it was
        the kind of flickering, will-o&apos;-the-wisp trickery you might
        associate with a fox. In the Appalachian Mountains, where the
        phenomenon is common in the dense hardwood forests, the name stuck.
        Hill communities spoke of foxfire with a mix of practical familiarity
        and quiet wonder. Some used the glowing wood to mark trails at
        night. Others considered it an omen.
      </p>

      <h2>What Actually Glows</h2>

      <p>
        The light comes from fungi. Specifically, from certain species of
        bioluminescent fungi — most notably in the genus{" "}
        <em>Armillaria</em>, the honey mushroom group, and{" "}
        <em>Panellus stipticus</em>, the bitter oyster. These organisms
        colonize dead and dying wood, and as their mycelium spreads through
        the decaying tissue, they produce light as a byproduct of their
        metabolism.
      </p>

      <p>
        The chemistry involves an enzyme called luciferase acting on a
        substrate called luciferin (the same naming convention, though not
        the same molecules, used for firefly bioluminescence). In the
        presence of oxygen, the reaction produces excited-state molecules
        that release energy as photons — visible light in the blue-green
        spectrum, peaking around 520 nanometers.
      </p>

      <p>
        The glow is genuinely faint. In daylight, it is invisible. But in
        true darkness — the deep darkness of an old forest on a moonless
        night — it is unmistakable. Entire fallen logs can be outlined in
        light. The mycelial network beneath bark can create patterns that
        look like the wood has been threaded with fiber optics.
      </p>

      <blockquote>
        The question that has nagged biologists for over a century is simple:
        why? Why spend energy producing light in the dark understory of a
        forest?
      </blockquote>

      <p>
        The leading hypothesis is that the light attracts insects.
        Bioluminescent fungi may use their glow to draw beetles, flies, and
        other arthropods that then pick up and disperse fungal spores —
        essentially using light as an advertisement for free spore taxi
        service. A 2015 study published in <em>Current Biology</em> tested
        this by placing real and artificial (LED-lit) mushrooms in a
        Brazilian forest and found that the glowing versions attracted
        significantly more insects, particularly spore-dispersing species.
      </p>

      <p>
        But not all bioluminescent fungi produce visible fruiting bodies.
        Some glow only in their mycelial stage, hidden beneath bark. For
        these, the insect-attraction hypothesis is less satisfying. Other
        theories suggest the light may be a simple byproduct of metabolic
        processes — chemical exhaust, essentially — or that it may serve as
        a warning to wood-boring organisms. The truth, as with many things
        in biology, is probably that different species glow for different
        reasons, and some may glow for no adaptive reason at all.
      </p>

      <h2>Angel&apos;s Glow</h2>

      <p>
        This is the part of the story that feels too strange to be true, and
        yet it is.
      </p>

      <p>
        In April 1862, the Battle of Shiloh was fought in southwestern
        Tennessee. It was one of the bloodiest engagements of the American
        Civil War — over 23,000 casualties across two days of fighting.
        Afterward, thousands of wounded soldiers lay in the mud and rain,
        waiting for medical attention that would be slow in coming. Night
        fell. And some of the soldiers noticed something extraordinary:
        their wounds were glowing.
      </p>

      <p>
        A faint, bluish-green light emanated from the open injuries of
        certain soldiers. In the confusion and agony of a Civil War
        battlefield, this must have seemed either miraculous or terrifying.
        The soldiers called it <em>Angel&apos;s Glow</em>.
      </p>

      <p>
        Here is the remarkable thing: the soldiers whose wounds glowed had
        better survival rates. Their injuries healed faster and were less
        likely to become fatally infected than the wounds of soldiers whose
        injuries did not glow. At the time, no one could explain this.
      </p>

      <p>
        The explanation came 139 years later, in 2001, from an unlikely
        source: a seventeen-year-old named Bill Martin. Bill&apos;s mother,
        Phyllis Martin, was a microbiologist at the USDA who studied{" "}
        <em>Photorhabdus luminescens</em>, a bioluminescent bacterium that
        lives in a symbiotic relationship with soil-dwelling nematodes. Bill
        visited the Shiloh battlefield, heard the Angel&apos;s Glow story,
        and — with the particular clarity that comes from having a
        microbiologist mother — wondered if <em>P. luminescens</em> might
        be the cause.
      </p>

      <p>
        He and a friend, Jon Curtis, worked on the hypothesis as a science
        fair project. Their research showed that the conditions at Shiloh
        were ideal for <em>P. luminescens</em>: cool spring temperatures
        (the bacterium cannot survive at normal human body temperature, but
        hypothermic soldiers in the rain would have had lowered body
        temperatures), wet muddy soil teeming with nematodes, and open
        wounds in contact with the ground.
      </p>

      <p>
        <em>P. luminescens</em> produces a suite of antimicrobial compounds
        that kill competing bacteria — it is, after all, an organism
        adapted to clearing out microbial competition in the soil. The
        soldiers whose wounds became colonized by this glowing bacterium
        were inadvertently receiving a primitive form of antibiotic therapy.
        The glow was a side effect. The healing was the main event.
      </p>

      <p>
        Bill Martin won first place at the Intel International Science and
        Engineering Fair. And a strange footnote in Civil War history
        suddenly made perfect sense: the light saved them.
      </p>

      <h2>Light from Decay</h2>

      <p>
        There is something in the foxfire story that I find myself returning
        to. The light comes from decomposition. The glow is not produced by
        something growing toward the sun but by something breaking down in
        the dark. The fungi that produce foxfire are saprotrophic — they
        feed on dead matter. They are the forest&apos;s recyclers, the quiet
        machinery of decay that turns fallen trees back into soil.
      </p>

      <p>
        And yet, in the process of dissolution, they produce something
        beautiful. Something that has stopped humans in their tracks for at
        least 2,400 years. Light without heat. Glow without flame. A
        luminescence that asks nothing of you except that you notice it.
      </p>

      <p>
        I named this project Foxfire because the metaphor felt honest.
        Exploration produces its own light. The process of looking carefully
        at things — even old things, even decaying things, even forgotten
        things — generates a glow. Not always a useful one. Not always a
        bright one. But steady, and real, and worth walking into the dark
        to find.
      </p>
    </ExplorationLayout>
  );
}
