'use client';

import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle } from 'lucide-react';

interface ModuleProgress {
  [moduleId: string]: {
    completed: boolean;
    completedAt?: number;
  };
}

interface LearningProgressTrackerProps {
  moduleId: string;
  isOnlyTracking?: boolean;
}

const MODULES = [
  'introduction',
  'history',
  'reading-basics',
  'card-meanings',
  'spreads',
  'advanced',
  'marie-annes-system',
];

const STORAGE_KEY = 'lenormand_learning_progress';

export function LearningProgressTracker({
  moduleId,
  isOnlyTracking = false,
}: LearningProgressTrackerProps) {
  const [progress, setProgress] = useState<ModuleProgress>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Load progress from localStorage
    const savedProgress = localStorage.getItem(STORAGE_KEY);
    if (savedProgress) {
      try {
        setProgress(JSON.parse(savedProgress));
      } catch {
        setProgress({});
      }
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Save progress to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress, mounted]);

  const markModuleComplete = () => {
    if (isOnlyTracking) return;

    setProgress((prev) => ({
      ...prev,
      [moduleId]: {
        completed: true,
        completedAt: Date.now(),
      },
    }));
  };

  const completedCount = Object.values(progress).filter((p) => p.completed).length;
  const progressPercentage = (completedCount / MODULES.length) * 100;

  if (!mounted) {
    return (
      <div className="space-y-4 rounded-lg border border-border/50 bg-gradient-to-r from-primary/5 to-primary/10 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">Your Learning Progress</h3>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isOnlyTracking) {
    return (
      <button
        onClick={markModuleComplete}
        className="w-full rounded-lg border border-border bg-card/50 p-4 text-left transition-all hover:border-primary/50 hover:bg-card"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-foreground">Mark as Complete</p>
            <p className="text-sm text-muted-foreground">
              Track your learning progress
            </p>
          </div>
          <CheckCircle2 className="h-5 w-5 text-primary" />
        </div>
      </button>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border border-border/50 bg-gradient-to-r from-primary/5 to-primary/10 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Your Learning Progress</h3>
          <p className="text-sm text-muted-foreground">
            {completedCount} of {MODULES.length} modules completed
          </p>
        </div>
        <Badge variant="secondary" className="text-base">
          {Math.round(progressPercentage)}%
        </Badge>
      </div>

      <Progress value={progressPercentage} className="h-2" />

      <div className="grid gap-3">
        {MODULES.map((mod) => (
          <div
            key={mod}
            className="flex items-center gap-2 text-sm"
          >
            {progress[mod]?.completed ? (
              <CheckCircle2 className="h-4 w-4 text-primary" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground" />
            )}
            <span
              className={
                progress[mod]?.completed
                  ? 'text-foreground line-through opacity-60'
                  : 'text-muted-foreground'
              }
            >
              {mod
                .split('-')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function useLearningProgress() {
  const [progress, setProgress] = useState<ModuleProgress>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedProgress = localStorage.getItem(STORAGE_KEY);
    if (savedProgress) {
      try {
        setProgress(JSON.parse(savedProgress));
      } catch {
        setProgress({});
      }
    }
    setMounted(true);
  }, []);

  const markComplete = (moduleId: string) => {
    setProgress((prev) => ({
      ...prev,
      [moduleId]: {
        completed: true,
        completedAt: Date.now(),
      },
    }));
  };

  const completedCount = Object.values(progress).filter((p) => p.completed).length;
  const progressPercentage = (completedCount / MODULES.length) * 100;

  return {
    progress,
    mounted,
    markComplete,
    completedCount,
    progressPercentage,
  };
}
