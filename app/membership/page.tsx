import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Sparkles, Crown, Zap, Infinity } from "lucide-react";

export const metadata: Metadata = {
  title: "Membership - Lenormand Intelligence",
  description: "Unlock unlimited AI interpretations for €2,99/month",
};

const benefits = [
  {
    icon: <Infinity className="h-6 w-6" />,
    title: "Unlimited AI Readings",
    description: "Get as many AI interpretations as you want, whenever you want.",
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: "All Spread Types",
    description: "Access every spread from single card to the full Grand Tableau.",
  },
  {
    icon: <Sparkles className="h-6 w-6" />,
    title: "Priority Processing",
    description: "Your readings get priority in the queue.",
  },
  {
    icon: <Crown className="h-6 w-6" />,
    title: "Member Status",
    description: "Show off your membership with a special badge.",
  },
];

const includedSpreads = [
  "Single Card",
  "3-Card Sentence",
  "5-Card Sentence",
  "9-Card Box",
  "Grand Tableau (36 cards)",
];

export default function MembershipPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center justify-center rounded-full bg-amber-100 p-4 dark:bg-amber-900/30">
            <Crown className="h-10 w-10 text-amber-600 dark:text-amber-400" />
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground md:text-6xl">
            Unlimited AI Interpretations
          </h1>
          <p className="mb-8 text-lg text-muted-foreground md:text-xl">
            Get clear, personalized AI guidance for every reading. No limits, no waiting.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href="https://ko-fi.com/lenormand/tiers"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" className="gap-2 bg-amber-500 hover:bg-amber-600">
                <Crown className="h-4 w-4" />
                Become a Member
              </Button>
            </a>
            <span className="text-sm text-muted-foreground">
              €2,99/month • Cancel anytime
            </span>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="border-y bg-muted/50 px-4 py-16">
        <div className="container mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-3xl font-bold">What You Get</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit, i) => (
              <Card key={i} className="border-border bg-card">
                <CardHeader>
                  <div className="mb-2 text-primary">{benefit.icon}</div>
                  <CardTitle className="text-lg">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center text-3xl font-bold">Choose Your Plan</h2>
          <div className="grid gap-8 md:grid-cols-2">
            {/* Free Plan */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-2xl">Free</CardTitle>
                <p className="text-sm text-muted-foreground">Get started with Lenormand</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-3xl font-bold">€0</div>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 text-green-500" />
                    <span>1 AI interpretation per day</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 text-green-500" />
                    <span>All 36 Lenormand cards</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 text-green-500" />
                    <span>Basic spreads (1-5 cards)</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 text-green-500" />
                    <span>Reading history</span>
                  </li>
                </ul>
                <Link href="/auth/sign-up">
                  <Button variant="outline" className="mt-4 w-full">
                    Get Started Free
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Membership Plan */}
            <Card className="relative border-amber-200 bg-amber-50/30 dark:border-amber-800 dark:bg-amber-950/20">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-medium text-white">
                  Most Popular
                </span>
              </div>
              <CardHeader>
                <CardTitle className="text-2xl">Member</CardTitle>
                <p className="text-sm text-muted-foreground">Unlimited readings & more</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">€2,99</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 text-green-500" />
                    <span className="font-medium">Unlimited AI interpretations</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 text-green-500" />
                    <span>All spreads including Grand Tableau</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 text-green-500" />
                    <span>Priority processing</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 text-green-500" />
                    <span>Member badge</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 text-green-500" />
                    <span>Everything in Free</span>
                  </li>
                </ul>
                <a
                  href="https://ko-fi.com/lenormand/tiers"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="mt-4 w-full gap-2 bg-amber-500 hover:bg-amber-600">
                    <Crown className="h-4 w-4" />
                    Become a Member
                  </Button>
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Included Spreads */}
      <section className="border-y bg-muted/50 px-4 py-16">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="mb-8 text-2xl font-bold">All Spreads Included</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {includedSpreads.map((spread) => (
              <span
                key={spread}
                className="rounded-full border border-border bg-background px-4 py-2 text-sm"
              >
                {spread}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-8 text-center text-2xl font-bold">Common Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="mb-2 font-semibold">How does the membership work?</h3>
              <p className="text-sm text-muted-foreground">
                Sign up on Ko-Fi with the same email you use for Lenormand Intelligence. 
                Your membership activates automatically within minutes.
              </p>
            </div>
            <div>
              <h3 className="mb-2 font-semibold">Can I cancel anytime?</h3>
              <p className="text-sm text-muted-foreground">
                Yes! Cancel anytime on Ko-Fi. You&apos;ll keep access until your current 
                billing period ends.
              </p>
            </div>
            <div>
              <h3 className="mb-2 font-semibold">What if I sign up with a different email?</h3>
              <p className="text-sm text-muted-foreground">
                Make sure to use the same email on Ko-Fi that you use for your 
                Lenormand Intelligence account. If you made a mistake, contact us.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 pb-16">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="mb-4 text-2xl font-bold">Ready to unlock unlimited readings?</h2>
          <a
            href="https://ko-fi.com/lenormand/tiers"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="lg" className="gap-2 bg-amber-500 hover:bg-amber-600">
              <Crown className="h-4 w-4" />
              Become a Member — €2,99/month
            </Button>
          </a>
          <p className="mt-4 text-sm text-muted-foreground">
            Cancel anytime. No questions asked.
          </p>
        </div>
      </section>
    </main>
  );
}
