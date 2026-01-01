"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BreadcrumbNav } from "@/components/BreadcrumbNav";
import { LearningProgressTracker } from "@/components/LearningProgressTracker";
import { BackToTop } from "@/components/BackToTop";
import { Heart, Coins, Stethoscope, Briefcase, Zap, Users } from "lucide-react";
import { useHeadingIds } from "@/hooks/use-heading-ids";

interface CardCombination {
  cards: string;
  meaning: string;
  context?: string;
}

interface CombinationContext {
  title: string;
  icon: React.ReactNode;
  description: string;
  combinations: CardCombination[];
}

const combinationContexts: CombinationContext[] = [
  {
    title: "Love & Relationships",
    icon: <Heart className="h-6 w-6 text-red-500" />,
    description:
      "Combinations that reveal matters of the heart, relationships, and romantic connections",
    combinations: [
      {
        cards: "Rider + Lover",
        meaning:
          "Fast-moving romantic news or a new romantic connection approaching",
        context:
          "Someone is coming to confess feelings or propose a romantic relationship",
      },
      {
        cards: "Lover + Heart",
        meaning: "Deep romantic love, passion, and emotional connection",
        context:
          "A sincere and heartfelt relationship or the confirmation of true love",
      },
      {
        cards: "Lover + Ring",
        meaning: "Marriage proposal, engagement, or long-term commitment",
        context:
          "A significant commitment is being made or promised in a relationship",
      },
      {
        cards: "Lover + Clouds",
        meaning:
          "Relationship confusion, misunderstandings, or unclear feelings",
        context: "Partners are not on the same page or emotions are mixed",
      },
      {
        cards: "Lover + Whip",
        meaning: "Passion and intensity, but also conflict and arguments",
        context:
          "A relationship with strong emotions - either very passionate or volatile",
      },
      {
        cards: "Lover + Tower",
        meaning: "Relationship breakdown, separation, or serious obstacles",
        context: "A relationship faces significant challenges or is ending",
      },
      {
        cards: "Lover + Clover",
        meaning: "Light, happy love, pleasant romantic moments",
        context: "A carefree, joyful period in a relationship",
      },
      {
        cards: "Lover + Key",
        meaning: "Relationship matters are resolved or clarified",
        context:
          "Finding the solution to a romantic issue or confirming a commitment",
      },
      {
        cards: "Fox + Lover",
        meaning: "Deception in love, hidden attraction, or manipulation",
        context:
          "Someone is not being truthful or is playing games in a relationship",
      },
      {
        cards: "Snake + Lover",
        meaning:
          "Jealousy, betrayal, or a complicated woman affecting the relationship",
        context: "Triangles, complications, or a femme fatale figure",
      },
    ],
  },
  {
    title: "Money & Finance",
    icon: <Coins className="h-6 w-6 text-yellow-600" />,
    description:
      "Combinations revealing financial situations, opportunities, and challenges",
    combinations: [
      {
        cards: "Rider + Abundance",
        meaning: "Money is coming toward you quickly",
        context: "Quick financial gain, payment arrival, or income increase",
      },
      {
        cards: "Abundance + Key",
        meaning: "Financial success is certain or guaranteed",
        context: "A secure financial outcome or confirmed money matter",
      },
      {
        cards: "Abundance + Clouds",
        meaning: "Financial confusion or unclear monetary situation",
        context:
          "Hidden costs, unclear financial terms, or money problems obscured",
      },
      {
        cards: "Abundance + Whip",
        meaning: "Financial struggle, repeated expenses, or stress about money",
        context:
          "Ongoing financial difficulties or repeated financial setbacks",
      },
      {
        cards: "Abundance + Tower",
        meaning: "Major financial loss or bankruptcy",
        context: "Significant financial crisis or loss of money",
      },
      {
        cards: "Fox + Abundance",
        meaning: "Financial deception or hidden money matters",
        context:
          "Be cautious of financial schemes or look for hidden financial aspects",
      },
      {
        cards: "Snake + Abundance",
        meaning: "Complex financial situation with complications",
        context: "Tangled finances or indirect path to money",
      },
      {
        cards: "Abundance + Scythe",
        meaning: "Sudden financial loss or cuts to finances",
        context: "Abrupt money situation change, redundancy, or financial cuts",
      },
      {
        cards: "Abundance + Anchor",
        meaning: "Stable finances or fixed financial situation",
        context:
          "Secure financial foundation or locked-in financial arrangement",
      },
      {
        cards: "Rider + Abundance + Key",
        meaning:
          "Quick confirmation of financial gain or fast money resolution",
        context: "Money is coming quickly and the outcome is certain",
      },
    ],
  },
  {
    title: "Health & Well-being",
    icon: <Stethoscope className="h-6 w-6 text-green-600" />,
    description:
      "Combinations related to physical health, healing, and wellness",
    combinations: [
      {
        cards: "Clover + Medicine",
        meaning: "Quick recovery or healing with ease",
        context: "Swift improvement in health, effective treatment",
      },
      {
        cards: "Tower + Medicine",
        meaning: "Serious health issues requiring professional treatment",
        context: "Major health concern, hospitalization, or serious diagnosis",
      },
      {
        cards: "Clouds + Medicine",
        meaning: "Unclear diagnosis or confusing health situation",
        context:
          "Health condition is difficult to identify or treatment is unclear",
      },
      {
        cards: "Whip + Medicine",
        meaning: "Painful treatment or difficult health process",
        context: "Surgery, intense therapy, or difficult medical procedure",
      },
      {
        cards: "Medicine + Key",
        meaning: "Health situation is resolved or cure is found",
        context: "Finding the right treatment or recovery is assured",
      },
      {
        cards: "Scythe + Medicine",
        meaning: "Sudden health crisis or unexpected illness",
        context: "Acute condition or sudden health emergency",
      },
      {
        cards: "Medicine + Anchor",
        meaning: "Long-term health condition or chronic situation",
        context: "Ongoing health management or stable health condition",
      },
      {
        cards: "Clover + Heart",
        meaning: "Emotional health and happiness, joy",
        context: "Good mental health, emotional well-being, contentment",
      },
      {
        cards: "Clouds + Heart",
        meaning: "Emotional distress or mental health concerns",
        context: "Emotional confusion, anxiety, or mental health struggles",
      },
      {
        cards: "Tower + Heart",
        meaning: "Emotional breakdown or serious emotional trauma",
        context: "Major emotional crisis or relationship heartbreak",
      },
    ],
  },
  {
    title: "Career & Work",
    icon: <Briefcase className="h-6 w-6 text-blue-600" />,
    description:
      "Combinations for job situations, career growth, and professional matters",
    combinations: [
      {
        cards: "Rider + Whip",
        meaning: "Job offer or employment news arriving quickly",
        context: "Job opportunity coming fast or quick work communication",
      },
      {
        cards: "Whip + Key",
        meaning: "Work problem is resolved or solution is found",
        context: "Overcoming a workplace challenge or finding work solution",
      },
      {
        cards: "Tower + Whip",
        meaning: "Job loss, redundancy, or workplace conflict",
        context: "Career setback, firing, or serious workplace issues",
      },
      {
        cards: "Clouds + Whip",
        meaning: "Unclear job situation or confusing work circumstances",
        context: "Job uncertainty or confused workplace dynamics",
      },
      {
        cards: "Whip + Anchor",
        meaning: "Stable long-term job or secure employment",
        context: "Job security or permanent employment position",
      },
      {
        cards: "Fox + Whip",
        meaning: "Workplace deception or cunning required at work",
        context:
          "Office politics, workplace trickery, or strategic workplace moves",
      },
      {
        cards: "Snake + Whip",
        meaning: "Complex work situation with complications",
        context:
          "Tangled workplace issues or complicated professional dynamics",
      },
      {
        cards: "Abundance + Whip",
        meaning: "Hard work leading to financial reward",
        context: "Success through effort or earning through work",
      },
      {
        cards: "Clover + Whip",
        meaning: "Light work responsibilities or easy job",
        context: "Simple job tasks or enjoyable work",
      },
      {
        cards: "Rider + Abundance + Whip",
        meaning: "Job offer with good pay or quick work success",
        context: "Profitable employment opportunity arriving quickly",
      },
    ],
  },
  {
    title: "Personal Growth & Spirituality",
    icon: <Zap className="h-6 w-6 text-purple-600" />,
    description:
      "Combinations for personal development, spirituality, and inner wisdom",
    combinations: [
      {
        cards: "Key + Heart",
        meaning: "Understanding your true feelings or emotional breakthrough",
        context: "Clarity about what you really want emotionally",
      },
      {
        cards: "Clouds + Key",
        meaning: "Confusion preventing clarity or delayed understanding",
        context: "The answer isn't clear yet, clarity will come later",
      },
      {
        cards: "Tower + Key",
        meaning:
          "Major life breakthrough or significant personal transformation",
        context: "Breaking through a major obstacle, major life change",
      },
      {
        cards: "Clover + Key",
        meaning: "Simple solution or easy answer",
        context: "The answer is simpler than expected",
      },
      {
        cards: "Scythe + Key",
        meaning: "Sudden clarity or quick realization",
        context: "An 'aha moment' or sudden understanding",
      },
      {
        cards: "Whip + Key",
        meaning: "Through struggle comes wisdom",
        context: "Learning from difficult experiences",
      },
      {
        cards: "Snake + Clouds",
        meaning: "Complex emotional confusion or twisted thoughts",
        context: "Tangled emotions or confusing spiritual path",
      },
      {
        cards: "Heart + Anchor",
        meaning: "Emotional stability or secure loving foundation",
        context: "Strong emotional grounding or stable relationship",
      },
      {
        cards: "Rider + Key",
        meaning: "News that brings understanding or clarity comes quickly",
        context: "Quick answer to a question or swift understanding",
      },
      {
        cards: "Star + Key",
        meaning: "Spiritual insight or seeing your true path",
        context: "Clarity about your life purpose or spiritual direction",
      },
    ],
  },
  {
    title: "Social & Community",
    icon: <Users className="h-6 w-6 text-indigo-600" />,
    description:
      "Combinations for relationships, friendships, and social interactions",
    combinations: [
      {
        cards: "Rider + Lover",
        meaning: "Someone important is coming or news about someone special",
        context:
          "A key person is arriving or communicating about a relationship",
      },
      {
        cards: "Fox + Clover",
        meaning: "Small deception or minor dishonesty among friends",
        context: "Light social trickery or minor social lie",
      },
      {
        cards: "Snake + Clover",
        meaning: "Mixed feelings in a friendship or complicated friendship",
        context: "A complicated relationship with both good and bad aspects",
      },
      {
        cards: "Clouds + Lover",
        meaning:
          "Unclear relationship status or confused feelings about someone",
        context: "Ambiguous relationship or undefined romantic situation",
      },
      {
        cards: "Tower + Lover",
        meaning: "Relationship ending or major separation",
        context: "Breakup, divorce, or relationship dissolution",
      },
      {
        cards: "Clover + Lover",
        meaning: "Happy friendship or pleasant romantic relationship",
        context: "Easy, light, enjoyable social connection",
      },
      {
        cards: "Heart + Lover",
        meaning: "Deep love and genuine affection",
        context: "True love or heartfelt friendship",
      },
      {
        cards: "Key + Lover",
        meaning: "Relationship is clarified or commitment is confirmed",
        context: "Understanding your relationship or confirming feelings",
      },
      {
        cards: "Whip + Lover",
        meaning: "Arguments, passion, or conflict in relationship",
        context: "Passionate but turbulent relationship dynamics",
      },
      {
        cards: "Rider + Lover + Clover",
        meaning: "Good news about a pleasant romantic connection arriving",
        context: "Happy news about a relationship coming quickly",
      },
    ],
  },
  {
    title: "Universal Pair Combinations",
    icon: <Zap className="h-6 w-6 text-orange-600" />,
    description: "Fundamental combinations that work across all contexts",
    combinations: [
      {
        cards: "Key + Any Card",
        meaning: "That card's meaning is confirmed or certain",
        context: "Success, certainty, and resolution of the card's meaning",
      },
      {
        cards: "Clouds + Any Card",
        meaning: "That card's meaning is unclear, delayed, or confused",
        context: "Uncertainty or confusion about the card's topic",
      },
      {
        cards: "Scythe + Any Card",
        meaning: "That card's meaning happens suddenly or is cut short",
        context: "Sudden change regarding that card's topic",
      },
      {
        cards: "Anchor + Any Card",
        meaning: "That card's meaning is stable, lasting, or permanent",
        context: "Long-term, fixed, or secure outcome",
      },
      {
        cards: "Clover + Any Card",
        meaning: "That card's meaning is lightened or improved slightly",
        context: "Small improvement or light positive influence",
      },
      {
        cards: "Whip + Any Card",
        meaning:
          "That card's meaning involves struggle, repetition, or intensity",
        context: "Difficulty, stress, or repeated situations",
      },
      {
        cards: "Tower + Any Card",
        meaning: "That card's meaning experiences major disruption or crisis",
        context: "Significant problem or major change",
      },
      {
        cards: "Fox + Any Card",
        meaning: "That card's meaning involves deception or requires caution",
        context: "Dishonesty, manipulation, or strategic moves needed",
      },
      {
        cards: "Snake + Any Card",
        meaning:
          "That card's meaning is complicated, delayed, or involves jealousy",
        context: "Complex situation, complications, or negative emotions",
      },
      {
        cards: "Rider + Any Card",
        meaning: "That card's meaning arrives quickly or brings news",
        context: "Speed, movement toward, or news about the card's topic",
      },
    ],
  },
];

