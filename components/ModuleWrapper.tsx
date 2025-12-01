'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BreadcrumbNav } from '@/components/BreadcrumbNav';
import { LearningProgressTracker } from '@/components/LearningProgressTracker';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { ReactNode } from 'react';

interface ModuleWrapperProps {
  moduleId: string;
  title: string;
  previousModule?: {
    id: string;
    title: string;
  };
  nextModule?: {
    id: string;
    title: string;
  };
  children: ReactNode;
}

export function ModuleWrapper({
  moduleId,
  title,
  previousModule,
  nextModule,
  children,
}: ModuleWrapperProps) {
  const moduleNumber = {
    introduction: 1,
    history: 2,
    'reading-basics': 3,
    'card-meanings': 4,
    spreads: 5,
    advanced: 6,
    'marie-annes-system': 7,
  }[moduleId] || 1;

  const totalModules = 7;

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="border-b border-border bg-card/50 backdrop-blur">
        <div className="container mx-auto max-w-4xl px-4 py-4">
          <BreadcrumbNav
            items={[
              { name: 'Home', url: '/' },
              { name: 'Learn', url: '/learn' },
              { name: title, url: `/learn/${moduleId}` },
            ]}
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="border-b border-border bg-card/80 backdrop-blur">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
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
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                Module {moduleNumber} of {totalModules}
              </span>
            </div>
            {nextModule && (
              <Link href={`/learn/${nextModule.id}`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary hover:text-primary/80"
                >
                  Next Module
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-4xl px-4 py-8">{children}</div>

      {/* Progress Tracker */}
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <LearningProgressTracker moduleId={moduleId} />
        </div>

        {/* Navigation Footer */}
        <div className="flex items-center justify-between border-t border-border pt-8">
          {previousModule ? (
            <Link href={`/learn/${previousModule.id}`}>
              <Button variant="outline" className="border-border hover:bg-muted">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to {previousModule.title}
              </Button>
            </Link>
          ) : (
            <div />
          )}
          {nextModule ? (
            <Link href={`/learn/${nextModule.id}`}>
              <Button className="bg-primary hover:bg-primary/90">
                Continue to {nextModule.title}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <div />
          )}
        </div>
      </div>
    </div>
  );
}
