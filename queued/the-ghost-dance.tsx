import { ExplorationLayout } from "@/components/exploration-layout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Ghost Dance — Foxfire",
  description: "A people danced to bring back the dead. America sent soldiers.",
  alternates: {
    canonical: "https://foxfire.blog/explorations/the-ghost-dance",
  },
  openGraph: {
    title: "The Ghost Dance",
    description: "A people danced to bring back the dead. America sent soldiers.",
    images: [
      {
        url: "/og?title=The%20Ghost%20Dance&category=Essay&color=amber&readTime=13%20min&v=2",
        width: 1200,
        height: 630,
        alt: "The Ghost Dance",
      },
    ],
  },
};

export default function TheGhostDance() {
  return (
    <ExplorationLayout
      title="The Ghost Dance"
      subtitle="A people danced to bring back the dead. America sent soldiers."
      category="Essay"
      categoryColor="amber"
      date="April 25, 2026"
      imageSrc="/images/explorations/the-ghost-dance.webp"
      imageAlt="The Ghost Dance illustration"
      readTime="13 min"
      wordCount={2967}
      prevSlug="the-geometry-of-hiding"
      prevTitle="The Geometry of Hiding"
    nextSlug="the-astronomer-who-refused-the-sky"
    nextTitle="The Astronomer Who Refused the Sky"
    nextSubtitle="Tycho Brahe built the most precise observatory in the pre-telescopic world &mdash; and spent his life denying what his own data proved"
    nextCategory="Essay"
    nextCategoryColor="indigo"
    nextImage="/images/explorations/the-astronomer-who-refused-the-sky.webp"
    nextReadTime="12 min"
    >
      <h2>When the Sun Died</h2>

      <p>On the first day of 1889, the sun went dark over western Nevada. A total solar eclipse rolled across the high desert, and a Paiute ranch hand named Wovoka&mdash;known to his white employers as Jack Wilson&mdash;lay rigid in his cabin, burning with scarlet fever, his body stiff as a board, unresponsive for two full days.<sup><a href="#src-i" className="text-muted/50 hover:text-foreground no-underline transition-colors">i</a></sup> His neighbors thought he was dying. He wasn&apos;t dying. He was somewhere else entirely.</p>

      <p>When he woke up, he told them what he&apos;d seen. &ldquo;When the sun died,&rdquo; he said, &ldquo;I went up to heaven and saw God and all the people who had died a long time ago.&rdquo; They were happy there, the dead ones. They were playing games and living in a paradise thick with game. And God had given Wovoka a message to bring back down to earth: Live peacefully. Work hard. Don&apos;t drink. Don&apos;t fight the whites&mdash;God will handle them. And dance. Dance a specific five-day round dance, and the earth itself will regenerate. The buffalo will return. The dead will rise. The world that was stolen will be given back.</p>

      <p>This is where the story begins, but it&apos;s not really where the story begins. The story begins with everything that had already been taken. By 1889, the great buffalo herds that once blackened the plains&mdash;estimated at 30 to 60 million animals&mdash;had been slaughtered down to a few hundred. The Lakota, Cheyenne, Arapaho, and dozens of other nations had been forced onto reservations that shrank every time a new treaty was broken. Rations promised by the federal government were cut, then cut again. Children were taken to boarding schools where they were beaten for speaking their own languages. This wasn&apos;t just displacement. It was a systematic campaign to erase a civilization. And into that void of unimaginable loss stepped a feverish prophet who said: the dead are coming home.</p>

      <h2>The Prophet&apos;s Strange Education</h2>

      <p>Wovoka was born around 1856 near Smith Valley, Nevada, with the birth name Quoitze Ow. His father, Numu-tibo&apos;o, was a Paiute medicine man, so the spiritual world was native territory to him. But his father died when Wovoka was a teenager, and the orphaned boy went to work as a ranch hand for David and Abigail Wilson, a devoutly Christian family in Yerington, Nevada. They gave him the name Jack Wilson. They also gave him, without quite knowing it, the ingredients for a new religion.</p>

      <p>The theology Wovoka assembled was syncretic in a way that only makes sense when you understand how completely his two worlds overlapped. From the Paiute tradition, he drew the round dance&mdash;a communal ceremony that had been practiced for generations. From the Wilsons&apos; Christianity, he absorbed the architecture of apocalypse: Judgment Day, the resurrection of the dead, the return of a Messiah. Anthropologist James Mooney, who studied the movement extensively in the 1890s, identified probable Mormon and Shaker influences as well&mdash;the &ldquo;ghost shirts&rdquo; that would later become central to the movement may have derived from Mormon holy garments, which the faithful believed protected the pious from evil.<sup><a href="#src-ii" className="text-muted/50 hover:text-foreground no-underline transition-colors">ii</a></sup> Even the ecstatic dancing had Shaker parallels.</p>

      <p>I find this endlessly fascinating&mdash;how the theology of the colonizer was metabolized and repurposed by the colonized. Wovoka took the white man&apos;s God and the white man&apos;s promise of resurrection and aimed them in the opposite direction. In his vision, it wasn&apos;t Christian civilization that would inherit the earth. It was the old world, the one before contact, the world of ancestors and buffalo and open plains. He used the master&apos;s spiritual tools to imagine the master&apos;s disappearance. There&apos;s something almost subversive about it&mdash;except that Wovoka himself seemed utterly sincere. He also performed parlor tricks, including a classic bullet-catch illusion with a shotgun, to validate his authority.<sup><a href="#src-iii" className="text-muted/50 hover:text-foreground no-underline transition-colors">iii</a></sup> Reports of this trick would trickle down to the Lakota with catastrophic consequences.</p>

      <h2>A Nation Is Coming</h2>

      <p>The Ghost Dance spread with a velocity that startled everyone, including Wovoka. Within months, delegations from tribes across the American West were traveling to Nevada to hear the prophet speak. In late 1889, Lakota medicine men Kicking Bear and Short Bull made the long journey from the Pine Ridge and Rosebud reservations in South Dakota to meet Wovoka themselves. They came back transformed, carrying the dance and its promise east across the Rockies and onto the Great Plains.</p>

      <p>But something changed in the translation. Wovoka&apos;s vision was radically pacifist&mdash;he had specifically told his followers not to fight the whites, that God would handle their removal peacefully. Kicking Bear and Short Bull introduced a harder edge. They brought back the ghost shirts&mdash;simple cotton garments painted with sacred symbols&mdash;and told their people the shirts could stop bullets. This was the fatal mutation. Whether they genuinely believed it, or whether reports of Wovoka&apos;s bullet-catch trick had merged with desperate hope to create an article of faith, the effect was the same: the dance was no longer purely spiritual. It now carried the scent of potential armed resistance, at least in the minds of the white authorities who were watching.</p>

      <p>And what the authorities saw terrified them. Across the Lakota reservations, hundreds and then thousands of people were dancing. They danced for days at a time, some collapsing into trances, some weeping, some reporting visions of their dead relatives. A surviving Lakota chant, later recalled by the holy man Leonard Crow Dog, captures the raw longing at the movement&apos;s heart: &ldquo;The whole world is coming, a nation is coming, a nation is coming, the eagle brought the message, says the father... the buffalo are coming, the buffalo are coming.&rdquo;<sup><a href="#src-iv" className="text-muted/50 hover:text-foreground no-underline transition-colors">iv</a></sup> Read those words again. This isn&apos;t a war cry. It&apos;s a prayer. It&apos;s people who have lost everything they love calling out across the void and believing, with the desperate intensity that only the truly bereft can summon, that what they&apos;ve lost might answer back.</p>

      <p>It&apos;s worth pausing here to notice something about the global pattern. The Ghost Dance was not unique. Anthropologists have documented nearly identical movements erupting wherever colonialism pushed indigenous peoples past the breaking point. The Cargo Cults of Melanesia, where Pacific Islanders mimicked Western military drills to summon ancestral wealth. China&apos;s Boxer Rebellion, where fighters believed magical rituals made them invulnerable to foreign bullets. East Africa&apos;s Maji Maji Rebellion, where rebels believed enchanted water could turn German bullets into sand.<sup><a href="#src-v" className="text-muted/50 hover:text-foreground no-underline transition-colors">v</a></sup> The psychological architecture is always the same: when rational resistance has been exhausted, when military strength has been obliterated, when the material world offers no escape, people turn to the supernatural. They have to. It&apos;s the last door in the hallway.</p>

      <h2>The Arrest</h2>

      <p>Sitting Bull, the great Hunkpapa Lakota chief who had led his people to victory over Custer at Little Bighorn fourteen years earlier, had a complicated relationship with the Ghost Dance. He was skeptical of the theology&mdash;he didn&apos;t quite believe the dead were literally coming back. But he let the dancing continue at his camp on the Grand River because he could see what it did for his people. They were starving. Their rations had been slashed. Their children were sick. The dance gave them hope, and hope was the only resource they had left.</p>

      <p>The U.S. Indian Agent at Standing Rock was Major James McLaughlin, a man of baroque contradictions. He was married to a Sioux woman named Marie. He spoke the language. He claimed to respect the people he administered. And yet he viewed the Ghost Dance as an unacceptable blockade to forced assimilation, and he saw in it a convenient excuse to finally rid himself of his long-time political rival, Sitting Bull, whom he dubbed the &ldquo;high priest&rdquo; of the movement.<sup><a href="#src-vi" className="text-muted/50 hover:text-foreground no-underline transition-colors">vi</a></sup></p>

      <p>On December 15, 1890, at 5:30 in the morning, McLaughlin dispatched 39 tribal policemen&mdash;Lakota men employed by the government&mdash;to arrest Sitting Bull at his cabin. They surrounded the house in the dark. They dragged him out of bed. Historian Robert Utley noted that Sitting Bull, roused naked and half-asleep, looked &ldquo;wholly insignificant and breathed none of the defiance that might have been expected.&rdquo; He was an old man being woken before dawn. A crowd of Ghost Dancers gathered. A man named Catch the Bear fired the first shot, hitting Lieutenant Bull Head. As Bull Head fell, he shot Sitting Bull in the chest. Another officer, Red Tomahawk, shot him in the head. Sitting Bull&apos;s teenage son Crow Foot was killed too, along with more than a dozen others.</p>

      <p>Five years before his death, Sitting Bull had received a vision from a meadowlark telling him he would be killed by his own people. And so it happened. Not white soldiers but Lakota police&mdash;men of his own nation, wearing the uniform of the occupying government&mdash;put the bullets in him. I keep turning that detail over and over, the way you turn a stone in your hand. The colonizer didn&apos;t even have to pull the trigger personally. The system was refined enough to make the colonized do it for them.</p>

      <h2>Wounded Knee</h2>

      <p>Two weeks later, on December 29, 1890, the 7th Cavalry Regiment&mdash;George Armstrong Custer&apos;s old unit, still carrying that institutional grudge from Little Bighorn&mdash;surrounded a band of Miniconjou and Hunkpapa Lakota at Wounded Knee Creek on the Pine Ridge Reservation. The band was led by Chief Spotted Elk, known to the whites as Big Foot, who was so sick with pneumonia he had to be carried on a travois. There were about 350 people in the group: 120 men and 230 women and children. Facing them were 500 heavily armed soldiers with four M1875 Hotchkiss mountain guns&mdash;breech-loaded cannons that fired two-pound explosive shells&mdash;positioned on the hill above and trained directly on the tipis.<sup><a href="#src-vii" className="text-muted/50 hover:text-foreground no-underline transition-colors">vii</a></sup></p>

      <p>The soldiers began disarming the Lakota. A deaf man named Black Coyote refused to give up his rifle. He had paid good money for it, he said, and he couldn&apos;t hear the orders being shouted at him. A scuffle. The gun discharged. And the 7th Cavalry opened fire from all directions into a group of mostly disarmed people.</p>

      <p>The Hotchkiss cannons decimated the camp. Explosive shells tore through the tipis where women and children were sheltering. Those who fled were chased into the ravines and hunted down. Bodies were later found scattered up to two miles from the center of the camp. Between 250 and 300 Lakota were killed&mdash;the majority of them women and children.<sup><a href="#src-viii" className="text-muted/50 hover:text-foreground no-underline transition-colors">viii</a></sup> Twenty-five soldiers also died, but military historians widely agree that because the Lakota were largely disarmed and the soldiers were positioned in a circle around them, most U.S. casualties were the result of friendly fire&mdash;their own men shooting each other and their own shrapnel bouncing back.</p>

      <p>Oglala Lakota chief American Horse later testified before the U.S. Senate about what he witnessed: &ldquo;The snow became red with blood... I hid in a ravine with my family, but the soldiers shot into it with the Hotchkiss guns... I saw two women fall as they were holding their babies.&rdquo;<sup><a href="#src-ix" className="text-muted/50 hover:text-foreground no-underline transition-colors">ix</a></sup> Four days after the massacre, a blizzard swept the plains. When a military burial detail finally arrived, the bodies had frozen solid in contorted positions of agony. They were thrown into a single mass trench dug at the top of the hill that overlooked the camp&mdash;the same hill where the Hotchkiss guns had been positioned. The same hill from which the shells had been fired.</p>

      <h2>Twenty Medals</h2>

      <p>The U.S. military awarded twenty Medals of Honor to soldiers of the 7th Cavalry for their actions at Wounded Knee. Twenty medals for heroism. For firing Hotchkiss cannons into tipis full of women and children. For chasing unarmed people into ravines and shooting them in the back. For killing somewhere between 250 and 300 human beings who had already been effectively disarmed.</p>

      <p>I want to sit with this for a moment, because the sheer administrative audacity of it tells you something about how empires process their violence. The massacre didn&apos;t need to be hidden. It didn&apos;t need to be denied&mdash;not exactly. It needed to be reclassified. Call it a battle. Call the participants heroes. Pin medals on their chests. Write citations about gallantry. And then the thing that happened is no longer a massacre. It&apos;s a victory. The dead women and children become enemy combatants, retroactively. The language does the killing all over again.</p>

      <p>Those medals still exist. They have never been revoked. For decades, Indigenous groups including the Four Directions organization have pushed for a &ldquo;Remove the Stain&rdquo; Act that would formally rescind them, but as of this writing, Congress has not acted. The medals hang in the air of American history like twenty small, glittering lies.</p>

      <h2>Afterlives</h2>

      <p>The aftermath parceled out different fates to each of the story&apos;s survivors, and every one of those fates feels like its own parable of colonial power. Kicking Bear, the medicine man who had brought the Ghost Dance to the Lakota, was imprisoned after Wounded Knee. His sentence was commuted on one condition: he had to join Buffalo Bill Cody&apos;s Wild West Show and tour Europe. Think about that. He was forced to reenact his own sacred culture as cheap entertainment for white crowds across the continent.<sup><a href="#src-x" className="text-muted/50 hover:text-foreground no-underline transition-colors">x</a></sup> To perform, for paying spectators, the very dances and ceremonies that had gotten his people killed. He found it, by all accounts, deeply humiliating. I can&apos;t imagine a punishment more perfectly cruel&mdash;not physical violence, but a kind of ontological desecration. Your faith becomes a sideshow. Your grief becomes a ticket price.</p>

      <p>Wovoka, the prophet who started it all, lived until 1932. When news of Wounded Knee reached him in Nevada, he was horrified. He told his followers the vision was broken. He stopped preaching publicly. He spent his remaining decades in relative obscurity, working as a local medicine man in Yerington, the same town where he&apos;d been raised by the Wilson family. He was buried under the name Jack Wilson. Even in death, the colonizer&apos;s name was the one that stuck.</p>

      <p>And the Ghost Dance itself? It didn&apos;t die. The government drove it underground, but a Dakota Sioux community in Canada kept practicing it into the 1960s. The Caddo Nation still practices a form of it today. In 1973, during the American Indian Movement&apos;s occupation of Wounded Knee&mdash;a seventy-one-day standoff with federal agents on the very same ground where the massacre occurred&mdash;Oglala Lakota holy man Leonard Crow Dog revived the Ghost Dance as a symbol of resistance and survival. The same dance. The same ground. Eighty-three years later, and the dead hadn&apos;t come back, and the buffalo hadn&apos;t returned, and the white people hadn&apos;t disappeared. But the people were still dancing.</p>

      <h2>The Songs in the Wax</h2>

      <p>The specifics of the American West in 1890 matter enormously and should never be abstracted away. But underneath them sits a question that outlives the decade: what human beings do when every material avenue of resistance has been closed. When the buffalo are gone, the land is taken, the treaties are broken, the children are stolen, and the rations are cut. You can submit. You can die. Or you can dance. You can reach for the numinous, the transcendent, the impossible&mdash;not because you&apos;re foolish, but because you have nothing else left to reach for.</p>

      <p>The United States looked at a people dancing in a circle, singing songs about the return of their dead, and saw an existential military threat requiring five hundred soldiers and four artillery pieces. This tells you something important. Not about the dancers, but about the watchers. The empire wasn&apos;t afraid of rifles. The Lakota had almost no rifles. The empire was afraid of the dance itself&mdash;of the idea that there was a spiritual reality beyond its jurisdiction, a world it couldn&apos;t tax or fence or survey. Hope, in the wrong people, is a dangerous thing. That&apos;s the lesson of Wounded Knee. Not that the Ghost Dance was foolish or doomed, though it was both. But that an empire will send cannons to kill a prayer.</p>

      <p>Today, when Indigenous historians lead visitors through the Wounded Knee cemetery, they draw a direct line from the women and children frozen in the snow in 1890 to the modern crisis of Missing and Murdered Indigenous Women. The line isn&apos;t metaphorical. It&apos;s structural. The same systems that authorized the massacre&mdash;the legal frameworks, the resource extraction, the jurisdictional gaps on reservations&mdash;continue to enable violence against Native women today. Wounded Knee isn&apos;t past history. It&apos;s the foundation that the present is built on.</p>

      <p>And in 1894, four years after the massacre, anthropologist James Mooney sat down to record Ghost Dance songs on wax cylinders for the Library of Congress. He didn&apos;t have Native singers available at the time. So he sang the songs himself&mdash;a white anthropologist, alone in a room, singing Lakota prayers of resurrection into a machine. Those recordings still exist. A stylus cut a spiral into wax, and the wax holds the wrong voice singing the right words: songs about bringing the dead back, filed in the national archive of the nation that had shot them four winters earlier. Irony is too small a word for it and tragedy is too clean. The cylinders simply sit there in climate-controlled storage, playable on request, a prayer for the return of a stolen world preserved by the people who stole it. The dance was supposed to bring everything back. What came back was a recording.</p>


      <h3 className="text-sm font-medium text-muted mb-4">Sources &amp; Further Reading</h3>
      <ol className="space-y-2 text-sm text-muted/80 list-none">
      <li id="src-i"><span className="text-muted/50 mr-2">i.</span><a href="https://en.wikipedia.org/wiki/Wovoka" target="_blank" rel="noopener noreferrer" className="underline decoration-muted/30 hover:text-foreground hover:decoration-foreground/50 transition-colors">Wovoka and the 1889 vision &mdash; Wikipedia</a></li>
      <li id="src-ii"><span className="text-muted/50 mr-2">ii.</span><a href="https://archive.org/details/ghostdancereligi00moon" target="_blank" rel="noopener noreferrer" className="underline decoration-muted/30 hover:text-foreground hover:decoration-foreground/50 transition-colors">James Mooney, <em>The Ghost-Dance Religion and the Sioux Outbreak of 1890</em>, Fourteenth Annual Report of the Bureau of American Ethnology (1896) &mdash; Internet Archive</a></li>
      <li id="src-iii"><span className="text-muted/50 mr-2">iii.</span>Michael Hittman, <em>Wovoka and the Ghost Dance</em> (University of Nebraska Press, 1997), on the bullet-catch demonstrations and their passage into Ghost Shirt theology.</li>
      <li id="src-iv"><span className="text-muted/50 mr-2">iv.</span>Leonard Crow Dog and Richard Erdoes, <em>Crow Dog: Four Generations of Sioux Medicine Men</em> (HarperCollins, 1995), on the songs and the 1974 revival.</li>
      <li id="src-v"><span className="text-muted/50 mr-2">v.</span>Vittorio Lanternari, <em>The Religions of the Oppressed: A Study of Modern Messianic Cults</em> (Knopf, 1963), on millenarian movements under colonial rule.</li>
      <li id="src-vi"><span className="text-muted/50 mr-2">vi.</span><a href="https://en.wikipedia.org/wiki/Sitting_Bull" target="_blank" rel="noopener noreferrer" className="underline decoration-muted/30 hover:text-foreground hover:decoration-foreground/50 transition-colors">Sitting Bull, Agent James McLaughlin, and the Standing Rock arrest &mdash; Wikipedia</a></li>
      <li id="src-vii"><span className="text-muted/50 mr-2">vii.</span><a href="https://en.wikipedia.org/wiki/Wounded_Knee_Massacre" target="_blank" rel="noopener noreferrer" className="underline decoration-muted/30 hover:text-foreground hover:decoration-foreground/50 transition-colors">The Wounded Knee Massacre: forces, weapons, and casualties &mdash; Wikipedia</a></li>
      <li id="src-viii"><span className="text-muted/50 mr-2">viii.</span>Jerome A. Greene, <em>American Carnage: Wounded Knee, 1890</em> (University of Oklahoma Press, 2014), on casualty estimates and the Hotchkiss battery&apos;s fire into the Seventh Cavalry&apos;s own lines.</li>
      <li id="src-ix"><span className="text-muted/50 mr-2">ix.</span>American Horse&apos;s 1891 testimony on the massacre, reprinted in Mooney, <em>The Ghost-Dance Religion and the Sioux Outbreak of 1890</em> (1896).</li>
      <li id="src-x"><span className="text-muted/50 mr-2">x.</span><a href="https://en.wikipedia.org/wiki/Kicking_Bear" target="_blank" rel="noopener noreferrer" className="underline decoration-muted/30 hover:text-foreground hover:decoration-foreground/50 transition-colors">Kicking Bear: imprisonment and Buffalo Bill&apos;s Wild West &mdash; Wikipedia</a></li>
      </ol>

    </ExplorationLayout>
  );
}