export default function CardCombinationsPage() {
  useHeadingIds();

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="border-b border-border bg-card/50 backdrop-blur">
        <div className="container mx-auto max-w-4xl px-4 py-4">
          <BreadcrumbNav
            items={[
              { name: "Home", url: "/" },
              { name: "Learn", url: "/learn" },
              { name: "Card Combinations", url: "/learn/card-combinations" },
            ]}
          />
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1
            id="card-combinations"
            className="mb-4 text-4xl font-bold text-foreground"
          >
            Card Combinations & Meanings
          </h1>
          <p className="mb-4 text-lg text-muted-foreground">
            Master the art of reading card combinations. In Lenormand, two or
            more cards create new meanings through their interaction. This
            comprehensive guide breaks down combinations across different life
            contexts.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Intermediate</Badge>
            <Badge variant="secondary">20+ Minutes</Badge>
            <Badge variant="secondary">Practical Technique</Badge>
          </div>
        </div>

        {/* Learning Progress Tracker */}
        <LearningProgressTracker moduleId="card-combinations" />

        {/* Core Concept Section */}
        <Card className="mb-8 border-border bg-card">
          <CardHeader>
            <CardTitle id="core-concepts">How Card Combinations Work</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="mb-3 font-semibold text-foreground">
                The Principle of Interaction
              </h3>
              <p className="text-muted-foreground">
                In Lenormand, cards don&apos;t exist in isolation. When two
                cards appear together, they modify and enhance each other&apos;s
                meanings. The combination creates a new, unified message
                that&apos;s more specific than either card alone.
              </p>
            </div>
            <div>
              <h3 className="mb-3 font-semibold text-foreground">
                Modifier Cards
              </h3>
              <p className="text-muted-foreground">
                Certain cards act as &quot;modifiers&quot; - they change the
                meaning of adjacent cards. The Key adds certainty, Clouds add
                confusion, the Scythe adds suddenness. Learning to identify
                these modifiers is crucial to accurate combination reading.
              </p>
            </div>
            <div>
              <h3 className="mb-3 font-semibold text-foreground">
                Context Matters
              </h3>
              <p className="text-muted-foreground">
                The same combination can have different meanings depending on
                the context of the reading. A Lover + Tower in a love question
                might mean relationship breakup, but in a career question it
                might indicate conflict with a colleague.
              </p>
            </div>
            <div>
              <h3 className="mb-3 font-semibold text-foreground">
                Reading Direction
              </h3>
              <p className="text-muted-foreground">
                In most Lenormand spreads, cards are read left to right,
                creating a narrative flow. The first card influences the second,
                and together they tell a story. Pay attention to the order and
                direction of your cards.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Combination Contexts */}
        {combinationContexts.map((context, index) => (
          <Card key={index} className="mb-8 border-border bg-card">
            <CardHeader>
              <div className="mb-2 flex items-center gap-3">
                {context.icon}
                <CardTitle
                  id={context.title.toLowerCase().replace(/\s+/g, "-")}
                >
                  {context.title}
                </CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">
                {context.description}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {context.combinations.map((combo, comboIndex) => (
                  <div
                    key={comboIndex}
                    className="border-l-2 border-primary/50 py-2 pl-4"
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <h4 className="font-semibold text-foreground">
                        {combo.cards}
                      </h4>
                      <Badge className="ml-2">{context.title}</Badge>
                    </div>
                    <p className="mb-2 text-foreground">{combo.meaning}</p>
                    {combo.context && (
                      <p className="text-sm italic text-muted-foreground">
                        Context: {combo.context}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Practice Tips Section */}
        <Card className="mb-8 border-border bg-card">
          <CardHeader>
            <CardTitle id="practice-tips">
              Tips for Mastering Combinations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/20">
                <span className="text-sm font-semibold text-primary">1</span>
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Start Simple</h4>
                <p className="text-sm text-muted-foreground">
                  Begin with 2-card combinations before progressing to complex
                  spreads. Master the fundamentals first.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/20">
                <span className="text-sm font-semibold text-primary">2</span>
              </div>
              <div>
                <h4 className="font-semibold text-foreground">
                  Identify Modifiers
                </h4>
                <p className="text-sm text-muted-foreground">
                  Look for Key, Clouds, Scythe, and Anchor cards first - these
                  change the meaning of nearby cards.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/20">
                <span className="text-sm font-semibold text-primary">3</span>
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Read the Flow</h4>
                <p className="text-sm text-muted-foreground">
                  Read combinations left to right as a narrative. What story do
                  the cards tell together?
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/20">
                <span className="text-sm font-semibold text-primary">4</span>
              </div>
              <div>
                <h4 className="font-semibold text-foreground">
                  Consider Context
                </h4>
                <p className="text-sm text-muted-foreground">
                  Always consider the question and context of the reading. The
                  same combination means different things in different
                  situations.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/20">
                <span className="text-sm font-semibold text-primary">5</span>
              </div>
              <div>
                <h4 className="font-semibold text-foreground">
                  Practice Consistently
                </h4>
                <p className="text-sm text-muted-foreground">
                  The best way to master combinations is through regular
                  practice. Do daily 2-3 card readings to build muscle memory.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cross-Reference Section */}
        <Card className="mb-8 border-border bg-card">
          <CardHeader>
            <CardTitle id="exploring-further">
              Explore Individual Cards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-muted-foreground">
              To deepen your understanding of combinations, explore how each
              individual card works with others:
            </p>
            <Link href="/cards/guide">
              <Button variant="outline" className="w-full">
                View All Card Meanings
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Navigation to Other Modules */}
        <div className="flex gap-4 border-t border-border pt-8">
          <Link href="/learn/spreads" className="flex-1">
            <Button variant="outline" className="w-full">
              ← Spreads & Techniques
            </Button>
          </Link>
          <Link href="/learn" className="flex-1">
            <Button variant="ghost" className="w-full">
              Back to Learning Hub
            </Button>
          </Link>
        </div>
      </div>

      <BackToTop />
    </div>
  );
}
