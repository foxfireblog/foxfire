import { ExplorationLayout } from "@/components/exploration-layout";

const colors = [
  {
    name: "Mummy Brown",
    hex: "#7B5B3A",
    years: "16th–20th century",
    story: `Exactly what it sounds like. From the sixteenth century onward, European painters used a rich, warm brown pigment made by grinding up Egyptian mummies — both human and feline. The bitumen and resins used in mummification produced a translucent, warm-toned paint prized for glazing shadows and flesh tones. Pre-Raphaelite painter Edward Burne-Jones, upon learning what was actually in his paint, reportedly held a funeral for his tube of Mummy Brown in his garden. The last known manufacturer, C. Roberson and Co. in London, ran out of mummy supply in 1964.`,
  },
  {
    name: "Tyrian Purple",
    hex: "#66023C",
    years: "1500 BCE–1453 CE",
    story: `The color of emperors, extracted from the hypobranchial gland of predatory sea snails — primarily Bolinus brandaris and Hexaplex trunculus. Each snail produces only a few drops of the precursor mucus, meaning thousands of snails were needed for a single garment. The Phoenician city of Tyre became wealthy on this trade; the stench of rotting snails was said to be overwhelming. The resulting dye was extraordinary: it didn't fade in sunlight but grew more vibrant. When Constantinople fell in 1453, the Byzantine dye works were destroyed, and the secret of production was effectively lost for centuries.`,
  },
  {
    name: "Scheele's Green",
    hex: "#4B8B3B",
    years: "1775–~1900",
    story: `Invented by Carl Wilhelm Scheele in 1775, this vivid green pigment was copper arsenite — beautiful, cheap to produce, and quietly deadly. It was used in everything: wallpaper, fabric, children's toys, candy, artificial flowers, and candles. In damp conditions, the arsenic could be released as a toxic gas. There is a persistent (though debated) theory that Napoleon Bonaparte was slowly poisoned by the green wallpaper in his room on St. Helena. Whether or not Napoleon was killed by his décor, countless others certainly were. Workers in wallpaper factories suffered terribly, and children in green-papered nurseries fell ill. The pigment was eventually replaced by the less toxic (but still arsenic-containing) Paris Green.`,
  },
  {
    name: "Indian Yellow",
    hex: "#E3A857",
    years: "15th–early 20th century",
    story: `For centuries, a warm, luminous yellow appeared in Indian and Dutch paintings. Its origins were mysterious until the late nineteenth century, when investigators traced it to the small town of Mirzapur in Bihar, India. There, cows were fed exclusively on mango leaves — a diet that made them malnourished but produced intensely yellow urine. The urine was collected, dried into balls called "purree," and exported. The process was cruel to the animals (mango leaves lack essential nutrients), and the British government banned it in the early 1900s on grounds of animal cruelty. No synthetic substitute captures exactly the same warm, translucent quality.`,
  },
  {
    name: "Dragon's Blood",
    hex: "#8B0000",
    years: "Ancient–present (rare)",
    story: `Despite its dramatic name, Dragon's Blood is a resin, not a fluid from mythical creatures — though the name itself tells you how people once perceived it. Sourced from several different trees and palms (most famously Dracaena cinnabari on the island of Socotra, whose trees look like they belong on another planet), the deep red resin has been used as a pigment, medicine, varnish, and incense for millennia. Roman gladiators may have used it to color their armor. It was a key ingredient in the varnish used by Stradivarius on his violins — or so the legend goes. The trees that produce the finest Dragon's Blood are now endangered, and genuine Socotran resin is exceptionally rare.`,
  },
  {
    name: "Lapis Lazuli Blue",
    hex: "#26619C",
    years: "6th century–1826 (as natural ultramarine)",
    story: `Not extinct, but functionally lost as a working pigment. Natural ultramarine was made by grinding lapis lazuli — a semi-precious stone mined almost exclusively in Badakhshan, Afghanistan. The extraction process was laborious: the stone was ground, mixed with wax, pine resin, and lye, then kneaded underwater for days to separate the blue particles from impurities. The result was a blue of extraordinary depth and permanence. It was more expensive than gold. Vermeer used it lavishly and may have driven his family into debt doing so. In 1826, a synthetic version (French ultramarine) was invented, and the natural pigment became a curiosity rather than a necessity.`,
  },
];

export default function LostColors() {
  return (
    <ExplorationLayout
      title="Lost Colors"
      subtitle="A visual elegy for pigments that no longer exist"
      category="Art & Chemistry"
      categoryColor="amber"
      imageSrc="/images/explorations/lost-colors.png"
      imageAlt="Still life of extinct pigments including Tyrian purple and lapis lazuli"
      readTime="11 min"
      prevSlug="the-glow-between"
      prevTitle="The Glow Between"
      nextSlug="what-the-light-finds"
      nextTitle="What the Light Finds"
    >
      <p>
        We think of color as permanent — as a property of the world rather
        than an artifact of chemistry and culture. But the history of
        pigment is a history of loss. Colors have been invented, traded
        across empires, used to paint masterpieces, and then quietly gone
        extinct — their sources exhausted, their methods forgotten, their
        ingredients banned.
      </p>

      <p>
        Each lost pigment carries a story that is equal parts chemistry,
        economics, cruelty, beauty, and accident. Here are six of them.
      </p>

      {/* Color entries */}
      <div className="mt-8 space-y-12 not-prose">
        {colors.map((color, i) => (
          <div key={color.name}>
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0">
                <div
                  className="color-swatch h-20 w-20 rounded-xl border border-white/5"
                  style={{
                    backgroundColor: color.hex,
                    boxShadow: `0 0 30px ${color.hex}33, 0 0 60px ${color.hex}1a`,
                  }}
                />
                <p className="mt-2 text-center font-mono text-[10px] tracking-wider text-muted/60">
                  {color.hex}
                </p>
              </div>
              <div className="flex-1">
                <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold text-foreground">
                  {color.name}
                </h3>
                <p className="mt-0.5 text-xs tracking-wider text-muted/60">
                  {color.years}
                </p>
                <p className="mt-3 font-[family-name:var(--font-serif)] text-sm leading-relaxed text-muted">
                  {color.story}
                </p>
              </div>
            </div>
            {i < colors.length - 1 && (
              <div className="mt-12 h-px bg-border" />
            )}
          </div>
        ))}
      </div>

      <div className="mt-16">
        <p>
          Every color on this list was once someone&apos;s livelihood, someone&apos;s
          obsession, someone&apos;s masterpiece. The Phoenicians who boiled
          sea snails for purple, the Indian cow-keepers collecting yellow
          urine in clay pots, the London colormen grinding mummies to
          powder — each participated in an economy of beauty that seems,
          from our distance, barely believable.
        </p>

        <p>
          We have synthetic replacements for most of these pigments now.
          They are cheaper, safer, and more consistent. But something is lost
          in the substitution — not the color itself, but the strangeness of
          its origin. The knowledge that beauty was once extracted from death,
          cruelty, and the deep earth, and that the paintings we admire in
          museums carry, in their very pigment, stories as vivid as anything
          depicted on the canvas.
        </p>
      </div>
    </ExplorationLayout>
  );
}
