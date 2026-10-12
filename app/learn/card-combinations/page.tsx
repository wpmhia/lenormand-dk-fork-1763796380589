import { ArrowRight, BookOpen, Combine, HelpCircle } from "lucide-react";
import Link from "next/link";
import { ModulePageClient } from "@/components/ModulePageClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Reading Lenormand Combinations | Lenormand Course",
  description: "A context-first approach to ordered Lenormand combinations without treating uncited pair lists as fixed doctrine.",
};

export default function CardCombinationsPage() {
  return (
    <ModulePageClient
      moduleId="card-combinations"
      moduleNumber={4}
      totalModules={8}
      title="Reading Card Combinations"
      description="Build a contextual reading from ordered cards, the question, and the actual spread."
      duration="15 minutes"
      difficulty="Intermediate"
      icon={<Combine className="h-8 w-8 text-white" />}
      prevModule={{ id: "reading-fundamentals", title: "Reading Fundamentals" }}
      nextModule={{ id: "spreads", title: "Spreads & Techniques" }}
      breadcrumbs={[
        { name: "Home", url: "/" },
        { name: "Learn", url: "/learn" },
        { name: "Card Combinations", url: "/learn/card-combinations" },
      ]}
    >
      <Card className="mb-8 border-primary/20 bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            A context-first method
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            A card pairing is an interpretive synthesis, not automatically a fixed dictionary entry. Start with the user’s current question, the core meanings of the cards actually drawn, their order, and their positions. Explain the best-supported reading in plain language; do not turn a symbol into a proven real-world event.
          </p>
          <ol className="list-decimal space-y-2 pl-5">
            <li>Identify what the question is asking without treating its assumptions as evidence.</li>
            <li>Read consecutive cards in the line from left to right. Order can affect emphasis; do not assume the reverse order says exactly the same thing.</li>
            <li>Combine meanings in context rather than listing a memorized phrase for every pair.</li>
            <li>Use only combinations that contribute to the question. Explain material support and conflict without forcing every card into a story.</li>
            <li>Separate symbolic suggestions from claims about a named person, event, motive, or guaranteed outcome.</li>
          </ol>
        </CardContent>
      </Card>

      <Card className="mb-8 border-border bg-muted/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Keep the symbols distinct
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p><strong>Paths (#22)</strong> concerns choices, alternatives, and decisions. <strong>Cross (#36)</strong> concerns burden, hardship, duty, and suffering; it is not a synonym for Paths.</p>
          <p><strong>Fox (#14)</strong> can concern work, strategy, self-interest, caution, or deception depending on context. Fox alone does not prove infidelity.</p>
          <p>Other secondary meanings can vary by school. For example, some readers associate Lily with sexuality or Fish with independence; those are contextual variants, not automatic conclusions.</p>
        </CardContent>
      </Card>

      <Card className="mb-8 border-border bg-card">
        <CardHeader>
          <CardTitle>Pair-reference review status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>
            The old generated pair list contained uncited, highly specific statements and is quarantined from the reading model. No pair meanings are currently marked source-reviewed in the canonical registry, so this course does not present a generic pair list as established tradition. Novel combinations may still be interpreted from the reviewed core meanings and the current spread.
          </p>
          <Link href="/cards">
            <Button variant="outline" className="gap-2">
              Browse the 36 core card meanings <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </ModulePageClient>
  );
}
