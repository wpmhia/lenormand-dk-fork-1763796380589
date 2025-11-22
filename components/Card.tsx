"use client"

import { useState } from 'react'
import Image from 'next/image'
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
            'relative card-mystical rounded-xl cursor-pointer flex items-center justify-center group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background will-change-transform overflow-hidden',
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
        aria-label="Lenormand card back. Click to draw or select card"
      >
        {/* Card Back Image */}
        <Image
          src="/images/card-back.png"
          alt="Card back"
          fill
          className="object-cover"
          sizes={`${size === 'sm' ? '80px' : size === 'md' ? '112px' : '144px'}`}
        />

        {/* Hover overlay */}
        <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-t from-transparent via-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus:opacity-100"></div>
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
          <Image
            src={card.imageUrl || ''}
            alt={card.name}
            width={200}
            height={300}
            className="h-full w-full object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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