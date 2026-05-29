import { BookOpen, Grid3X3, LayoutGrid, Sparkles, Shield, Layers } from "lucide-react";
import Link from "next/link";

export default function HowReadingsWorkPage() {
  return (
    <div className="page-layout">
      <div className="container mx-auto max-w-4xl px-4 py-16">
        <h1 className="mb-4 text-4xl font-bold text-foreground">How Readings Work</h1>
        <p className="mb-12 text-lg text-muted-foreground">
          Lenormand Intelligence is a structured reading engine, not a generic AI chatbot. Here is how it works.
        </p>

        <div className="space-y-12">
          <section>
            <div className="mb-4 flex items-center gap-3">
              <Layers className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">What the app uses</h2>
            </div>
            <div className="space-y-3 text-muted-foreground leading-relaxed">
              <p>
                Every reading starts with real Lenormand structure. The app uses the spread you select, the cards you draw (whether virtually or from your physical deck), and the full 36-card Lenormand system.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Card meanings</strong> &mdash; Base meanings from the traditional Lenormand deck, stored in the app&apos;s card database.</li>
                <li><strong>Card combinations</strong> &mdash; Traditional pair meanings for adjacent cards, drawn from historical Lenormand reference.</li>
                <li><strong>Spread geometry</strong> &mdash; The app knows whether you are reading a 3-card line, a 9-card Petit Tableau, or a 36-card Grand Tableau, and formats the reading structure accordingly.</li>
                <li><strong>Grand Tableau logic</strong> &mdash; Houses, significators, corners, center four, cards of fate, mirror pairs, and vertical columns are computed from the card positions, not guessed by the model.</li>
              </ul>
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">What the AI does</h2>
            </div>
            <div className="space-y-3 text-muted-foreground leading-relaxed">
              <p>
                The AI reads only the cards you drew. It does not draw extra cards, invent new ones, or replace the structured card data. The app sends the AI a formatted prompt containing:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>The spread type and question</li>
                <li>Card names, keywords, timing, and strength</li>
                <li>Adjacent pair meanings from the traditional combination database</li>
                <li>Spread geometry &mdash; rows, columns, diagonals for Petit Tableau; houses, significator position, mirrors for Grand Tableau</li>
              </ul>
              <p>
                The AI is instructed as a traditional Lenormand reader, not a Tarot reader. It is told to read combinations, not isolated cards, and to produce concrete, practical interpretations.
              </p>
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-center gap-3">
              <Shield className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">Daily Card is different</h2>
            </div>
            <div className="space-y-3 text-muted-foreground leading-relaxed">
              <p>
                The Daily Card does <strong>not</strong> use the AI at all. It is fully deterministic:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>A single card is drawn randomly from the 36-card deck</li>
                <li>The app displays the card&apos;s base meaning, keywords, timing, and practical focus</li>
                <li>Everything comes from the card database, not from an AI model</li>
                <li>It is instant, free, and the same for everyone who draws the same card</li>
              </ul>
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-center gap-3">
              <BookOpen className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">What makes it Lenormand</h2>
            </div>
            <div className="space-y-3 text-muted-foreground leading-relaxed">
              <p>The app follows traditional Lenormand methodology:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>No reversals</strong> &mdash; Cards are always upright, as in traditional Lenormand.</li>
                <li><strong>Combination reading</strong> &mdash; Multi-card readings are interpreted through adjacent pairs and lines, not isolated card meanings.</li>
                <li><strong>Line reading</strong> &mdash; 3-card and 5-card spreads are read as sentences, with pairs carrying the meaning.</li>
                <li><strong>Petit Tableau</strong> &mdash; The 9-card grid is read through rows, columns, diagonals, and the center card &mdash; not past/present/future positions.</li>
                <li><strong>Grand Tableau</strong> &mdash; The full 36-card spread uses houses (card name defines the house topic), significator position, mirror pairs, corners, center four, and cards of fate. The model receives the actual grid structure, not a flat list.</li>
              </ul>
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-center gap-3">
              <LayoutGrid className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">What readings are not</h2>
            </div>
            <div className="space-y-3 text-muted-foreground leading-relaxed">
              <p>Lenormand readings are tools for reflection and practical guidance. They are not:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Medical, legal, financial, or emergency advice</li>
                <li>A guarantee of future events</li>
                <li>Substitutes for professional consultation</li>
              </ul>
              <p>
                Use readings as a mirror for your own thinking and as practical guidance for the situations you face.
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
