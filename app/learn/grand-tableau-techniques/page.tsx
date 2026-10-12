import { Compass, Grid3X3, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModulePageClient } from "@/components/ModulePageClient";

export const metadata = {
  title: "Grand Tableau Structure | Lenormand Course",
  description: "A source-conscious guide to the 4×9 Grand Tableau structure, houses, person-card focus, and immediate neighbours.",
};

export default function GrandTableauTechniquesPage() {
  return (
    <ModulePageClient
      moduleId="grand-tableau-techniques"
      moduleNumber={5}
      totalModules={8}
      title="Grand Tableau Structure"
      description="Read the 4×9 layout from its actual positions, houses, and card relationships without assuming unsupported advanced rules."
      duration="20 minutes"
      difficulty="Advanced"
      icon={<Compass className="h-8 w-8 text-white" />}
      prevModule={{ id: "spreads", title: "Spreads & Techniques" }}
      nextModule={{ id: "advanced", title: "Advanced Concepts" }}
      breadcrumbs={[
        { name: "Home", url: "/" },
        { name: "Learn", url: "/learn" },
        { name: "Grand Tableau Structure", url: "/learn/grand-tableau-techniques" },
      ]}
    >
      <Card className="mb-8 border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Grid3X3 className="h-6 w-6 text-primary" />
            The fixed 4×9 grid
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>
            Positions are numbered left-to-right, then top-to-bottom. The application supplies all 36 row and column coordinates and maps each position to its house card.
          </p>
          <p>
            A card at position N occupies the house named by deck card N. The card physically adjacent to it is a separate fact: adjacency does not imply house occupancy, and sharing a house does not imply adjacency.
          </p>
          <p>
            Immediate neighbours are the eight surrounding cells (horizontal, vertical, and diagonal). Grid edges do not wrap. For example, cells at the right edge are not adjacent to cells at the left edge of the next row.
          </p>
        </CardContent>
      </Card>

      <Card className="mb-8 border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Users className="h-6 w-6 text-primary" />
            Man, Woman, and reading focus
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>
            Man (#28) and Woman (#29) are person cards. A selected reading focus directs attention to that card; it does not, by itself, identify the querent, a spouse, a partner, or any particular person.
          </p>
          <p>
            Left, right, above, below, and diagonal describe geometry. They do not have universal past/future, visible/hidden, or psychological meanings in this application.
          </p>
          <p>
            Interpret the focus card and nearby cards only in relation to the current question and the actual draw. Do not infer an absent relationship or personal history.
          </p>
        </CardContent>
      </Card>

      <Card className="mb-8 border-border bg-muted/30">
        <CardHeader>
          <CardTitle>Advanced techniques: review status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Mirrors, knight moves, and other advanced Tableau methods vary among modern schools. This application does not calculate or present them as established facts. They should be enabled only after a method is explicitly sourced, defined for this 4×9 layout, and covered by positional regression tests.
          </p>
          <p>
            The 1799 Game of Hope source is useful for deck/game history and an early playful oracle layout; it is not evidence for every later Grand Tableau convention.
          </p>
        </CardContent>
      </Card>
    </ModulePageClient>
  );
}
