import { Metadata } from "next";
import Image from "next/image";
import {
  BrainCircuit,
  CheckCircle2,
  Club,
  Code2,
  HeartPulse,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Willem Gielen | Lenormand Intelligence",
  description:
    "Lenormand Intelligence is an independent structured-reasoning and AI engineering project by Willem Gielen, cardiologist and physician-builder.",
  openGraph: {
    title: "About Lenormand Intelligence",
    description:
      "Meet Willem Gielen and learn why he built Lenormand Intelligence as an experiment in structured reasoning and constrained AI.",
    type: "website",
  },
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  return (
    <div className="page-layout">
      <div className="container mx-auto max-w-5xl px-4 py-12">
        <section className="mb-16 text-center">
          <div className="mb-6 flex items-center justify-center gap-3">
            <Club className="h-10 w-10 text-primary" />
            <h1 className="text-5xl font-bold text-foreground">
              Built by Willem Gielen
            </h1>
          </div>
          <p className="mb-5 text-xl font-medium text-primary">
            Cardiologist, physician-builder, and AI expert
          </p>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Lenormand Intelligence is my independent project at the intersection
            of traditional Lenormand, structured reasoning, and modern artificial
            intelligence.
          </p>
        </section>

        <Card className="mb-12 border-border bg-gradient-to-br from-muted to-muted/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl text-foreground">
              <HeartPulse className="h-6 w-6 text-primary" />
              Why I built this
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-8 text-foreground md:grid-cols-[1fr_280px] md:items-start">
            <div className="space-y-5">
              <p>
                I&apos;m Willem Gielen, a cardiologist with a longstanding interest
                in technology, clinical decision-making, and artificial
                intelligence. In medicine, I work in a world where complex
                information has to be reduced to something useful: identify the
                important signals, understand uncertainty, and communicate a
                conclusion clearly.
              </p>
              <p>
                Lenormand Intelligence is not a medical tool and it does not turn
                card readings into medical, financial, or legal advice. Lenormand
                is a separate symbolic practice. What makes it interesting to me
                is the engineering problem: can a system represent a question,
                apply a defined reading method, and produce a useful answer
                without pretending that an unconstrained language model is an
                oracle?
              </p>
              <p>
                That makes this project a practical experiment in structured
                reasoning and AI engineering. The cards provide a compact domain;
                the software provides the discipline needed to make its reasoning
                inspectable and repeatable.
              </p>
            </div>
            <div className="overflow-hidden rounded-lg border border-border shadow-lg">
              <Image
                src="/images/about-willem.jpg"
                alt="Willem Gielen exploring the symbolic world behind Lenormand Intelligence"
                width={960}
                height={1280}
                className="h-auto w-full object-cover"
                priority
              />
            </div>
          </CardContent>
        </Card>

        <section className="mb-12">
          <h2 className="mb-8 flex items-center gap-3 text-3xl font-bold text-foreground">
            <BrainCircuit className="h-8 w-8 text-primary" />
            The engineering approach
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-border bg-muted">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Code2 className="h-5 w-5 text-primary" />
                  Deterministic logic first
                </CardTitle>
              </CardHeader>
              <CardContent className="text-foreground">
                <p>
                  Spread layouts, card relationships, timing evidence, and
                  question framing are represented in code rather than left to
                  improvisation. The same input should lead to the same
                  structural context.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-muted">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <BrainCircuit className="h-5 w-5 text-primary" />
                  Constrained AI
                </CardTitle>
              </CardHeader>
              <CardContent className="text-foreground">
                <p>
                  AI is used for language and synthesis inside a defined
                  context. Structured output, explicit prompts, and limited
                  responsibilities keep the model from replacing the method.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-muted">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Validation over confidence
                </CardTitle>
              </CardHeader>
              <CardContent className="text-foreground">
                <p>
                  Generated content is parsed, normalized, and checked before
                  it is rendered. When an output does not satisfy the contract,
                  the system should recover safely or fail clearly.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-muted">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Honest boundaries
                </CardTitle>
              </CardHeader>
              <CardContent className="text-foreground">
                <p>
                  A reading is an interpretive tool for reflection, not a
                  prediction engine or professional service. The site should
                  make that distinction clear rather than oversell certainty.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <Card className="mb-12 border-border bg-gradient-to-br from-muted to-muted/50">
          <CardHeader>
            <CardTitle className="text-2xl text-foreground">
              A work in progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 text-foreground">
            <p>
              Lenormand Intelligence is intentionally an evolving project. I use
              it to test how domain models, deterministic software, structured
              output, and language models can work together without hiding the
              limits of any one of them.
            </p>
            <p>
              The goal is not to make a machine sound mystical. It is to build a
              clear, useful, and technically honest interface for exploring a
              traditional system of symbols.
            </p>
            <p className="pt-3 text-right font-medium text-primary">
              Willem Gielen
            </p>
          </CardContent>
        </Card>

        <div className="rounded-lg border border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10 p-8 text-center">
          <h2 className="mb-4 text-2xl font-bold text-foreground">
            Explore the project
          </h2>
          <p className="mb-6 text-lg text-muted-foreground">
            Try a reading or learn more about the system behind it.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/read/new">
              <Button size="lg" className="w-full sm:w-auto">
                Get Your Reading
              </Button>
            </Link>
            <Link href="/how-readings-work">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                How Readings Work
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
