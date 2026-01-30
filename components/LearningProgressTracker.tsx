"use client";

import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle } from "lucide-react";

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
  "introduction",
  "history",
  "reading-basics",
  "card-meanings",
  "spreads",
  "card-combinations",
  "advanced",
  "marie-annes-system",
];

const STORAGE_KEY = "lenormand_learning_progress";

function useLearningProgress() {
  const [progress, setProgress] = useState<ModuleProgress>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const savedProgress = localStorage.getItem(STORAGE_KEY);
      if (savedProgress) {
        try {
          setProgress(JSON.parse(savedProgress));
        } catch {
          setProgress({});
        }
      }
    } catch {
      setProgress({});
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

  const completedCount = Object.values(progress).filter(
    (p) => p.completed,
  ).length;
  const progressPercentage = (completedCount / MODULES.length) * 100;

  return {
    progress,
    mounted,
    markComplete,
    completedCount,
    progressPercentage,
  };
}

export function LearningProgressTracker({
  moduleId,
  isOnlyTracking = false,
}: LearningProgressTrackerProps) {
  const {
    progress,
    mounted,
    markComplete,
    completedCount,
    progressPercentage,
  } = useLearningProgress();

  const handleMarkComplete = (e: React.MouseEvent) => {
    e.preventDefault();
    markComplete(moduleId);
  };

  return (
    <div className="space-y-4 rounded-lg border border-border/50 bg-gradient-to-r from-primary/5 to-primary/10 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">
            Your Learning Progress
          </h3>
          <p className="text-sm text-muted-foreground">
            {mounted ? (
              `${completedCount} of ${MODULES.length} modules completed`
            ) : (
              <span className="inline-block h-4 w-20 animate-pulse rounded bg-muted" />
            )}
          </p>
        </div>
        <Badge variant="secondary" className="text-base">
          {mounted ? (
            `${Math.round(progressPercentage)}%`
          ) : (
            <span className="inline-block h-4 w-8 animate-pulse rounded bg-muted" />
          )}
        </Badge>
      </div>

      <Progress value={progressPercentage} className="h-2" />

      <div className="grid gap-3">
        {MODULES.map((mod) => (
          <div key={mod} className="flex items-center gap-2 text-sm">
            {mounted ? (
              progress[mod]?.completed ? (
                <CheckCircle2 className="h-4 w-4 text-primary" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground" />
              )
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground" />
            )}
            <span
              className={
                mounted && progress[mod]?.completed
                  ? "text-foreground line-through opacity-60"
                  : "text-muted-foreground"
              }
            >
              {mod
                .split("-")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ")}
            </span>
          </div>
        ))}
      </div>

      {!isOnlyTracking && mounted && (
        <button
          onClick={handleMarkComplete}
          className="mt-4 w-full rounded-lg border border-border bg-card/50 p-4 text-left transition-all hover:border-primary/50 hover:bg-card"
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
      )}
    </div>
  );
}

export { useLearningProgress };
