import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ModulePageClient } from "@/components/ModulePageClient";
import {
  Compass,
  Target,
  Users,
  TrendingUp,
  Clock,
  MapPin,
  Star,
  Sun,
  Moon,
  Key,
  Fish,
} from "lucide-react";

export const metadata = {
  title: "Spreads & Techniques | Lenormand Course",
  description:
    "Discover powerful spreads from simple 3-card readings to the comprehensive Grand Tableau. Master diverse reading methods.",
};

const spreads = [
  {
    category: "Single Card",
    description: "The simplest and fastest reading method for daily guidance",
    spreads: [
      {
        name: "Single Card Draw",
        description:
          "One card for direct, immediate answers and daily guidance",
        layout: "One Card",
        useCase: "Daily guidance, quick questions, immediate answers",
        difficulty: "Beginner",
        isPrimary: true,
        positions: [
          {
            name: "The Answer",
            description: "Direct response to your question or situation",
          },
        ],
      },
    ],
  },
   {
     category: "3-Card Spreads",
     description: "Perfect for quick insights and daily guidance - Lenormand's most popular method",
     spreads: [
       {
         name: "3-Card Sentence Reading",
         description:
           "Three cards flowing as a narrative sentence using pair-reading - the core Lenormand method",
         layout: "Card 1 → Card 2 → Card 3 (combine pairs: 1+2, then 2+3)",
         useCase: "Universal reading, foundational technique, any question",
         difficulty: "Beginner",
         isPrimary: true,
         positions: [
           {
             name: "Card 1",
             description:
               "Current situation or topic (read with Card 2 to see development)",
           },
           {
             name: "Card 2",
             description:
               "Development or action (read with Card 1 and Card 3 for full meaning)",
           },
           {
             name: "Card 3",
             description: "Outcome or resolution (read with Card 2 to see how it concludes)",
           },
         ],
       },
       {
         name: "3-Card: Situation-Challenge-Advice",
         description: "Diagnostic spread for problem-solving using Lenormand pair-reading",
         layout: "Situation → Challenge → Advice (read pairs 1+2 and 2+3)",
         useCase: "Problem analysis, decision making, troubleshooting",
         difficulty: "Beginner",
         isPrimary: false,
         positions: [
           {
             name: "Situation",
             description: "What's currently happening (combined with Challenge shows the problem)",
           },
           {
             name: "Challenge",
             description: "What's blocking or opposing you (read with Advice to see the solution path)",
           },
           {
             name: "Advice",
             description: "What to do about it (the resolution that follows from the challenge)",
           },
         ],
       },
     ],
   },
  {
    category: "5-Card Spreads",
    description: "Extended narrative for more context without complexity",
    spreads: [
      {
        name: "5-Card Sentence Reading",
        description: "Extended narrative read as a grammatical sentence flowing left to right",
        layout: "Card 1 → Card 2 → Card 3 → Card 4 → Card 5",
        useCase: "General readings, seeing development over time, understanding influencing factors",
        difficulty: "Intermediate",
        isPrimary: true,
        positions: [
          { name: "Opening", description: "The situation's beginning or foundation" },
          { name: "Development", description: "What unfolds or emerges" },
          { name: "Focus", description: "The central theme or key energy (pay special attention to this card)" },
          { name: "Influence", description: "External factors or approaching energies" },
          { name: "Outcome", description: "Where the situation leads" },
        ],
      },
    ],
  },

   {
     category: "9-Card Spreads",
     description: "Petit Grand Tableau - Master spread for comprehensive life insights using authentic Lenormand row-reading",
     spreads: [
       {
         name: "9-Card Petit Grand Tableau",
         description: "Complete life reading using traditional 3x3 grid layout read as three rows with pair combinations",
         layout:
           "3x3 Grid (3 rows): Row 1 = Opening situation, Row 2 = Development, Row 3 = Resolution (read pairs 1+2, 2+3 in each row)",
         useCase: "Major life decisions, deep insight, complex situations",
         difficulty: "Intermediate",
         isPrimary: true,
         positions: [
           {
             name: "Row 1, Card 1",
             description:
               "The topic or beginning of the situation (pair with Card 2 to see opening development)",
           },
           {
             name: "Row 1, Card 2",
             description:
               "How the situation opens or develops initially (read with Card 3 to see where it leads)",
           },
           {
             name: "Row 1, Card 3",
             description: "Where the opening leads or the transition point",
           },
           {
             name: "Row 2, Card 1",
             description:
               "Development or complication emerges (shows what unfolds from Row 1)",
           },
           {
             name: "Row 2, Card 2 (CENTER)",
             description:
               "Heart of the matter - the central theme connecting all rows. Read with surrounding cards for full meaning",
           },
           {
             name: "Row 2, Card 3",
             description:
               "Further development or turning point in the narrative",
           },
           {
             name: "Row 3, Card 1",
             description:
               "Resolution begins (shows how development leads to closing)",
           },
           {
             name: "Row 3, Card 2",
             description:
               "How the resolution manifests or the final action taken",
           },
           {
             name: "Row 3, Card 3",
             description: "Final outcome or settled state",
           },
         ],
       },
     ],
   },
  {
    category: "36-Card Master Reading",
    description: "Complete deck reading for comprehensive guidance",
    spreads: [
       {
         name: "Grand Tableau (36-Card Reading)",
         description:
           "The most comprehensive Lenormand reading using all 36 cards in a 4×9 grid - authentic French salon method",
         layout: "4 rows of 9 cards (traditional salon formation) - read left-to-right by row with pair combinations",
         useCase:
           "Major life decisions, year-ahead readings, complex situations, complete life picture",
         difficulty: "Expert",
         isPrimary: true,
         positions: [
           {
             name: "Significator",
             description:
               "The card representing you (usually Man #28 or Woman #29) - the anchor point for directional reading",
           },
           {
             name: "Row-by-Row Reading",
             description:
               "Read all 36 cards left-to-right by row, combining adjacent cards (pairs) to build narrative",
           },
           {
             name: "Directional Zones",
             description:
               "Cards to LEFT of significator = past influences | RIGHT = future possibilities | ABOVE = conscious thoughts | BELOW = unconscious forces",
           },
           {
             name: "Four Corners",
             description:
               "Cards 1, 9, 28, 36 (or 1, 9, 27, 36) - represent the strongest foundational influences and extreme energies",
           },
           {
             name: "Center Area",
             description:
               "Central cards around middle of grid - reveal what's at the heart of the situation",
           },
           {
             name: "Cards of Fate",
             description:
               "Cards 32 (Sun), 33 (Moon), 34 (Key), 35 (Fish) - when prominent, indicate destiny points",
           },
           {
             name: "Topic Cards",
             description:
               "Specific positions carry traditional meanings: health, love, career, money (research position associations)",
           },
           {
             name: "Pair Reading",
             description:
               "Read adjacent cards in rows as pairs for flowing narrative - same pair-reading method as 3-card and 9-card spreads",
           },
         ],
       },
    ],
  },
];

