import { Clock, Globe, Grid3X3, Spade } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModulePageClient } from "@/components/ModulePageClient";

export const metadata = {
  title: "Advanced Correspondences | Lenormand Course",
  description: "A source-conscious overview of timing, playing-card associations, interpretive variation, and supported Grand Tableau structure.",
};

export default function AdvancedPage() {
  return (
    <ModulePageClient
      moduleId="advanced"
      moduleNumber={6}
      totalModules={8}
      title="Advanced Correspondences & Limits"
      description="Distinguish school-specific correspondences from the structure currently used by the app."
      duration="15 minutes"
      difficulty="Advanced"
      icon={<Grid3X3 className="h-8 w-8 text-white" />}
      prevModule={{ id: "grand-tableau-techniques", title: "Grand Tableau Structure" }}
      nextModule={{ id: "marie-annes-system", title: "Marie-Anne and the Petit Deck" }}
      breadcrumbs={[
        { name: "Home", url: "/" },
        { name: "Learn", url: "/learn" },
        { name: "Advanced Correspondences", url: "/learn/advanced" },
      ]}
    >
      <Card className="mb-8 border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Clock className="h-5 w-5 text-primary" />
            Timing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>Timing tables differ by source and school. A requested observation window frames the question; it does not establish when an event will happen.</p>
          <p>The app does not send its learning-only card timing labels as model evidence. A generated timing should remain null unless the current question and spread provide a defensible basis; no deadline or probability is forced.</p>
        </CardContent>
      </Card>

      <Card className="mb-8 border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Spade className="h-5 w-5 text-primary" />
            Playing-card insets
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>Many Petit Lenormand decks show a playing-card inset on each card. Readers may use these correspondences, but their methods and meanings vary.</p>
          <p>The app&apos;s interpretation prompt uses the reviewed pictorial core meanings and spread structure; it does not pass suit/rank correspondences as additional evidence.</p>
        </CardContent>
      </Card>

      <Card className="mb-8 border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Globe className="h-5 w-5 text-primary" />
            Interpretive variation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>Meanings and methods vary among authors and schools. Avoid treating broad national or religious labels as one uniform practice. Attribute a secondary meaning to a named, cited source and keep it separate from the core meaning.</p>
          <p>Uncited pair lists, invented histories, and single-card claims about a real person or event are not source evidence.</p>
        </CardContent>
      </Card>

      <Card className="border-border bg-muted/30">
        <CardHeader>
          <CardTitle className="text-xl">Grand Tableau methods</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>The application supplies the 4×9 coordinates, all houses, and immediate neighbours for drawn Man/Woman cards. House occupancy is separate from adjacency.</p>
          <p>Mirrors, knight moves, and school-specific directional interpretations are not currently computed or presented as established app methods. They require a named source, exact boundary rules, and regression tests before use.</p>
        </CardContent>
      </Card>
    </ModulePageClient>
  );
}
