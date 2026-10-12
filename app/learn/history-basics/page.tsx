import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModulePageClient } from "@/components/ModulePageClient";
import {
  BookOpen,
  Diamond,
  Clock,
  Star,
  Heart,
  Lightbulb,
  Target,
} from "lucide-react";

export const metadata = {
  title: "History & Basics | Lenormand Course",
  description:
    "Discover the origins of Lenormand divination and learn the fundamental concepts that make this 36-card system unique and powerful.",
};

export default function HistoryBasicsPage() {
  return (
    <ModulePageClient
      moduleId="history-basics"
      moduleNumber={1}
      totalModules={8}
      title="History & Basics"
      description="Discover the origins of Lenormand divination and learn the fundamental concepts that make this 36-card system unique and powerful."
      duration="20 minutes"
      difficulty="Beginner"
      icon={<BookOpen className="h-8 w-8 text-white" />}
      nextModule={{ id: "card-meanings", title: "Card Meanings" }}
      breadcrumbs={[
        { name: "Home", url: "/" },
        { name: "Learn", url: "/learn" },
        { name: "History & Basics", url: "/learn/history-basics" },
      ]}
    >
      {/* What is Lenormand */}
      <Card className="mb-8 border-border bg-card">
        <CardHeader>
          <CardTitle
            id="what-is-lenormand"
            className="flex items-center text-2xl text-foreground"
          >
            <Diamond className="mr-3 h-6 w-6 text-primary" />
            What is Lenormand?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="leading-relaxed text-muted-foreground">
            Petit Lenormand is a 36-card cartomancy deck that uses everyday
            images. A related 36-card German parlour game, <em>Das Spiel der
            Hoffnung</em>, was published around 1799. The later deck was
            posthumously associated with Marie-Anne Lenormand; the exact history
            of that connection is not fully documented.
          </p>
          <p className="leading-relaxed text-muted-foreground">
            The modern 36-card deck and its interpretation methods became known
            as Lenormand in the 19th century, posthumously associated with the
            legendary French fortune teller Marie Anne Adelaide Lenormand.
            While she didn&apos;t leave behind a documented system for this
            specific deck, the symbolic language and reading traditions
            connected to her name developed through later publishers and
            practitioners. This platform provides a source-compared, symbolic
            interpretation of the current question and drawn cards; it is not
            evidence of events or a guaranteed forecast.
          </p>
        </CardContent>
      </Card>

      {/* Origins and History */}
      <Card className="mb-8 border-border bg-card">
        <CardHeader>
          <CardTitle
            id="origins-history"
            className="flex items-center text-2xl text-foreground"
          >
            <Clock className="mr-3 h-6 w-6 text-primary" />
            Origins & History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="mb-3 font-semibold text-foreground">
              Marie Anne Adelaide Lenormand (1772-1843)
            </h3>
            <p className="leading-relaxed text-muted-foreground">
              The legendary French fortune teller who gained fame for her
              readings and high-profile clientele including Napoleon and
              Josephine. She became one of the most celebrated diviners of her
              time.
            </p>
          </div>

          <div>
            <h3 className="mb-3 font-semibold text-foreground">
              Das Spiel der Hoffnung (The Game of Hope)
            </h3>
            <p className="leading-relaxed text-muted-foreground">
              <em>Das Spiel der Hoffnung</em> is a 36-card German parlour game
              published around 1799 and associated with Johann Kaspar Hechtel.
              Its surviving instructions describe the game and a playful oracle
              layout; they do not give the modern fixed divinatory meanings for
              every card.
            </p>
          </div>

          <div>
            <h3 className="mb-3 font-semibold text-foreground">
              Posthumous Naming
            </h3>
            <p className="leading-relaxed text-muted-foreground">
              After Lenormand&apos;s death in 1843, the 36-card deck became
              widely marketed under her name as the &quot;Petit Lenormand.&quot;
              The deck&apos;s association with her name enhanced its mystique and
              helped popularize it across Europe.
            </p>
          </div>

          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm text-foreground">
              <strong>Historical Note:</strong> The modern Petit Lenormand is
              associated with her name, but the surviving record does not
              establish that Marie-Anne Lenormand designed this 36-card deck or
              authored its current card meanings and pair methods. Treat modern
              keywords as later interpretations, not as direct quotations from
              her practice.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Method scope */}
      <Card className="mb-8 border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl text-foreground">
            <Star className="mr-3 h-6 w-6 text-primary" />
            How this app approaches the cards
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>The app preserves the current question, drawn cards, order, spread geometry, and optional selected focus. It supplies source-compared core meanings and treats combinations as contextual interpretation unless a reviewed source is recorded.</p>
          <p>Cards can support reflection on a question, but do not establish that an event occurred or guarantee a future outcome. This app uses upright meanings; other contemporary practices may differ.</p>
        </CardContent>
      </Card>

      {/* Why Learn Lenormand */}
      <Card className="mb-8 border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl text-foreground">
            <Heart className="mr-3 h-6 w-6 text-primary" />
            Why Learn Lenormand?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Target className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <div>
                  <h3 className="font-semibold text-foreground">
                    Question-led interpretation
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    The answer should address the question and explain how the drawn cards inform it
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Heart className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <div>
                  <h3 className="font-semibold text-foreground">
                    Context matters
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    A relationship question does not by itself prove a partner&apos;s actions or identify a person card
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Clock className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <div>
                  <h3 className="font-semibold text-foreground">
                    Timing is uncertain
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Timing methods vary; the app does not promise that an event will occur by a date
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <BookOpen className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <div>
                  <h3 className="font-semibold text-foreground">
                    Accessible Learning
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Learn the core meanings, positional structure, and source status of secondary variants
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What Lenormand Can Help With */}
      <Card className="mb-8 border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl text-foreground">
            <Lightbulb className="mr-3 h-6 w-6 text-primary" />
            What Lenormand Can Help With
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-6 text-muted-foreground">
            People commonly use Lenormand to reflect on practical questions. A
            reading is symbolic interpretation, not independent evidence that a
            real-world event or allegation is true. Common question areas include:
          </p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-3">
              <div className="mb-2">
                <h3 className="font-semibold text-foreground">
                  Daily Guidance
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                A single card as a prompt for reflection; it does not guarantee how the day will unfold
              </p>
            </div>
            <div className="space-y-3">
              <div className="mb-2">
                <h3 className="font-semibold text-foreground">
                  Decision Making
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Consider options symbolically without treating a forecast as certain
              </p>
            </div>
            <div className="space-y-3">
              <div className="mb-2">
                <h3 className="font-semibold text-foreground">Relationships</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Reflect on relationship questions without assuming unprovided events or motives
              </p>
            </div>
            <div className="space-y-3">
              <div className="mb-2">
                <h3 className="font-semibold text-foreground">
                  Career & Work
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Reflect on work questions; timing and outcomes are not guaranteed
              </p>
            </div>
            <div className="space-y-3">
              <div className="mb-2">
                <h3 className="font-semibold text-foreground">
                  Problem Solving
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Consider alternative interpretations without claiming access to hidden facts
              </p>
            </div>
            <div className="space-y-3">
              <div className="mb-2">
                <h3 className="font-semibold text-foreground">
                  Self-Reflection
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Explore a different perspective on personal questions
              </p>
            </div>
          </div>
          <div className="mt-6 rounded-lg border border-amber-200/20 bg-amber-50/10 p-4 text-sm text-muted-foreground dark:bg-amber-950/10 dark:text-amber-400">
            <p className="font-medium text-amber-700 dark:text-amber-400">
              Key Principle: The question focuses the interpretation; it does not prove its assumptions.
            </p>
            <p className="mt-1">
              Be clear and specific in your questions. A focused question helps
              narrow the subject, but it does not guarantee an outcome. For example, ask: &quot;Should
              I accept this job offer?&quot; rather than &quot;What about my
              career?&quot;
            </p>
          </div>
        </CardContent>
      </Card>
    </ModulePageClient>
  );
}
