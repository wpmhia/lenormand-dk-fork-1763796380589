import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ModulePageClient } from "@/components/ModulePageClient";
import {
  Compass,
  MapPin,
  Target,
  TrendingUp,
  Star,
} from "lucide-react";

export const metadata = {
  title: "Spreads & Techniques | Lenormand Course",
  description:
    "Discover powerful spreads from simple 3-card readings to the comprehensive Grand Tableau. Master diverse reading methods.",
};

const spreads = [
  {
    category: "Single Card",
    description: "A single-card symbolic reading for a concise question",
    spreads: [
      {
        name: "Single Card Draw",
        description:
          "One card as a focused symbolic prompt for a concise question",
        layout: "One Card",
        useCase: "A concise question or single-card reflection; not a guaranteed answer",
        difficulty: "Beginner",
        isPrimary: true,
        positions: [
          {
            name: "Drawn card",
            description: "Interpret the card in relation to the actual question",
          },
        ],
      },
    ],
  },
   {
     category: "3-Card Spreads",
      description: "A short ordered line for a focused question",
     spreads: [
       {
         name: "3-Card Sentence Reading",
          description:
            "Three ordered cards read as a connected line; interpretation stays with the question and draw",
         layout: "Card 1 → Card 2 → Card 3 (combine pairs: 1+2, then 2+3)",
         useCase: "Universal reading, foundational technique, any question",
         difficulty: "Beginner",
         isPrimary: true,
         positions: [
           {
             name: "Card 1",
             description:
               "First position in the line (read with Card 2 to see how the sentence opens)",
           },
           {
             name: "Card 2",
             description:
               "Middle position, the point the line turns on (read with Cards 1 and 3)",
           },
           {
             name: "Card 3",
             description:
               "Final position - where the line currently leads, not a guaranteed outcome (read with Card 2)",
           },
         ],
       },
       {
          name: "Optional 3-Card Situation-Challenge-Advice Frame",
          description: "A reader-selected modern framing; it is not the app's sentence-3 preset or a universal Lenormand rule",
          layout: "Situation → Challenge → Advice (optional labels applied to a 3-card line)",
          useCase: "A chosen reflection structure; positions do not guarantee advice or resolution",
         difficulty: "Beginner",
         isPrimary: false,
         positions: [
           {
             name: "Situation",
              description: "The first card's position in this optional layout",
           },
           {
             name: "Challenge",
              description: "The second card's position in this optional layout",
           },
           {
             name: "Advice",
              description: "The third card's position in this optional layout; it is not guaranteed advice or a resolution",
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
        useCase: "A focused question with more ordered card context",
        difficulty: "Intermediate",
        isPrimary: true,
        positions: [
          { name: "First card", description: "Position 1 of the line; read in sequence with its neighbour" },
          { name: "Second card", description: "Position 2 of the line; modifies and is modified by its neighbours" },
          { name: "Third card", description: "Position 3 of the line; modifies and is modified by its neighbours" },
          { name: "Fourth card", description: "Position 4 of the line; modifies and is modified by its neighbours" },
          { name: "Fifth card", description: "Position 5 of the line; the last card, not a predetermined verdict" },
        ],
      },
    ],
  },

   {
     category: "9-Card Spreads",
      description: "A nine-card Petit Tableau arranged as a 3×3 grid",
     spreads: [
       {
          name: "9-Card Petit Tableau",
          description: "A 3×3 layout with a geometric centre and relevant lines considered in relation to the question",
         layout:
           "3x3 Grid (3 rows). No row is designated main or underlying; the centre is structurally special. Read rows, columns, diagonals and surrounding cards together",
          useCase: "A broad question where a 3×3 view may add useful context",
         difficulty: "Intermediate",
         isPrimary: true,
         positions: [
           {
             name: "Row 1, Card 1",
             description:
               "Top row, column 1. Part of the top row; read with the cards around it",
           },
           {
             name: "Row 1, Card 2",
             description:
               "Top row, column 2. Part of the top row; read with the cards around it",
           },
           {
             name: "Row 1, Card 3",
             description: "Top row, column 3. Part of the top row; read with the cards around it",
           },
           {
             name: "Row 2, Card 1",
             description:
               "Middle row, column 1. Part of the middle row; read with the cards around it",
           },
           {
             name: "Row 2, Card 2 (CENTER)",
             description:
                "The geometric centre of the grid; use it as a focal influence without treating it as a predetermined outcome",
           },
           {
             name: "Row 2, Card 3",
             description:
               "Middle row, column 3. Part of the middle row; read with the cards around it",
           },
           {
             name: "Row 3, Card 1",
             description:
               "Bottom row, column 1. Part of the bottom row; read with the cards around it",
           },
           {
             name: "Row 3, Card 2",
             description:
               "Bottom row, column 2. Part of the bottom row; read with the cards around it",
           },
           {
             name: "Row 3, Card 3",
             description: "Bottom row, column 3. Part of the bottom row; read with the cards around it",
           },
         ],
       },
     ],
   },
  {
     category: "36-Card Grand Tableau",
     description: "A full-deck 4×9 layout for a broad reading of the current question",
    spreads: [
       {
         name: "Grand Tableau (36-Card Reading)",
          description:
            "A full-deck layout arranged as four rows of nine cards; traditions differ on advanced techniques",
          layout: "4 rows × 9 columns; card order and houses are mapped separately",
          useCase:
            "Broad questions that benefit from the full deck; it does not guarantee a year-ahead forecast",
         difficulty: "Expert",
         isPrimary: true,
         positions: [
           {
             name: "Significator",
              description:
                "Man (#28) or Woman (#29) may be selected as a reading focus; neither is automatically assigned to the querent or a partner",
           },
           {
             name: "Row-by-Row Reading",
              description:
                "Rows provide exact order and position; interpret relevant lines rather than forcing a story from every pair",
           },
           {
             name: "Directional Zones",
              description:
                "Left, right, above, below, and diagonal are geometric relations only; do not assign universal chronology or hidden/visible meanings",
           },
           {
             name: "Four Corners",
              description:
                "The four corner cells are geometric reference points; their significance depends on the question and reading method",
           },
           {
             name: "Center Area",
              description:
                "The four middle cells occupy the centre of the 4×9 grid; centre does not mean a guaranteed answer",
           },
            {
              name: "Fourth-row positions",
              description:
                 "Positions 33–36 are ordinary cells in the fourth row; they are not a special fate or outcome row.",
            },
           {
             name: "Topic Cards",
              description:
                "Topic-relevant cards may receive attention when supported by the question; no separate topic card is assumed",
           },
           {
             name: "Pair Reading",
              description:
                "Adjacency is a spatial fact. Pair interpretations remain contextual unless a source-reviewed pair is available",
           },
         ],
       },
    ],
  },
];

const techniques = [
  {
    name: "Ordered lines",
    description: "Keep the supplied order and read a linear spread from left to right; do not assume reversing a pair leaves the emphasis unchanged.",
    icon: TrendingUp,
  },
  {
    name: "Relevant geometry",
    description: "Use only rows, columns, diagonals, adjacency, and houses that exist in the current spread and materially address its question.",
    icon: Compass,
  },
  {
    name: "Houses and adjacency",
    description: "In a Grand Tableau, house occupancy and immediate neighbouring cells are separate relationships.",
    icon: Target,
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
            The Grand Tableau: 4×9 Structure
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="leading-relaxed text-card-foreground">
            The Grand Tableau uses all 36 cards in four rows of nine. The surviving 1799 Game of Hope source documents a game and a playful oracle layout; it does not establish every modern Grand Tableau technique or fixed card meaning.
          </p>

          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
            <p className="text-sm text-card-foreground">
              <strong>Person cards:</strong> Man (#28) and Woman (#29) can serve as person cards or an explicitly selected reading focus. Do not automatically identify either card as the querent, their partner, or another real person.
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
                  Four rows × nine columns; positions are numbered left-to-right, top-to-bottom
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8 border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl text-foreground">
            <Star className="mr-3 h-6 w-6 text-amber-500" />
            Fourth-row positions in a 9×4 tableau
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="leading-relaxed text-muted-foreground">
            Positions 33–36 are ordinary cells in the fourth row. They do not form a
            separate fate row or universal outcome zone; read them through their
            houses, positions, and relationships with the question and significator.
          </p>
        </CardContent>
      </Card>
    </ModulePageClient>
  );
}
