"use client"

import { useState } from 'react'
import { Card as CardType, CardCombo } from '@/lib/types'
import { cn } from '@/lib/utils'
import { CardModal } from './CardModal'

interface CardProps {
  card: CardType
  onClick?: () => void
  showBack?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Card({
  card,
  onClick,
  showBack = false,
  size = 'md',
  className
}: CardProps) {
  const [showModal, setShowModal] = useState(false)

  const getCardColor = (cardId: number): string => {
    const colors = [
      'from-primary/60 to-primary/80', 'from-primary/50 to-primary/70', 'from-primary/40 to-primary/60',
      'from-primary/70 to-primary/90', 'from-primary/55 to-primary/75', 'from-primary/45 to-primary/65',
      'from-primary/65 to-primary/85', 'from-primary/35 to-primary/55', 'from-primary/75 to-primary/95'
    ]
    return colors[cardId % colors.length]
  }

  const handleCardClick = () => {
    if (onClick) {
      onClick()
    } else {
      setShowModal(true)
    }
  }

  const sizeClasses = {
    sm: 'w-20 h-32 text-xs',
    md: 'w-28 h-40 text-sm sm:text-base',
    lg: 'w-36 h-52 text-base'
  }

  if (showBack) {
    return (
      <div
        className={cn(
            'relative card-mystical rounded-xl cursor-pointer flex items-center justify-center group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background will-change-transform',
           sizeClasses[size],
           className
         )}
        onClick={handleCardClick}
        onMouseEnter={() => {
          // Soft bell at 432 Hz, 80 ms, −18 dB - felt, not heard
          // Implementation: playGentleBell()
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleCardClick()
          }
        }}
        tabIndex={0}
        role="button"
        aria-label="Lenormand card back. Click to draw or select card"
      >
        {/* Single background layer */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/90 via-primary/80 to-muted/90"></div>

        {/* Single opacity overlay for hover/focus - GPU accelerated */}
        <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-t from-transparent via-primary/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus:opacity-100"></div>

        <div className="relative z-10 text-center text-card-foreground">
          <div className="mb-2 text-4xl opacity-90">✦</div>
          <div className="text-sm font-bold tracking-wider text-muted-foreground opacity-90 transition-colors duration-300 group-hover:text-foreground">LENORMAND</div>
          <div className="mt-1 text-xs text-muted-foreground opacity-70 transition-opacity duration-300 group-hover:opacity-90">MYSTICAL DIVINATION</div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div
        className={cn(
          'relative card-mystical rounded-xl cursor-pointer overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background will-change-transform group',
          sizeClasses[size],
          className
        )}
        onClick={handleCardClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleCardClick()
          }
        }}
        tabIndex={0}
        role="button"
        aria-label={`${card.name} card. Click to ${onClick ? 'select' : 'view details'}`}
      >
        {/* Card Image */}
        <div className="relative h-full w-full overflow-hidden rounded-lg bg-card">
          <img
            src={card.imageUrl || ''}
            alt={card.name}
            className="h-full w-full object-cover"
          />
        </div>
      </div>
      
      {/* Card Name and Number - Below Card */}
      <div className="mt-2 text-center">
        <div className="text-sm font-bold text-foreground">
          {card.name}
        </div>
        <div className="text-xs text-muted-foreground">
          #{card.id}
        </div>
      </div>

      {showModal && (
        <CardModal
          card={card}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}