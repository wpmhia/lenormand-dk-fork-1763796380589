import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coffee, Heart, Sparkles, Users, Code } from "lucide-react";

export const metadata: Metadata = {
  title: "Support - Lenormand Intelligence",
  description: "Support Lenormand Intelligence with a coffee. No subscriptions, completely free.",
};

const whySupport = [
  {
    icon: <Code className="h-6 w-6" />,
    title: "Keep It Running",
    description: "AI interpretations and hosting cost money. Your support helps cover these expenses.",
  },
  {
    icon: <Sparkles className="h-6 w-6" />,
    title: "More Features",
    description: "Support enables new features like more spreads, better AI, and mobile apps.",
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: "Stay Free",
    description: "Your donations keep Lenormand Intelligence free for everyone, forever.",
  },
];

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center justify-center rounded-full bg-amber-100 p-4 dark:bg-amber-900/30">
            <Coffee className="h-10 w-10 text-amber-600 dark:text-amber-400" />
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground md:text-6xl">
            Support the Project
          </h1>
          <p className="mb-4 text-lg text-muted-foreground md:text-xl">
            Lenormand Intelligence is completely free. No subscriptions. No limits. Just gratitude.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href="https://ko-fi.com/lenormand"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" className="gap-2 bg-amber-500 hover:bg-amber-600">
                <Coffee className="h-4 w-4" />
                Buy Me a Coffee
              </Button>
            </a>
            <span className="text-sm text-muted-foreground">
              Any amount helps. One-time or monthly.
            </span>
          </div>
        </div>
      </section>

      {/* Why Support */}
      <section className="border-y bg-muted/50 px-4 py-16">
        <div className="container mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-3xl font-bold">Why Support?</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {whySupport.map((reason, i) => (
              <Card key={i} className="border-border bg-card">
                <CardHeader>
                  <div className="mb-2 text-primary">{reason.icon}</div>
                  <CardTitle className="text-lg">{reason.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {reason.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center text-3xl font-bold">What You Get</h2>
          <Card className="border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40">
            <CardContent className="p-8">
              <div className="grid gap-8 md:grid-cols-2">
                <div>
                  <h3 className="mb-4 text-xl font-bold">Completely Free</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600">✓</span>
                      <span>Unlimited AI readings</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600">✓</span>
                      <span>All 36 Lenormand cards</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600">✓</span>
                      <span>All spread types (1-36 cards)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600">✓</span>
                      <span>Reading history</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600">✓</span>
                      <span>Daily card draw</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600">✓</span>
                      <span>Complete learning guide</span>
                    </li>
                  </ul>
                </div>
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="mb-4 rounded-full bg-amber-100 p-4 dark:bg-amber-900/30">
                    <Heart className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                  </div>
                  <p className="mb-4 text-sm text-muted-foreground">
                    If Lenormand Intelligence has helped you, consider supporting its continued development.
                  </p>
                  <a
                    href="https://ko-fi.com/lenormand"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button className="gap-2 bg-amber-500 hover:bg-amber-600">
                      <Coffee className="h-4 w-4" />
                      Buy Me a Coffee
                    </Button>
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-8 text-center text-2xl font-bold">Common Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="mb-2 font-semibold">Is this really free?</h3>
              <p className="text-sm text-muted-foreground">
                Yes! Lenormand Intelligence is completely free for everyone. All features, all spreads, unlimited AI readings — no catch.
              </p>
            </div>
            <div>
              <h3 className="mb-2 font-semibold">What happens if I don&apos;t donate?</h3>
              <p className="text-sm text-muted-foreground">
                Nothing changes. You get the exact same experience. This is truly voluntary support.
              </p>
            </div>
            <div>
              <h3 className="mb-2 font-semibold">Where does the money go?</h3>
              <p className="text-sm text-muted-foreground">
                Donations help cover AI API costs, hosting fees, and development time. It keeps the project alive and growing.
              </p>
            </div>
            <div>
              <h3 className="mb-2 font-semibold">Can I support in other ways?</h3>
              <p className="text-sm text-muted-foreground">
                Absolutely! Share Lenormand Intelligence with friends, leave feedback, or contribute ideas. Word of mouth is incredibly valuable.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 pb-16">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="mb-4 text-2xl font-bold">Ready to show some love?</h2>
          <a
            href="https://ko-fi.com/lenormand"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="lg" className="gap-2 bg-amber-500 hover:bg-amber-600">
              <Coffee className="h-4 w-4" />
              Buy Me a Coffee
            </Button>
          </a>
          <p className="mt-4 text-sm text-muted-foreground">
            Thank you for being here. ✨
          </p>
        </div>
      </section>
    </main>
  );
}
