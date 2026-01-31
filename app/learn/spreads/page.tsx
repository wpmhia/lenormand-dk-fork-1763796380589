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
        useCase: "Daily oracle, quick questions, immediate answers",
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
    description: "Perfect for quick insights and daily guidance",
    spreads: [
      {
        name: "3-Card Sentence Reading",
        description:
          "Three cards flowing as a narrative sentence - the core Lenormand method",
        layout: "Card 1 → Card 2 → Card 3 (as flowing narrative)",
        useCase: "Universal reading, foundational technique",
        difficulty: "Beginner",
        isPrimary: true,
        positions: [
          {
            name: "Card 1",
            description:
              "First element in the narrative sentence (subject/context)",
          },
          {
            name: "Card 2",
            description:
              "Central element in the narrative (action/development)",
          },
          {
            name: "Card 3",
            description: "Final element in the narrative (object/outcome)",
          },
        ],
      },
      {
        name: "3-Card Past-Present-Future",
        description: "Classic timeline spread for understanding progression",
        layout: "Past → Present → Future",
        useCase: "General guidance, life overview",
        difficulty: "Beginner",
        isPrimary: false,
        positions: [
          {
            name: "Past",
            description: "What has led to the current situation",
          },
          {
            name: "Present",
            description: "Current circumstances and energies",
          },
          { name: "Future", description: "Likely outcome or direction" },
        ],
      },
      {
        name: "Mind-Body-Spirit",
        description: "Holistic view of your situation across three dimensions",
        layout: "Mind → Body → Spirit",
        useCase: "Wellness, balance, personal growth",
        difficulty: "Beginner",
        isPrimary: false,
        positions: [
          {
            name: "Mind",
            description: "Thoughts, mental state, and intellectual matters",
          },
          {
            name: "Body",
            description: "Physical health, actions, and material concerns",
          },
          {
            name: "Spirit",
            description:
              "Emotional well-being, spiritual growth, and inner wisdom",
          },
        ],
      },
      {
        name: "3-Card: Yes or No",
        description: "Direct answer to your yes or no question",
        layout: "First Card → Center Card → Third Card",
        useCase: "Binary decisions, clear answers",
        difficulty: "Beginner",
        isPrimary: false,
        positions: [
          {
            name: "First Card",
            description: "The foundation of your question",
          },
          {
            name: "Center Card",
            description: "The central issue or influence",
          },
          {
            name: "Third Card",
            description: "The resolution or outcome",
          },
        ],
      },
      {
        name: "3-Card: Situation-Challenge-Advice",
        description: "Diagnostic spread for problem-solving",
        layout: "Situation → Challenge → Advice",
        useCase: "Problem analysis, decision making",
        difficulty: "Beginner",
        isPrimary: false,
        positions: [
          {
            name: "Situation",
            description: "What's currently happening",
          },
          {
            name: "Challenge",
            description: "What's blocking or opposing you",
          },
          {
            name: "Advice",
            description: "What to do about it",
          },
        ],
      },
    ],
  },
  {
    category: "5-Card Spreads",
    description: "Detailed analysis for specific situations and decisions",
    spreads: [
      {
        name: "5-Card Situation Spread",
        description: "Detailed analysis of a specific situation",
        layout: "Situation → Challenge → Advice → Outcome → Timing",
        useCase: "Problem-solving, decision making",
        difficulty: "Intermediate",
        isPrimary: true,
        positions: [
          { name: "Situation", description: "Current state of affairs" },
          { name: "Challenge", description: "Obstacles or difficulties" },
          { name: "Advice", description: "Guidance for moving forward" },
          { name: "Outcome", description: "Likely result of current path" },
          { name: "Timing", description: "When to expect developments" },
        ],
      },
      {
        name: "5-Card Structured Reading",
        description:
          "Grammar-based analysis where each card represents a part of speech",
        layout: "Subject → Verb → Object → Modifier → Outcome",
        useCase: "Analytical insights, understanding dynamics",
        difficulty: "Intermediate",
        isPrimary: false,
        positions: [
          {
            name: "Subject",
            description:
              "The opening element—who or what the story begins with",
          },
          {
            name: "Verb",
            description:
              "The action or descriptor—what is happening or being done",
          },
          {
            name: "Object",
            description: "The direct impact or target—what is being affected",
          },
          {
            name: "Modifier",
            description:
              "The qualifier or condition—how, when, or under what circumstance",
          },
          {
            name: "Outcome",
            description: "The result or conclusion—where this leads",
          },
        ],
      },
    ],
  },
  {
    category: "7-Card Spreads",
    description: "Deep insights for weekly guidance or relationship dynamics",
    spreads: [
      {
        name: "7-Card Week Ahead",
        description: "Navigate your week with daily guidance and insights",
        layout:
          "Monday → Tuesday → Wednesday → Thursday → Friday → Saturday → Sunday",
        useCase: "Weekly planning, timing insights",
        difficulty: "Intermediate",
        isPrimary: true,
        positions: [
          { name: "Monday", description: "New beginnings and fresh energy" },
          { name: "Tuesday", description: "Challenges and work matters" },
          { name: "Wednesday", description: "Communication and connections" },
          { name: "Thursday", description: "Progress and momentum building" },
          { name: "Friday", description: "Social activities and completion" },
          { name: "Saturday", description: "Rest and reflection" },
          { name: "Sunday", description: "Closure and spiritual renewal" },
        ],
      },
      {
        name: "7-Card Relationship Spread",
        description: "Deep insights into romantic or interpersonal dynamics",
        layout:
          "Your Past → Your Present → Your Future → Connection → Their Past → Their Present → Their Future",
        useCase: "Love, partnerships, relationships",
        difficulty: "Intermediate",
        isPrimary: false,
        positions: [
          {
            name: "Your Past",
            description: "Your past experiences in relationships",
          },
          {
            name: "Your Present",
            description: "Your current relationship energy",
          },
          { name: "Your Future", description: "Your relationship outlook" },
          { name: "Connection", description: "The bond between you both" },
          {
            name: "Their Past",
            description: "Their past relationship experiences",
          },
          {
            name: "Their Present",
            description: "Their current relationship energy",
          },
          { name: "Their Future", description: "Their relationship outlook" },
        ],
      },
    ],
  },
  {
    category: "9-Card Spreads",
    description: "Master spread for comprehensive life insights",
    spreads: [
      {
        name: "9-Card Comprehensive Spread",
        description: "Complete life reading using traditional 3x3 grid layout",
        layout:
          "3x3 Grid: Recent Past → Present → Near Future (across rows) × Inner World → Direct Actions → External Influences (down columns)",
        useCase: "Major life decisions, deep insight",
        difficulty: "Advanced",
        isPrimary: true,
        positions: [
          {
            name: "Recent Past - Inner World",
            description:
              "Thoughts, feelings, and personal resources from your recent past that influence your current situation",
          },
          {
            name: "Recent Past - Direct Actions",
            description:
              "Actions you took recently that shaped your current circumstances",
          },
          {
            name: "Recent Past - Outside World",
            description: "External influences and events from your recent past",
          },
          {
            name: "Present - Inner World",
            description: "Your current thoughts, feelings, and internal state",
          },
          {
            name: "Present - Direct Actions",
            description:
              "Your current actions and the central issue you're facing",
          },
          {
            name: "Present - Outside World",
            description:
              "Current external influences, other people, and environmental factors",
          },
          {
            name: "Near Future - Inner World",
            description:
              "How your thoughts and feelings will evolve in the near future",
          },
          {
            name: "Near Future - Direct Actions",
            description: "Actions you'll need to take in the near future",
          },
          {
            name: "Near Future - Outside World",
            description:
              "External events and influences approaching in the near future",
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
          "The most comprehensive Lenormand reading using all 36 cards",
        layout: "4 rows of 9 cards (traditional French 'salon' method)",
        useCase:
          "Major life decisions, year-ahead readings, complex relationship issues",
        difficulty: "Expert",
        isPrimary: true,
        positions: [
          {
            name: "Significator",
            description:
              "The card representing you (usually Woman #29 or Man #28) - the center of the reading",
          },
          {
            name: "Cross of the Moment",
            description:
              "The 5-card cross formed by significator's row and column - reveals immediate situation",
          },
          {
            name: "Four Corners",
            description:
              "Cards 1, 6, 31, 36 - represent the fixed frame and foundation of the situation",
          },
          {
            name: "Four Center Cards",
            description:
              "Cards 13, 16, 12, 11 - reveal what's secretly driving the matter",
          },
          {
            name: "Nine-Card Square",
            description:
              "3x3 area around significator - shows immediate influences and personal sphere",
          },
          {
            name: "Knight Moves",
            description:
              "L-shaped patterns from significator - reveal underlying patterns and connections",
          },
          {
            name: "Mirror Positions",
            description:
              "Cards directly opposite significator - show balancing energies and lessons",
          },
          {
            name: "House Meanings",
            description:
              "Each position has traditional house associations that add symbolic meaning",
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
