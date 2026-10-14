import {
  BookOpen,
  Grid3X3,
  LayoutGrid,
  Sparkles,
  Shield,
  Layers,
} from "lucide-react";
import Link from "next/link";

export default function HowReadingsWorkPage() {
  return (
    <div className="page-layout">
      <div className="container mx-auto max-w-4xl px-4 py-16">
        <h1 className="mb-4 text-4xl font-bold text-foreground">
          How Readings Work
        </h1>
        <p className="mb-12 text-lg text-muted-foreground">
          Lenormand Intelligence is a structured reading engine, not a generic
          AI chatbot. Here is how it works.
        </p>

        <div className="space-y-12">
          <section>
            <div className="mb-4 flex items-center gap-3">
              <Layers className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">
                What the app uses
              </h2>
            </div>
            <div className="space-y-3 leading-relaxed text-muted-foreground">
              <p>
                Every reading starts with real Lenormand structure. The app uses
                the spread you select, the cards you draw (whether virtually or
                from your physical deck), and the full 36-card Lenormand system.
              </p>
              <ul className="list-disc space-y-2 pl-6">
                <li>
                  <strong>Card meanings</strong> &mdash; Source-compared core
                  meanings for all 36 cards, with expert review status shown.
                </li>
                <li>
                  <strong>Card combinations</strong> &mdash; Interpreted in the
                  question and spread context. No pair is called established
                  doctrine unless it is source-reviewed in the canonical registry.
                </li>
                <li>
                  <strong>Spread geometry</strong> &mdash; The app knows whether
                  you are reading a 3-card line, a 9-card Petit Tableau, or a
                  36-card Grand Tableau, and formats the reading structure
                  accordingly.
                </li>
                <li>
                  <strong>Grand Tableau structure</strong> &mdash; The 4×9 grid,
                  all houses, and immediate Man/Woman neighbours are supplied
                  from actual coordinates. House occupancy and adjacency remain
                  separate; unsupported mirror methods are not supplied.
                </li>
              </ul>
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">
                What the AI does
              </h2>
            </div>
            <div className="space-y-3 leading-relaxed text-muted-foreground">
              <p>
                The AI receives the current question and only the cards you
                drew. It does not draw extra cards, invent new ones, or replace
                the structured card data. The app sends a formatted prompt containing:
              </p>
              <ul className="list-disc space-y-2 pl-6">
                <li>The spread type and question</li>
                <li>Canonical card names and source-compared core meanings, plus supported secondary variants</li>
                <li>
                  Ordered positions and relevant structural lines; legacy pair prose is excluded
                </li>
                <li>
                  Spread geometry &mdash; rows, columns, diagonals for the Petit Tableau; rows, houses, and direct person-card neighbours for the Grand Tableau
                </li>
              </ul>
              <p>
                The AI is asked to synthesize a direct Lenormand-style reading
                from the current question and cards. It gives a direct answer,
                separates symbolic suggestions from facts, and does not claim
                that an uncatalogued pair is fixed doctrine.
              </p>
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-center gap-3">
              <Shield className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">
                Daily Card is different
              </h2>
            </div>
            <div className="space-y-3 leading-relaxed text-muted-foreground">
              <p>
                The Daily Card does <strong>not</strong> use the AI at all. It
                is fully deterministic:
              </p>
              <ul className="list-disc space-y-2 pl-6">
                <li>A single card is drawn randomly from the 36-card deck</li>
                <li>
                  The app displays the card&apos;s base meaning, keywords,
                  timing, and practical focus
                </li>
                <li>
                  Everything comes from the card database, not from an AI model
                </li>
                <li>
                  It is instant, free, and the same for everyone who draws the
                  same card
                </li>
              </ul>
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-center gap-3">
              <BookOpen className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">
                What makes it Lenormand
              </h2>
            </div>
            <div className="space-y-3 leading-relaxed text-muted-foreground">
              <p>The app uses a source-conscious Lenormand-style method and marks where review is still pending:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>
                  <strong>Upright-only in this app</strong> &mdash; This
                  application does not interpret reversals; some contemporary
                  schools use them.
                </li>
                <li>
                  <strong>Combination reading</strong> &mdash; Multi-card
                  readings synthesize adjacent and relevant cards in context;
                  uncatalogued pairs are not fixed doctrine.
                </li>
                <li>
                  <strong>Line reading</strong> &mdash; 3-card and 5-card
                  spreads preserve left-to-right order; pair order is not
                  silently reversed.
                </li>
                <li>
                  <strong>Petit Tableau</strong> &mdash; The 9-card grid supplies
                  rows, columns, diagonals, and a central focal card; only
                  question-relevant lines need synthesis, without chronology.
                </li>
                <li>
                  <strong>Grand Tableau</strong> &mdash; The full 36-card spread
                  supplies the 4×9 grid, all 36 houses, and bounded immediate
                  person-card neighbours. Adjacency and house occupancy are
                  separate; mirror methods are not currently treated as doctrine.
                </li>
              </ul>
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-center gap-3">
              <LayoutGrid className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">
                What readings are not
              </h2>
            </div>
            <div className="space-y-3 leading-relaxed text-muted-foreground">
              <p>
                Lenormand readings are tools for reflection and practical
                guidance. They are not:
              </p>
              <ul className="list-disc space-y-2 pl-6">
                <li>Medical, legal, financial, or emergency advice</li>
                <li>A guarantee of future events</li>
                <li>Substitutes for professional consultation</li>
              </ul>
              <p>
                Use readings as a mirror for your own thinking and as practical
                guidance for the situations you face.
              </p>
            </div>
          </section>

          <div className="rounded-lg border border-primary/20 bg-primary/5 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Ready for a reading?{" "}
              <Link href="/read/new" className="text-primary hover:underline">
                Start here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
