"use client";

import Image from "next/image";
import Link from "next/link";
import { Card as CardType } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CardProps {
  card: CardType;
  onClick?: () => void;
  showBack?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Card({
  card,
  onClick,
  showBack = false,
  size = "md",
  className,
}: CardProps) {
  const handleCardClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick();
    }
  };

  const sizeClasses = {
    sm: "w-20 h-32 text-xs",
    md: "w-28 h-40 text-sm sm:text-base",
    lg: "w-36 h-52 text-base",
  };

  if (showBack) {
    return (
      <div
        className={cn(
          "card-mystical group relative flex cursor-pointer items-center justify-center overflow-hidden rounded-xl will-change-transform focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
          sizeClasses[size],
          className,
        )}
        onClick={handleCardClick}
        onKeyDown={onClick ? handleKeyDown : undefined}
        tabIndex={onClick ? 0 : undefined}
        role={onClick ? "button" : undefined}
        aria-label="Lenormand card back. Click to draw or select card"
      >
        <Image
          src="/images/card-back.png"
          alt="Card back"
          fill
          className="object-cover"
          sizes={`${size === "sm" ? "80px" : size === "md" ? "112px" : "144px"}`}
        />
      </div>
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
        onClick={handleCardClick}
        onKeyDown={onClick ? handleKeyDown : undefined}
        tabIndex={onClick ? 0 : undefined}
        role={onClick ? "button" : undefined}
        aria-label={`${card.name} card. Click to ${onClick ? "select" : "view details"}`}
      >
        <div className="relative h-full w-full overflow-hidden rounded-lg bg-card">
          <Image
            src={card.imageUrl || ""}
            alt={card.name}
            width={200}
            height={300}
            className="h-full w-full object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
