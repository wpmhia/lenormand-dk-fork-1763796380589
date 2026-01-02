"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BreadcrumbNav } from "@/components/BreadcrumbNav";
import { LearningProgressTracker } from "@/components/LearningProgressTracker";
import { BackToTop } from "@/components/BackToTop";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  MapPin,
  User,
  Crown,
  BookOpen,
  Sparkles,
} from "lucide-react";

export default function HistoryPage() {
  const timeline = [
    {
      year: "1770s-1820s",
      title: "Marie Anne Adelaide Lenormand's Era",
      description:
        "The legendary French fortune teller Marie Anne Adelaide Lenormand (1772-1843) gains fame for her readings and high-profile clientele including Napoleon and Josephine. She becomes one of the most celebrated diviners of her time.",
      icon: User,
      color: "from-primary to-primary/80",
    },
    {
      year: "Early 1800s",
      title: "Early Divination Decks",
      description:
        "Various fortune-telling decks emerge during this era. While directly attributed to Lenormand posthumously, these decks evolved from the broader tradition of European cartomancy that flourished during her lifetime.",
      icon: BookOpen,
      color: "from-primary to-primary/80",
    },
    {
      year: "1840s-1890s",
      title: "Posthumous Popularization",
      description:
        "After Lenormand's death in 1843, the 36-card system becomes widely known as the Lenormand deck. Publishers capitalize on her name and legacy, creating standardized versions and interpretation guides that shaped modern Lenormand readings.",
      icon: Crown,
      color: "from-primary to-primary/80",
    },
    {
      year: "Modern Era",
      title: "Global Revival & Evolution",
      description:
        "Contemporary artists and readers honor Lenormand's legacy by creating beautiful new decks and refined interpretations. Modern Lenormand combines historical tradition with contemporary insights, respecting the symbolic heritage even as it continues to evolve.",
      icon: Sparkles,
      color: "from-primary to-primary/80",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="border-b border-border bg-card/50 backdrop-blur">
        <div className="container mx-auto max-w-4xl px-4 py-4">
          <BreadcrumbNav
            items={[
              { name: "Home", url: "/" },
              { name: "Learn", url: "/learn" },
              { name: "History & Origins", url: "/learn/history" },
            ]}
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="border-b border-border bg-card/80 backdrop-blur">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/learn">
              <Button
                variant="ghost"
                size="sm"
                className="text-primary hover:text-primary/80"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Course
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <Badge className="border-primary/30 bg-primary/10 text-primary dark:border-primary/40 dark:bg-primary/20 dark:text-primary">
                Module 2 of 7
              </Badge>
              <Badge className="border-primary/30 bg-primary/10 text-primary dark:border-primary/40 dark:bg-primary/20 dark:text-primary">
                Beginner
              </Badge>
            </div>
            <Link href="/learn/reading-basics">
              <Button
                variant="ghost"
                size="sm"
                className="text-primary hover:text-primary/80"
              >
                Next Module
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Module Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary/80">
              <Clock className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
            History & Origins
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Journey through time to discover how Lenormand divination evolved
            from 18th century France to become a global phenomenon.
          </p>
          <div className="mt-4 flex items-center justify-center space-x-4 text-sm text-primary">
            <div className="flex items-center">
              <Clock className="mr-1 h-4 w-4" />
              20 minutes
            </div>
            <div className="flex items-center">
              <MapPin className="mr-1 h-4 w-4" />
              Beginner Level
            </div>
          </div>
        </div>

        {/* Marie Lenormand */}
        <Card className="mb-8 border-border bg-card">
          <CardHeader>
            <CardTitle
              id="marie-anne-biography"
              className="flex items-center text-2xl text-foreground"
            >
              <User className="mr-3 h-6 w-6 text-primary" />
              Marie Anne Adelaide Lenormand
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="mb-3 font-semibold text-foreground">
                  Early Life & Education
                </h3>
                <p className="leading-relaxed text-muted-foreground">
                  Marie Anne Adelaide Lenormand was born on{" "}
                  <strong>May 27, 1772</strong> in{" "}
                  <strong>Alençon, Normandy, France</strong>, to Jean Louis
                  Antoine Lenormand (a draper) and Marie Anne Lenormand (née
                  Gilbert). Orphaned at the age of five, she was educated in a
                  convent school. This early religious education would shape her
                  spiritual worldview throughout her life.
                </p>
              </div>

              <div>
                <h3 className="mb-3 font-semibold text-foreground">
                  Coming of Age During the French Revolution
                </h3>
                <p className="leading-relaxed text-muted-foreground">
                  Lenormand left Alençon for <strong>Paris in 1786</strong> at
                  approximately age 14. Remarkably, at age 17, she witnessed the{" "}
                  <strong>storming of the Bastille on July 14, 1789</strong>—a
                  pivotal moment in history. She came of age during the
                  turbulent French Revolution, which would profoundly influence
                  her practice and clientele.
                </p>
              </div>

              <div>
                <h3 className="mb-3 font-semibold text-foreground">
                  A Legendary Diviner (1790s-1820s)
                </h3>
                <p className="leading-relaxed text-muted-foreground">
                  Lenormand built her reputation over more than{" "}
                  <strong>40 years of active practice</strong>. She claimed to
                  have given cartomantic advice to many famous persons,
                  including:
                </p>
                <ul className="mt-2 space-y-1 pl-4 text-sm text-muted-foreground">
                  <li>
                    • <strong>Leaders of the French Revolution:</strong>{" "}
                    Jean-Paul Marat, Maximilien Robespierre, and Louis Antoine
                    de Saint-Just
                  </li>
                  <li>
                    • <strong>Empress Josephine</strong> (wife of Napoleon
                    Bonaparte)
                  </li>
                  <li>
                    • <strong>Tsar Alexander I</strong> of Russia
                  </li>
                  <li>
                    • <strong>Napoleon Bonaparte</strong> and members of French
                    aristocracy
                  </li>
                </ul>
                <p className="mt-3 leading-relaxed text-muted-foreground">
                  She became known as &ldquo;the Sibyl of the Faubourg
                  Saint-Germain,&rdquo; famous for her direct, practical
                  readings and accurate predictions about political and personal
                  matters.
                </p>
              </div>

              <div>
                <h3 className="mb-3 font-semibold text-foreground">
                  Imprisonment & Controversy (1809)
                </h3>
                <p className="leading-relaxed text-muted-foreground">
                  In <strong>1809</strong>, Lenormand was arrested and
                  imprisoned for her activities. She published a memoir about
                  this experience titled{" "}
                  <em>
                    &ldquo;Les Souvenirs prophétiques d&apos;une sibylle sur les
                    causes secrètes de son arrestation&rdquo;
                  </em>{" "}
                  (The Prophetic Memories of a Sibyl on the Secret Causes of Her
                  Arrest). Though she was imprisoned more than once, these
                  periods were never lengthy. Her notoriety only increased her
                  mystique and fame.
                </p>
              </div>

              <div>
                <h3 className="mb-3 font-semibold text-foreground">
                  Second Career as a Published Author (1814+)
                </h3>
                <p className="leading-relaxed text-muted-foreground">
                  In <strong>1814</strong>, Lenormand began a second literary
                  career, publishing numerous texts that sparked public
                  controversies. She authored at least{" "}
                  <strong>13 major works</strong>, including:
                </p>
                <ul className="mt-2 space-y-1 pl-4 text-sm text-muted-foreground">
                  <li>
                    • <em>Les Souvenirs prophétiques d&apos;une sibylle</em>{" "}
                    (1814) - 592 pages - Her foundational memoir about her
                    arrest
                  </li>
                  <li>
                    •{" "}
                    <em>
                      Anniversaire de la mort de l&apos;impératrice Josephine
                    </em>{" "}
                    (1815) - Anniversary reflections on Empress Josephine
                  </li>
                  <li>
                    • <em>La sibylle au tombeau de Louis XVI</em> (1816) - The
                    Sibyl at the Tomb of Louis XVI
                  </li>
                  <li>
                    •{" "}
                    <em>
                      Les oracles sibyllins ou la suite des souvenirs
                      prophétiques
                    </em>{" "}
                    (1817) - 528 pages - Continuation of her prophetic memories
                  </li>
                  <li>
                    • <em>La sibylle au congrès d&apos;Aix-la-Chapelle</em>{" "}
                    (1819) - 316 pages - The Sibyl at the Congress of Aachen
                  </li>
                  <li>
                    •{" "}
                    <em>
                      Mémoires historiques et secrets de l&apos;impératrice
                      Joséphine
                    </em>{" "}
                    (1820) - 556 pages - Historical and secret memoirs of
                    Empress Josephine
                  </li>
                  <li>
                    • <em>Mémoire justificatif présenté par Mlle Le Normand</em>{" "}
                    (1821) - Justificatory Memoir
                  </li>
                  <li>
                    • <em>Cri de l&apos;honneur</em> (1821) - Cry of Honor
                  </li>
                  <li>
                    • <em>Souvenirs de la Belgique</em> (1822) - 416 pages -
                    Memories of Belgium
                  </li>
                  <li>
                    •{" "}
                    <em>
                      L&apos;ange protecteur de la France au tombeau de Louis
                      XVIII
                    </em>{" "}
                    (1824) - The Guardian Angel of France
                  </li>
                  <li>
                    •{" "}
                    <em>
                      L&apos;ombre immortelle de Catherine II au tombeau
                      d&apos;Alexandre Ier
                    </em>{" "}
                    (1826) - The Immortal Shadow of Catherine II
                  </li>
                  <li>
                    • <em>L&apos;ombre de Henri IV au palais d&apos;Orléans</em>{" "}
                    (1830) - 107 pages - The Shadow of Henry IV
                  </li>
                  <li>
                    • <em>Le petit homme rouge au château des Tuileries</em>{" "}
                    (1831) - 107 pages - The Little Red Man at the Tuileries
                    Palace
                  </li>
                </ul>
                <p className="mt-3 leading-relaxed text-muted-foreground">
                  These works established her as a major literary and historical
                  figure, not merely a fortune teller, but a political
                  commentator and memoirist of her era. She continued publishing
                  until the 1830s, with additional works on French politics and
                  history.
                </p>
              </div>

              <div>
                <h3 className="mb-3 font-semibold text-foreground">
                  Legacy & Wealth
                </h3>
                <p className="leading-relaxed text-muted-foreground">
                  Marie Anne Lenormand died in{" "}
                  <strong>Paris on June 25, 1843</strong> at the age of 71. She
                  left behind a substantial fortune of{" "}
                  <strong>500,000 Francs</strong> (an enormous sum for the
                  time), a testament to her successful practice and
                  publications. She is buried in{" "}
                  <strong>Division 3 of Père Lachaise Cemetery</strong> in
                  Paris, France—the most prestigious cemetery in the city.
                </p>
                <p className="mt-2 leading-relaxed text-muted-foreground">
                  Interestingly, she had no heirs other than a nephew who was in
                  the army at the time of her death. A devout Catholic, her
                  nephew burned all of her occult paraphernalia after inheriting
                  her fortune, preserving only the monetary wealth she left
                  behind.
                </p>
              </div>
            </div>

            <hr className="my-4 border-border" />

            <p className="leading-relaxed text-muted-foreground">
              <strong>Important Note:</strong> While Lenormand was a legendary
              diviner, she did not leave behind a documented system specifically
              for the 36-card deck that now bears her name. The modern Lenormand
              system and interpretations were developed and popularized{" "}
              <em>after her death</em> by publishers and readers who honored her
              legacy by associating the deck with her name. The symbolic
              language and reading traditions we know today as Lenormand evolved
              from the broader European cartomantic traditions of her era and
              the decades following.
            </p>
            <div className="rounded-lg border border-border bg-muted p-4">
              <p className="text-sm italic text-foreground">
                This platform respects Lenormand&apos;s historical significance
                while offering interpretations inspired by the spirit of
                divination traditions connected to her legacy—a living tradition
                that honors the past while continuing to evolve.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Origins of the Deck Section */}
        <Card className="mb-8 border-border bg-card">
          <CardHeader>
            <CardTitle
              id="origins-of-the-deck"
              className="flex items-center text-2xl text-foreground"
            >
              <BookOpen className="mr-3 h-6 w-6 text-primary" />
              The True Origins: Das Spiel der Hoffnung
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="mb-3 font-semibold text-foreground">
                Before Lenormand: A German Board Game
              </h3>
              <p className="leading-relaxed text-muted-foreground">
                The 36-card Lenormand deck we know today is not directly created
                by Marie Anne Lenormand herself. Rather, it evolved from a
                German board game called{" "}
                <strong>
                  <em>Das Spiel der Hoffnung</em>
                </strong>{" "}
                (<strong>The Game of Hope</strong>), which was published around{" "}
                <strong>1799</strong> by <strong>Johann Kaspar Hechtel</strong>{" "}
                of <strong>Nuremberg, Germany</strong>.
              </p>
            </div>

            <div>
              <h3 className="mb-3 font-semibold text-foreground">
                A Game of Chance Becomes a Divination Tool
              </h3>
              <p className="leading-relaxed text-muted-foreground">
                Originally, Das Spiel der Hoffnung was designed as a board game
                of chance. The 36 cards were arranged in a 6×6 grid and played
                with a pair of six-sided dice. Card #1 (The Rider) marked the
                start, and Card #35 (The Anchor/Hope) marked the goal. Players
                moved around the grid based on dice rolls:
              </p>
              <ul className="mt-2 space-y-1 pl-4 text-sm text-muted-foreground">
                <li>
                  • Some cards granted money from the pot or advanced the player
                </li>
                <li>
                  • Others forced payment into the pot or moved players backward
                </li>
                <li>
                  • Landing on Card #8 (The Coffin) trapped you until rolling
                  doubles
                </li>
                <li>
                  • Overshooting Card #35 onto Card #36 (The Cross) also trapped
                  the player
                </li>
              </ul>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                Remarkably, each card also depicted German- or French-suited
                playing cards in the upper field, allowing the deck to function
                as a standard 36-card German playing card deck as well.
              </p>
            </div>

            <div>
              <h3 className="mb-3 font-semibold text-foreground">
                From Game to Divination Deck
              </h3>
              <p className="leading-relaxed text-muted-foreground">
                While Das Spiel der Hoffnung was popular as a game, its
                structure naturally lent itself to fortune-telling. The symbolic
                meanings of the cards and their narrative flow made them ideal
                for divination through card spreads. This is where
                fortune-tellers like Marie Anne Lenormand came in—not as
                creators of the deck, but as brilliant interpreters who
                recognized the divinatory potential of these cards.
              </p>
            </div>

            <div>
              <h3 className="mb-3 font-semibold text-foreground">
                Posthumous Naming & Modern Legacy
              </h3>
              <p className="leading-relaxed text-muted-foreground">
                After Lenormand&apos;s death in 1843, publishers capitalized on
                her legendary fame and reputation. The 36-card deck became
                widely marketed under her name as the{" "}
                <strong>&quot;Petit Lenormand&quot;</strong> (Little Lenormand),
                even though Lenormand never formally created it. The deck&apos;s
                association with her name enhanced its mystique and helped
                popularize it across Europe, particularly in France, Germany,
                Eastern Europe, Russia, and eventually Brazil.
              </p>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                This naming convention—while historically inaccurate—proved
                brilliant for the deck&apos;s global expansion. Lenormand&apos;s
                documented reputation as an accurate and respected diviner lent
                credibility to the cards that bore her name.
              </p>
            </div>

            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <p className="text-sm text-foreground">
                <strong>Historical Note:</strong> The symbiotic relationship
                between Das Spiel der Hoffnung and Marie Anne Lenormand&apos;s
                fame shows how history is not always straightforward. The cards
                were not invented by Lenormand, but her legendary status as a
                diviner ensured they would be remembered by her name for
                centuries to come.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Historical Timeline */}
        <Card className="mb-8 border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl text-foreground">
              <Clock className="mr-3 h-6 w-6 text-primary" />
              The Evolution of Lenormand
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {timeline.map((event, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div
                    className={`h-12 w-12 rounded-full bg-gradient-to-r ${event.color} mt-1 flex flex-shrink-0 items-center justify-center`}
                  >
                    <event.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="mb-2 flex items-center space-x-3">
                      <Badge className="bg-muted text-muted-foreground">
                        {event.year}
                      </Badge>
                      <h2 className="font-semibold text-foreground">
                        {event.title}
                      </h2>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {event.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Cultural Evolution */}
        <Card className="mb-8 border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl text-foreground">
              <MapPin className="mr-3 h-6 w-6 text-primary" />
              Cultural Schools of Thought
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">French School</h4>
                <p className="text-sm text-muted-foreground">
                  Emphasizes elegance and sophistication. Focuses on courtly
                  imagery and aristocratic symbolism. Known for its poetic
                  interpretations.
                </p>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">German School</h4>
                <p className="text-sm text-muted-foreground">
                  Practical and straightforward. Emphasizes everyday symbolism
                  and concrete meanings. Known for systematic approaches.
                </p>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">
                  Contemporary School
                </h4>
                <p className="text-sm text-muted-foreground">
                  Blends traditional wisdom with modern interpretations.
                  Incorporates diverse cultural perspectives and innovative
                  symbolism.
                </p>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">
                  Playing Card Associations
                </h4>
                <p className="text-sm text-muted-foreground">
                  Links Lenormand cards to traditional playing cards (clubs,
                  hearts, diamonds, spades) for additional layers of meaning.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Modern Revival */}
        <Card className="mb-8 border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl text-foreground">
              <Sparkles className="mr-3 h-6 w-6 text-primary" />
              The Modern Renaissance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="leading-relaxed text-muted-foreground">
              In recent decades, Lenormand has experienced a remarkable revival.
              Contemporary artists and spiritual practitioners have created
              beautiful new decks that honor traditional meanings while
              incorporating diverse cultural perspectives.
            </p>
            <p className="leading-relaxed text-muted-foreground">
              Today, Lenormand is practiced worldwide, with readers from every
              culture adding their unique interpretations and symbolism. This
              diversity has enriched the system, making it more inclusive and
              accessible to modern seekers.
            </p>
            <div className="rounded-lg border border-border bg-muted p-4">
              <p className="text-sm text-foreground">
                <strong>Did you know?</strong> Lenormand cards are experiencing
                their greatest popularity since the 19th century, with new decks
                being created by artists from around the world.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="mb-8">
          <LearningProgressTracker moduleId="history" />
        </div>

        <div className="flex items-center justify-between border-t border-border pt-8">
          <Link href="/learn/introduction">
            <Button
              variant="outline"
              className="border-border text-card-foreground hover:bg-muted"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Introduction
            </Button>
          </Link>
          <Link href="/learn/reading-basics">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              Continue to Reading Basics
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      <BackToTop />
    </div>
  );
}
