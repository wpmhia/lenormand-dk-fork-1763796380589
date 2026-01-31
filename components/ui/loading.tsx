import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl";
  color?: "primary" | "muted" | "white";
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-12 w-12",
};

const colorClasses = {
  primary: "border-primary",
  muted: "border-muted-foreground",
  white: "border-white",
};

/**
 * Industry-standard spinner component
 * Replaces all inconsistent spinners across the codebase
 */
export function Spinner({
  size = "md",
  color = "primary",
  className,
  ...props
}: SpinnerProps) {
  return (
    <div
      className={cn(
        "animate-spin rounded-full border-b-2",
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      {...props}
    />
  );
}

interface AIThinkingIndicatorProps {
  message?: string;
  subtext?: string;
  showDots?: boolean;
  className?: string;
}

/**
 * Unified AI loading indicator
 * Replaces all AI loading patterns with a single, branded component
 */
export function AIThinkingIndicator({
  message = "Consulting the cards...",
  subtext = "Reading the cards for clear, practical guidance",
  showDots = true,
  className,
}: AIThinkingIndicatorProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-primary/20 bg-card/80 p-8 text-center backdrop-blur-sm",
        className
      )}
      aria-busy="true"
      aria-live="polite"
    >
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center">
        <div className="absolute h-12 w-12 animate-ping rounded-full bg-primary/20" />
        <div className="absolute h-10 w-10 animate-pulse rounded-full bg-primary/30" />
        <Loader2 className="relative h-6 w-6 animate-spin text-primary" />
      </div>
      <p className="text-lg font-medium text-foreground">{message}</p>
      {subtext && (
        <p className="mt-2 text-sm italic text-muted-foreground">{subtext}</p>
      )}
      {showDots && (
        <div className="mt-4 flex justify-center gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2 w-2 animate-bounce rounded-full bg-primary/60"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface CardGridSkeletonProps {
  count?: number;
  className?: string;
}

/**
 * Skeleton for card grid layouts
 * Used in /cards and /read pages
 */
export function CardGridSkeleton({ count = 12, className }: CardGridSkeletonProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6",
        className
      )}
      aria-busy="true"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="aspect-[2.5/3.5] w-full animate-pulse rounded-lg bg-muted" />
          <div className="mx-auto h-4 w-16 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

interface PageSkeletonProps {
  type?: "cards" | "reading" | "learn" | "generic";
  className?: string;
}

/**
 * Full-page skeleton that matches layout structure
 * Prevents layout shift during loading
 */
export function PageSkeleton({ type = "generic", className }: PageSkeletonProps) {
  if (type === "cards") {
    return (
      <div className={cn("container-section", className)} aria-busy="true">
        <div className="mb-8 space-y-2">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="h-4 w-64 animate-pulse rounded bg-muted" />
        </div>
        <div className="mb-8 flex gap-2">
          <div className="h-10 flex-1 animate-pulse rounded bg-muted" />
          <div className="h-10 w-32 animate-pulse rounded bg-muted" />
        </div>
        <CardGridSkeleton count={12} />
      </div>
    );
  }

  if (type === "reading") {
    return (
      <div className={cn("container mx-auto max-w-4xl px-4 py-8", className)} aria-busy="true">
        <div className="mb-8 space-y-4 text-center">
          <div className="mx-auto h-8 w-64 animate-pulse rounded bg-muted" />
          <div className="mx-auto h-4 w-96 animate-pulse rounded bg-muted" />
        </div>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="h-6 w-32 animate-pulse rounded bg-muted" />
            <div className="grid grid-cols-3 gap-4">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="aspect-square animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-6 w-40 animate-pulse rounded bg-muted" />
            <div className="h-48 animate-pulse rounded-lg bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  // Generic fallback
  return (
    <div className={cn("flex min-h-screen items-center justify-center", className)} aria-busy="true">
      <div className="text-center">
        <Spinner size="lg" className="mx-auto" />
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

/**
 * Button wrapper with loading state
 * Industry standard: show spinner + text change during loading
 */
export function LoadingButton({
  loading = false,
  loadingText,
  children,
  disabled,
  className,
  ...props
}: LoadingButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2",
        "rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground",
        "transition-colors hover:bg-primary/90",
        "disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    >
      {loading && <Spinner size="sm" color="white" />}
      {loading && loadingText ? loadingText : children}
    </button>
  );
}

/**
 * Full-screen branded loading state
 * Used for initial page loads and major transitions
 */
export function FullPageLoader({ message = "Loading Lenormand..." }: { message?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background" aria-busy="true">
      <div className="text-center">
        <div className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center">
          <div className="absolute h-16 w-16 animate-ping rounded-full bg-primary/20" />
          <div className="absolute h-12 w-12 animate-pulse rounded-full bg-primary/30" />
          <Loader2 className="relative h-8 w-8 animate-spin text-primary" />
        </div>
        <p className="text-lg font-medium text-foreground">{message}</p>
        <p className="mt-2 text-sm text-muted-foreground">Preparing your reading experience</p>
      </div>
    </div>
  );
}