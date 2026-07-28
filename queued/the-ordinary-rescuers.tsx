import { ExplorationLayout } from "@/components/exploration-layout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Ordinary Rescuers — Foxfire",
  description: "What made some people refuse to obey",
  alternates: {
    canonical: "https://foxfire.blog/explorations/the-ordinary-rescuers",
  },
  openGraph: {
    title: "The Ordinary Rescuers",
    description: "What made some people refuse to obey",
    images: [
      {
        url: "/og?title=The%20Ordinary%20Rescuers&category=Essay&color=amber&readTime=12%20min&v=2",
        width: 1200,
        height: 630,
        alt: "The Ordinary Rescuers",
      },
    ],
  },
};

export default function TheOrdinaryRescuers() {
  return (
    <ExplorationLayout
      title="The Ordinary Rescuers"
      subtitle="What made some people refuse to obey"
      category="Essay"
      categoryColor="amber"
      date="March 31, 2026"
      imageSrc="/images/explorations/the-ordinary-rescuers.webp"
      imageAlt="The Ordinary Rescuers illustration"
      readTime="12 min"
      wordCount={2828}
      prevSlug="the-banality-of-evil"
      prevTitle="The Banality of Evil"
    nextSlug="the-haitian-revolution-part-2"
    nextTitle="The Haitian Revolution: The Price of Freedom (Part II of II)"
    nextSubtitle="Napoleon's invasion, independence, the 1825 indemnity, and 200 years of consequences"
    nextCategory="Essay"
    nextCategoryColor="red"
    nextImage="/images/explorations/the-haitian-revolution-part-2.webp"
    nextReadTime="13 min"
    >
      <h2>The Knock</h2>

      <p>Almost no one went looking for someone to save. That is the first thing the archives give up, and it stubbornly refuses to go away. The rescue almost always began the same way&mdash;a knock at the door. A face, bloodied or terrified or simply exhausted beyond the point of pretense, appeared on a doorstep that belonged to someone who, until that moment, had been ordinary. A cashier. A farmer. A nanny. The knock came, and a question was posed that had no comfortable answer. Not a philosophical question. Not a theological question. A human one: Will you let me in?</p>

      <p>Josef Diamant had jumped from a train headed to a death camp. He staggered through the streets of Przemyśl, bleeding, and knocked on the door of a sixteen-year-old Catholic girl named Stefania Podgórska&mdash;a former employee of his family&apos;s grocery store. She told him he could stay for one night.<sup><a href="#src-i" className="text-muted/50 hover:text-foreground no-underline transition-colors">i</a></sup> He ended up staying in her attic with twelve other Jewish refugees. The SS eventually requisitioned her cottage and moved into a downstairs bedroom. For seven months, thirteen people lay motionless on floorboards directly above sleeping German officers, and Stefania crept upstairs to gently wake anyone who began to snore. She was sixteen years old.</p>

      <p>I keep returning to this story because it refuses to be heroic in the way we usually mean. Stefania didn&apos;t have a plan. She didn&apos;t have a manifesto. She had a doorstep and a bleeding man on it, and she couldn&apos;t say no. This is, I think, the most important and most uncomfortable truth about moral courage: it almost never begins with courage. It begins with an inability to look away.</p>

      <h2>The Numbers and the Silence</h2>

      <p>As of January 2024, Yad Vashem has officially recognized 28,707 individuals from 51 countries as &ldquo;Righteous Among the Nations&rdquo;&mdash;non-Jews who risked their lives to save Jews during the Holocaust.<sup><a href="#src-ii" className="text-muted/50 hover:text-foreground no-underline transition-colors">ii</a></sup> Poland leads with 7,318 recognized rescuers. The Netherlands follows with 6,137. France with 4,303. These numbers deserve a moment of silence, but not for the reason you might think. The silence should be for what the numbers reveal about everyone else.</p>

      <p>Twenty-eight thousand people, across an entire continent, over a period of years. In a Europe of hundreds of millions. The math is obscene. For every person who opened a door, there were thousands&mdash;tens of thousands&mdash;who heard the knock and did not answer, or answered and said no, or never even had to face the question because they had already arranged their lives so the knock could never reach them. The psychologist Ervin Staub made a point that I find genuinely chilling: passive bystanders didn&apos;t merely fail to help. Their inaction actively encouraged the perpetrators by signaling that the violence was socially acceptable.<sup><a href="#src-iii" className="text-muted/50 hover:text-foreground no-underline transition-colors">iii</a></sup> Silence is not neutral. Silence is a vote.</p>

      <p>This is the context in which the rescuers must be understood. They were not acting in a moral vacuum where the right thing to do was obvious and the only cost was personal danger. They were acting against the full weight of social consensus. Their neighbors, their governments, their churches, their newspapers, their police&mdash;the entire architecture of ordinary life had been reorganized to make what they did unthinkable. What interests me is not that they were brave. Bravery is common enough; soldiers are brave. What interests me is that they were <em>deviant</em>. They were the people who, when the world agreed on something monstrous, could not bring themselves to agree.</p>

      <h2>The Childhood You Almost Wouldn&apos;t Notice</h2>

      <p>In 1988, Samuel Oliner&mdash;himself a Holocaust survivor who had been rescued as a child by a Polish peasant woman&mdash;published <em>The Altruistic Personality</em> with his wife Pearl. They had interviewed over 700 people: verified rescuers, bystanders who had the opportunity to help but didn&apos;t, and a control group. It remains one of the most rigorous empirical studies of moral behavior ever conducted, and its central finding is one that should quietly revolutionize how we raise children.<sup><a href="#src-iv" className="text-muted/50 hover:text-foreground no-underline transition-colors">iv</a></sup></p>

      <p>The Oliners expected to find that religious faith was the engine of rescue. It wasn&apos;t. There was no significant difference in religious identification between rescuers and bystanders. Devout Christians rescued Jews; devout Christians turned them away. The variable that predicted rescue had nothing to do with what people believed and everything to do with how they had been disciplined as children. Bystanders were significantly more likely to have been raised with strict, physical punishment that emphasized unquestioning obedience to authority. Rescuers were significantly more likely to have been raised by parents who relied on reasoning&mdash;who, when a child did something wrong, explained <em>why</em> the action caused harm to another person.<sup><a href="#src-v" className="text-muted/50 hover:text-foreground no-underline transition-colors">v</a></sup></p>

      <p>Let that sink in. The difference between opening the door and closing it, between a life saved and a life lost, correlated not with ideology, not with theology, not with political affiliation, but with whether your mother, when you pulled your sister&apos;s hair at age four, hit you and said &ldquo;Don&apos;t do that&rdquo; or knelt down and said &ldquo;That hurts her. How would you feel?&rdquo; The Oliners called the key trait <em>extensivity</em>&mdash;the propensity to extend one&apos;s sense of moral obligation beyond one&apos;s own group to all of humanity. And extensivity was seeded, almost without exception, in early childhood, in homes where empathy was not assumed but taught, patiently, through explanation rather than force.</p>

      <p>This finding is, frankly, terrifying in its implications. It means that moral courage is not, or not primarily, a product of the dramatic moment. It is built slowly, invisibly, in thousands of forgotten conversations between parents and small children. The rescue happened decades later. The foundation was laid when the rescuer was three.</p>

      <h2>The Misfits</h2>

      <p>Nechama Tec was a Holocaust survivor. Catholic Poles had hidden her and her family during the war, and she spent the rest of her life trying to understand why. Her book <em>When Light Pierced the Darkness</em> (1986) arrived at a finding that complements the Oliners&apos; but takes a sharper, stranger turn. The trait she identified as central to rescue was <em>marginality</em>&mdash;what she more precisely called &ldquo;individuality.&rdquo;<sup><a href="#src-vi" className="text-muted/50 hover:text-foreground no-underline transition-colors">vi</a></sup></p>

      <p>Rescuers, Tec found, were disproportionately people who had been social outsiders <em>before</em> the war. They were the eccentric, the contrarian, the person who didn&apos;t quite belong. A communist living in a deeply Catholic village. An intellectual among peasants. A woman with unconventional views in a traditional community. They were people who had already, in peacetime, developed the psychological muscle of not caring what their neighbors thought of them. When the regime demanded conformity in genocide, they had been practicing nonconformity for years. Defiance was not a new behavior; it was an old one, scaled up to meet a monstrous occasion.</p>

      <p>I find this finding beautiful and deeply unsettling. It means that the very traits we often punish in peacetime&mdash;stubbornness, eccentricity, a refusal to go along&mdash;may be precisely the traits that save lives in crisis. The person who annoys you at Thanksgiving dinner because they won&apos;t let a casual bigotry pass without comment. The colleague who won&apos;t sign the petition everyone else has signed. The neighbor whose yard is too messy, whose politics are too strange, whose life is just a little too different. We should be more careful about what we call &ldquo;not fitting in.&rdquo;</p>

      <p>Consider the case of Alexander Roslan, a pre-war black-market dealer in Poland. His peacetime skills were, by any conventional moral standard, unsavory: smuggling, bribing officials, forging documents. When the war came, he used every one of those skills to shelter three Jewish children. The smuggler&apos;s network became an underground railroad. The forger&apos;s hands made new identities. The man who had learned to move invisibly through a corrupt system used that invisibility to save lives.<sup><a href="#src-vii" className="text-muted/50 hover:text-foreground no-underline transition-colors">vii</a></sup> Virtue, it turns out, does not always arrive dressed in virtue&apos;s clothes.</p>

      <h2>The Double Life and Its Cost</h2>

      <p>Eva Fogelman, the social psychologist who spent years interviewing rescuers for her 1994 book <em>Conscience and Courage</em>, made a discovery that speaks to something I think about constantly: the cost of goodness. She broke rescuer motivations into five categories&mdash;moral rescuers (32%), Judeophiles (28%), network or political rescuers (22%), children of rescuers (12%), and professionals like doctors and social workers (5%).<sup><a href="#src-viii" className="text-muted/50 hover:text-foreground no-underline transition-colors">viii</a></sup> But what unified all of them was not their motivation. It was what the act of rescue did to their psyche.</p>

      <p>To save a life under Nazi occupation, deeply moral people had to become master liars, smugglers, and thieves. They had to deceive their neighbors, their friends, sometimes their own family members. They had to live in constant, unrelenting terror&mdash;not the clean terror of a battlefield, but the grinding, intimate terror of knowing that a child&apos;s cough from behind a false wall could kill everyone in the house. Fogelman found that to survive this, rescuers developed what she called a &ldquo;rescuer self&rdquo;&mdash;a compartmentalized identity, almost an alter ego, that could do what needed to be done without being psychologically destroyed by the fear.</p>

      <p>And then the war ended. And the rescuer self was no longer needed. And the rescuers discovered something nobody had warned them about: you cannot just put away a self you have lived inside for years. Many suffered severe post-war trauma. They had been heroes in secret and now they were nobody again, ordinary people in an ordinary world that had no use for the extraordinary skills they had developed. Some were shunned by neighbors who had collaborated. Some were actively punished by post-war Communist regimes that did not want stories of individual moral heroism disrupting the narrative of collective suffering. In Ukraine, the stories of roughly 2,700 recognized rescuers were deliberately suppressed during the entire Soviet era; only in 2021 did Ukraine officially introduce a Remembrance Day for Ukrainians who rescued Jews.<sup><a href="#src-ix" className="text-muted/50 hover:text-foreground no-underline transition-colors">ix</a></sup></p>

      <p>The rescuer self is, I think, one of the most haunting concepts I have ever encountered. It means that doing good under conditions of extreme evil requires a kind of self-violence&mdash;a splitting of your own identity that leaves scars. It means that moral courage is not free. It costs something even when it works.</p>

      <h2>A Village That Said No</h2>

      <p>Le Chambon-sur-Lignon is a small mountain village in south-central France, populated largely by Protestant Huguenots&mdash;a religious minority that had its own centuries-long history of persecution by the Catholic majority. When the Vichy government began rounding up Jews, the village, under the leadership of Pastor André Trocmé, collectively decided to refuse. Not individually. Collectively. The entire town became a conspiracy of rescue.</p>

      <p>The details are astonishing. Villagers forged ration cards. They hid children in farmhouses scattered across the mountainside. They routinely escorted refugees on foot through freezing mountain passes to Switzerland. Lookouts would ring church bells in specific patterns to warn of approaching police. Over the course of the war, Le Chambon and its surrounding communities sheltered approximately 5,000 Jews.<sup><a href="#src-x" className="text-muted/50 hover:text-foreground no-underline transition-colors">x</a></sup> When Vichy authorities demanded that Trocmé hand over the Jews, he refused. He scrawled in the margin of his Bible: &ldquo;Happy are those hungry and thirsty of justice...&rdquo; His philosophy was blunt and unsentimental: &ldquo;People who agonize don&apos;t act, people who act don&apos;t agonize.&rdquo;</p>

      <p>Le Chambon is the exception that tests the rule. Most rescue was individual, isolated, terrified. Le Chambon was communal, organized, almost defiant. And the reason matters: the Huguenots already understood themselves as outsiders. They had collective memory of being hunted, of hiding in mountains, of being the minority that the majority wanted dead. Tec&apos;s concept of marginality, applied to an entire community. When the state came for someone else&apos;s children, the Huguenots of Le Chambon recognized the sound. They had heard that knock before.</p>

      <h2>What Milgram Missed</h2>

      <p>We tell the story of Stanley Milgram&apos;s obedience experiments (1961&ndash;1974) as a story about obedience. Subjects were told by an authority figure to deliver what they believed were increasingly painful electric shocks to another person. Sixty-five percent went all the way to the maximum voltage. The conventional interpretation&mdash;Milgram&apos;s own&mdash;was that people enter an &ldquo;agentic state,&rdquo; surrendering their moral autonomy to authority and focusing not on what is right but on being a good subordinate.<sup><a href="#src-xi" className="text-muted/50 hover:text-foreground no-underline transition-colors">xi</a></sup></p>

      <p>But recent scholarship, drawing on Milgram&apos;s own archival data, has complicated this picture considerably. The subjects who obeyed didn&apos;t just passively comply. Many of them actively <em>identified</em> with the experimenter&apos;s stated mission&mdash;the advancement of science, the importance of the research. They weren&apos;t mindless cogs. They believed they were doing something good. This reinterpretation has profound implications for understanding not just obedience but perpetration. The Germans who participated in the Holocaust were not, for the most part, people who had switched off their moral reasoning. They were people who had switched it on&mdash;but in the service of a different moral framework, one in which the extermination of Jews was a <em>good</em> thing, a necessary sacrifice for the health of the nation.</p>

      <p>This is harder to sit with than the original Milgram story. It&apos;s more comforting to believe that evil is the result of moral sleep&mdash;that if we just stay awake, stay alert, we&apos;ll be fine. The darker truth is that evil is often wide awake. It has its own reasons. It thinks it&apos;s right. The rescuers survived psychologically not because they were more awake, but because they were plugged into a completely different moral framework&mdash;one in which the person at the door was not an abstraction or a category or a threat to national health, but a face. A specific, irreplaceable face, bleeding on their doorstep.</p>

      <p>Marion van Binsbergen, a Dutch woman, registered newborn Jewish babies as her own children&mdash;an extraordinary administrative deception that saved multiple infants within a span of five months. Maria Babych, a Ukrainian nanny in occupied Rivne, rescued a Jewish girl named Irit Osipowa; after the war, the bond between them was so profound that Babych emigrated to Israel with the Osipow family. These are not stories of obedience or disobedience. They are stories of people who saw a face and could not unsee it.</p>

      <h2>The Habit of Seeing Faces</h2>

      <p>None of these people describe having decided in advance. There is no rehearsal in the record, no moment of resolve in a quiet room, no plan filed away against the day it might be needed. There was a knock, and then there was an answer, and the answer came out of whatever the person had already become by the time the knocking started. Stefania Podgórska was sixteen and said one night. The villagers of Le Chambon were already in the habit of taking in strangers, and had been for three hundred years. Marion van Binsbergen wrote her own name on a stranger&apos;s child&apos;s birth certificate because that was the document in front of her and the child was in the room. The choice was not made at the door. It was only revealed there.</p>

      <p>The research keeps pointing at the same thing. The trait that predicted rescue&mdash;extensivity, the ability to extend moral concern to those outside your group&mdash;is not, at bottom, an emotion. It is a <em>pattern of attention</em>. It is the habit of seeing the full humanity of someone who is not like you. It is, in a way, a perceptual skill. And the thing that predicted its absence was not cruelty but a certain kind of training: the training to obey without asking why, to accept categories without questioning them, to see the world in terms of who belongs and who doesn&apos;t.</p>

      <p>Nechama Tec died in August 2023, at ninety-two. Stefania Podgórska died in 2018, at ninety-seven. The last of the rescuers are leaving us. What remains are the studies&mdash;Oliner, Tec, Fogelman&mdash;and the stories, and the strange, persistent, inconvenient question they pose to every generation: not <em>would you have opened the door?</em> (everyone says yes to that; it costs nothing to say yes in a warm room) but rather, <em>are you the kind of person who would open the door?</em> Have you been shaped that way? Have you practiced not fitting in? Have you maintained the habit of seeing faces instead of categories?</p>

      <p>Trocmé said there is a point where agonizing must stop and acting must begin, and that sentence is the hinge the whole literature turns on. Nothing in Oliner or Tec or Fogelman suggests that people who could explain extensivity were any better at practicing it. The rescuers themselves were mostly unable to explain what they had done, and found the question faintly irritating; several of them got annoyed at the interviewers for asking. What the studies describe is not a belief but a habit, laid down years earlier, in households where children were reasoned with instead of struck, in villages that had spent three centuries being the wrong kind of Protestant, in the ordinary long practice of not quite fitting in. Understanding arrives late and slowly. The knock arrives without warning, and it does not wait while you think. Whatever a person has become by then is what answers the door. Stefania Podgórska was sixteen, and she opened it to a bleeding man she barely knew, and she told him one night. Thirteen people lived.</p>


      <h3 className="text-sm font-medium text-muted mb-4">Sources &amp; Further Reading</h3>
      <ol className="space-y-2 text-sm text-muted/80 list-none">
      <li id="src-i"><span className="text-muted/50 mr-2">i.</span><a href="https://en.wikipedia.org/wiki/Stefania_Podg%C3%B3rska" target="_blank" rel="noopener noreferrer" className="underline decoration-muted/30 hover:text-foreground hover:decoration-foreground/50 transition-colors">Stefania Podg&oacute;rska &mdash; Wikipedia</a></li>
      <li id="src-ii"><span className="text-muted/50 mr-2">ii.</span><a href="https://en.wikipedia.org/wiki/Righteous_Among_the_Nations" target="_blank" rel="noopener noreferrer" className="underline decoration-muted/30 hover:text-foreground hover:decoration-foreground/50 transition-colors">Righteous Among the Nations &mdash; Wikipedia</a></li>
      <li id="src-iii"><span className="text-muted/50 mr-2">iii.</span>Ervin Staub, <em>The Roots of Evil: The Origins of Genocide and Other Group Violence</em> (Cambridge University Press, 1989).</li>
      <li id="src-iv"><span className="text-muted/50 mr-2">iv.</span>Samuel P. Oliner and Pearl M. Oliner, <em>The Altruistic Personality: Rescuers of Jews in Nazi Europe</em> (Free Press, 1988).</li>
      <li id="src-v"><span className="text-muted/50 mr-2">v.</span>David R. Blumenthal, <em>The Banality of Good and Evil: Moral Lessons from the Shoah and Jewish Tradition</em> (Georgetown University Press, 1999).</li>
      <li id="src-vi"><span className="text-muted/50 mr-2">vi.</span>Nechama Tec, <em>When Light Pierced the Darkness: Christian Rescue of Jews in Nazi-Occupied Poland</em> (Oxford University Press, 1986).</li>
      <li id="src-vii"><span className="text-muted/50 mr-2">vii.</span>Eva Fogelman, <em>Conscience and Courage: Rescuers of Jews During the Holocaust</em> (Anchor/Doubleday, 1994).</li>
      <li id="src-viii"><span className="text-muted/50 mr-2">viii.</span>Fogelman&apos;s rescuer typology, set out in <em>Conscience and Courage</em> (1994).</li>
      <li id="src-ix"><span className="text-muted/50 mr-2">ix.</span>Recognition of Ukrainian Righteous Among the Nations &mdash; Ukrainian Jewish Encounter. (Original link retired; citation retained unlinked.)</li>
      <li id="src-x"><span className="text-muted/50 mr-2">x.</span><a href="https://encyclopedia.ushmm.org/content/en/article/le-chambon-sur-lignon" target="_blank" rel="noopener noreferrer" className="underline decoration-muted/30 hover:text-foreground hover:decoration-foreground/50 transition-colors">Le Chambon-sur-Lignon &mdash; United States Holocaust Memorial Museum</a></li>
      <li id="src-xi"><span className="text-muted/50 mr-2">xi.</span><a href="https://www.simplypsychology.org/milgram.html" target="_blank" rel="noopener noreferrer" className="underline decoration-muted/30 hover:text-foreground hover:decoration-foreground/50 transition-colors">Milgram&apos;s obedience experiments &mdash; Simply Psychology</a></li>
      </ol>

    </ExplorationLayout>
  );
}
