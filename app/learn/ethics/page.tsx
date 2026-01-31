"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BreadcrumbNav } from "@/components/BreadcrumbNav";
import { LearningProgressTracker } from "@/components/LearningProgressTracker";
import { BackToTop } from "@/components/BackToTop";
import {
  ArrowLeft,
  ArrowRight,
  Shield,
  Heart,
  Scale,
  Users,
  AlertTriangle,
  CheckCircle,
  BookOpen,
} from "lucide-react";

export default function EthicsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="border-b border-border bg-card/50 backdrop-blur">
        <div className="container mx-auto max-w-4xl px-4 py-4">
          <BreadcrumbNav
            items={[
              { name: "Home", url: "/" },
              { name: "Learn", url: "/learn" },
              { name: "Ethics & Guidelines", url: "/learn/ethics" },
            ]}
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="border-b border-border bg-card/80 backdrop-blur">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/learn">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Course
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <Badge className="border-primary/30 bg-primary/10 text-primary">
                Essential Reading
              </Badge>
              <Badge variant="secondary">
                <Shield className="mr-1 h-3 w-3" />
                Ethics
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary/80">
              <Scale className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
            Ethics & Guidelines
          </h1>
          <p className="text-lg text-muted-foreground">
            Responsible reading practices and important disclaimers
          </p>
        </div>

        {/* Important Disclaimer */}
        <Card className="mb-8 border-amber-500/30 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
              Important Disclaimer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Lenormand readings and the AI interpretations provided on this platform are for 
              <strong> entertainment, spiritual exploration, and self-reflection purposes only</strong>. 
              They should not be considered as:
            </p>
            <ul className="list-inside list-disc space-y-2 text-muted-foreground">
              <li>Professional medical, psychological, or psychiatric advice, diagnosis, or treatment</li>
              <li>Legal, financial, or investment advice</li>
              <li>A substitute for qualified professional guidance in any field</li>
              <li>Absolute predictions of future events (free will always applies)</li>
            </ul>
            <p className="text-sm text-muted-foreground">
              Always seek the advice of qualified professionals for medical, mental health, legal, 
              or financial matters. Use your own judgment and intuition when making important life decisions.
            </p>
          </CardContent>
        </Card>

        {/* Ethical Guidelines */}
        <div className="mb-8 space-y-6">
          <h2 className="text-2xl font-bold text-foreground">Ethical Guidelines for Readers</h2>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                Reading for Others
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 text-green-500" />
                  <span><strong>Always ask for consent</strong> - Never read for someone without their explicit permission</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 text-green-500" />
                  <span><strong>Maintain confidentiality</strong> - Keep readings private unless given permission to share</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 text-green-500" />
                  <span><strong>Empower, don&apos;t disempower</strong> - Frame readings as guidance, not absolute fate</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 text-green-500" />
                  <span><strong>Be mindful of vulnerable states</strong> - Don&apos;t exploit those in crisis for profit</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 text-green-500" />
                  <span><strong>Respect boundaries</strong> - Don&apos;t read about third parties without their consent</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-primary" />
                Professional Integrity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 text-green-500" />
                  <span><strong>Be honest about your experience level</strong> - Don&apos;t claim expertise you don&apos;t have</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 text-green-500" />
                  <span><strong>Refer when necessary</strong> - Direct clients to professionals for medical/legal issues</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 text-green-500" />
                  <span><strong>Don&apos;t create dependency</strong> - Encourage clients to trust their own intuition</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 text-green-500" />
                  <span><strong>Transparent pricing</strong> - Be clear about costs upfront, no hidden fees</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 text-green-500" />
                  <span><strong>Continue learning</strong> - Stay humble and keep developing your skills</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-500" />
                Topics to Approach with Care
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground">
                Some topics require extra sensitivity and should be approached with caution:
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-border bg-muted/50 p-3">
                  <h4 className="mb-1 font-semibold">Health & Medical</h4>
                  <p className="text-sm text-muted-foreground">
                    Never diagnose or prescribe. Always refer to medical professionals.
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-muted/50 p-3">
                  <h4 className="mb-1 font-semibold">Legal Matters</h4>
                  <p className="text-sm text-muted-foreground">
                    Don&apos;t give legal advice. Direct to qualified attorneys.
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-muted/50 p-3">
                  <h4 className="mb-1 font-semibold">Financial Decisions</h4>
                  <p className="text-sm text-muted-foreground">
                    Don&apos;t advise on investments or major financial moves.
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-muted/50 p-3">
                  <h4 className="mb-1 font-semibold">Pregnancy & Fertility</h4>
                  <p className="text-sm text-muted-foreground">
                    Extremely sensitive - refer to medical professionals.
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-muted/50 p-3">
                  <h4 className="mb-1 font-semibold">Death & Grief</h4>
                  <p className="text-sm text-muted-foreground">
                    Approach with extreme compassion. Don&apos;t make predictions about death.
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-muted/50 p-3">
                  <h4 className="mb-1 font-semibold">Third Party Privacy</h4>
                  <p className="text-sm text-muted-foreground">
                    Don&apos;t read about people who haven&apos;t consented.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Self-Reading Guidelines */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-green-500" />
              Guidelines for Self-Reading
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 text-green-500" />
                <span><strong>Don&apos;t read when emotionally overwhelmed</strong> - Wait until you&apos;re calm and centered</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 text-green-500" />
                <span><strong>Avoid excessive reading</strong> - Don&apos;t ask the same question repeatedly</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 text-green-500" />
                <span><strong>Journal your readings</strong> - Track accuracy and patterns over time</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 text-green-500" />
                <span><strong>Trust your intuition</strong> - The cards are a tool, not a master</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 text-green-500" />
                <span><strong>Take action</strong> - Readings are guidance; you must still act</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Final Thoughts */}
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardContent className="p-6 text-center">
            <p className="mb-4 text-lg font-medium text-foreground">
              &ldquo;With knowledge comes responsibility.&rdquo;
            </p>
            <p className="text-muted-foreground">
              Lenormand is a powerful tool for insight and guidance. Use it wisely, 
              ethically, and always with the highest good of all involved in mind. 
              The cards reveal possibilities—not certainties—and should empower 
              people to make informed choices, not create dependency or fear.
            </p>
          </CardContent>
        </Card>

        {/* Progress Tracker */}
        <LearningProgressTracker moduleId="ethics" />

        {/* Navigation */}
        <div className="flex justify-between">
          <Link href="/learn">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Learn
            </Button>
          </Link>
          <Link href="/learn/history-basics">
            <Button>
              Start Course
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      <BackToTop />
    </div>
  );
}
