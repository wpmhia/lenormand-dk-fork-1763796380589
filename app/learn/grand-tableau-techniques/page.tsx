import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModulePageClient } from "@/components/ModulePageClient";
import {
  Compass,
  Target,
  Users,
  RefreshCw,
  Move,
  Eye,
  Zap,
  Star,
  Moon,
  ChevronUp,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  ArrowUpLeft,
  ArrowDownLeft,
} from "lucide-react";

export const metadata = {
  title: "Grand Tableau Techniques | Lenormand Course",
  description:
    "Master the 36-card Grand Tableau with knight moves, mirrors, houses, and advanced interpretation techniques.",
};

const knightDirections = [
  { name: "Up-Left", icon: ArrowUpLeft, description: "2 up, 1 left" },
  { name: "Up-Right", icon: ArrowUpRight, description: "2 up, 1 right" },
  { name: "Down-Left", icon: ArrowDownLeft, description: "2 down, 1 left" },
  { name: "Down-Right", icon: ArrowDownRight, description: "2 down, 1 right" },
  { name: "Left-Up", icon: ChevronUp, description: "1 up, 2 left" },
  { name: "Left-Down", icon: ChevronDown, description: "1 down, 2 left" },
  { name: "Right-Up", icon: ChevronUp, description: "1 up, 2 right" },
  { name: "Right-Down", icon: ChevronDown, description: "1 down, 2 right" },
];

const knightMoveExamples = [
  {
    source: "Rider (1)",
    target: "Coffin (8)",
    reading: "News of ending or transformation",
  },
  {
    source: "Sun (31)",
    target: "Heart (24)",
    reading: "Happy love, romantic success",
  },
  {
    source: "Key (33)",
    target: "Mountain (21)",
    reading: "Solution to obstacle found",
  },
  {
    source: "Moon (32)",
    target: "Tree (5)",
    reading: "Health connected to emotions/dreams",
  },
  {
    source: "Mice (23)",
    target: "Coffin (8)",
    reading: "Stress period coming to an end",
  },
  {
    source: "Crossroads (22)",
    target: "Key (33)",
    reading: "Right choice opens door",
  },
];

