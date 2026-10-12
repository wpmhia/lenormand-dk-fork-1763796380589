import { BookOpen, History, Link2 } from "lucide-react";
import { ModulePageClient } from "@/components/ModulePageClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Marie-Anne Lenormand and the Petit Deck | Lenormand Course",
  description: "What historical sources do and do not establish about Marie-Anne Lenormand and the 36-card deck named after her.",
};

export default function MarieAnnesSystemPage() {
  return (
    <ModulePageClient
      moduleId="marie-annes-system"
      moduleNumber={7}
      totalModules={8}
      title="Marie-Anne Lenormand and the Petit Deck"
      description="Separate documented history from later methods and modern interpretations."
      duration="10 minutes"
      difficulty="Intermediate"
      icon={<History className="h-8 w-8 text-white" />}
      prevModule={{ id: "advanced", title: "Advanced Concepts" }}
      breadcrumbs={[
        { name: "Home", url: "/" },
        { name: "Learn", url: "/learn" },
        { name: "Marie-Anne Lenormand", url: "/learn/marie-annes-system" },
      ]}
    >
      <Card className="mb-8 border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            What the record supports
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            Marie-Anne Adelaide Lenormand (1772–1843) was a well-known French fortune-teller. The 36-card Petit Lenormand deck that later bore her name is not securely documented as a deck she designed or as a system whose instructions she authored.
          </p>
          <p>
            <em>Das Spiel der Hoffnung</em>, published around 1799, is an earlier 36-card German parlour game with related motifs. Its surviving instructions describe game rules and a playful oracle layout around the Man/Woman cards. They do not provide the modern fixed meanings for all 36 cards or a source-reviewed dictionary of pairs.
          </p>
          <p>
            Later publishers and readers developed and varied divinatory interpretations. This course therefore does not attribute deadlines, action prescriptions, directional rules, or a precise five-step Grand Tableau method to Lenormand without documentary evidence.
          </p>
        </CardContent>
      </Card>

      <Card className="mb-8 border-border bg-muted/30">
        <CardHeader>
          <CardTitle>How this application describes its method</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Current readings use the current question, actual cards, exact order/positions, and optional reading focus. Reading history and prior predictions are not generation inputs.</p>
          <p>Core meanings are source-compared editorial summaries. Expert review is pending. No pair is presented as established doctrine until its sources and review status are recorded.</p>
          <p>Methods differ. A modern school-specific technique may be useful, but it should be identified as such rather than retroactively attributed to Marie-Anne Lenormand.</p>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Sources
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><a className="underline underline-offset-2" href="https://archive.org/details/bub_gb_kU9CAAAAcAAJ" target="_blank" rel="noreferrer">Humoristische Blätter für Kopf und Herz (1799), Internet Archive</a> — historical game publication.</p>
          <p><a className="underline underline-offset-2" href="https://www.lenormandreader.com/blog/the-game-of-hope" target="_blank" rel="noreferrer">The Game of Hope, Lenormand Reader</a> — discussion of the surviving game instructions and later meanings.</p>
          <p><a className="underline underline-offset-2" href="https://www.lenormandreader.com/about-mlle-lenormand" target="_blank" rel="noreferrer">Who Was Mlle Lenormand?, Lenormand Reader</a> — overview of attribution uncertainty.</p>
        </CardContent>
      </Card>
    </ModulePageClient>
  );
}
