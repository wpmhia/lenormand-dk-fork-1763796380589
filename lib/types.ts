export interface CardMeaning {
  general: string
  positive: string[]
  negative: string[]
  relationships?: string
  careerFinance?: string
  timing?: string
}

export interface Card {
  id: number
  name: string
  number: number
  keywords: string[]
  uprightMeaning: string
  meaning: CardMeaning
  combos: CardCombo[]
  imageUrl: string | null
  emoji?: string
  timing?: string
  strength?: 'STRONG' | 'NEUTRAL' | 'WEAK'
  historicalMeaning?: string
}

export interface CardCombo {
  withCardId: number
  meaning: string
}

export interface ReadingCard {
  id: number
  position: number
  x?: number
  y?: number
}

export interface Reading {
  id: string
  title: string
  question?: string
  layoutType: number // Allow any number of cards
  cards: ReadingCard[]
  slug: string
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
  timingDays?: number
  timingType?: 'days' | 'weeks'
  deadlineDate?: Date
}

export interface LayoutConfig {
  name: string
  cardCount: number
  positions: Array<{
    id: string
    x: number
    y: number
    label: string
    meaning: string
  }>
}

export interface Locale {
  [key: string]: string | Locale
}

export type Language = 'en' | 'da'