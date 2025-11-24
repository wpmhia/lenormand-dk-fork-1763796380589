"use client"

import Link from 'next/link'
import { Card as CardType } from '@/lib/types'
import { Card } from './Card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ArrowUpRight } from 'lucide-react'

interface CardWithTooltipProps {
  card: CardType
  onClick?: () => void
  showBack?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
  positionLabel?: string
  positionDescription?: string
}

export function CardWithTooltip({
  card,
  onClick,
  showBack = false,
  size = 'md',
  className,
  positionLabel,
  positionDescription
}: CardWithTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <Card
              card={card}
              onClick={onClick}
              showBack={showBack}
              size={size}
              className={className}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs border-border bg-card p-4 shadow-lg">
          <div className="space-y-3">
            {/* Card Name and Position */}
            <div>
              <h4 className="font-semibold text-foreground">
                {card.name}
              </h4>
              {positionLabel && (
                <p className="text-xs text-primary font-medium">
                  {positionLabel}
                </p>
              )}
              {positionDescription && (
                <p className="text-xs text-muted-foreground mt-1">
                  {positionDescription}
                </p>
              )}
            </div>

            {/* Card Meaning */}
            <div>
              <p className="text-sm leading-relaxed text-foreground">
                {card.uprightMeaning}
              </p>
            </div>

            {/* Keywords */}
            {card.keywords && card.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {card.keywords.slice(0, 4).map((keyword, idx) => (
                  <span
                    key={idx}
                    className="inline-block bg-primary/10 text-primary text-xs px-2 py-1 rounded border border-primary/20"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            )}

            {/* Learn More Link */}
            <Link
              href={`/cards/${card.id}`}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors pt-2 border-t border-border/30"
            >
              Learn more about this card
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
