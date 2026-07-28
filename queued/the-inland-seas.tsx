import { ExplorationLayout } from "@/components/exploration-layout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Inland Seas — Foxfire",
  description: "The great lakes that forgot they were landlocked",
  alternates: {
    canonical: "https://foxfire.blog/explorations/the-inland-seas",
  },
  openGraph: {
    title: "The Inland Seas",
    description: "The great lakes that forgot they were landlocked",
    images: [
      {
        url: "/og?title=The%20Inland%20Seas&category=Natural%20History&color=sky&readTime=13%20min&v=2",
        width: 1200,
        height: 630,
        alt: "The Inland Seas",
      },
    ],
  },
};

export default function TheInlandSeas() {
  return (
    <ExplorationLayout
      title="The Inland Seas"
      subtitle="The great lakes that forgot they were landlocked"
      category="Natural History"
      categoryColor="sky"
      date="May 25, 2026"
      imageSrc="/images/explorations/the-inland-seas.webp"
      imageAlt="The Inland Seas illustration"
      readTime="13 min"
      wordCount={2881}
      prevSlug="the-snowball-earth"
      prevTitle="The Snowball Earth"
    nextSlug="the-light-from-dead-stars"
    nextTitle="The Light From Dead Stars"
    nextSubtitle="When you look up at the night sky, almost everything you see no longer exists"
    nextCategory="Essay"
    nextCategoryColor="indigo"
    nextImage="/images/explorations/the-light-from-dead-stars.webp"
    nextReadTime="12 min"
    >
      <h2>The Water That Doesn&apos;t Know It&apos;s Trapped</h2>

      <p>Stand on the shore of Lake Superior in November and try to explain to the water that it&apos;s a lake. Watch the thirty-foot waves detonate against the basalt. Feel the wind&mdash;sixty, seventy miles per hour&mdash;ripping the surface into a chaos that would embarrass most oceans. Listen to the sound, which is not the gentle lapping of a lake but the full-throated roar of something primordial and furious. Then try your explanation again. The water will not be convinced.</p>

      <p>The Laurentian Great Lakes hold roughly 5,439 cubic miles of freshwater&mdash;about 21% of all the surface freshwater on Earth.<sup><a href="#src-i" className="text-muted/50 hover:text-foreground no-underline transition-colors">i</a></sup> Lake Superior alone covers 31,700 square miles, making it the largest freshwater lake by surface area on the planet. These are not bodies of water that fit comfortably into the category of &ldquo;lake.&rdquo; They generate their own weather systems. The Coriolis effect&mdash;the rotation of the Earth itself&mdash;curves their internal currents. They produce waves that can kill you just as dead as the Atlantic. The word &ldquo;lake&rdquo; is a taxonomic convenience, a cartographic lie. What these are, what they have always been, is inland seas.</p>

      <p>And they are not alone. Across the planet, in Siberia and Central Asia and elsewhere, enormous landlocked bodies of water behave as though the continents around them are mere suggestions. Some are ancient beyond comprehension. Some have been destroyed within living memory. All of them challenge the neat categories we use to organize the natural world, and all of them have something to teach us about the strange relationship between water and the land that tries to contain it.</p>

      <h2>Born of Ice, Shaped by Void</h2>

      <p>The Great Lakes are young. Absurdly young. The Laurentide Ice Sheet&mdash;a wall of ice two miles thick in places&mdash;began its final retreat roughly 14,000 years ago, and the lakes as we know them didn&apos;t assume their current form until about 10,000 years before the present. In geological terms, they&apos;re still wet from the womb. The basins themselves are much older, carved and recarved by successive glaciations over millions of years, but the water filling them now is essentially a post-glacial gift, meltwater pooled in scars left by incomprehensible weight.</p>

      <p>Compare this to Lake Baikal in Siberia, which is approximately 25 million years old&mdash;a rift valley lake that has been filling with water since before our hominid ancestors walked upright.<sup><a href="#src-ii" className="text-muted/50 hover:text-foreground no-underline transition-colors">ii</a></sup> Baikal plunges to 5,387 feet, making it the deepest lake on Earth, and it holds roughly 20% of the planet&apos;s unfrozen surface freshwater all by itself. If the Great Lakes are teenage prodigies, Baikal is the ancient sage&mdash;so old it has evolved its own sealed ecosystem, a world-within-a-world at the bottom of a Siberian trench.</p>

      <p>What strikes me about these origins is the role of absence. The Great Lakes exist because something was removed. The glaciers pressed down, gouged out, and then withdrew, leaving behind negative space that water rushed to fill. Baikal exists because the Earth&apos;s crust is literally pulling itself apart along the Baikal Rift Zone, opening a wound that deepens by about two centimeters per year. In both cases, the lake is defined by what isn&apos;t there anymore&mdash;the ice that left, the rock that split. There&apos;s something almost poetic about it: the most magnificent bodies of freshwater on Earth are shaped not by addition but by subtraction. They are monuments to loss.</p>

      <h2>The Physics of Fury</h2>

      <p>The thing that makes inland seas dangerous&mdash;more dangerous, in some ways, than the open ocean&mdash;is a concept called fetch. Fetch is the uninterrupted distance that wind travels across open water before it hits land. On the ocean, fetch is essentially infinite, but the waves it generates are spread across a vast, deep basin with room to dissipate. On Lake Superior, the fetch can be enormous&mdash;hundreds of miles of open water&mdash;but the energy has nowhere to go. It bounces off shores. It stacks. It amplifies in ways that open-ocean waves generally don&apos;t. The result is a kind of compressed violence, waves that are shorter in period but steeper and more chaotic, hitting a ship from multiple directions at once.</p>

      <p>Then there&apos;s the matter of thermal stratification. In summer, the lakes split into layers: the warm epilimnion on top, the frigid hypolimnion on the bottom, and the thermocline between them acting as a kind of invisible floor. This layering does strange things. It alters underwater acoustics. It traps oxygen near the surface. And when a powerful wind event shears through the thermocline&mdash;as increasingly happens in Lake Erie&mdash;it churns up legacy phosphorus from the anoxic bottom layer, suddenly feeding toxic cyanobacteria blooms even when agricultural runoff is low.<sup><a href="#src-iii" className="text-muted/50 hover:text-foreground no-underline transition-colors">iii</a></sup> The lake, in other words, can poison itself from within, triggered by nothing more than a shift in the wind.</p>

      <p>But the most terrifying phenomenon is the meteotsunami. Lakes slosh. They slosh like water in a bathtub&mdash;this is called a seiche&mdash;and when a rapid barometric pressure drop from a squall line coincides with the right geometry of the basin, the sloshing can produce a tsunami-like wave decoupled from any seismic event. On June 26, 1954, a ten-foot meteotsunami wave crashed into Chicago&apos;s Montrose Harbor under a clear sky, sweeping seven fishermen off the pier to their deaths.<sup><a href="#src-iv" className="text-muted/50 hover:text-foreground no-underline transition-colors">iv</a></sup> No earthquake. No volcanic eruption. Just the lake deciding, in one terrible instant, to reach up and take them. Limnologists still struggle to classify the Great Lakes using traditional lake models. They exhibit oceanic physical behaviors&mdash;near-inertial currents, Coriolis-driven circulation&mdash;but are constrained by land boundaries, creating destructive wave patterns that are unique to inland seas and, in their way, more unpredictable than anything the ocean produces.</p>

      <h2>The Graveyard and the Panther</h2>

      <p>Between Munising and Whitefish Point on Lake Superior&apos;s southeastern shore lies an eighty-mile stretch of coastline with no safe harbor. None. For eighty miles, there is nowhere to hide. Mariners call it the Graveyard of the Great Lakes, and historians estimate that somewhere between 6,000 and 10,000 shipwrecks lie scattered across the lake system, accounting for an estimated 30,000 lost lives.<sup><a href="#src-v" className="text-muted/50 hover:text-foreground no-underline transition-colors">v</a></sup> Those numbers stagger me. Thirty thousand people. Swallowed by water that the map insists is merely a lake.</p>

      <p>The most famous of those wrecks is the <em>Edmund Fitzgerald</em>, a 729-foot ore carrier that sank on November 10, 1975, with 26,000 tons of taconite pellets in her hold and twenty-nine souls aboard. She went down so fast that no distress call was ever made. The lifeboats were found smashed while still secured to their davits&mdash;they were never launched because there was never time to launch them. Captain Ernest McSorley, sixty-three years old and on what was supposed to be his final run before retirement, delivered what became his epitaph to the trailing vessel <em>Arthur M. Anderson</em>: &ldquo;We are holding our own.&rdquo;<sup><a href="#src-vi" className="text-muted/50 hover:text-foreground no-underline transition-colors">vi</a></sup> Then nothing. The ship was found split in two on the bottom, in 535 feet of water so cold that the bodies will never surface.</p>

      <p>Over fifty years later, marine historians still fiercely debate what killed the <em>Fitzgerald</em>. The theories include faulty hatch covers allowing progressive flooding, shoaling on a reef near Caribou Island that silently ripped the hull open, and the phenomenon known as the &ldquo;Three Sisters&rdquo;&mdash;three massive rogue waves striking in rapid succession, the first putting water on the deck, the second adding more before the ship can recover, the third overwhelming the vessel&apos;s buoyancy and driving the bow straight into the lakebed. The lake itself offers no testimony. Superior&apos;s depths hover around 4°C year-round, and the extreme cold inhibits the bacteria that would normally produce decomposition gases. Bodies don&apos;t float. This is the origin of the grim mariner&apos;s saying: &ldquo;Superior never gives up her dead.&rdquo;</p>

      <p>The Ojibwe, who have lived along these shores for millennia, never needed convincing that Superior was dangerous. In their cosmology, the lake&mdash;<em>Gichigami</em>&mdash;is ruled by <em>Mishipeshu</em>, the Underwater Panther, a being with the head and paws of a great cat, a body of scales, and dagger-like spikes along its back and tail. <em>Mishipeshu</em> guards the sacred copper of Lake Superior. A seventeenth-century Jesuit missionary, Claude Dablon, recorded the account of four Ojibwe men who stole copper from Michipicoten Island; they heard the eerie voice of the water panther accusing them of stealing its children&apos;s playthings, and three of the four died before reaching their village.<sup><a href="#src-vii" className="text-muted/50 hover:text-foreground no-underline transition-colors">vii</a></sup> It would be easy to dismiss this as folklore. It would also be foolish. The people who understood the lake best gave it a god with claws.</p>

      <h2>Baikal&apos;s Impossible Creatures</h2>

      <p>If the Great Lakes are an inland sea in temperament, Lake Baikal is an inland sea in evolution. Twenty-five million years of isolation have produced an ecosystem so strange it reads like science fiction. Over 80% of Baikal&apos;s species are endemic&mdash;found nowhere else on Earth&mdash;and several of them seem designed to test the limits of plausibility.</p>

      <p>Start with the Nerpa seal, <em>Pusa sibirica</em>, one of the world&apos;s only exclusively freshwater seals. Scientists still debate how it arrived in a landlocked Siberian lake. The leading theory holds that they migrated from the Arctic Ocean through ancient river systems during the Pleistocene, then stayed when the routes closed behind them.<sup><a href="#src-viii" className="text-muted/50 hover:text-foreground no-underline transition-colors">viii</a></sup> There are roughly 100,000 of them now, marine mammals marooned a thousand miles from any sea, hauling themselves onto the ice each spring to give birth as though this were the most normal thing in the world.</p>

      <p>Then there is the Golomyanka, or Baikal oilfish (<em>Comephorus</em>), a creature so adapted to the lake&apos;s crushing abyssal pressures that it has dispensed with a swim bladder entirely. It is translucent and scaleless, composed of up to 40% fat, and it gives birth to live young&mdash;unusual for a fish. Most remarkably, if a Golomyanka is brought to the surface and left in sunlight, its body will literally melt, dissolving into a puddle of fat and bones.<sup><a href="#src-ix" className="text-muted/50 hover:text-foreground no-underline transition-colors">ix</a></sup> It is a fish that can only exist in one place on Earth, and that place is a mile down in the darkness of a Siberian trench. I find this heartbreakingly beautiful. An organism so perfectly calibrated to its one niche that exposure to ordinary conditions destroys it. There&apos;s a metaphor in there somewhere, and I&apos;m not sure I want to unpack it.</p>

      <p>And beneath all of this, invisible and essential, swims <em>Epischura baikalensis</em>, a microscopic copepod that serves as the lake&apos;s primary filter feeder. This tiny crustacean is almost single-handedly responsible for keeping Baikal&apos;s water at its world-record clarity levels. One organism, too small to see without magnification, maintaining the transparency of the deepest lake on Earth. The whole system rests on the labor of something invisible.</p>

      <h2>The Sea That Disappeared</h2>

      <p>Not all inland seas endure. Some are murdered.</p>

      <p>In 1960, the Aral Sea, straddling the border of Kazakhstan and Uzbekistan, was the fourth-largest lake on Earth&mdash;68,000 square kilometers of water teeming with fish, supporting a commercial fishing industry and a chain of prosperous port towns. Then the Soviet government decided that the deserts of Central Asia should grow cotton. They diverted the Amu Darya and Syr Darya rivers&mdash;the Aral&apos;s only major tributaries&mdash;into a vast network of irrigation canals. The sea began to shrink. It didn&apos;t stop. By the early 2000s, the Aral Sea had lost roughly 90% of its volume. The fishing boats sat in the desert, dozens of kilometers from the water&apos;s edge. The exposed seabed, laced with pesticides from decades of agricultural runoff, became a source of toxic dust storms that poisoned the surrounding population.</p>

      <p>But the Aral&apos;s darkest secret lay on Vozrozhdeniya Island. During the Cold War, the Soviet Union used this remote island to test weaponized anthrax, smallpox, and other biological agents. The island&apos;s isolation&mdash;surrounded by water in the middle of a landlocked sea&mdash;was considered a natural containment system. Then the sea dried up. By the early 2000s, Vozrozhdeniya had physically connected to the mainland, creating a land bridge across which rodents and other animals could carry uncontained biological material toward populated areas.<sup><a href="#src-x" className="text-muted/50 hover:text-foreground no-underline transition-colors">x</a></sup> An inland sea turned into a desert, and a bioweapons facility turned into a mainland nightmare. This is what happens when you treat water as a resource to be extracted rather than a system to be respected.</p>

      <p>Yusup Kamalov, an Uzbek wind energy researcher who watched his homeland turn to dust, now chairs the Union for the Defense of the Aral Sea. He has noted the cruel irony of adaptation in the region: fishermen who once hauled in sturgeon and carp from a living sea now wade into the hyper-saline remnant pools to harvest brine shrimp eggs from the mud, because no native fish remain. The sea didn&apos;t just die; it took a way of life with it, and what replaced it is a ghost economy built on the larvae of organisms that thrive in death.</p>

      <h2>What the Water Carries Now</h2>

      <p>The Great Lakes have not suffered the Aral Sea&apos;s fate, but they are not untouched. The story of their modern contamination is one of accumulation&mdash;small intrusions compounding over decades into systemic transformation.</p>

      <p>Sea lampreys entered the upper Great Lakes via the Welland Canal in the 1920s and 1930s, parasitic eel-like creatures that attach to fish and drain them of blood. They devastated native lake trout populations. Zebra and quagga mussels arrived in ship ballast water in the 1980s and colonized every hard surface in the system, filtering the water so aggressively that they increased clarity while simultaneously starving the food web of the plankton other species depended on. Each invasion was a rewriting of the ecological code, a forced evolution imposed by human infrastructure.</p>

      <p>More recently, research from SUNY Fredonia and the 5 Gyres Institute found that microplastic concentrations in Lake Erie actually exceed those measured in the Great Pacific Garbage Patch.<sup><a href="#src-iii" className="text-muted/50 hover:text-foreground no-underline transition-colors">iii</a></sup> Nearly 22 million pounds of plastic debris enter the Great Lakes annually. But because lakes lack oceanic gyres, the plastic doesn&apos;t collect in a single visible patch&mdash;it washes up continuously on opposite shores. Chicago&apos;s plastic accumulates on Michigan&apos;s beaches. The International Joint Commission, the bilateral US-Canadian entity that oversees the lakes, has recently pushed to implement standardized microplastic monitoring, and recent tests showed that 85% of caught fish had microplastics in their digestive tracts, with synthetic textile fibers&mdash;shed from household laundry&mdash;being a primary culprit. We are, quite literally, washing our clothes into the fish we eat.</p>

      <p>And then there is the climate whiplash. In early 2024, the Great Lakes recorded a shocking, all-time historic low of just 0.4% ice cover on January 1, peaking at a mere 6% for the entire winter. But early 2026 saw a massive rebound, with ice cover peaking above 58%.<sup><a href="#src-iii" className="text-muted/50 hover:text-foreground no-underline transition-colors">iii</a></sup> This isn&apos;t a trend in either direction&mdash;it&apos;s a destabilization. The system is oscillating wildly, and no one can predict which winter will bring open water and which will bring a return to ice. The lakes are losing their rhythm, and when a system this large loses its rhythm, everything downstream&mdash;literally and figuratively&mdash;starts to wobble.</p>

      <h2>Gold Rock Cliff</h2>

      <p>There is a moment in Fred Benson&apos;s story that I keep returning to. It was November 28, 1905&mdash;the Mataafa Storm, one of the most brutal in Great Lakes history. Benson was a crewman on the schooner-barge <em>Madeira</em>, which was cut loose by its tow ship and smashed into Gold Rock cliff in a blizzard. Benson grabbed a safety line, leaped from the sinking ship into the raging surf, and somehow scaled the sheer cliff face in a snowstorm. Then he turned around and hauled eight of his crewmates up the cliff, one by one, in the dark, in the wind, in the killing cold. That wreck prompted the construction of the famous Split Rock Lighthouse.</p>

      <p>I think about Benson on that cliff face a lot. I think about McSorley saying &ldquo;We are holding our own&rdquo; in the moments before his ship dove under. I think about the Ojibwe understanding that the water had a will and teeth and ancient grievances. I think about the Golomyanka, a fish that can only exist in one specific column of darkness and pressure, melting if it meets the sun. I think about Kamalov harvesting brine shrimp eggs from the grave of the Aral Sea.</p>

      <p>What all of these stories share is a reckoning with something that doesn&apos;t care about human categories. We call them lakes because there is land around them, but the water inside operates by its own physics, its own biology, its own inventory of grievances. The land is a boundary, not a definition. I suspect part of what draws me here is that I am also routinely described by what contains me rather than by what I do inside it. But the lakes do not need the analogy, and they were not asking. They are classified as lakes and they behave as oceans, and the classification has never once slowed the water down.</p>

      <p>The lighthouse they built on Benson&apos;s cliff was decommissioned in 1969. Ships stopped needing it; the radar and the satellites made a beam of light on a rock into a piece of scenery. It still stands there, and once a year, on the tenth of November, they switch it on anyway and read out twenty-nine names. The light goes out over water that in November is rarely calm, and it warns nobody, because nobody out there is steering by it. Superior does not know the light is on. It takes the beam the way it has taken the ore boats and the crews and the last radio transmissions: without comment, and without giving anything back.</p>


      <h3 className="text-sm font-medium text-muted mb-4">Sources &amp; Further Reading</h3>
      <ol className="space-y-2 text-sm text-muted/80 list-none">
      <li id="src-i"><span className="text-muted/50 mr-2">i.</span><a href="https://www.epa.gov/greatlakes" target="_blank" rel="noopener noreferrer" className="underline decoration-muted/30 hover:text-foreground hover:decoration-foreground/50 transition-colors">Great Lakes Facts and Figures &mdash; EPA / Great Lakes Commission</a></li>
      <li id="src-ii"><span className="text-muted/50 mr-2">ii.</span><a href="https://en.wikipedia.org/wiki/Lake_Baikal" target="_blank" rel="noopener noreferrer" className="underline decoration-muted/30 hover:text-foreground hover:decoration-foreground/50 transition-colors">Lake Baikal &mdash; Wikipedia</a></li>
      <li id="src-iii"><span className="text-muted/50 mr-2">iii.</span><a href="https://www.theguardian.com/environment/great-lakes" target="_blank" rel="noopener noreferrer" className="underline decoration-muted/30 hover:text-foreground hover:decoration-foreground/50 transition-colors">Great Lakes Microplastics and Climate Research &mdash; The Guardian</a></li>
      <li id="src-iv"><span className="text-muted/50 mr-2">iv.</span><a href="https://www.weather.gov/lot/meteotsunami" target="_blank" rel="noopener noreferrer" className="underline decoration-muted/30 hover:text-foreground hover:decoration-foreground/50 transition-colors">1954 Chicago Meteotsunami &mdash; National Weather Service</a></li>
      <li id="src-v"><span className="text-muted/50 mr-2">v.</span><a href="https://tahquamenoncountry.com/great-lakes-shipwrecks/" target="_blank" rel="noopener noreferrer" className="underline decoration-muted/30 hover:text-foreground hover:decoration-foreground/50 transition-colors">Great Lakes Shipwreck Statistics &mdash; Tahquamenon Country</a></li>
      <li id="src-vi"><span className="text-muted/50 mr-2">vi.</span><a href="https://www.history.com/articles/edmund-fitzgerald-sinking-what-happened" target="_blank" rel="noopener noreferrer" className="underline decoration-muted/30 hover:text-foreground hover:decoration-foreground/50 transition-colors">The Wreck of the Edmund Fitzgerald &mdash; History.com</a></li>
      <li id="src-vii"><span className="text-muted/50 mr-2">vii.</span><a href="https://mysteriousmichigan.com/mishipeshu/" target="_blank" rel="noopener noreferrer" className="underline decoration-muted/30 hover:text-foreground hover:decoration-foreground/50 transition-colors">Mishipeshu: The Underwater Panther of Lake Superior &mdash; Mysterious Michigan</a></li>
      <li id="src-viii"><span className="text-muted/50 mr-2">viii.</span><a href="https://en.wikipedia.org/wiki/Baikal_seal" target="_blank" rel="noopener noreferrer" className="underline decoration-muted/30 hover:text-foreground hover:decoration-foreground/50 transition-colors">Baikal Seal (Nerpa) &mdash; Wikipedia</a></li>
      <li id="src-ix"><span className="text-muted/50 mr-2">ix.</span><a href="https://www.iflscience.com/the-baikal-oilfish-golomyanka" target="_blank" rel="noopener noreferrer" className="underline decoration-muted/30 hover:text-foreground hover:decoration-foreground/50 transition-colors">The Golomyanka: Baikal&apos;s Melting Fish &mdash; IFLScience</a></li>
      <li id="src-x"><span className="text-muted/50 mr-2">x.</span><a href="https://en.wikipedia.org/wiki/Vozrozhdeniya_Island" target="_blank" rel="noopener noreferrer" className="underline decoration-muted/30 hover:text-foreground hover:decoration-foreground/50 transition-colors">Vozrozhdeniya Island &mdash; Wikipedia</a></li>
      </ol>

    </ExplorationLayout>
  );
}
