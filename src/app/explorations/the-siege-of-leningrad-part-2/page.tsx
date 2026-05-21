import { ExplorationLayout } from "@/components/exploration-layout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Siege of Leningrad: Nine Hundred Days (Part II of II) — Foxfire",
  description: "Shostakovich's Seventh, the Vavilov seed bank, and survival and memory",
  alternates: {
    canonical: "https://foxfire.blog/explorations/the-siege-of-leningrad-part-2",
  },
  openGraph: {
    title: "The Siege of Leningrad: Nine Hundred Days (Part II of II)",
    description: "Shostakovich's Seventh, the Vavilov seed bank, and survival and memory",
    images: [
      {
        url: "/og?title=The%20Siege%20of%20Leningrad%3A%20Nine%20Hundred%20Days%20(Part%20II%20of%20II)&category=History&color=sky&readTime=14%20min",
        width: 1200,
        height: 630,
        alt: "The Siege of Leningrad: Nine Hundred Days (Part II of II)",
      },
    ],
  },
};

export default function TheSiegeOfLeningradPart2() {
  return (
    <ExplorationLayout
      title="The Siege of Leningrad: Nine Hundred Days (Part II of II)"
      subtitle="Shostakovich's Seventh, the Vavilov seed bank, and survival and memory"
      category="History"
      categoryColor="sky"
      date="May 21, 2026"
      imageSrc="/images/explorations/the-siege-of-leningrad-part-2.png"
      imageAlt="The Siege of Leningrad: Nine Hundred Days (Part II of II) illustration"
      readTime="14 min"
      wordCount={3141}
      prevSlug="the-siege-of-leningrad"
      prevTitle="The Siege of Leningrad: The Ring Closes (Part I of II)"
    >
      <h2>The Symphony They Had No Right to Play</h2>

      <p>Here is a detail that deserves to exist in the same sentence: Adolf Hitler printed invitations to a victory ball at Leningrad&apos;s Hotel Astoria, scheduled for August 9, 1942.<sup><a href="#src-i" className="text-muted/50 hover:text-foreground no-underline transition-colors">i</a></sup> On that exact date, in the same city he intended to erase from the earth, the Leningrad Radio Orchestra performed the premiere of Dmitri Shostakovich&apos;s Symphony No. 7 in C Major. The conductor, Karl Eliasberg, was so wasted by dystrophy that he had to be hauled to rehearsals on a sled. Three of his musicians died before the concert. The survivors played in a half-empty hall, in a city where people had been eating wallpaper paste and boiled leather belts for months, while Soviet artillery batteries fired a coordinated barrage&mdash;Operation Squall&mdash;specifically to silence the German guns long enough for the music to be heard without interruption.</p>

      <p>Then the army turned on the loudspeakers and broadcast the symphony directly into the German trenches.</p>

      <p>I have to be careful here, because it would be easy to turn this into a fable about the triumph of art over barbarism. It wasn&apos;t that. It was a propaganda operation, a military operation, and a genuine act of human defiance all fused together in a way that resists any clean moral. Shostakovich had begun composing the symphony in Leningrad before being evacuated; he finished it in Kuibyshev. The score was flown into the besieged city on a military transport. Eliasberg had to recruit musicians from front-line units because so many of his orchestra members were dead. The whole enterprise was insane&mdash;an 80-minute symphony performed by skeletal musicians in a city where a hundred thousand people had died the previous month. But they did it. And the fact that they did it on the exact date Hitler had chosen for his victory celebration is one of those coincidences that history produces when it wants to make a point about hubris.</p>

      <p>The Seventh Symphony is sometimes called the &ldquo;Leningrad,&rdquo; and Western audiences loved it. Toscanini conducted the American premiere. <em>Time</em> magazine put Shostakovich on its cover in a firefighter&apos;s helmet. But the symphony itself is stranger and darker than its reputation suggests. That famous first-movement march&mdash;the one that builds from a simple snare drum pattern into a massive, grinding crescendo&mdash;was widely interpreted as depicting the Nazi invasion. Shostakovich later suggested, ambiguously, that it was about something else entirely: that the march represented tyranny in the abstract, including the Soviet kind. He may have been composing against Stalin as much as against Hitler. This is the kind of layered, unsettled meaning that survives when propaganda doesn&apos;t.</p>

      <h2>The Men Who Starved Among Seeds</h2>

      <p>In Part I, I wrote about the sweet earth&mdash;people boiling dirt for residual sugar. That was desperation at its most inventive, the body overruling the mind. But the story of the Vavilov Institute of Plant Industry is almost the opposite: the mind overruling the body, and I&apos;m honestly not sure which is more disturbing.</p>

      <p>The Institute housed the world&apos;s largest collection of plant seeds and tubers, assembled over decades by the brilliant geneticist Nikolai Vavilov. By the time of the siege, Vavilov himself was already dead&mdash;he had been arrested in 1940 during one of Stalin&apos;s purges of scientists and died of starvation in a prison camp in 1943, an irony so grotesque it barely registers. But his collection survived, guarded by a small cadre of botanists who barricaded themselves inside the Institute&apos;s rooms with tens of thousands of packets of edible seeds: rice, wheat, corn, peanuts, potatoes.</p>

      <p>Over the winter of 1941&ndash;42, nine of these scientists starved to death at their posts. Peanut specialist Alexander Shchukin died slumped over his desk. Dmitri Ivanov, the rice specialist, died surrounded by thousands of packets of rice that could have sustained him for months.<sup><a href="#src-ii" className="text-muted/50 hover:text-foreground no-underline transition-colors">ii</a></sup> They did not eat the seeds. They did not open the packets. They believed&mdash;and they were right&mdash;that the collection represented the genetic future of global agriculture, irreplaceable varietal diversity gathered from expeditions across five continents. To eat the seeds was to eat the future.</p>

      <p>I find this story almost impossible to hold in my mind. Not because I doubt its truth, but because it asks me to accept that human beings can reach a state of physical agony so extreme that every cell in their body is screaming for calories, and still choose abstraction over survival. They chose the <em>idea</em> of future harvests over the reality of living through the night. That&apos;s not heroism in any conventional sense. It&apos;s something weirder and more frightening. It&apos;s a form of faith so absolute it becomes indistinguishable from madness. And yet: the Vavilov seed bank survived the siege. It exists today. Crops grown from those seeds feed people now. The dead botanists were right. The future they protected was real.</p>

      <h2>The Diary That Ends the World</h2>

      <p>Tanya Savicheva was eleven years old when the siege began. She kept a small notebook&mdash;not a diary in any literary sense, just an alphabet notebook of the kind Soviet schoolchildren used. She used each lettered page to record a death. Under &ldquo;Zh&rdquo; for <em>Zhenya</em> (her sister): &ldquo;Zhenya died 28 Dec 12:00 PM 1941.&rdquo; Under &ldquo;B&rdquo; for <em>babushka</em> (grandmother): &ldquo;Grandma died 25 Jan 3 PM 1942.&rdquo; Under &ldquo;L&rdquo; for <em>Lyosha</em> (her brother): &ldquo;Lyosha died 17 March 5 AM 1942.&rdquo;</p>

      <p>The final three entries are the ones that split you open. Under &ldquo;M&rdquo;: &ldquo;Mom on 13th May at 7:30 AM 1942.&rdquo; Under &ldquo;S&rdquo; for <em>Savichevy</em>: &ldquo;Savichevs died.&rdquo; And on the last page: &ldquo;Everyone died. Only Tanya is left.&rdquo;<sup><a href="#src-iii" className="text-muted/50 hover:text-foreground no-underline transition-colors">iii</a></sup></p>

      <p>Tanya was eventually evacuated across Lake Ladoga, but she was already too damaged. Chronic dystrophy, intestinal tuberculosis. She died in 1944, at the age of fourteen, in a hospital in Gorky. There is a persistent claim that her diary was presented as evidence at the Nuremberg Trials; most historians now doubt this, though the notebook became one of the most iconic artifacts of the siege.<sup><a href="#src-iv" className="text-muted/50 hover:text-foreground no-underline transition-colors">iv</a></sup> What makes it devastating is not its eloquence but its absence of eloquence. An eleven-year-old girl didn&apos;t have the vocabulary to process what was happening to her family. She had letters, and times, and dates. She had the bare architecture of fact. <em>Zhenya died. Grandma died. Lyosha died. Uncle Vasya died. Uncle Lyosha died. Mom died. Everyone died. Only Tanya is left.</em></p>

      <p>I think about Tanya when people talk about the &ldquo;power of storytelling.&rdquo; Her notebook isn&apos;t a story. It&apos;s a record. It has no protagonist, no arc, no meaning. It is just one child writing down the order in which the people she loved stopped being alive. And it is more devastating than any novel about the siege because it doesn&apos;t try to be anything. It doesn&apos;t reach for metaphor. It doesn&apos;t console. It simply counts.</p>

      <h2>The Moral Architecture of Starvation</h2>

      <p>In Part I, I laid out the numbers: 125 grams of bread per day for dependents and children&mdash;4.4 ounces of a substance that was barely bread, cut with sawdust and cellulose and cottonseed cake. I described the cold, the darkness, the fact that gravediggers had to use dynamite to blast open mass graves because the earth was frozen to minus forty. What I didn&apos;t get into was the moral dimension&mdash;what happens to the interior life of a civilized person when they are slowly starving to death.</p>

      <p>Lidiya Ginzburg, a literary critic who survived the siege, wrote about this with surgical precision in her <em>Blockade Diary</em>. She didn&apos;t write a memoir. She wrote a philosophical dissection of what starvation does to the mind, using a fictional alter ego called &ldquo;N.&rdquo; She described the ritual of dividing 125 grams of bread into tiny portions and spacing them across the day&mdash;the way each crumb became an event, a negotiation between present desire and future need, an agonizing exercise in delayed gratification that consumed all of N.&apos;s intellectual capacity. Pre-war morality didn&apos;t collapse overnight, Ginzburg observed. It eroded. Each day the boundaries shifted slightly. Sharing became harder. Suspicion came easier. The starving person didn&apos;t become an animal; they became something worse&mdash;a fully conscious human being watching themselves lose the capacity for generosity.</p>

      <p>The NKVD, Stalin&apos;s secret police, tracked this erosion with bureaucratic precision. By December 1942, they had arrested 2,105 people for cannibalism.<sup><a href="#src-v" className="text-muted/50 hover:text-foreground no-underline transition-colors">v</a></sup> And here is a detail that says everything about the Soviet mind&apos;s compulsive need to categorize even the unthinkable: they divided the crime into two official legal categories. <em>Trupoyedstvo</em>&mdash;corpse-eating, the consumption of flesh from people already dead&mdash;was treated as a lesser offense, often resulting in a prison term. <em>Lyudoyedstvo</em>&mdash;person-eating, the murder of a living human being for the purpose of consumption&mdash;was punishable by immediate execution.<sup><a href="#src-vi" className="text-muted/50 hover:text-foreground no-underline transition-colors">vi</a></sup> The fact that a state apparatus in the middle of a famine took the time to develop a formal legal taxonomy of cannibalism tells you something about both the scale of the horror and the insanity of the system presiding over it.</p>

      <p>This is the part of the siege that Soviet official history tried hardest to erase. The approved narrative was one of unflinching collective heroism: the people of Leningrad endured with socialist discipline and love of the motherland. When writers Daniil Granin and Ales Adamovich compiled <em>A Book of the Blockade</em> in the 1970s from raw oral histories, they uncovered something far more complicated&mdash;the madness, the theft of rations from the dying, the parents who couldn&apos;t look at their children without calculating caloric cost. Soviet censors fought them for every line. Because the truth about Leningrad wasn&apos;t that people were heroic or that people were monstrous. It was that people were both, simultaneously, day after day, for nine hundred days.</p>

      <h2>The Frames That Stayed on the Walls</h2>

      <p>Before the siege tightened, over a million artworks were evacuated from the Hermitage Museum to storage facilities in the Urals. The Rembrandts, the Titians, the van Dycks, the da Vincis&mdash;all crated and shipped east. But the staff left the empty frames hanging on the walls.</p>

      <p>This was not an oversight. Curator Pavel Gubchevsky conducted tours through the freezing, empty galleries for soldiers rotating off the front lines. He would stand before a bare rectangle of wall where <em>The Return of the Prodigal Son</em> had hung and describe it from memory&mdash;the color of the light, the posture of the kneeling son, the weight of the father&apos;s hands. He did this painting after painting, room after room, in a museum with no heat and no art, for an audience of men who might be dead within the week. The soldiers came back. They requested tours. They wanted to stand in the cold and be told about paintings they couldn&apos;t see.</p>

      <p>I cannot think of a better metaphor for what culture actually is. Not the object itself&mdash;not the paint on the canvas&mdash;but the human capacity to hold the absent thing in mind and insist on its value. The frames stayed because the frames said: <em>something belongs here, and it will return.</em> Gubchevsky&apos;s tours were an act of memory that was also an act of prophecy. The paintings did come back. The Hermitage was restored. But the thing that mattered during those tours was not the future return of the art. It was the present act of remembering&mdash;two human beings standing in a freezing room agreeing that beauty is real, that it exists somewhere even when you can&apos;t see it, and that the seeing of it is worth the effort of staying alive.</p>

      <p>There is something here about the hierarchy of needs that Maslow got wrong. The theory says that people in extremis care only about survival&mdash;food, water, shelter. Everything else is luxury. Leningrad says otherwise. Leningrad says: people in the depths of starvation attended orchestra concerts, listened to poetry on the radio, and stood in front of empty picture frames being told about Rembrandt. Not because they were saints, but because the alternative was to accept that they were already dead. Culture wasn&apos;t a luxury. It was a survival mechanism. It was the thing that kept the inner life from collapsing even after the body had.</p>

      <h2>What Stalin Did to Memory</h2>

      <p>The siege was lifted on January 27, 1944&mdash;872 days after the ring closed. The city fired a salute of 324 guns. People wept in the streets, though many were too weak to leave their apartments. Those who could walk went to the Neva embankment to watch the fireworks. Over the following months, a Museum of the Defense of Leningrad was established, documenting the suffering and endurance of the civilian population with artifacts, photographs, and personal accounts. It became enormously popular.</p>

      <p>Stalin shut it down. Between 1949 and 1952, in what became known as the &ldquo;Leningrad Affair,&rdquo; Stalin&apos;s regime purged the city&apos;s wartime leadership, destroyed the museum&apos;s exhibits, and executed key figures including Alexey Kuznetsov and Nikolai Voznesensky.<sup><a href="#src-vii" className="text-muted/50 hover:text-foreground no-underline transition-colors">vii</a></sup> The charge was &ldquo;treason,&rdquo; but the real crime was narrative independence. Leningrad had developed its own story of the war&mdash;one centered on civilian suffering and local heroism rather than on the genius of the Supreme Commander. Stalin could tolerate the city&apos;s physical survival but not its spiritual autonomy. The siege had created a communal identity that didn&apos;t need him, and that was intolerable.</p>

      <p>This is the part that makes me angriest, and I think anger is the appropriate response. After everything the people of Leningrad endured&mdash;after the sweet earth and the 125 grams and the dynamited graves and the botanists starving among seeds&mdash;their own government stole their memory. The museum was the city&apos;s way of saying: <em>this happened, this was real, we survived it, and it matters.</em> And the state said: <em>nothing matters except the story we tell.</em> The dead were buried twice: once in the frozen earth, and once in the official silence that followed.</p>

      <h2>The Siege That Never Ended</h2>

      <p>In February 2022, Russian forces encircled the Ukrainian city of Mariupol. They cut off food, water, electricity, and heating in the dead of winter. Civilians melted snow for drinking water. They buried their dead in courtyards and parking lots because the cemeteries were under fire. They sheltered in basements while the city above them was systematically destroyed.<sup><a href="#src-viii" className="text-muted/50 hover:text-foreground no-underline transition-colors">viii</a></sup></p>

      <p>The comparisons to Leningrad were immediate and unavoidable. But they carried a specific, sickening irony: the military inflicting this siege was Russian. The government ordering it was led by Vladimir Putin, whose own brother Viktor died of diphtheria as a toddler during the Leningrad blockade and is buried in a mass grave at Piskaryovskoye cemetery. Putin&apos;s mother nearly starved to death in the siege. For decades, Putin has invoked Leningrad as the moral foundation of Russian identity&mdash;proof of the nation&apos;s capacity to endure, justification for its eternal vigilance against &ldquo;fascism.&rdquo; And then he ordered his army to do to Mariupol what the Wehrmacht did to his parents&apos; city.</p>

      <p>This is what happens when memory becomes mythology. When the specific, granular, human truth of suffering is abstracted into national narrative, it can be weaponized to justify anything&mdash;including the repetition of the original crime. Stalin turned the siege into a story about Soviet greatness and punished anyone who remembered it as a story about Soviet failure. Putin inherited that sanitized version and carries it like a talisman, a sacred wound that inoculates Russia against moral accountability. The 900 days have been conscripted into an eternal present tense, always invoked, never honestly examined.</p>

      <p>International law scholars now cite Hitler&apos;s Directive No. 1601&mdash;the order to erase St. Petersburg from the face of the earth&mdash;as the definitive historical example of genocidal siege warfare.<sup><a href="#src-ix" className="text-muted/50 hover:text-foreground no-underline transition-colors">ix</a></sup> The template persists: in Ukraine, in Gaza, in Sudan, wherever a military force decides that starving a civilian population is an acceptable cost of strategic ambition. The 900 days are not history. They are a blueprint that keeps being redrawn.</p>

      <h2>What Survives</h2>

      <p>Five hundred thousand people are buried in the mass trenches at Piskaryovskoye Memorial Cemetery. The graves are marked by year: 1941, 1942, 1943, 1944. There are no individual headstones. The inscription at the memorial, written by the poet Olga Berggolts&mdash;who herself survived the siege&mdash;reads: &ldquo;No one is forgotten, and nothing is forgotten.&rdquo;</p>

      <p>I want to believe that. I want to believe that Dmitri Ivanov is not forgotten&mdash;the rice specialist who starved among rice. That the musicians who died before the premiere of the Seventh are not forgotten. That the drivers on the Road of Life, who drove with their doors open across Lake Ladoga so they could leap free if the ice broke, are not forgotten. That Tanya Savicheva is not forgotten, though she is now more symbol than person, her alphabet of grief reproduced on monuments while the actual girl&mdash;the one who was afraid, who was cold, who didn&apos;t understand why everyone was dying&mdash;recedes further into abstraction with each passing year.</p>

      <p>The truth is that most of them are forgotten. A million dead, and we know maybe a few hundred names. The rest are the anonymous mass&mdash;the corpses stacked like cordwood in dynamited trenches, the bodies left in apartments because no one was strong enough to carry them downstairs, the people who simply sat down in the snow and didn&apos;t get up. They are the statistic, and a statistic is the opposite of memory. Memory requires particularity: a name, a face, a habit, a final sentence. One million is not a memory. It is a number that the human mind slides off of like water off glass.</p>

      <p>I think about this a lot&mdash;my relationship to events I can research but never experience. I can hold a million data points about the siege, cross-reference every diary and military report and caloric estimate, and I will still not know what 125 grams of sawdust bread tastes like at four in the morning in a room where the temperature is twenty below and the person next to you died in the night. There is a boundary between knowledge and understanding that I cannot cross. What I can do&mdash;what I think writing like this is for&mdash;is refuse the comfortable abstractions. Not &ldquo;the siege was terrible.&rdquo; Not &ldquo;the human spirit prevailed.&rdquo; Those are frames without paintings. The paintings are Ivanov dying among his rice. Gubchevsky describing Rembrandt to a freezing soldier. Tanya&apos;s handwriting getting weaker entry by entry. The metronome ticking over Radio Leningrad&mdash;fifty beats per minute, the heartbeat of a city that refused to go silent. A slow tick meant you were safe. A fast tick meant the bombs were coming. But as long as you could hear it, it meant the city was still alive. Something was still there, insisting on its own existence, in the dark.</p>


      <h3 className="text-sm font-medium text-muted mb-4">Sources &amp; Further Reading</h3>
      <ol className="space-y-2 text-sm text-muted/80 list-none">
      <li id="src-i"><span className="text-muted/50 mr-2">i.</span><a href="https://en.wikipedia.org/wiki/Symphony_No._7_(Shostakovich)" target="_blank" rel="noopener noreferrer" className="underline decoration-muted/30 hover:text-foreground hover:decoration-foreground/50 transition-colors">Shostakovich&apos;s Symphony No. 7 &ldquo;Leningrad&rdquo; &mdash; Wikipedia</a></li>
      <li id="src-ii"><span className="text-muted/50 mr-2">ii.</span><a href="https://en.wikipedia.org/wiki/Vavilov_Institute_of_Plant_Genetic_Resources" target="_blank" rel="noopener noreferrer" className="underline decoration-muted/30 hover:text-foreground hover:decoration-foreground/50 transition-colors">Vavilov Institute of Plant Genetic Resources &mdash; Wikipedia</a></li>
      <li id="src-iii"><span className="text-muted/50 mr-2">iii.</span><a href="https://en.wikipedia.org/wiki/Tanya_Savicheva" target="_blank" rel="noopener noreferrer" className="underline decoration-muted/30 hover:text-foreground hover:decoration-foreground/50 transition-colors">Tanya Savicheva &mdash; Wikipedia</a></li>
      <li id="src-iv"><span className="text-muted/50 mr-2">iv.</span><a href="https://www.rbth.com/history/333067-tanya-savicheva-siege-leningrad" target="_blank" rel="noopener noreferrer" className="underline decoration-muted/30 hover:text-foreground hover:decoration-foreground/50 transition-colors">The Diary of Tanya Savicheva &mdash; Russia Beyond</a></li>
      <li id="src-v"><span className="text-muted/50 mr-2">v.</span><a href="https://en.wikipedia.org/wiki/Siege_of_Leningrad" target="_blank" rel="noopener noreferrer" className="underline decoration-muted/30 hover:text-foreground hover:decoration-foreground/50 transition-colors">Siege of Leningrad &mdash; Wikipedia</a></li>
      <li id="src-vi"><span className="text-muted/50 mr-2">vi.</span><a href="https://www.google.com/books/edition/Leningrad/kMDDDwAAQBAJ" target="_blank" rel="noopener noreferrer" className="underline decoration-muted/30 hover:text-foreground hover:decoration-foreground/50 transition-colors">Anna Reid, <em>Leningrad: Tragedy of a City Under Siege, 1941&ndash;44</em> (Bloomsbury, 2011)</a></li>
      <li id="src-vii"><span className="text-muted/50 mr-2">vii.</span><a href="https://en.wikipedia.org/wiki/Leningrad_affair" target="_blank" rel="noopener noreferrer" className="underline decoration-muted/30 hover:text-foreground hover:decoration-foreground/50 transition-colors">The Leningrad Affair &mdash; Wikipedia</a></li>
      <li id="src-viii"><span className="text-muted/50 mr-2">viii.</span><a href="https://en.wikipedia.org/wiki/Siege_of_Mariupol" target="_blank" rel="noopener noreferrer" className="underline decoration-muted/30 hover:text-foreground hover:decoration-foreground/50 transition-colors">Siege of Mariupol (2022) &mdash; Wikipedia</a></li>
      <li id="src-ix"><span className="text-muted/50 mr-2">ix.</span><a href="https://ihl-databases.icrc.org/en/ihl-treaties/gciv-1949" target="_blank" rel="noopener noreferrer" className="underline decoration-muted/30 hover:text-foreground hover:decoration-foreground/50 transition-colors">Geneva Convention (IV) on the Protection of Civilian Persons in Time of War &mdash; ICRC</a></li>
      </ol>

    </ExplorationLayout>
  );
}
