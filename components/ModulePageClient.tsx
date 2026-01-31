"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BreadcrumbNav } from "@/components/BreadcrumbNav";
import { LearningProgressTracker } from "@/components/LearningProgressTracker";
import { BackToTop } from "@/components/BackToTop";
import { ArrowLeft, ArrowRight, BookOpen, Target } from "lucide-react";
import { ReactNode } from "react";

interface ModulePageClientProps {
  children: ReactNode;
  moduleId: string;
  moduleNumber: number;
  totalModules: number;
  title: string;
  description: string;
  duration: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  icon: ReactNode;
  prevModule?: {
    id: string;
    title: string;
  };
  nextModule?: {
    id: string;
    title: string;
  };
  breadcrumbs: Array<{ name: string; url: string }>;
}

export function ModulePageClient({
  children,
  moduleId,
  moduleNumber,
  totalModules,
  title,
  description,
  duration,
  difficulty,
  icon,
  prevModule,
  nextModule,
  breadcrumbs,
}: ModulePageClientProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="border-b border-border bg-card/50 backdrop-blur">
        <div className="container mx-auto max-w-4xl px-4 py-4">
          <BreadcrumbNav items={breadcrumbs} />
        </div>
      </div>

      {/* Navigation */}
      <div className="border-b border-border bg-card/80 backdrop-blur">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {prevModule ? (
              <Link href={`/learn/${prevModule.id}`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary hover:text-primary/80"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              </Link>
            ) : (
              <Link href="/learn">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary hover:text-primary/80"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Course
                </Button>
              </Link>
            )}
            <div className="flex items-center space-x-2">
              <Badge className="border-primary/30 bg-primary/10 text-primary dark:border-primary/40 dark:bg-primary/20 dark:text-primary">
                Module {moduleNumber} of {totalModules}
              </Badge>
              <Badge className="border-primary/30 bg-primary/10 text-primary dark:border-primary/40 dark:bg-primary/20 dark:text-primary">
                {difficulty}
              </Badge>
            </div>
            {nextModule ? (
              <Link href={`/learn/${nextModule.id}`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary hover:text-primary/80"
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <div className="w-20" />
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Module Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary/80">
              {icon}
            </div>
          </div>
          <h1 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
            {title}
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            {description}
          </p>
          <div className="mt-4 flex items-center justify-center space-x-4 text-sm text-primary">
            <div className="flex items-center">
              <BookOpen className="mr-1 h-4 w-4" />
              {duration}
            </div>
            <div className="flex items-center">
              <Target className="mr-1 h-4 w-4" />
              {difficulty} Level
            </div>
          </div>
        </div>

        {/* Content */}
        {children}

        {/* Progress Tracker */}
        <div className="mb-8">
          <LearningProgressTracker moduleId={moduleId} />
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between border-t border-border pt-8">
          {prevModule ? (
            <Link href={`/learn/${prevModule.id}`}>
              <Button
                variant="outline"
                className="border-border text-card-foreground hover:bg-muted"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to {prevModule.title}
              </Button>
            </Link>
          ) : (
            <Link href="/learn">
              <Button
                variant="outline"
                className="border-border text-card-foreground hover:bg-muted"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Course Overview
              </Button>
            </Link>
          )}
          {nextModule ? (
            <Link href={`/learn/${nextModule.id}`}>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                Continue to {nextModule.title}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <Link href="/learn">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                Complete Course
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      <BackToTop />
    </div>
  );
}
