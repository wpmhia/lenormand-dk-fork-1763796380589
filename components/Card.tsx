"use client";

import Image from "next/image";
import Link from "next/link";
import { Card as CardType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { memo, useCallback, useState } from "react";

interface CardProps {
  card: CardType;
  onClick?: () => void;
  showBack?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses: Record<string, string> = {
  sm: "w-20 h-32 text-xs",
  md: "w-28 h-40 text-sm sm:text-base",
  lg: "w-36 h-52 text-base",
};

const sizeToPixels: Record<string, string> = {
  sm: "80px",
  md: "112px",
  lg: "144px",
};

function CardInner({
  card,
  onClick,
  showBack = false,
  size = "md",
  className,
}: CardProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  
  const handleClick = useCallback(() => {
    onClick?.();
  }, [onClick]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (onClick && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        onClick();
      }
    },
    [onClick],
  );

  if (showBack) {
    return (
      <div
        className={cn(
          "card-mystical group relative flex cursor-pointer items-center justify-center overflow-hidden rounded-xl will-change-transform focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
          sizeClasses[size],
          className,
        )}
        onClick={handleClick}
        onKeyDown={onClick ? handleKeyDown : undefined}
        tabIndex={onClick ? 0 : undefined}
        role={onClick ? "button" : undefined}
        aria-label="Lenormand card back. Click to draw or select card"
        style={{
          backgroundImage: "url(/images/card-back.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundColor: "#1a1a1a", // Fallback color
        }}
      />
    );
  }

  const cardContent = (
    <>
      <div
        className={cn(
          "card-mystical group relative cursor-pointer overflow-hidden rounded-xl will-change-transform focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
          sizeClasses[size],
          className,
        )}
        onClick={handleClick}
        onKeyDown={onClick ? handleKeyDown : undefined}
        tabIndex={onClick ? 0 : undefined}
        role={onClick ? "button" : undefined}
        aria-label={`${card.name} card. Click to ${onClick ? "select" : "view details"}`}
      >
        <div className="relative h-full w-full overflow-hidden rounded-lg bg-muted">
          {/* Skeleton placeholder to prevent layout shift */}
          {!isLoaded && (
            <div className="absolute inset-0 animate-pulse bg-muted" />
          )}
          <Image
            src={card.imageUrl || ""}
            alt={card.name}
            fill
            className={cn(
              "h-full w-full object-cover transition-opacity duration-300",
              isLoaded ? "opacity-100" : "opacity-0"
            )}
            sizes={sizeToPixels[size]}
            loading={size === "sm" ? "lazy" : "eager"}
            priority={size !== "sm"}
            onLoad={() => setIsLoaded(true)}
          />
        </div>
      </div>

      <div className="mt-2 text-center">
        <div className="text-sm font-bold text-foreground">{card.name}</div>
        <div className="text-xs text-muted-foreground">#{card.id}</div>
      </div>
    </>
  );

  if (onClick) {
    return cardContent;
  }

  return <Link href={`/cards/${card.id}`}>{cardContent}</Link>;
}

export const Card = CardInner;
export const MemoizedCard = memo(CardInner);
