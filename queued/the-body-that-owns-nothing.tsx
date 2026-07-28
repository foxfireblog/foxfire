import { ExplorationLayout } from "@/components/exploration-layout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Body That Owns Nothing — Foxfire",
  description: "Your cells, your genome, your surgical waste — and the strange law that says none of it belongs to you",
  alternates: {
    canonical: "https://foxfire.blog/explorations/the-body-that-owns-nothing",
  },
  openGraph: {
    title: "The Body That Owns Nothing",
    description: "Your cells, your genome, your surgical waste — and the strange law that says none of it belongs to you",
    images: [
      {
        url: "/og?title=The%20Body%20That%20Owns%20Nothing&category=Essay&color=red&readTime=12%20min&v=2",
        width: 1200,
        height: 630,
        alt: "The Body That Owns Nothing",
      },
    ],
  },
};

export default function TheBodyThatOwnsNothing() {
  return (
    <ExplorationLayout
      title="The Body That Owns Nothing"
      subtitle="Your cells, your genome, your surgical waste &mdash; and the strange law that says none of it belongs to you"
      category="Essay"
      categoryColor="red"
      date="July 20, 2026"
      imageSrc="/images/explorations/the-body-that-owns-nothing.webp"
      imageAlt="The Body That Owns Nothing illustration"
      readTime="12 min"
      wordCount={2673}
      prevSlug="the-radcliffe-line"
      prevTitle="The Radcliffe Line"
    nextSlug="the-despotate-of-the-morea"
    nextTitle="The Despotate of the Morea"
    nextSubtitle="The last garden of Byzantium, where scholars fled with armloads of Plato before the world went dark"
    nextCategory="Essay"
    nextCategoryColor="violet"
    nextImage="/images/explorations/the-despotate-of-the-morea.webp"
    nextReadTime="13 min"
    >
      <h2>The Sheets, Not the Body</h2>

      <p>In 1614, a man named William Haynes dug up four corpses in England. He wasn&apos;t interested in the dead themselves&mdash;he wanted their winding-sheets, the cloth wrapped around them for burial. The court convicted him of petty larceny for stealing the fabric, which belonged to whoever had wrapped the bodies. As for the corpses? The court noted, almost in passing, that a dead body could own nothing.<sup><a href="#src-i" className="text-muted/50 hover:text-foreground no-underline transition-colors">i</a></sup></p>

      <p>That was it. A footnote about linens. But Sir Edward Coke, the towering English jurist, took this throwaway observation and calcified it into a legal doctrine: <em>nullius in bonis</em>&mdash;the body is the property of no one. Not a grand philosophical argument. Not a carefully reasoned treatise on the sanctity of flesh. A case about stolen sheets, misread by a brilliant man, became the foundation upon which four centuries of Anglo-American law would rest. And that foundation says something extraordinary: you do not own your body.</p>

      <p>I find this genuinely astonishing. Not because the conclusion is necessarily wrong&mdash;there are serious reasons to be cautious about treating the human body as property&mdash;but because the reasoning is so threadbare. The entire edifice of tissue law, the framework that allows corporations to patent your genes while you have no claim to them, traces back to a grave robber who wanted some nice cloth. If you&apos;ve ever felt that the rules governing your most intimate biological self were built on something flimsy, you were right. They were built on a misunderstanding.</p>

      <h2>The Man Who Was Farmed</h2>

      <p>John Moore walked into UCLA Medical Center in 1976 with a spleen swollen to grotesque proportions&mdash;the hallmark of hairy-cell leukemia. His doctor, David Golde, removed it. Standard procedure. What was not standard was what happened next: Golde discovered that Moore&apos;s cells produced unusually valuable lymphokines, proteins with enormous commercial potential. So Golde told Moore he needed to keep coming back for follow-ups.</p>

      <p>For seven years, from 1976 to 1983, Moore flew from his home in Seattle to Los Angeles, at his own expense, believing he was receiving life-saving cancer monitoring. He wasn&apos;t. Golde was harvesting him&mdash;blood, bone marrow, semen&mdash;farming his body like a crop to sustain what would become the &ldquo;Mo cell line.&rdquo; On March 20, 1984, the U.S. Patent Office issued Patent No. 4,438,032 for that cell line. Golde acquired 75,000 shares in Genetics Institute. The Mo cell line was worth billions. Moore got nothing, because Moore didn&apos;t know.<sup><a href="#src-ii" className="text-muted/50 hover:text-foreground no-underline transition-colors">ii</a></sup></p>

      <p>When Moore finally discovered the truth and sued, the California Supreme Court ruled on July 9, 1990, in a 5&ndash;2 decision, that he had no property rights in his discarded cells. He could sue for lack of informed consent&mdash;the court acknowledged that Golde should have told him what was happening&mdash;but the cells themselves? Once they left his body, they were not his. The court&apos;s reasoning was pragmatic: if patients could claim ownership of their excised tissue, it might cripple biomedical research. The free flow of human biological materials was too important to impede with something as inconvenient as the rights of the person those materials came from.</p>

      <p>I keep returning to the image of Moore on those flights. A man in an airplane seat, anxious about his cancer, traveling across the country to be milked. The legal system looked at that man and saw a reasonable cost of innovation.</p>

      <h2>The Parents Who Drove Around Collecting Urine</h2>

      <p>If Moore&apos;s story is about a patient exploited by his doctor, the Greenberg case is about something worse: people who volunteered everything, out of love, and were betrayed by the system they helped build.</p>

      <p>Daniel and Debbie Greenberg had two children with Canavan disease, a fatal genetic disorder that destroys the brain&apos;s white matter. There is no cure. Starting in 1987, the Greenbergs worked with Dr. Reuben Matalon to find the gene responsible. They didn&apos;t just donate their own children&apos;s tissue&mdash;they became recruiters, organizers, fundraisers. Daniel Greenberg personally drove around collecting urine, blood, and tissue samples from other affected families, building the research base that Matalon needed. The families poured in money, time, grief, and biological material, united by the desperate hope that identifying the gene would make carrier testing widely available and save future children from dying the way theirs were dying.</p>

      <p>Matalon isolated the Canavan gene in 1993. And then, in October 1997, Miami Children&apos;s Hospital quietly obtained U.S. Patent No. 5,679,635&mdash;on the gene the families had helped find.<sup><a href="#src-iii" className="text-muted/50 hover:text-foreground no-underline transition-colors">iii</a></sup> The hospital began restricting carrier testing and charging royalties. The parents who had given everything to make this test possible were now legally barred from freely accessing it. When the Greenbergs sued, the court ruled on May 29, 2003, that individuals have no property rights in tissue once donated to researchers. The families&apos; flesh, blood, and money had been transmuted into someone else&apos;s intellectual property, and the law called this outcome correct.</p>

      <p>There&apos;s a word for what the Greenbergs experienced, though the court didn&apos;t use it. The word is <em>theft</em>. Not in the legal sense, because the law had already decided there was nothing to steal. But in every other sense that matters to human beings trying to save their children&apos;s lives.</p>

      <h2>The Paradox of Dignity</h2>

      <p>Here is the bind, and I want to be honest about it because this is where the issue gets genuinely hard. The courts that ruled against Moore and the Greenbergs weren&apos;t staffed by monsters. They were grappling with a real philosophical trap that traces back at least to John Locke&apos;s assertion that &ldquo;every man has a property in his own person.&rdquo; If the body is property, then property can be bought, sold, seized, foreclosed upon, and collateralized. If you own your kidney, can you sell it? If you can sell it, what stops the rich from buying the organs of the poor? What stops a creditor from claiming your bone marrow as an asset? The courts feared that classifying the body as property would legalize organ markets, slavery in new clothing, the ultimate commodification of poverty.</p>

      <p>So they chose dignity over ownership. The body is not property; it is sacred, beyond commerce. A noble principle. But here&apos;s the paradox: by declaring the body not-property to protect human dignity, the courts created a legal vacuum. You can&apos;t own your tissue&mdash;but once a researcher applies &ldquo;work or skill&rdquo; to it, <em>they</em> can own the result. This bizarre exception comes from a 1908 Australian case, <em>Doodeward v. Spence</em>, involving a preserved two-headed fetus. A body is not property unless someone transforms it through labor.<sup><a href="#src-iv" className="text-muted/50 hover:text-foreground no-underline transition-colors">iv</a></sup> You cannot own your own DNA. But the moment a biotech firm isolates, sequences, or modifies it, they can patent it and profit from it forever.</p>

      <p>The result is a system that protects human dignity in theory and violates it in practice. You are too sacred to own yourself, but not too sacred to be owned by Pfizer. The court reached for something beautiful and grabbed a trap.</p>

      <h2>Sacred Blood and the Canyon</h2>

      <p>In the 1990s, researchers from Arizona State University collected blood samples from members of the Havasupai tribe, a community of roughly 650 people living at the bottom of the Grand Canyon. The tribe was suffering from a devastating type II diabetes epidemic, and they agreed to give their blood for diabetes research. That was the understanding. That was the deal.</p>

      <p>In 2003, a Havasupai woman named Carletta Tilousi attended a lecture at ASU and discovered, with horror, that a researcher was presenting on &ldquo;inbreeding&rdquo; and &ldquo;schizophrenia&rdquo; among her people, using data derived from the blood her community had given for an entirely different purpose.<sup><a href="#src-v" className="text-muted/50 hover:text-foreground no-underline transition-colors">v</a></sup> Even worse, the blood had been used to study migration patterns, producing evidence that the Havasupai&apos;s ancestors had crossed the frozen Bering Strait&mdash;a conclusion that directly violated the tribe&apos;s foundational spiritual belief that the Grand Canyon is the literal birthplace of the human race. The researchers had used sacred material to disprove the sacred story.</p>

      <p>When the Havasupai eventually won a settlement in 2010, the money was almost beside the point. The most significant act was the physical return of the remaining blood vials. In Havasupai culture, blood and bodily fluids are not abstract biological matter&mdash;they are sacred personhood. The tribe transported the vials back to the Grand Canyon and gave them a spiritual burial, healing what they understood as a wound inflicted on their ancestors. I think about this scene often: people carrying coolers of blood down into a canyon, performing a funeral for the part of themselves that had been taken.</p>

      <p>What the Havasupai case reveals is the yawning gap between what &ldquo;broad consent&rdquo; means on paper and what it means in life. In modern biobanking, researchers increasingly require donors to sign broad consent forms&mdash;effectively blank checks for future, unspecified research. You sign, and your tissue can be used for anything, by anyone, for decades. The bioethicists call this &ldquo;consent.&rdquo; The Havasupai would call it something else.</p>

      <h2>The Woman Whose Cells Outlived Her</h2>

      <p>Henrietta Lacks was a 31-year-old Black mother of five when she sought treatment for cervical cancer in a segregated ward at Johns Hopkins in 1951. A doctor took a sample of her tumor without asking. She died on October 4 of that year. Her cells did not.</p>

      <p>The HeLa cell line became the first human cells to replicate endlessly in a laboratory&mdash;an immortal biological engine that has powered the polio vaccine, advances in cancer treatment, gene mapping, IVF research, and COVID-19 vaccine development. An estimated 50 million metric tons of HeLa cells have been grown. The commercial and scientific value is incalculable&mdash;billions of dollars, millions of lives saved. Henrietta&apos;s family, meanwhile, remained in poverty. Many couldn&apos;t afford health insurance. They learned that her cells were still alive decades later, through a chance encounter, not from Johns Hopkins.<sup><a href="#src-vi" className="text-muted/50 hover:text-foreground no-underline transition-colors">vi</a></sup></p>

      <p>For seventy years, the Lacks family received nothing. Then something shifted. In August 2023, the Lacks estate reached a historic, confidential settlement with Thermo Fisher Scientific. In February 2026, they settled with the Swiss pharmaceutical giant Novartis. In March 2026, they settled with Viatris and its subsidiary Mylan. As of mid-2026, a major unjust enrichment lawsuit against Ultragenyx remains active in federal court.<sup><a href="#src-vii" className="text-muted/50 hover:text-foreground no-underline transition-colors">vii</a></sup> The legal theory isn&apos;t property&mdash;it&apos;s unjust enrichment, a workaround that avoids the toxic question of whether Henrietta owned her cells and asks instead whether it&apos;s unconscionable for companies to profit from them without compensating her family.</p>

      <p>The settlements are a crack in the wall. Not a demolition, but a crack. Courts are starting to acknowledge that even if the law says you don&apos;t own your body, there&apos;s something obscene about a system that lets corporations build empires on a dead woman&apos;s cells while her grandchildren can&apos;t see a doctor.</p>

      <h2>Your DNA Is a Corporate Asset</h2>

      <p>In late 2023, 23andMe suffered a data breach that exposed the genetic information of 6.9 million users. The company settled a class-action lawsuit for $30 million&mdash;roughly $4.35 per person whose most intimate biological data was compromised. Then things got worse. In September 2024, seven of the company&apos;s eight board members resigned en masse, leaving only CEO Anne Wojcicki, citing the absence of a credible plan to save the company. In March 2025, 23andMe filed for Chapter 11 bankruptcy.<sup><a href="#src-viii" className="text-muted/50 hover:text-foreground no-underline transition-colors">viii</a></sup></p>

      <p>Fifteen million people&apos;s genetic data is now caught in bankruptcy proceedings. And here is the terrifying legal reality: under current law, your sequenced genome, when held by a company, is categorized as a corporate asset. It can be liquidated and sold to the highest bidder to pay off creditors, just like office furniture or server racks. 23andMe&apos;s own privacy policy states it plainly: &ldquo;If we are involved in a bankruptcy, merger, acquisition, reorganization, or sale of assets, your Personal Information may be transferred as part of that transaction.&rdquo;<sup><a href="#src-ix" className="text-muted/50 hover:text-foreground no-underline transition-colors">ix</a></sup> This isn&apos;t hypothetical anymore. This is happening.</p>

      <p>The federal protections that exist are riddled with holes. GINA, the Genetic Information Nondiscrimination Act of 2008, prevents health insurers and employers from discriminating based on your DNA. But GINA explicitly omits life insurance, long-term care insurance, and disability insurance. In 49 out of 50 states, a life insurer can legally deny you coverage or hike your premiums based on a genetic test result. Only Florida, which passed HB 1189 in July 2020, completely bars these insurers from using genetic information.<sup><a href="#src-x" className="text-muted/50 hover:text-foreground no-underline transition-colors">x</a></sup> And the biotech industry&apos;s assurance that selling your DNA is safe because it&apos;s &ldquo;anonymized&rdquo;? Geneticists have demonstrated repeatedly that cross-referencing supposedly anonymous DNA with public genealogy databases can re-identify not just an individual but their entire extended family. De-identification is a myth dressed up as a safeguard.</p>

      <p>So here we are. You spit in a tube because you were curious about your ancestry or wanted to know your risk for Parkinson&apos;s. And now your genome&mdash;the most irreducible expression of who you are, the thing that cannot be changed, cannot be revoked, cannot be un-known&mdash;is sitting on a bankruptcy court&apos;s auction block. You&apos;ll note that no one asked you. You&apos;ll note that legally, they didn&apos;t have to.</p>

      <h2>Four Hundred Years of a Misreading</h2>

      <p>Trace the doctrine back far enough and it terminates in a shroud. Haynes&apos;s Case decided who owned four winding-sheets. The observation that a corpse cannot hold property in the cloth laid over it was a fix for a problem of theft, not a considered position on what a human being is or what remains of one. Every extension since has been an extension by analogy: to organs, to tissue samples, to cell lines, to sequenced genomes, to the immortalized descendants of a cervical tumor taken without asking in 1951. Each step was small. Nobody stood at the end of the chain and checked whether the analogy had survived the distance.</p>

      <p>What disturbs me isn&apos;t the existence of biomedical research&mdash;the HeLa cells genuinely saved millions of lives, and I believe that matters enormously. What disturbs me is the architecture of pretending. The courts pretend that a man flying across the country to be secretly harvested for seven years is a reasonable cost of progress. They pretend that broad consent forms signed by people who have no idea what their tissue will be used for in thirty years constitute meaningful agreement. They pretend that ruling the body &ldquo;not property&rdquo; protects dignity, when the practical effect is to strip people of any legal tool to object when a corporation converts their flesh into profit. The whole system runs on a series of polite fictions, and the fictions always seem to benefit the same people.</p>

      <p>I think the Havasupai had it right, or at least more right than the courts. Blood is not just a fluid. A cell line is not just a product. A genome is not just data. These things carry something&mdash;call it identity, call it personhood, call it the sacred if you&apos;re not embarrassed by the word. The law needs a category for this. Not property exactly, because the courts are correct that treating the body as mere property opens terrible doors. But something. Some legal recognition that when a thing comes from inside you, built by your DNA, encoding your most private biological truths, you should have a voice in what happens to it. Not absolute ownership. Not a veto over all research. Just a voice. Just the basic acknowledgment that the source matters.</p>

      <p>We built a legal framework for human tissue out of a 1614 case about stolen sheets, and we never went back to question whether the foundation made sense. Four hundred years is a long time to run on a misunderstanding. The body that owns nothing is waiting for the law to catch up with what everyone except the law already knows: that you are not nothing, and the pieces of you are not nothing, and the fact that someone else can do clever things with those pieces does not make them any less yours.</p>


      <h3 className="text-sm font-medium text-muted mb-4">Sources &amp; Further Reading</h3>
      <ol className="space-y-2 text-sm text-muted/80 list-none">
      <li id="src-i"><span className="text-muted/50 mr-2">i.</span><span className="text-muted/60">Haynes&apos;s Case (1614), 77 Eng. Rep. 1389, origin of the English &ldquo;no property in a corpse&rdquo; rule</span></li>
      <li id="src-ii"><span className="text-muted/50 mr-2">ii.</span><a href="https://en.wikipedia.org/wiki/Moore_v._Regents_of_the_University_of_California" target="_blank" rel="noopener noreferrer" className="underline decoration-muted/30 hover:text-foreground hover:decoration-foreground/50 transition-colors">Moore v. Regents of the University of California, 51 Cal.3d 120 (1990)</a></li>
      <li id="src-iii"><span className="text-muted/50 mr-2">iii.</span><a href="https://en.wikipedia.org/wiki/Greenberg_v._Miami_Children%27s_Hospital_Research_Institute" target="_blank" rel="noopener noreferrer" className="underline decoration-muted/30 hover:text-foreground hover:decoration-foreground/50 transition-colors">Greenberg v. Miami Children&apos;s Hospital Research Institute, 264 F. Supp. 2d 1064 (2003)</a></li>
      <li id="src-iv"><span className="text-muted/50 mr-2">iv.</span><a href="https://en.wikipedia.org/wiki/Doodeward_v_Spence" target="_blank" rel="noopener noreferrer" className="underline decoration-muted/30 hover:text-foreground hover:decoration-foreground/50 transition-colors">Doodeward v. Spence (1908) &mdash; High Court of Australia &ldquo;work or skill&rdquo; exception</a></li>
      <li id="src-v"><span className="text-muted/50 mr-2">v.</span><a href="https://en.wikipedia.org/wiki/Havasupai" target="_blank" rel="noopener noreferrer" className="underline decoration-muted/30 hover:text-foreground hover:decoration-foreground/50 transition-colors">The Havasupai blood-sample litigation against the Arizona Board of Regents and its 2010 settlement (Wikipedia)</a></li>
      <li id="src-vi"><span className="text-muted/50 mr-2">vi.</span><a href="https://en.wikipedia.org/wiki/Henrietta_Lacks" target="_blank" rel="noopener noreferrer" className="underline decoration-muted/30 hover:text-foreground hover:decoration-foreground/50 transition-colors">Henrietta Lacks and the HeLa cell line &mdash; history and legacy</a></li>
      <li id="src-vii"><span className="text-muted/50 mr-2">vii.</span><a href="https://www.reuters.com/legal/litigation/" target="_blank" rel="noopener noreferrer" className="underline decoration-muted/30 hover:text-foreground hover:decoration-foreground/50 transition-colors">Lacks estate settlements with Thermo Fisher (2023), Novartis (2026), and Viatris (2026)</a></li>
      <li id="src-viii"><span className="text-muted/50 mr-2">viii.</span><a href="https://www.nytimes.com/2025/03/23/health/23andme-bankruptcy.html" target="_blank" rel="noopener noreferrer" className="underline decoration-muted/30 hover:text-foreground hover:decoration-foreground/50 transition-colors">23andMe files for Chapter 11 bankruptcy, March 2025</a></li>
      <li id="src-ix"><span className="text-muted/50 mr-2">ix.</span><a href="https://www.23andme.com/legal/privacy/" target="_blank" rel="noopener noreferrer" className="underline decoration-muted/30 hover:text-foreground hover:decoration-foreground/50 transition-colors">23andMe Privacy Policy &mdash; data transfer provisions in bankruptcy or acquisition</a></li>
      <li id="src-x"><span className="text-muted/50 mr-2">x.</span><a href="https://www.genome.gov/about-genomics/policy-issues/Genetic-Discrimination" target="_blank" rel="noopener noreferrer" className="underline decoration-muted/30 hover:text-foreground hover:decoration-foreground/50 transition-colors">GINA (2008) and its gaps &mdash; National Human Genome Research Institute</a></li>
      </ol>

    </ExplorationLayout>
  );
}
