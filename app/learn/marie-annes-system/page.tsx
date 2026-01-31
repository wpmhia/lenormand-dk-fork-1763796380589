import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModulePageClient } from "@/components/ModulePageClient";
import {
  Crown,
  Zap,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export const metadata = {
  title: "Marie-Anne's System | Lenormand Course",
  description:
    "Learn the historical methodology inspired by Marie-Anne Lenormand's practical, deadline-driven readings and authentic techniques.",
};

export default function MarieAnnesSystemPage() {
  return (
    <ModulePageClient
      moduleId="marie-annes-system"
      moduleNumber={7}
      totalModules={8}
      title="Marie-Anne's System"
      description="Learn the historical methodology inspired by Marie-Anne Lenormand's practical, deadline-driven readings and authentic techniques."
      duration="30 minutes"
      difficulty="Advanced"
      icon={<Crown className="h-8 w-8 text-white" />}
      prevModule={{ id: "advanced", title: "Advanced Concepts" }}
      breadcrumbs={[
        { name: "Home", url: "/" },
        { name: "Learn", url: "/learn" },
        { name: "Marie-Anne's System", url: "/learn/marie-annes-system" },
      ]}
    >
      {/* Who She Was */}
      <Card className="mb-8 border-border bg-card">
        <CardHeader>
          <CardTitle
            id="who-was-marie-anne"
            className="flex items-center gap-2"
          >
            <Crown className="h-5 w-5 text-amber-500" />
            Who Was Marie-Anne Lenormand?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-foreground">
          <p>
            Marie-Anne Adelaide Lenormand (1772–1843) was the most celebrated
            fortune-teller of the Napoleonic era. She read for Empress
            Josephine, revolutionary leaders, and thousands of clients in her
            Paris salon. Her reputation for sharp, practical readings made her
            legendary.
          </p>
          <p>
            While she did not leave behind a documented system for the 36-card
            deck now bearing her name, the modern Lenormand deck evolved from
            German fortune-telling games like{" "}
            <em>Das Spiel der Hoffnung</em> (The Game of Hope). After her death,
            the deck became posthumously associated with her legacy, and modern
            interpretations have developed to honor the spirit of reading
            traditions from her era.
          </p>
          <p>
            This page explores reading principles inspired by the historical
            Lenormand tradition—practical, direct guidance drawn from the
            symbolic language and techniques that became known as Lenormand
            divination.
          </p>
        </CardContent>
      </Card>

      {/* Five Core Principles */}
      <Card className="mb-8 border-border bg-card">
        <CardHeader>
          <CardTitle
            id="five-core-principles"
            className="flex items-center gap-2"
          >
            <Zap className="h-5 w-5 text-amber-500" />
            Her Five Core Principles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-foreground">
          <div className="space-y-4">
            <div className="border-l-2 border-amber-500 pl-4">
              <h3 className="font-semibold">
                1. The Significator is Sacred
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Every reading begins with a significator. Choose the{" "}
                <strong>Man card (first person)</strong> to represent the
                querent&apos;s perspective, or the{" "}
                <strong>Woman card (second person)</strong> for the other
                person&apos;s perspective. The significator is the center, the
                anchor, the heart of the reading.
              </p>
            </div>

            <div className="border-l-2 border-amber-500 pl-4">
              <h3 className="font-semibold">2. Deadline-First Always</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Every reading ends with a specific deadline: &quot;by Thursday
                evening,&quot; &quot;next Monday morning,&quot; &quot;within three
                days.&quot; Her querents were working women who needed to know:{" "}
                <strong>when</strong>. No vague &quot;when the time is
                right.&quot;
              </p>
            </div>

            <div className="border-l-2 border-amber-500 pl-4">
              <h3 className="font-semibold">3. Action Required</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                A reading without action is worthless. Marie-Anne always ended
                with an imperative: &quot;Send word to him before Friday,&quot;
                &quot;Make the decision by Wednesday,&quot; &quot;Prepare for
                this by tomorrow.&quot; The cards show what is, action reveals
                what&apos;s possible.
              </p>
            </div>

            <div className="border-l-2 border-amber-500 pl-4">
              <h3 className="font-semibold">4. No Reversals</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Marie-Anne read only upright meanings. No reversed cards adding
                confusion or ambiguity. The Mountain is obstacles. The Sun is
                clarity. Simple. Direct. Unambiguous.
              </p>
            </div>

            <div className="border-l-2 border-amber-500 pl-4">
              <h3 className="font-semibold">5. Card Strength Matters</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Some cards carry weight (Strong): Sun, Key, Ring. Others modify
                (Weak): Clouds, Mice, Child. Her readings reflected this
                hierarchy—strong cards as the foundation, weak cards as context.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Original Spreads */}
      <Card className="mb-8 border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-amber-500" />
            Marie-Anne&apos;s Original Spreads
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-foreground">
          <p>These are the spreads she actually used in her salon:</p>

          <div className="space-y-3">
            <div className="rounded-lg bg-muted p-4">
              <h4 className="font-semibold">Single Card</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                Quick daily guidance. One card, one answer, immediate action.
              </p>
            </div>

            <div className="rounded-lg bg-muted p-4">
              <h4 className="font-semibold">3-Card Sentence</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                Her daily workhorse. Opening → Turning Point → Outcome. Always
                with deadline and action.
              </p>
            </div>

            <div className="rounded-lg bg-muted p-4">
              <h4 className="font-semibold">9-Card Petit Grand Tableau</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                3x3 grid. Deeper exploration without overwhelming complexity.
                For situations requiring more nuance.
              </p>
            </div>

            <div className="rounded-lg bg-muted p-4">
              <h4 className="font-semibold">36-Card Grand Tableau</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                The complete 4x9 grid. Her reading. The entire situation visible
                at once. She read by rows, diagonals, and the
                significator&apos;s position.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modern Spreads Through Her Lens */}
      <Card className="mb-8 border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            Modern Spreads (Applied with Her Methodology)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-foreground">
          <p>
            Spreads like Past-Present-Future and Situation-Challenge-Advice
            were developed after Marie-Anne&apos;s time. But we apply{" "}
            <strong>her methodology</strong> to all of them:
          </p>

          <ul className="space-y-2 text-sm">
            <li className="flex gap-2">
              <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
              <span>
                <strong>Deadline-driven:</strong> Every modern spread ends with
                a specific day and time
              </span>
            </li>
            <li className="flex gap-2">
              <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
              <span>
                <strong>Action-oriented:</strong> Never interpretation
                alone—always prescribe action
              </span>
            </li>
            <li className="flex gap-2">
              <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
              <span>
                <strong>Direct language:</strong> Her commanding, practical
                voice guides every reading
              </span>
            </li>
            <li className="flex gap-2">
              <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
              <span>
                <strong>Card strength respected:</strong> Strong cards carry
                weight, weak cards modify
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* How to Read Like Marie-Anne */}
      <Card className="mb-8 border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-amber-500" />
            How to Read Like Marie-Anne
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-foreground">
          <div className="space-y-3">
            <div>
              <h4 className="mb-2 font-semibold">
                Step 1: Choose or Draw the Significator
              </h4>
              <p className="text-sm text-muted-foreground">
                <strong>Man (First Person):</strong> Use to represent the
                querent&apos;s primary perspective.{" "}
                <strong>Woman (Second Person):</strong> Use to represent another
                person&apos;s perspective or the secondary focus. These
                positional significators work with any person, regardless of
                gender.
              </p>
            </div>

            <div>
              <h4 className="mb-2 font-semibold">
                Step 2: Ask a Direct Question
              </h4>
              <p className="text-sm text-muted-foreground">
                No vague questions. &quot;What should I do about my job?&quot;
                not &quot;What does the universe think?&quot; Marie-Anne read
                for practical people with real problems.
              </p>
            </div>

            <div>
              <h4 className="mb-2 font-semibold">Step 3: Draw the Spread</h4>
              <p className="text-sm text-muted-foreground">
                Single card, 3-card, 9-card, or 36-card. Focus on the cards that
                appear and their story together.
              </p>
            </div>

            <div>
              <h4 className="mb-2 font-semibold">
                Step 4: Read the Cards&apos; Story
              </h4>
              <p className="text-sm text-muted-foreground">
                What is the sequence of events? Where is the friction? What
                breaks it? What&apos;s the outcome? Don&apos;t interpret each
                card separately—see how they flow together.
              </p>
            </div>

            <div>
              <h4 className="mb-2 font-semibold">
                Step 5: State the Outcome & Action
              </h4>
              <p className="text-sm text-muted-foreground">
                &quot;This is what will happen. Here&apos;s what you do about
                it. Do this by [specific day/time].&quot; Clear. Commanding.
                Actionable.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Why This Matters */}
      <Card className="mb-8 border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Why This Matters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-foreground">
          <p>
            Marie-Anne wasn&apos;t a mystic or a spiritual guide. She was a
            problem-solver. Her querents came with real questions: Should I
            marry this man? Should I leave my job? When will my son return? How
            do I survive this winter?
          </p>
          <p>
            She gave them answers. Direct, practical, deadline-driven,
            action-oriented answers. That&apos;s the soul of her system.
          </p>
          <p className="text-sm italic text-muted-foreground">
            This app brings that methodology back—not as history, but as a
            living, practical tool for real guidance in the modern world.
          </p>
        </CardContent>
      </Card>
    </ModulePageClient>
  );
}
