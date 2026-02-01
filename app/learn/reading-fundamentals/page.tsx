import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModulePageClient } from "@/components/ModulePageClient";
import {
  Target,
  Shuffle,
  MessageSquare,
  BookOpen,
  Users,
  HelpCircle,
  Briefcase,
  Clock,
  Heart,
  TrendingUp,
} from "lucide-react";

export const metadata = {
  title: "Reading Fundamentals | Lenormand Course",
  description:
    "Master the core methodology of Lenormand divination. Learn sentence structure and fundamental reading techniques.",
};

export default function ReadingFundamentalsPage() {
  return (
    <ModulePageClient
      moduleId="reading-fundamentals"
      moduleNumber={3}
      totalModules={8}
      title="Reading Fundamentals"
      description="Master the core methodology of Lenormand divination. Learn sentence structure and fundamental techniques."
      duration="30 minutes"
      difficulty="Beginner"
      icon={<Target className="h-8 w-8 text-white" />}
      prevModule={{ id: "card-meanings", title: "Card Meanings" }}
      nextModule={{ id: "card-combinations", title: "Card Combinations" }}
      breadcrumbs={[
        { name: "Home", url: "/" },
        { name: "Learn", url: "/learn" },
        { name: "Reading Fundamentals", url: "/learn/reading-fundamentals" },
      ]}
    >
      {/* Reading as Sentences */}
      <Card className="mb-8 border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl text-foreground">
            <MessageSquare className="mr-3 h-6 w-6 text-primary" />
            Reading Cards as Sentences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="leading-relaxed text-muted-foreground">
            The most distinctive feature of Lenormand reading is treating card
            meanings as words in a sentence. Unlike Tarot&apos;s symbolic
            interpretation, Lenormand cards are read in sequence to form
            coherent messages.
          </p>

          <div className="rounded-lg border border-border bg-muted p-6">
            <h3 className="mb-3 font-semibold text-foreground">
              Example: Three-Card Spread
            </h3>
            <div className="space-y-3">
              <div className="flex flex-col items-center">
                <div className="inline-flex items-center space-x-4 rounded-lg bg-card p-4 shadow-sm">
                  <div className="flex flex-col items-center">
                    <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-r from-primary to-primary/80">
                      <span className="font-bold text-white">1</span>
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      Card 1
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Opening/Context
                    </p>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-r from-primary to-primary/80">
                      <span className="font-bold text-white">2</span>
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      Card 2
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Central/Action
                    </p>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-r from-primary to-primary/80">
                      <span className="font-bold text-white">3</span>
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      Card 3
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Outcome/Result
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-card-foreground">How it works:</strong>{" "}
                  After you learn the 36 card meanings in the next module, you&apos;ll be able to read any three cards as a flowing sentence. For now, understand that Card 1 sets the context, Card 2 shows the central action, and Card 3 reveals the outcome.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 5-Card Methodology */}
      <Card className="mb-8 border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl text-foreground">
            <MessageSquare className="mr-3 h-6 w-6 text-primary" />
            5-Card Reading: Two Depth Modes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="leading-relaxed text-muted-foreground">
            The 5-card spread is the workhorse of modern Lenormand. It&apos;s
            flexible, fast, and layered. You can use it two ways depending on
            how much depth you need.
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <h3 className="mb-3 font-semibold text-foreground">
                MODE 1: SENTENCE ONLY (Quick)
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <strong>Time:</strong> 10–15 seconds
                </p>
                <p>
                  <strong>Method:</strong> Read cards 1-2-3-4-5 as ONE
                  grammatical sentence and stop.
                </p>
                <p>
                  <strong>Structure:</strong> Subject (1) + Verb (2) + Object (3)
                  + Modifier (4) + Outcome (5)
                </p>
                <p>
                  <strong>Best for:</strong> Daily draws, quick questions, when
                  you only need the headline
                </p>
                <p>
                  <strong>Example:</strong> &quot;Card 1 (subject) brings an
                  invitation (object) to the family (modifier) and leads to
                  money (outcome).&quot; - Once you know the cards, you&apos;ll substitute Card 1 with the actual card name and meaning.
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <h3 className="mb-3 font-semibold text-foreground">
                MODE 2: FULL STRUCTURED (Deep)
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <strong>Time:</strong> 60–90 seconds
                </p>
                <p>
                  <strong>Method:</strong> Start with the sentence, then layer
                  three optional interpretive lenses, analyze adjacent pairs,
                  and add timing if needed.
                </p>
                <p>
                  <strong>Layers:</strong>
                </p>
                <ul className="ml-4 space-y-1 text-xs">
                  <li>
                    • Three lenses: Past-Present-Future OR
                    Problem-Advice-Outcome OR Situation-Action-Result
                  </li>
                  <li>
                    • Four adjacent pairs: 1+2, 2+3, 3+4, 4+5 as micro-story
                    beats
                  </li>
                  <li>
                    • Optional timing: Add pips of card 5 (≤10=days,
                    11-20=weeks, &gt;20=months)
                  </li>
                  <li>
                    • Optional significator: Identify the central focus (Man =
                    you/focus person, Woman = another key person, Heart = a
                    situation or emotion)
                  </li>
                </ul>
                <p>
                  <strong>Best for:</strong> Important questions, relationship
                  issues, decisions where you need to know{" "}
                  <em>when, why, and who</em>
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm font-medium text-foreground">
              💡 Think of Sentence mode as the <strong>headline</strong>;
              Structured mode is the <strong>full article</strong>.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Use the light version when you&apos;re in a hurry. Run the full
              checklist when the question matters.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Basic Reading Steps */}
      <Card className="mb-8 border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl text-foreground">
            <Shuffle className="mr-3 h-6 w-6 text-primary" />
            Basic Reading Steps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {[
              {
                step: 1,
                title: "Prepare Your Space",
                description:
                  "Find a quiet, comfortable space. Clear your mind and focus on your question or situation.",
              },
              {
                step: 2,
                title: "Shuffle Intuitively",
                description:
                  "Shuffle the cards while thinking about your question. When you feel ready, stop shuffling.",
              },
              {
                step: 3,
                title: "Draw Your Cards",
                description:
                  "Draw cards in the spread pattern you're using. Place them face up in order.",
              },
              {
                step: 4,
                title: "Read as a Sentence",
                description:
                  "Read the card meanings in sequence to form a coherent message or story.",
              },
              {
                step: 5,
                title: "Trust Your Intuition",
                description:
                  "While meanings are concrete, your intuition helps connect the dots and find personal relevance.",
              },
            ].map((item) => (
              <div key={item.step} className="flex items-start space-x-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary/80">
                  <span className="text-sm font-bold text-white">
                    {item.step}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Common Questions */}
      <Card className="mb-8 border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl text-foreground">
            <HelpCircle className="mr-3 h-6 w-6 text-primary" />
            Common Lenormand Questions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="leading-relaxed text-muted-foreground">
            Lenormand excels at practical, everyday questions. Unlike Tarot
            focus on psychological depth, Lenormand answers &quot;how&quot; and
            &quot;when&quot; about real-world situations.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            {[
              {
                category: "Love & Relationships",
                icon: Heart,
                color: "text-rose-500",
                questions: [
                  "Will they contact me soon?",
                  "What is the future of this relationship?",
                  "How do they feel about me?",
                  "Will my ex come back?",
                  "Is a new relationship coming?",
                ],
              },
              {
                category: "Career & Work",
                icon: Briefcase,
                color: "text-emerald-500",
                questions: [
                  "What is the outcome of my job interview?",
                  "Should I change jobs?",
                  "What will happen at work this week?",
                  "Is this a good time to start a business?",
                  "What do I need to know about my career?",
                ],
              },
              {
                category: "Timing Questions",
                icon: Clock,
                color: "text-amber-500",
                questions: [
                  "When will I hear back about X?",
                  "When will this situation change?",
                  "How long until things improve?",
                  "What is the timeline for this outcome?",
                  "When should I take action?",
                ],
              },
              {
                category: "General Guidance",
                icon: TrendingUp,
                color: "text-blue-500",
                questions: [
                  "What do I need to know about situation?",
                  "What should I focus on this week?",
                  "What advice do the cards have for me?",
                  "What obstacles might I face?",
                  "What is the best path forward?",
                ],
              },
            ].map((section, index) => (
              <div
                key={index}
                className="rounded-lg border border-primary/20 bg-primary/5 p-4"
              >
                <div className="mb-3 flex items-center">
                  <section.icon className={`mr-2 h-5 w-5 ${section.color}`} />
                  <h3 className="font-semibold text-foreground">
                    {section.category}
                  </h3>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {section.questions.map((q, i) => (
                    <li key={i}>• &quot;{q}&quot;</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
            <h3 className="mb-2 font-semibold text-foreground">
              How to Ask Lenormand Questions
            </h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong className="text-card-foreground">Be specific:</strong>{" "}
                Lenormand works best with concrete questions. &quot;Will I get
                the job?&quot; is better than &quot;What about my career?&quot;
              </p>
              <p>
                <strong className="text-card-foreground">
                  Include timeframe:
                </strong>{" "}
                &quot;What should I focus on this week?&quot; gets better answers
                than open-ended &quot;What about my future?&quot;
              </p>
              <p>
                <strong className="text-card-foreground">
                  Ask about others carefully:
                </strong>{" "}
                You can ask about others&apos; actions toward you, but avoid
                questions that try to control or predict others&apos; internal
                states.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </ModulePageClient>
  );
}
