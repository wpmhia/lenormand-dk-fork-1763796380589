"use client";

import Image from "next/image";
import Link from "next/link";
import { Card as CardType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { memo, useCallback, useState, useEffect } from "react";

interface CardProps {
  card: CardType;
  onClick?: () => void;
  showBack?: boolean;
  size?: "sm" | "md" | "lg" | "responsive";
  className?: string;
  selected?: boolean;
  priority?: boolean;
}

const sizeClasses: Record<string, string> = {
  sm: "w-20 aspect-[5/7] text-xs",
  md: "w-28 aspect-[5/7] text-sm sm:text-base",
  lg: "w-36 aspect-[5/7] text-base",
  responsive: "w-full aspect-[2.5/3.5] text-xs",
};

const sizeToPixels: Record<string, string> = {
  sm: "80px",
  md: "112px",
  lg: "144px",
  responsive: "clamp(72px, 22vw, 130px)",
};

function CardInner({
  card,
  onClick,
  showBack = false,
  size = "md",
  className,
  selected = false,
  priority = false,
}: CardProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(false);
  }, [card.imageUrl]);
  
  const handleClick = useCallback(() => {
    onClick?.();
  }, [onClick]);

  if (showBack) {
    const CardFace = onClick ? "button" : "div";
    return (
      <CardFace
        type={onClick ? "button" : undefined}
        className={cn(
           "lenormand-card group relative flex cursor-pointer items-center justify-center overflow-hidden will-change-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          selected && "ring-2 ring-primary ring-offset-2 ring-offset-background border-2 border-primary",
          sizeClasses[size],
          className,
        )}
        onClick={handleClick}
        aria-label={selected ? "Selected card" : "Lenormand card back. Click to draw or select card"}
        aria-pressed={selected}
        style={{
          backgroundImage: "url(/images/card-back.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundColor: "#1a1a1a", // Fallback color
        }}
      />
    );
  }

  const cardFace = (
    <>
      <div
        className={cn(
            "lenormand-card group relative cursor-pointer overflow-hidden transition-all duration-200 will-change-transform hover:scale-[1.02] hover:shadow-elevation-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          selected && "ring-2 ring-primary ring-offset-2 ring-offset-background border-2 border-primary",
          sizeClasses[size],
          className,
        )}
        aria-label={`${card.name} card${selected ? " (selected)" : ""}. Click to ${onClick ? "select" : "view details"}`}
        aria-pressed={selected}
      >
        <div className="relative h-full w-full overflow-hidden rounded-lg bg-muted">
          {/* Skeleton placeholder to prevent layout shift */}
          {!isLoaded && (
            <div className="absolute inset-0 animate-pulse bg-muted" />
          )}
          <Image
            src={card.imageUrl || "/images/cards-placeholder.jpg"}
            alt={card.name}
            fill
            className={cn(
              "h-full w-full object-cover transition-opacity duration-300",
              isLoaded ? "opacity-100" : "opacity-0"
            )}
            sizes={sizeToPixels[size]}
            loading={priority ? "eager" : "lazy"}
            priority={priority}
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
    return (
      <button type="button" onClick={handleClick} className="p-0 text-left" aria-label={`${card.name} card${selected ? " (selected)" : ""}`}>
        {cardFace}
      </button>
    );
  }

  return <Link href={`/cards/${card.id}`}>{cardFace}</Link>;
}

export const Card = CardInner;
export const MemoizedCard = memo(CardInner);
