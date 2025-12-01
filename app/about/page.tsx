'use client';

import Image from 'next/image';
import { Sparkles, Lightbulb, Users, BookOpen, Shield, Compass } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="page-layout mystical-bg">
      <div className="container mx-auto max-w-5xl px-4 py-12">
        {/* Hero Section */}
        <div className="mb-16 text-center">
          <div className="mb-6 flex items-center justify-center gap-3">
            <Sparkles className="h-10 w-10 text-primary animate-pulse" />
            <h1 className="text-5xl font-bold text-foreground">Lenormand Intelligence</h1>
            <Sparkles className="h-10 w-10 text-primary animate-pulse" />
          </div>
          <p className="mb-4 text-xl text-muted-foreground">
            Where ancient wisdom meets modern intelligence
          </p>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            We bridge the timeless art of Lenormand divination with trained AI, creating a platform where human expertise and machine learning work in perfect harmony to illuminate the patterns hidden within the cards.
          </p>
        </div>

        {/* Our Story */}
        <Card className="mb-12 border-border bg-gradient-to-br from-muted to-muted/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-foreground text-2xl">
              <Compass className="h-6 w-6 text-primary" />
              Our Journey
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 md:items-start">
              <div className="space-y-4 text-foreground">
                <p>
                  Lenormand Intelligence emerged from a vision: to preserve the profound depth of Lenormand divination while making it accessible to a new generation of seekers and practitioners.
                </p>
                <p>
                  Our founders—experienced Lenormand readers, historians devoted to the deck's evolution, and engineers passionate about responsible AI—came together with a singular mission. We painstakingly digitized decades of annotated readings, rare spreads, classical texts, and practitioner notes. This living archive became our training foundation.
                </p>
                <p>
                  Through careful curation and rigorous validation, we taught AI systems to recognize the subtle relationships between cards, detect timing patterns, and propose meaningful interpretations grounded in both tradition and real-world outcomes. What began as a private repository of knowledge has evolved into a collaborative platform that serves readers, students, and researchers worldwide.
                </p>
                <p className="text-sm italic text-muted-foreground">
                  Every reading here carries the weight of tradition and the clarity of technology—neither overwhelming the other, but each amplifying what the other can offer.
                </p>
              </div>
              <div className="relative w-full h-80 rounded-lg overflow-hidden shadow-lg">
                <Image
                  src="/images/team.webp"
                  alt="Lenormand Intelligence Team"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* What We Do */}
        <div className="mb-12">
          <h2 className="mb-8 flex items-center gap-3 text-3xl font-bold text-foreground">
            <Lightbulb className="h-8 w-8 text-primary" />
            What We Offer
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Card 1 */}
            <Card className="border-border bg-muted hover:bg-muted/80 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI-Assisted Readings
                </CardTitle>
              </CardHeader>
              <CardContent className="text-foreground">
                <p>
                  Our trained AI suggests interpretations, reveals card connections, and identifies timing indicators based on curated readings and historical sources. Every AI proposal passes through human review to ensure context, ethics, and accuracy remain central.
                </p>
              </CardContent>
            </Card>

            {/* Card 2 */}
            <Card className="border-border bg-muted hover:bg-muted/80 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Users className="h-5 w-5 text-primary" />
                  Expert Knowledge Modeling
                </CardTitle>
              </CardHeader>
              <CardContent className="text-foreground">
                <p>
                  We transform practitioner expertise—card meanings, spread logic, observed outcomes—into structured models that help AI recognize patterns and offer actionable insights while preserving the nuance of traditional practice.
                </p>
              </CardContent>
            </Card>

            {/* Card 3 */}
            <Card className="border-border bg-muted hover:bg-muted/80 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Learning & Mastery
                </CardTitle>
              </CardHeader>
              <CardContent className="text-foreground">
                <p>
                  Interactive courses, annotated example readings, and AI-powered practice drills accelerate your learning while honoring traditional methods. Study at your pace with feedback from both expert knowledge and intelligent systems.
                </p>
              </CardContent>
            </Card>

            {/* Card 4 */}
            <Card className="border-border bg-muted hover:bg-muted/80 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Shield className="h-5 w-5 text-primary" />
                  Living Archive
                </CardTitle>
              </CardHeader>
              <CardContent className="text-foreground">
                <p>
                  We maintain and continually expand our secure library of spreads, translations, historical texts, and practitioner notes—a conservancy that strengthens both AI performance and human understanding of the craft.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* How We Work */}
        <Card className="mb-12 border-border bg-gradient-to-br from-muted to-muted/50">
          <CardHeader>
            <CardTitle className="text-foreground text-2xl">How We Work</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Principle 1 */}
              <div className="border-l-4 border-primary pl-6">
                <h3 className="mb-2 font-semibold text-foreground">Data-First, Expert-Verified</h3>
                <p className="text-foreground">
                  Every training input comes from vetted readings and historical texts. Every AI output is reviewed by experienced readers before reaching you. Quality flows from curated foundations.
                </p>
              </div>

              {/* Principle 2 */}
              <div className="border-l-4 border-primary pl-6">
                <h3 className="mb-2 font-semibold text-foreground">Transparent Assistance</h3>
                <p className="text-foreground">
                  We present AI insights as suggestions and probabilities, never deterministic answers. Human context, intuition, and consent guide the final interpretation. The card reader remains the authority.
                </p>
              </div>

              {/* Principle 3 */}
              <div className="border-l-4 border-primary pl-6">
                <h3 className="mb-2 font-semibold text-foreground">Privacy & Ethical Practice</h3>
                <p className="text-foreground">
                  Client confidentiality and explicit consent are fundamental. We never use personal data for training without permission. Your readings remain yours alone.
                </p>
              </div>

              {/* Principle 4 */}
              <div className="border-l-4 border-primary pl-6">
                <h3 className="mb-2 font-semibold text-foreground">Continuous Evolution</h3>
                <p className="text-foreground">
                  Feedback from users, practitioners, and researchers refines both our AI models and teaching materials. We grow through listening, learning, and respectful iteration.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Who Benefits */}
        <div className="mb-12">
          <h2 className="mb-8 text-3xl font-bold text-foreground">Who We Serve</h2>
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted p-6">
              <h3 className="mb-2 font-semibold text-foreground">Curious Beginners</h3>
              <p className="text-foreground">
                Start with guided practice and reliable examples. Build confidence through structured learning and supportive AI feedback as you discover the language of the cards.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-muted p-6">
              <h3 className="mb-2 font-semibold text-foreground">Practicing Readers</h3>
              <p className="text-foreground">
                Deepen your craft with tools that increase consistency and speed. Access documented methods, reusable spreads, and insights that enhance your intuitive practice without replacing it.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-muted p-6">
              <h3 className="mb-2 font-semibold text-foreground">Professional Consultants</h3>
              <p className="text-foreground">
                Strengthen your practice with structured templates, AI-assisted consistency checks, and client-ready reports. Build your reputation on both expertise and transparency.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-muted p-6">
              <h3 className="mb-2 font-semibold text-foreground">Researchers & Historians</h3>
              <p className="text-foreground">
                Explore the deck's evolution, usage patterns, and cultural significance through our curated archive of texts, translations, and annotated readings spanning centuries of practice.
              </p>
            </div>
          </div>
        </div>

        {/* What You'll Find Here */}
        <Card className="mb-12 border-border bg-gradient-to-br from-muted to-muted/50">
          <CardHeader>
            <CardTitle className="text-foreground text-2xl">What Awaits You Here</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-foreground">
              <li className="flex gap-3">
                <Sparkles className="h-5 w-5 flex-shrink-0 text-primary mt-1" />
                <span><strong>AI-Assisted Readings:</strong> Immediate, nuanced interpretations grounded in curated knowledge</span>
              </li>
              <li className="flex gap-3">
                <BookOpen className="h-5 w-5 flex-shrink-0 text-primary mt-1" />
                <span><strong>Structured Learning Paths:</strong> From foundational concepts to advanced mastery, with AI feedback on your practice readings</span>
              </li>
              <li className="flex gap-3">
                <Compass className="h-5 w-5 flex-shrink-0 text-primary mt-1" />
                <span><strong>Reference Library:</strong> Downloadable spreads, card meanings, and annotated real-world examples</span>
              </li>
              <li className="flex gap-3">
                <Users className="h-5 w-5 flex-shrink-0 text-primary mt-1" />
                <span><strong>Community:</strong> Connect with readers, mentors, and fellow seekers in a thoughtful, respectful space</span>
              </li>
              <li className="flex gap-3">
                <Shield className="h-5 w-5 flex-shrink-0 text-primary mt-1" />
                <span><strong>Complete Privacy:</strong> Your readings remain yours. We respect your confidentiality absolutely</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="rounded-lg border border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10 p-8 text-center">
          <h2 className="mb-4 text-2xl font-bold text-foreground">Begin Your Journey</h2>
          <p className="mb-6 text-lg text-muted-foreground">
            Whether you're taking your first step into Lenormand or deepening a lifelong practice, we're here to illuminate your path.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/read/new">
              <Button size="lg" className="w-full sm:w-auto">
                Get Your Reading
              </Button>
            </Link>
            <Link href="/learn">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Explore Learning
              </Button>
            </Link>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-12 border-t border-border pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Lenormand Intelligence is a living project, continuously refined through the wisdom of practitioners, feedback from our community, and the evolving capabilities of responsible AI.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Questions or stories to share? We'd love to hear from you.
          </p>
        </div>
      </div>
    </div>
  );
}