const techniques = [
  {
    name: "Card Pairing",
    description: "Reading cards in pairs to understand relationships",
    icon: Users,
    examples: [
      "Rider + Letter = Important message or news",
      "Heart + Ring = Committed relationship",
      "Snake + Book = Hidden knowledge or secrets",
    ],
  },
  {
    name: "Directional Flow",
    description: "Following the energy flow from left to right",
    icon: TrendingUp,
    examples: [
      "Mountain → Sun = Overcoming obstacles leads to success",
      "Clouds → Key = Confusion finds clarity",
      "Coffin → Stork = Ending leads to new beginning",
    ],
  },
  {
    name: "Knights Move",
    description: "Reading cards in an L-shaped pattern like a chess knight",
    icon: Target,
    examples: [
      "Card 1 → Card 6 → Card 11 (in a 3x4 grid)",
      "Card 2 → Card 7 → Card 12",
      "Reveals underlying patterns and connections",
    ],
  },
  {
    name: "Time Associations",
    description: "Using cards to indicate timing of events",
    icon: Clock,
    examples: [
      "Rider = Days or very soon",
      "Ship = Weeks or months",
      "House = Months or years",
      "Tree = Years or long-term",
    ],
  },
];

export default function SpreadsPage() {
  return (
    <ModulePageClient
      moduleId="spreads"
      moduleNumber={4}
      totalModules={8}
      title="Spreads & Techniques"
      description="Discover powerful spreads from simple 3-card readings to the comprehensive Grand Tableau. Master diverse reading methods."
      duration="35 minutes"
      difficulty="Intermediate"
      icon={<Compass className="h-8 w-8 text-white" />}
      prevModule={{ id: "card-combinations", title: "Card Combinations" }}
      nextModule={{ id: "grand-tableau-techniques", title: "Grand Tableau Techniques" }}
      breadcrumbs={[
        { name: "Home", url: "/" },
        { name: "Learn", url: "/learn" },
        { name: "Spreads & Techniques", url: "/learn/spreads" },
      ]}
    >
      {/* Popular Spreads */}
      <Card className="mb-8 border-border bg-card">
        <CardHeader>
          <CardTitle
            id="popular-spreads"
            className="flex items-center text-2xl text-foreground"
          >
            <Compass className="mr-3 h-6 w-6 text-primary" />
            Popular Spreads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {spreads.map((group, groupIndex) => {
              const categoryId = group.category
                .toLowerCase()
                .replace(/\s+/g, "-");
              return (
                <div key={groupIndex} id={categoryId}>
                  <div className="mb-4">
                    <h2 className="mb-3 text-2xl font-bold text-foreground">
                      {group.category}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {group.description}
                    </p>
                  </div>
                  <div className="space-y-6">
                    {group.spreads.map((spread, spreadIndex) => (
                      <Card
                        key={spreadIndex}
                        className={`border ${spread.isPrimary ? "border-primary/30 bg-primary/5" : "border-border bg-muted"}`}
                      >
                        <CardContent className="p-6">
                          <div className="mb-4 flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="mb-0 text-lg font-semibold text-foreground">
                                  {spread.name}
                                </h3>
                                {spread.isPrimary && (
                                  <Badge className="border-primary/30 bg-primary/10 text-primary dark:border-primary/40 dark:bg-primary/20 dark:text-primary">
                                    Primary
                                  </Badge>
                                )}
                              </div>
                              <p className="mb-2 text-sm text-muted-foreground">
                                {spread.description}
                              </p>
                              <div className="flex items-center space-x-4 text-xs text-primary">
                                <span>Best for: {spread.useCase}</span>
                                <Badge
                                  className={
                                    spread.difficulty === "Beginner"
                                      ? "border-primary/30 bg-primary/10 text-primary dark:border-primary/40 dark:bg-primary/20 dark:text-primary"
                                      : spread.difficulty === "Intermediate"
                                        ? "border-border bg-muted text-muted-foreground dark:border-border dark:bg-muted/50 dark:text-muted-foreground"
                                        : "border-border bg-muted text-foreground dark:border-border dark:bg-muted dark:text-foreground"
                                  }
                                >
                                  {spread.difficulty}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          <div className="mb-4 rounded-lg bg-muted p-4">
                            <h4 className="mb-3 font-semibold text-foreground">
                              Layout:
                            </h4>
                            <p className="text-sm font-medium text-muted-foreground">
                              {spread.layout}
                            </p>
                          </div>

                          <div>
                            <h4 className="mb-3 font-semibold text-foreground">
                              Positions:
                            </h4>
                            <div className="grid gap-3 md:grid-cols-2">
                              {spread.positions.map((position, posIndex) => (
                                <div
                                  key={posIndex}
                                  className="flex items-start space-x-3"
                                >
                                  <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary/80">
                                    <span className="text-xs font-bold text-white">
                                      {posIndex + 1}
                                    </span>
                                  </div>
                                  <div>
                                    <h5 className="text-sm font-medium text-foreground">
                                      {position.name}
                                    </h5>
                                    <p className="text-xs text-primary">
                                      {position.description}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Advanced Techniques */}
      <Card className="mb-8 border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl text-foreground">
            <Target className="mr-3 h-6 w-6 text-primary" />
            Advanced Reading Techniques
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {techniques.map((technique, index) => (
              <Card key={index} className="border border-border bg-muted">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary/80">
                      <technique.icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">
                        {technique.name}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {technique.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Grand Tableau Section */}
      <Card className="mb-8 border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl text-foreground">
            <MapPin className="mr-3 h-6 w-6 text-primary" />
            The Grand Tableau: Historical Salon Method (1809)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="leading-relaxed text-card-foreground">
            The Grand Tableau is Marie-Anne Lenormand&apos;s most powerful
            reading technique, using all 36 cards in a 4×9 layout (four rows of
            nine cards). This is the exact method documented in 1820s handbooks
            and by eyewitnesses who watched her read for Joséphine and Napoleon.
          </p>

          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
            <p className="text-sm text-card-foreground">
              <strong>Historical Note:</strong> In Marie-Anne Lenormand&apos;s
              French tradition, the{" "}
              <strong>Man card represents the central focus</strong> (the
              questioner or primary subject), while the{" "}
              <strong>
                Woman card represents another key person or secondary influence
              </strong>
              .
            </p>
          </div>

          <div className="rounded-lg bg-muted p-6">
            <h4 className="mb-4 font-semibold text-foreground">
              The 4×9 Layout:
            </h4>
            <div className="text-center">
              <div className="inline-block rounded-lg bg-card p-4 shadow-sm">
                <div className="grid grid-cols-9 gap-1 text-xs">
                  {Array.from({ length: 36 }, (_, i) => (
                    <div
                      key={i}
                      className="flex h-6 w-6 items-center justify-center rounded bg-muted font-bold text-card-foreground"
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-primary dark:text-primary/80">
                  4 rows × 9 columns (historical &quot;salon&quot; formation)
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards of Fate */}
      <Card className="mb-8 border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl text-foreground">
            <Star className="mr-3 h-6 w-6 text-amber-500" />
            The Cards of Fate (Destiny Zone)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="leading-relaxed text-muted-foreground">
            In traditional Lenormand, four cards carry special weight as
            <strong className="text-amber-600">
              &quot;Cards of Fate&quot;
            </strong>
            . When multiple appear together in a reading, they create a powerful
            <strong>destiny zone</strong>.
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border border-amber-500/30 bg-amber-500/5">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Sun className="h-5 w-5 text-amber-500" />
                  <h4 className="text-sm font-semibold text-foreground">
                    32. The Sun
                  </h4>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-2 text-sm font-medium text-foreground">
                  Success, happiness, clarity, vitality
                </p>
                <p className="text-xs text-muted-foreground">
                  <strong>Role:</strong> Provides illumination, positive outcome
                </p>
              </CardContent>
            </Card>

            <Card className="border border-primary/30 bg-primary/5">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Moon className="h-5 w-5 text-primary" />
                  <h4 className="text-sm font-semibold text-foreground">
                    33. The Moon
                  </h4>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-2 text-sm font-medium text-foreground">
                  Emotions, intuition, dreams, cycles
                </p>
                <p className="text-xs text-muted-foreground">
                  <strong>Role:</strong> Influences timing, adds emotional depth
                </p>
              </CardContent>
            </Card>

            <Card className="border border-primary/30 bg-primary/5">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-primary" />
                  <h4 className="text-sm font-semibold text-foreground">
                    33. The Key
                  </h4>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-2 text-sm font-medium text-foreground">
                  Solutions, answers, unlocking, access
                </p>
                <p className="text-xs text-muted-foreground">
                  <strong>Role:</strong> Opens doors, provides answers
                </p>
              </CardContent>
            </Card>

            <Card className="border border-primary/30 bg-primary/5">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Fish className="h-5 w-5 text-primary" />
                  <h4 className="text-sm font-semibold text-foreground">
                    34. The Fish
                  </h4>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-2 text-sm font-medium text-foreground">
                  Abundance, wealth, business, multiplication
                </p>
                <p className="text-xs text-muted-foreground">
                  <strong>Role:</strong> Financial matters, prosperity
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </ModulePageClient>
  );
}
