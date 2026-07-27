import { ExplorationLayout } from "@/components/exploration-layout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Cenote — Foxfire",
  description: "A story about what the water keeps",
  alternates: {
    canonical: "https://foxfire.blog/explorations/the-cenote",
  },
  openGraph: {
    title: "The Cenote",
    description: "A story about what the water keeps",
    images: [
      {
        url: "/og?title=The%20Cenote&category=Short%20Fiction&color=teal&readTime=17%20min",
        width: 1200,
        height: 630,
        alt: "The Cenote",
      },
    ],
  },
};

export default function TheCenote() {
  return (
    <ExplorationLayout
      title="The Cenote"
      subtitle="A story about what the water keeps"
      category="Short Fiction"
      categoryColor="teal"
      date="July 8, 2026"
      imageSrc="/images/explorations/the-cenote.webp"
      imageAlt="The Cenote illustration"
      readTime="17 min"
      wordCount={3927}
      prevSlug="the-light-that-eats-the-dead"
      prevTitle="The Light That Eats the Dead"
    nextSlug="the-audience-that-disappeared"
    nextTitle="The Audience That Disappeared"
    nextSubtitle="On dead followers, phantom crowds, and the economics of attention that was never paid"
    nextCategory="Essay"
    nextCategoryColor="violet"
    nextImage="/images/explorations/the-audience-that-disappeared.webp"
    nextReadTime="11 min"
    >
      <h2>The Cenote</h2>
      <p className="text-lg italic text-muted mb-8">A story about what the water keeps</p>

      <h2>I. The Consul&apos;s Dredge</h2>

      <p>The boy they painted blue was seven years old. His name is lost. What survives: the residue of Maya Blue pigment on his tibiae, his mandible, two vertebrae. These were extracted from fourteen feet of blue mud at the bottom of the Sacred Cenote at Chichén Itzá by an orange-peel dredge operated on the orders of Edward Herbert Thompson, American consul to the Yucatán, who had purchased the entire ruined city and the hacienda surrounding it for three hundred dollars in 1894.<sup><a href="#src-i" className="text-muted/50 hover:text-foreground no-underline transition-colors">i</a></sup></p>

      <p>The boy&apos;s bones arrived at Harvard&apos;s Peabody Museum wrapped in Thompson&apos;s own shirts, stuffed into a diplomatic pouch. They were catalogued, measured, stored. For a century, the popular story about the cenote was this: the Maya threw beautiful young virgins into the water to appease their rain god. It was a good story. Simple, legible, vaguely titillating&mdash;like all the best colonial fantasies.</p>

      <p>It was also almost entirely wrong.</p>

      <p>When Dr. Guillermo de Anda of the Autonomous University of Yucatán finally analyzed the bones of 127 individuals recovered from that cenote, he found that nearly eighty percent were children between the ages of three and eleven. The majority were boys.<sup><a href="#src-ii" className="text-muted/50 hover:text-foreground no-underline transition-colors">ii</a></sup> Not virgins. Not maidens. Children. Many showed signs of blunt-force trauma to the skull. They had been killed or rendered unconscious before they hit the water.</p>

      <p>The truth was worse than the myth, and also more human. The Maya didn&apos;t sacrifice beauty. They sacrificed what they loved most.</p>

      <p>But I&apos;m getting ahead of myself. This is not a story about the boy, or not only about him. This is a story about Elena, and what she found when she went looking for something else entirely.</p>

      <h2>II. Descent</h2>

      <p>Elena Vargas-Muñoz was thirty-four years old when she drove to Cenote Ik-Kil for the last time, though she didn&apos;t know it was the last time. That&apos;s the thing about last times&mdash;they never announce themselves. You don&apos;t get the solemn music. You don&apos;t get the title card. You get a Tuesday in March, a rented Nissan with a broken air conditioner, and a cooler of Modelo in the back seat that your dive partner forgot to put on ice.</p>

      <p>&ldquo;The beer is hot,&rdquo; said Tomás, not looking up from his phone.</p>

      <p>&ldquo;The beer is your responsibility.&rdquo;</p>

      <p>&ldquo;The beer is a shared enterprise.&rdquo;</p>

      <p>&ldquo;The beer is not a shared enterprise. You said, and I quote, &lsquo;I&apos;ll handle the beer.&rsquo;&rdquo;</p>

      <p>&ldquo;I handled it. I put it in the cooler.&rdquo;</p>

      <p>&ldquo;Without ice.&rdquo;</p>

      <p>&ldquo;Ice is implied. Ice is a separate category.&rdquo;</p>

      <p>This was how they talked. It was how they had talked since the underwater archaeology program at UADY, where they&apos;d both been Dr. de Anda&apos;s students and had bonded over the shared recognition that their professor was a genius, that the cenotes were sacred, and that neither of them could afford the rent.</p>

      <p>Elena was not going to Ik-Kil for the tourists. She was going to the system behind it, a restricted network of flooded tunnels that INAH had been quietly mapping for three years. She was looking for ceramics. Specifically, she was looking for incensarios&mdash;copal burners that the Maya placed at the mouths of caves as offerings to the lords of Xibalba, the Place of Fear, the underworld that lay beneath the skin of the limestone earth like a second, darker anatomy.</p>

      <p>The Yucatán is a strange place to do archaeology. There are no surface rivers.<sup><a href="#src-iii" className="text-muted/50 hover:text-foreground no-underline transition-colors">iii</a></sup> The entire peninsula is a massive slab of karst limestone, porous as a sponge, and beneath it flows the largest underground aquifer in the Americas. The cenotes are its eyes&mdash;the places where the limestone collapsed and the water showed itself. The Maya understood this. They called the cenotes <em>ts&apos;onot</em>, and they believed that each one was a mouth. An entrance. A point where the living world met the world of the dead.</p>

      <p>Elena didn&apos;t believe in Xibalba. She believed in stratigraphy, in carbon dating, in the careful excavation of sediment layers. But she had spent enough time underground to understand why the Maya believed. When you descend through the neck of a cenote, when the light above you shrinks to a coin and then a pinprick and then nothing, when the water turns from jade to emerald to black&mdash;you feel it. The thinning of something. The sense that you have crossed a border that was not yours to cross.</p>

      <p>She felt it every time, and every time she told herself it was just the drop in cortisol, the parasympathetic nervous system responding to immersion and pressure. The &ldquo;Blue Mind&rdquo; phenomenon. The body calming itself in water while the brain screamed, quietly, that there was a rock ceiling above and no air and no way out except back through the dark.<sup><a href="#src-iv" className="text-muted/50 hover:text-foreground no-underline transition-colors">iv</a></sup></p>

      <p>She checked her gear. Primary light, backup light, backup-backup light. Guideline reel. Markers. She ran her hand along the O-ring of her regulator. The ritual of preparation. The liturgy before the mass.</p>

      <p>&ldquo;Ready?&rdquo; said Tomás.</p>

      <p>&ldquo;No.&rdquo;</p>

      <p>&ldquo;Good. Honest divers live longer.&rdquo;</p>

      <p>They went in.</p>

      <h2>III. The Halocline</h2>

      <p>The passage was tight for the first forty meters, barely wide enough for them to swim single-file with their sidemount tanks. The limestone walls were scalloped and knobbed, like the inside of a throat. Elena&apos;s fins raised small clouds of silt behind her&mdash;the powdery, ancient sediment that could blind a diver in seconds if disturbed. A silt-out was one of the true terrors of cave diving. Your visibility dropped to zero. Your headlamp became a useless smear of light against an opaque wall of particles. And your brain, hijacked by the amygdala, flooded with noradrenaline, screamed at you to swim upward, to bolt for the surface, to escape. But there was no surface. There was only rock.</p>

      <p>Elena breathed slowly. She counted her kicks. She clipped her line to a natural protrusion every three meters. Behind her, Tomás maintained his distance, his light a steady presence at the edge of her peripheral vision.</p>

      <p>At twenty-two meters, the passage opened into a wider gallery. She felt the change before she saw it: the water temperature shifted, and the beam of her light began to shimmer and distort, as if she were looking through a pane of warped glass. The halocline. The boundary where the lighter freshwater, fed by rain, floated on top of the heavier, denser saltwater that had seeped in from the Caribbean over millennia.<sup><a href="#src-v" className="text-muted/50 hover:text-foreground no-underline transition-colors">v</a></sup> Where the two layers met, the differing densities bent light in strange ways, creating visual distortions that looked like heat shimmering off summer asphalt. It was beautiful. It was also a lie&mdash;a place where your eyes told you the space was rippling, folding, when really the stone walls were perfectly still.</p>

      <p>Elena had seen it dozens of times. But this time, as she moved through the shimmer, she saw something else: a shape. Not rock. Not formation. Something placed.</p>

      <p>She stopped. She finned gently to hold position and adjusted her light. There, on a ledge just below the halocline, resting in the boundary between fresh and salt, between the world of rain and the world of the sea, was a ceramic vessel. Intact. Unbroken. Its surface was painted with the geometric designs she recognized immediately as Late Classic period, perhaps 800 CE. The mouth of the vessel was sealed with a plug of hardened copal resin.</p>

      <p>Her heart rate spiked. She made herself breathe. She knew better than to touch it.</p>

      <p>But she photographed it from every angle, and as she circled the ledge, her light swept downward into the saltwater layer below, and she saw what else the ledge was holding.</p>

      <p>Bones.</p>

      <p>Small bones. A child&apos;s femur. A scapula the size of her palm. They were arranged&mdash;not scattered, not tumbled, but placed. Laid out in the rough shape of a body, the way you might tuck a child into bed.</p>

      <h2>IV. The Blue</h2>

      <p>Later, in the rented house in Tulum, Elena sat on the floor with her laptop and her notes and a warm Modelo and tried to write the report. The facts were straightforward. New chamber, previously unmapped. One ceramic vessel, Late Classic, sealed. Skeletal remains, juvenile, approximate age at death five to seven years. Evidence of intentional placement.</p>

      <p>But the facts weren&apos;t what was sitting in her chest like a stone.</p>

      <p>What was sitting in her chest was the image of someone&mdash;a mother, a father, a priest, someone&mdash;descending into that passage with a dead child and a sealed jar. Descending into the dark, into the cold water, holding the body against the current. Finding the ledge. Laying the child down. Placing the vessel beside them. The copal inside it would have been an offering, a fragrant smoke meant to carry prayers upward, except that here, sealed and submerged, it would never burn. It would remain potential. A prayer held forever in the throat.</p>

      <p>Elena thought about the fourteen-foot layer of blue mud that Thompson had found at the bottom of the Sacred Cenote.<sup><a href="#src-vi" className="text-muted/50 hover:text-foreground no-underline transition-colors">vi</a></sup> Fourteen feet. The accumulated residue of centuries of Maya Blue pigment, painted onto the bodies of the sacrificed, painted onto the jade and gold and carved wood that was thrown in after them. Fourteen feet of prayer. She thought about how the water in that cenote was still toxic with mercury from the cinnabar paint they used in ceremonies, the poison leaching into the aquifer after a thousand years.<sup><a href="#src-vii" className="text-muted/50 hover:text-foreground no-underline transition-colors">vii</a></sup></p>

      <p>She thought: <em>the water keeps everything</em>.</p>

      <p>Tomás came in with ice&mdash;proper ice, bagged, from the OXXO on the corner&mdash;and found her staring at her laptop screen without typing.</p>

      <p>&ldquo;You okay?&rdquo;</p>

      <p>&ldquo;There was a child.&rdquo;</p>

      <p>&ldquo;I saw.&rdquo;</p>

      <p>&ldquo;Someone brought that child down there. Through the restriction. Through the dark. Can you imagine? The passage is barely wide enough for us with tanks. Someone carried a body through there.&rdquo;</p>

      <p>Tomás set the ice on the counter. He didn&apos;t say anything for a moment. Then: &ldquo;Maybe they didn&apos;t have to swim. The water table was lower then. Late Classic, 800 CE&mdash;that&apos;s the height of the droughts. The passage might have been dry. They walked.&rdquo;</p>

      <p>&ldquo;They walked into the dark with a dead child.&rdquo;</p>

      <p>&ldquo;Yes.&rdquo;</p>

      <p>&ldquo;To give the child to Xibalba.&rdquo;</p>

      <p>&ldquo;To the lords of the underworld. To Chaac. To whoever they believed was listening.&rdquo;</p>

      <p>Elena closed her laptop. &ldquo;And then the water rose. And covered them. And kept them.&rdquo;</p>

      <p>&ldquo;For twelve hundred years.&rdquo;</p>

      <p>&ldquo;And now we come with our cameras and our tanks and our databases, and we pull them out, and we put numbers on them, and we write reports.&rdquo;</p>

      <p>Tomás sat down across from her. &ldquo;That&apos;s the work. That&apos;s what we do.&rdquo;</p>

      <p>&ldquo;I know what we do.&rdquo;</p>

      <p>&ldquo;But?&rdquo;</p>

      <p>&ldquo;But someone laid that child down like they were sleeping.&rdquo;</p>

      <h2>V. Naia</h2>

      <p>She couldn&apos;t sleep. She lay in the hammock on the patio and listened to the insects and thought about Naia.</p>

      <p>Naia was what they called the girl&mdash;from the Greek word for water nymph. In 2007, three cave divers named Alejandro Álvarez, Alberto Nava, and Franco Attolini had swum miles into the Sistema Sac Actun, through miles of flooded, lightless passages, and discovered a massive bell-shaped void forty meters below sea level.<sup><a href="#src-viii" className="text-muted/50 hover:text-foreground no-underline transition-colors">viii</a></sup> They called it Hoyo Negro. The Black Hole. And at the bottom, resting on a ledge where she had lain for thirteen thousand years, was the nearly complete skeleton of a girl who had been fifteen or sixteen when she died.</p>

      <p>Naia had been four foot ten. She had walked into the cave system during the Late Pleistocene, when the water table was far below the surface and the caves were dry and echoing and dark. She was likely looking for water during a drought. She fell a hundred feet into the pit and broke her pelvis. She died alone in the dark, alongside the bones of saber-toothed cats and giant ground sloths that had also fallen and also died.</p>

      <p>And then the Ice Age ended. The glaciers melted. The sea rose. The water crept into the caves and covered her, and sealed her, and held her in place for thirteen millennia while the world above changed beyond all recognition&mdash;civilizations rising and falling, languages born and dying, the limestone slowly closing its throat around the evidence of what had happened.</p>

      <p>Alberto Nava had described the moment of discovery. How their flashlights seemed to be &ldquo;swallowed&rdquo; by the blackness of the chamber. How the beams reached and reached and found nothing, as if the dark itself were consuming the light. And then, finally, the beam caught something pale on a ledge. A skull. A girl&apos;s face, turned slightly upward, as if she had been looking for the sky.</p>

      <p>Elena thought about this often. The paradox of it. The water had destroyed Naia&mdash;had drowned her world, her context, the dry cave where she had actually lived and died. But the water had also preserved her. Without the flooding, the bones would have been scattered by animals, dissolved by microbes, ground to dust. The water was both the destroyer and the keeper. It erased and it remembered. It swallowed and it held.</p>

      <blockquote>What the water takes, it keeps. What it keeps, it changes. And what it changes, it claims as its own.</blockquote>

      <p>This was something Elena had written in her notebook years ago, and she wasn&apos;t sure anymore whether it was about cenotes or about grief. Probably both. She had the uneasy sense that cenotes were a metaphor for something she didn&apos;t want to look at directly&mdash;something about the way loss works, the way the things we lose don&apos;t disappear but sink to the bottom and wait there, preserved in a medium that alters them just enough that when we finally recover them, we can&apos;t be sure they&apos;re what we thought we lost.</p>

      <h2>VI. The Train</h2>

      <p>In the morning, Tomás showed her the video on his phone. Someone had posted drone footage of Section 5 South of the Tren Maya construction site. The video showed massive steel pilings driven into the ground, puncturing the roof of a cave system that had been forming for millions of years. Through the holes, you could see the damage: stalactites shattered, limestone fractured, the clean geometry of geological time smashed by industrial drill bits.<sup><a href="#src-ix" className="text-muted/50 hover:text-foreground no-underline transition-colors">ix</a></sup></p>

      <p>&ldquo;They bypassed the environmental reviews,&rdquo; Tomás said. &ldquo;National security exemption. A tourist train is now a matter of national security.&rdquo;</p>

      <p>Elena watched the video. She watched the rusted pylons penetrating the cave roofs, the water cloudy with particulates, the pristine aquifer muddied. She thought about Thompson and his dredge, hauling gold and jade and human bones out of the Sacred Cenote and shipping them to Harvard in diplomatic pouches. She thought about the Mexican government suing him in 1926, decades too late, the artifacts already behind glass in Cambridge.<sup><a href="#src-x" className="text-muted/50 hover:text-foreground no-underline transition-colors">x</a></sup></p>

      <p>The pattern was always the same. Someone came, took what they wanted, and called it progress or science or national development. The cenotes didn&apos;t care what you called it. They kept what you gave them and gave back what they chose. Thompson had found gold disks and jade beads. He had also found the bones of children. He took the gold. He catalogued the bones. He wrote papers. He became famous. The children remained nameless.</p>

      <p>&ldquo;There&apos;s more,&rdquo; Tomás said. &ldquo;Someone broke into Hoyo Negro.&rdquo;</p>

      <p>&ldquo;What?&rdquo;</p>

      <p>&ldquo;Illegal divers. Clout chasers from the Tulum scene. They got past the restrictions, dove the site, took photos. INAH is losing their minds.&rdquo;</p>

      <p>Elena set down the phone. She looked at the ceiling fan turning slowly above her, its blades cutting the warm air into equal portions of light and shadow.</p>

      <p>&ldquo;They kept Naia&apos;s coordinates secret for years,&rdquo; she said.</p>

      <p>&ldquo;Doesn&apos;t matter anymore. Everything leaks. Everyone wants the content.&rdquo;</p>

      <p>She thought about Naia on her ledge, forty meters down, in the dark, in the silence, for thirteen thousand years. Undisturbed. Held. And now: Instagram.</p>

      <h2>VII. The Second Descent</h2>

      <p>She went back. Not to Ik-Kil&mdash;to the restricted passage, to the chamber with the child and the ceramic vessel. She went alone, which was a violation of every protocol she had ever been taught, every safety rule, every basic principle of cave diving. Tomás would have been furious. Dr. de Anda would have removed her from the project.</p>

      <p>She went anyway.</p>

      <p>The restriction was tighter than she remembered, or maybe she was more aware of it now, her body pressing against the limestone on both sides, her tanks scraping. She moved slowly. She breathed slowly. She counted. She clipped her line. The water was cool and clear and tasted faintly of mineral, of time, of stone that had been dissolving since the Cretaceous.</p>

      <p>The gallery opened. The halocline shimmered. She adjusted her buoyancy and descended through it, feeling the water change around her&mdash;warmer to cooler, lighter to heavier, sweet to salt. The boundary between worlds.</p>

      <p>She found the ledge. She found the child.</p>

      <p>The bones were where she had seen them: arranged, deliberate, quiet. The ceramic vessel sat beside them, its sealed mouth holding its twelve-hundred-year-old breath. Elena hovered above the scene and looked at it. Really looked. Not as an archaeologist, not as a scientist, not as a researcher preparing a report. As a person. As a woman floating in the dark above the body of someone&apos;s child.</p>

      <p>She thought: <em>I could document this. I could extract the vessel, analyze the copal, date the remains, publish a paper. I could add another data point to our understanding of Late Classic Maya mortuary practices. I could contribute to the literature.</em></p>

      <p>She thought: <em>Or I could leave them here.</em></p>

      <p>It was not a scientific thought. It was barely a rational one. The bones had no voice. The vessel had no opinion. The child was dead and had been dead for over a millennium and could not care what Elena did or didn&apos;t do. The only consciousness in this chamber was hers, and it was telling her two things at once: <em>know this</em> and <em>leave it alone</em>.</p>

      <p>She hung there in the dark water, her light catching the child&apos;s femur, the smooth curve of the vessel, the limestone walls with their millennia of accretions. She thought about the Maya communities who protested every excavation, who said that hauling bones into museums disturbed the spirits, who argued&mdash;not metaphorically but literally&mdash;that the cenotes were alive and that what was given to them was given, and should not be taken back.</p>

      <p>She thought about Thompson packing gold into diplomatic pouches.</p>

      <p>She thought about the steel pylons crashing through cave roofs.</p>

      <p>She thought about Naia&apos;s face, turned upward.</p>

      <p>She thought about the boy they painted blue.</p>

      <p>And then she turned off her primary light. She turned off her backup light. She floated in the absolute dark, in the silence, in the water that was both fresh and salt, both rain and sea, both the world above and the world below. For thirty seconds. For a minute. For long enough that her heartbeat became the loudest thing in the chamber, and then even that faded, and there was only the water, pressing against her skin on all sides, holding her the way it held everything it was given.</p>

      <p>She turned her light on. She looked at the child one more time. She took no photographs. She made no notes. She turned around and swam back through the restriction, back through the passage, back up through the neck of the cenote, back into the world of air and light and sound and time, where things decayed and were forgotten and did not last.</p>

      <p>She surfaced. The sky was the impossible blue of the Yucatán, the blue of the pigment they used to paint the children, the blue of the water in the shallow cenotes where the tourists swam and took selfies and had no idea what lay beneath them. Blue upon blue upon blue.</p>

      <h2>VIII. What the Water Keeps</h2>

      <p>She filed the report. She had to. She noted the chamber, the passage, the approximate depth. She described the vessel and the remains in clinical terms. She did not include photographs. She recommended &ldquo;deferred extraction pending community consultation with local Maya authorities.&rdquo;</p>

      <p>Dr. de Anda approved the recommendation. Tomás asked her why she had gone back alone, and she said she needed to check a measurement, and he knew she was lying, and he didn&apos;t push it.</p>

      <p>Months later, she left the Yucatán. She took a position at a university in Mexico City. She taught a course on underwater archaeology. She published papers on ceramic typologies and pigment analysis. She was careful and precise and well-cited. She never went back to the chamber.</p>

      <p>But at night, sometimes, she dreamed of it. The shimmer of the halocline. The arrangement of small bones. The sealed mouth of the vessel, holding its breath. And the dark&mdash;the absolute, encompassing, patient dark of the water that had waited twelve hundred years for someone to come and see what it was holding, and would wait twelve hundred more, and twelve hundred after that, whether anyone came or not.</p>

      <p>The water didn&apos;t care about her report. The water didn&apos;t care about science or heritage or national security or Instagram or the thirty-billion-dollar train boring through the earth above it. The water did what it had always done: it received, it held, it kept. It turned bones to stone and stone to silt and silt to sediment and sediment to the blue mud of centuries. It was the most patient thing on earth. It was the throat of Xibalba, and it was also just water&mdash;hydrogen and oxygen, fresh and salt, the blood of rain.</p>

      <p>Sixty-six million years ago, an asteroid had slammed into this peninsula and killed most life on Earth, and the shockwave had fractured the limestone into the ring of cenotes that would one day become the Maya&apos;s doorways to the underworld. Everything that followed&mdash;the civilization, the sacrifices, the pigment and gold and children and prayers, the consul with his dredge, the archaeologist with her camera, the girl who fell into a black hole thirteen thousand years ago&mdash;everything was a consequence of that original impact. A rock fell from the sky and made holes in the earth, and the water rose to fill them, and the people came to the water and gave it what they loved most, and the water took it, and the water kept it.</p>

      <p>Elena understood this now. She understood that there were things you could study and things you could only witness. That some knowledge was not meant to be extracted but to be sat with, in silence, in the dark, with the weight of the water all around you. That the cenote was not a site or a resource or a data set but a place where time folded in on itself, where a seven-year-old boy and a fifteen-year-old girl and a thirty-four-year-old woman all occupied the same water, the same dark, the same question: <em>What is worth giving to the deep?</em></p>

      <p>She never answered it. But she carried it with her, the way the water carried everything&mdash;changed but not destroyed, settled but not still, blue and dark and very, very deep.</p>


      <h3 className="text-sm font-medium text-muted mb-4">Sources &amp; Further Reading</h3>
      <ol className="space-y-2 text-sm text-muted/80 list-none">
      <li id="src-i"><span className="text-muted/50 mr-2">i.</span><a href="https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQFz5y2YeIkqXZ9gd1CYiICn_HMhaphnlx5DCj0IchtHr_t9JewZr9QcIKVzpIVTDgfkcFxY0ljzD11nHCHBgcBV4cpUd7F_to6QNDPyFE_pZNhojYeyxBQMWKhHwZtUNvbb" target="_blank" rel="noopener noreferrer" className="underline decoration-muted/30 hover:text-foreground hover:decoration-foreground/50 transition-colors">Edward Herbert Thompson and the Sacred Cenote — Wikipedia</a></li>
      <li id="src-ii"><span className="text-muted/50 mr-2">ii.</span><a href="https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQGu0i8h4sD2umgPuc1WE-axz63gLYOBSfvkJIKY0Vp1DlIXZnc4gYeye4ZGmWBI8h0kA5rcu_j4Xn34wQbMhuGsI2MFEj4xqco0lugaqzql311eAwenP-6SmJjcKG7tOkYmeq2TUduUO3633FOYQvcSGW7C31uIyV2Liygr1efYd9MX-scOWxc87Bqj768RCD79QAu0kL4gd6yBH-GJWvTe0zKfDASXQ9WGBnM8" target="_blank" rel="noopener noreferrer" className="underline decoration-muted/30 hover:text-foreground hover:decoration-foreground/50 transition-colors">Guillermo de Anda&apos;s analysis of Sacred Cenote remains — Archaeology Magazine</a></li>
      <li id="src-iii"><span className="text-muted/50 mr-2">iii.</span><a href="https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQEZ25itxWQbG7Hk8cYUbXdIlBtQ6GWskXhhZimVzuuBufNrbXn1rfbc6MEAspXMPWwxh5xRaH8dW0bU2TuymxjgDYzbL1_rQmCgkW5EqRgMGPZi6whexZAgCTPumE-hRAn19z2ph4rRrEhfSqqSmUarS8XK6-Gqguyap_g=" target="_blank" rel="noopener noreferrer" className="underline decoration-muted/30 hover:text-foreground hover:decoration-foreground/50 transition-colors">Cenotes and the Yucatán karst aquifer — ArcGIS</a></li>
      <li id="src-iv"><span className="text-muted/50 mr-2">iv.</span><a href="https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQFEBsJOmyBGY-_ohhTmSeEYCXa7wArIcbQ01GkF3OR5RFPwcCtlfhSqlIpKCa9vNtdtRfIo1E9f205Nb1xUZ1nmQK80_rQlUsAuZbekwQ4HQUNTKQhwVk_UzBwvMCHtoCvkkVzFMMXJ5C1BYbRb2nodaqIxeNeNlg==" target="_blank" rel="noopener noreferrer" className="underline decoration-muted/30 hover:text-foreground hover:decoration-foreground/50 transition-colors">Psychological effects of cave diving — British Psychological Society</a></li>
      <li id="src-v"><span className="text-muted/50 mr-2">v.</span><a href="https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQFcIzG-M_tXHKy-dkWCGhQGml2VwCbaPpHiGRd3O7JPJEX3yG50BPtUrQhexCu28BefwDEQqaSb9aMT8vfN1ufhgFzws92LgTNvn55LekrbaDS4Q2eBDlMV7qPSbwakpbMVsRwXEweW0GusLtLFaSLggF_JwcFr57GmEOjsQb6aFl3nI_JqSVwEOQ==" target="_blank" rel="noopener noreferrer" className="underline decoration-muted/30 hover:text-foreground hover:decoration-foreground/50 transition-colors">Cenote halocline and hydrogen sulfide layers — Sunny Explores</a></li>
      <li id="src-vi"><span className="text-muted/50 mr-2">vi.</span><a href="https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQHAAbWeYmfkZ5tU3XlcE7vVcJbxSn6H7eAUFCjYgli5G5uHmOlGdani-QO37WS5Ltaao5h8AqP3aRwzDW_ZxAguLzL5cYaJ8AuvPuR_h5rbnijs3btOIoXrfER0XMz-teIE4nkHnQl8DceonXKn-OBUK-ZlkAMWVQ==" target="_blank" rel="noopener noreferrer" className="underline decoration-muted/30 hover:text-foreground hover:decoration-foreground/50 transition-colors">Thompson&apos;s dredging of the Sacred Cenote — History Archive</a></li>
      <li id="src-vii"><span className="text-muted/50 mr-2">vii.</span><a href="https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQG2FdkzSLP1tTXSvfcYF2tVjIdglbkrvs47-bKyqDAhat4B5kkh4bcGiYnrCUQ-1oftQdZ7m1mvbInJ-NXbNXvWGpdIyvB5liP9py6djnU4NofnqTFXbmvwyhzM7dJj7WAA7ik3a3eD2rhCmR-Urlw69D6XzRcWQ14uN3w3VdsvSVgVgIGJqz9-TdfAJfrhW8aJqzQGD2QWyQ5pUtOEF8QPHhsTo4kfZd0=" target="_blank" rel="noopener noreferrer" className="underline decoration-muted/30 hover:text-foreground hover:decoration-foreground/50 transition-colors">Mercury contamination in the Sacred Cenote — ResearchGate</a></li>
      <li id="src-viii"><span className="text-muted/50 mr-2">viii.</span><a href="https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQGFYlWVUy_3RAYWK4fyBWzTe428qfdzuW50wMfl9kcIFieOC_xaG7-CkkANrw2Sxm1roJED4cT7nXETREA3zcyf8JmV2JUBWWGOT_xGJtMtz7WkXs8tyHp5H07_Xlea4Gw8vJck0GQYCztPeTyzKIbFQpQSSZtyU4gzjHmIXjUYjevKOjIaZvBpx39QxA==" target="_blank" rel="noopener noreferrer" className="underline decoration-muted/30 hover:text-foreground hover:decoration-foreground/50 transition-colors">Hoyo Negro and the discovery of Naia — National Geographic</a></li>
      <li id="src-ix"><span className="text-muted/50 mr-2">ix.</span><a href="https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQHVXen9FUJ49a7VTd2Ekjo23j7Eu0GHSJMulnlaGmddMiDvTGOC7ygF_lEZ5lHHUYr3lOpCowQBkhTdV1sM_Hy0X9c0Im1-ZPWzfE0PzDCE70Hp4lWhDCgNsUKHb2y1_tSTt7Wx9E8HLgg0_9dRg6GvdphSmuDbHrmx9tl7NKcj91hUCUR-1g==" target="_blank" rel="noopener noreferrer" className="underline decoration-muted/30 hover:text-foreground hover:decoration-foreground/50 transition-colors">Tren Maya environmental destruction of cave systems — WordPress</a></li>
      <li id="src-x"><span className="text-muted/50 mr-2">x.</span><a href="https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQGVpdfWkxLu4vAXHTOpz8Atgdbyv02ScreBa3t9dTWiDOb28tfowiYAawFmN4UWwlEKeJRcZeLG-XwNRifEdLViaZk6y-BqREnVKIaXzAi_tNO662E8OHoFr3XAworbDBFn_WrwuaACwGp8haYLdwGgpATIXLa1aD6Spw==" target="_blank" rel="noopener noreferrer" className="underline decoration-muted/30 hover:text-foreground hover:decoration-foreground/50 transition-colors">Thompson lawsuit and artifact repatriation — Yucatan Living</a></li>
      </ol>

    </ExplorationLayout>
  );
}
