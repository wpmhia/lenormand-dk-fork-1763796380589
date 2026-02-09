import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Lock } from "lucide-react";
import { ReactNode } from "react";

interface ReadingTypeCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  cardCount: number;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  spreadId?: string;
  disabled?: boolean;
  disabledReason?: string;
}

export function ReadingTypeCard({
  icon,
  title,
  description,
  cardCount,
  badge,
  badgeVariant = "secondary",
  spreadId,
  disabled = false,
  disabledReason,
}: ReadingTypeCardProps) {
  const href = spreadId ? `/read/new?spread=${spreadId}` : "/read/new";

  const cardContent = (
    <Card className={`relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card backdrop-blur-sm ${disabled ? 'opacity-60' : 'cursor-pointer hover:border-primary/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300'}`}>
      <CardHeader className="relative z-10 pb-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className={`line-clamp-2 flex items-center gap-2 text-base font-semibold ${disabled ? 'text-muted-foreground' : 'text-card-foreground'}`}>
              {icon}
              <span>{title}</span>
            </CardTitle>
          </div>
          {badge && !disabled && (
            <Badge
              variant={badgeVariant}
              className="w-fit whitespace-nowrap text-xs"
            >
              {badge}
            </Badge>
          )}
          {disabled && (
            <Badge
              variant="outline"
              className="w-fit whitespace-nowrap text-xs border-amber-500/50 text-amber-600"
            >
              <Lock className="mr-1 h-3 w-3" />
              {disabledReason || "Supporter exclusive"}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="card-content-no-padding relative z-10 flex flex-grow flex-col justify-between pt-0">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
        <div className="mt-4 flex items-center text-sm font-medium">
          {disabled ? (
            <span className="inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold text-muted-foreground ring-1 ring-muted-foreground/20">
              {cardCount} Cards
            </span>
          ) : (
            <>
              <span className="bg-primary/12 inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold text-primary ring-1 ring-primary/10 dark:bg-primary dark:text-primary-foreground dark:ring-primary/30">
                {cardCount} Card{cardCount !== 1 ? "s" : ""}
              </span>
              <ArrowRight className="ml-2 h-4 w-4 text-primary/60" />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (disabled) {
    return (
      <a
        href="https://ko-fi.com"
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        {cardContent}
      </a>
    );
  }

  return (
    <Link href={href}>
      {cardContent}
    </Link>
  );
}