export default function GrandTableauTechniquesPage() {
  return (
    <ModulePageClient
      moduleId="grand-tableau-techniques"
      moduleNumber={5}
      totalModules={8}
      title="Grand Tableau Mastery"
      description="Master the 36-card Grand Tableau with knight moves, mirrors, houses, and advanced interpretation techniques."
      duration="40 minutes"
      difficulty="Advanced"
      icon={<Compass className="h-8 w-8 text-white" />}
      prevModule={{ id: "spreads", title: "Spreads & Techniques" }}
      nextModule={{ id: "advanced", title: "Advanced Concepts" }}
      breadcrumbs={[
        { name: "Home", url: "/" },
        { name: "Learn", url: "/learn" },
        { name: "Grand Tableau Techniques", url: "/learn/grand-tableau-techniques" },
      ]}
    >
      <Card className="mb-8 border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl text-foreground">
            <Target className="mr-3 h-6 w-6 text-primary" />
            Knight Moves (Cavalier&apos;s Move)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="leading-relaxed text-muted-foreground">
            The Knight&apos;s Move is a traditional Lenormand reading technique
            used primarily in Grand Tableau readings. Named after the chess
            knight&apos;s L-shaped movement, this technique reveals how cards
            influence each other across the tableau.
          </p>

          <div className="rounded-lg bg-muted p-4">
            <p className="mb-3 font-semibold text-foreground">
              How Knight Moves Work
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  A knight moves{" "}
                  <strong>
                    2 positions in one direction + 1 position perpendicular
                  </strong>
                  , forming an L-shape. In the 4×9 Grand Tableau grid, each card
                  can influence 2-8 other cards via knight&apos;s move.
                </p>
                <div className="rounded-lg bg-card p-3">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    Example: From position 1
                  </p>
                  <div className="grid grid-cols-3 gap-1 text-xs">
                    <div className="flex h-8 items-center justify-center rounded bg-muted">
                      .
                    </div>
                    <div className="flex h-8 items-center justify-center rounded bg-primary/20">
                      →
                    </div>
                    <div className="flex h-8 items-center justify-center rounded bg-muted">
                      .
                    </div>
                    <div className="flex h-8 items-center justify-center rounded bg-primary/20">
                      ↑
                    </div>
                    <div className="flex h-8 w-8 items-center justify-center rounded border-2 border-primary bg-card">
                      1
                    </div>
                    <div className="flex h-8 items-center justify-center rounded bg-primary/20">
                      ↑
                    </div>
                    <div className="flex h-8 items-center justify-center rounded bg-muted">
                      .
                    </div>
                    <div className="flex h-8 items-center justify-center rounded bg-primary/20">
                      →
                    </div>
                    <div className="flex h-8 items-center justify-center rounded bg-muted/50">
                      11
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Position 1 can knight to position 11 (2 right, 1 down)
                  </p>
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-foreground">
                  The 8 Knight Directions
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {knightDirections.map((direction, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 rounded bg-card p-2"
                    >
                      <direction.icon className="h-4 w-4 text-primary" />
                      <span className="font-medium text-foreground">
                        {direction.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {direction.description}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-primary/5 p-4">
            <p className="mb-3 font-semibold text-foreground">
              Interpretation Guidelines
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <strong>Source → Target:</strong> The source card&apos;s energy
                flows into the target
              </li>
              <li>
                <strong>Cards of Fate (31-35)</strong> carry extra weight when
                knighting
              </li>
              <li>
                <strong>Chain reactions:</strong> Multiple knight moves create
                reading paths
              </li>
              <li>
                <strong>Key indicators:</strong> Knight moves involving topic
                cards (5, 24, 34) focus on those areas
              </li>
            </ul>
          </div>

          <div className="rounded-lg border-primary/20 bg-primary/5 p-4">
            <p className="mb-3 font-semibold text-foreground">
              Common Knight Move Interpretations
            </p>
            <div className="grid gap-2 text-sm md:grid-cols-2">
              {knightMoveExamples.map((example, index) => (
                <div key={index} className="rounded bg-card p-3">
                  <p className="font-medium text-foreground">
                    {example.source} → {example.target}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {example.reading}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8 border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl text-foreground">
            <Users className="mr-3 h-6 w-6 text-primary" />
            Mirror Positions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="leading-relaxed text-muted-foreground">
            When two cards are positioned <strong>directly opposite</strong> in
            the 36-card layout, they form a <strong>reflecting pair</strong>.
            Mirrors show the other side of a situation, often indicating
            <strong>balancing energy</strong> or revealing what the querent is
            not seeing.
          </p>

          <div className="rounded-lg bg-muted p-4">
            <p className="mb-3 font-semibold text-foreground">
              How to Interpret Mirrors
            </p>
            <ul className="mb-4 space-y-2 text-sm text-muted-foreground">
              <li>
                <strong>Check position:</strong> Mirrors occur when cards are in
                the same row or same column (directly opposite)
              </li>
              <li>
                <strong>Look for contrary meanings:</strong> Mirror cards often
                show the
                <em> opposite</em> of their usual interpretation, revealing
                hidden aspects
              </li>
              <li>
                <strong>Consider relationship:</strong> If Mirror of Man is
                Woman, it may reveal relationship dynamics between querent and
                second person
              </li>
            </ul>

            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm text-muted-foreground">
                Heart (24) opposite Anchor (35) = stability of emotions versus
                emotional volatility
              </p>
              <p className="text-sm text-muted-foreground">
                Tree (5) opposite Ship (3) = rooted stability versus journey and
                change
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8 border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl text-foreground">
            <Eye className="mr-3 h-6 w-6 text-primary" />
            House Proximity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="leading-relaxed text-muted-foreground">
            Distance matters significantly in the Grand Tableau. Cards
            <strong> touching</strong> the significator have more influence than
            cards further away.
          </p>

          <div className="rounded-lg bg-muted p-4">
            <p className="mb-3 font-semibold text-foreground">
              Distance Weighting Guide
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <strong>Immediate zone:</strong> Cards in significator&apos;s
                row (touching) have strongest influence
              </li>
              <li>
                <strong>2 cards away:</strong> Cards two positions from
                significator (diagonal) have medium influence
              </li>
              <li>
                <strong>3+ cards away:</strong> Cards three or more positions
                away have weaker influence
              </li>
              <li>
                <strong>In diagonal zones:</strong> Cards diagonal from
                significator reveal hidden/unseen influences
              </li>
              <li>
                <strong>Same row/column:</strong> Cards in same line as
                significator have combined or opposing influence
              </li>
              <li>
                <strong>Four corners:</strong> Corner cards frame the entire
                reading and often indicate overall theme
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8 border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl text-foreground">
            <Moon className="mr-3 h-6 w-6 text-primary" />
            Pip-Based Timing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="leading-relaxed text-muted-foreground">
            Traditional Lenormand uses playing card values for precise timing.
            This is especially important in the Grand Tableau where timing is
            often the <strong>primary question</strong>.
          </p>

          <div className="rounded-lg bg-muted p-4">
            <p className="mb-3 font-semibold text-foreground">
              Court Card Values
            </p>
            <p className="text-sm text-muted-foreground">
              J, Q, K = <strong>weeks</strong> (Face cards in playing deck)
            </p>

            <div className="mt-4 rounded-lg bg-muted p-3">
              <p className="mb-3 font-semibold text-foreground">
                Number Card Values
              </p>
              <p className="text-sm text-muted-foreground">
                Ace = 1, 2-10 = <strong>1-10 days</strong>
              </p>
              <p className="text-sm text-muted-foreground">
                10 = 10 = <strong>10 days</strong>
              </p>
            </div>

            <div className="mt-4 rounded-lg bg-muted p-4">
              <p className="mb-3 font-semibold text-foreground">
                House Position Values
              </p>
              <p className="text-sm text-muted-foreground">
                Positions 1-4 = <strong>1-4 months</strong>
              </p>
              <p className="text-xs text-muted-foreground">
                House in position 4 represents months to years timeframe
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8 border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl text-foreground">
            <Star className="mr-3 h-6 w-6 text-primary" />
            Summary & Key Points
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary/80">
                  <RefreshCw className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-foreground">
                    Knights reveal hidden patterns
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    L-shaped movements show what is happening beyond the surface
                    reading
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary/80">
                  <Eye className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-foreground">
                    Mirrors expose blind spots
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Opposition shows what you are not seeing about yourself or a
                    situation
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary/80">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-foreground">
                    Proximity matters most
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Cards touching significator have the strongest influence on
                    interpretation.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 rounded-lg border border-border bg-muted/50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary/80">
                  <Move className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-foreground">
                    Traditional system focuses on:
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Card interactions, significator positioning, directional
                    zones, knights, and mirrors
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </ModulePageClient>
  );
}
