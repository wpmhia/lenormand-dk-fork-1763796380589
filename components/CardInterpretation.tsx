"use client"

import { useState } from 'react'
import { ReadingCard, Card as CardType } from '@/lib/types'
import { getCardById } from '@/lib/data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, ChevronDown } from 'lucide-react'

interface CardInterpretationProps {
  cards: ReadingCard[]
  allCards: CardType[]
  spreadId?: string
  question: string
}

interface PositionInfo {
  title: string
  description: string
}

const getPositionInfo = (position: number, spreadId?: string): PositionInfo => {
  // Spread-specific labels
  const spreadPositions: Record<string, PositionInfo[]> = {
    "single-card": [
      { title: "Insight", description: "Key guidance for your situation" }
    ],
    "sentence-3": [
      { title: "Opening Element", description: "Primary element - sets the narrative" },
      { title: "Central Element", description: "Core element - where the tension lies" },
      { title: "Closing Element", description: "Final element - the outcome or resolution" }
    ],
    "past-present-future": [
      { title: "Past", description: "What has led to your current situation" },
      { title: "Present", description: "Your current circumstances and energies" },
      { title: "Future", description: "What is likely to develop" }
    ],
    "yes-no-maybe": [
      { title: "Card 1", description: "First indicator - yes/no influence" },
      { title: "Card 2", description: "Center card - tie-breaker or balance" },
      { title: "Card 3", description: "Card 3 - final influence on the answer" }
    ],
    "situation-challenge-advice": [
      { title: "Situation", description: "The current situation or question you face" },
      { title: "Challenge", description: "Obstacles or difficulties you may encounter" },
      { title: "Advice", description: "Guidance for how to proceed" }
    ],
    "mind-body-spirit": [
      { title: "Mind", description: "Thoughts, mental state, and intellectual matters" },
      { title: "Body", description: "Physical health, actions, and material concerns" },
      { title: "Spirit", description: "Emotional well-being, spiritual growth, and inner wisdom" }
    ],
    "sentence-5": [
      { title: "Position 1", description: "Opening of the narrative" },
      { title: "Position 2", description: "Second element - deepens the story" },
      { title: "Position 3", description: "Middle element - turning point" },
      { title: "Position 4", description: "Fourth element - complications or resources" },
      { title: "Position 5", description: "Closing element - outcome or resolution" }
    ],
    "structured-reading": [
      { title: "Subject", description: "The opening element—who or what the story begins with" },
      { title: "Verb", description: "The action or descriptor—what is happening or being done" },
      { title: "Object", description: "The direct impact or target—what is being affected" },
      { title: "Modifier", description: "The qualifier or condition—how, when, or under what circumstance" },
      { title: "Outcome", description: "The result or conclusion—where this leads" }
    ],
    "week-ahead": [
      { title: "Monday", description: "New beginnings, fresh starts, and initial energy for the week" },
      { title: "Tuesday", description: "Challenges, obstacles, and work-related matters" },
      { title: "Wednesday", description: "Communication, connections, and mid-week transitions" },
      { title: "Thursday", description: "Progress, building momentum, and preparation" },
      { title: "Friday", description: "Social aspects, completion, and winding down" },
      { title: "Saturday", description: "Rest, reflection, and personal matters" },
      { title: "Sunday", description: "Closure, spiritual matters, and weekly review" }
    ],
    "relationship-double-significator": [
      { title: "Partner 1 - Essence", description: "First person's core presence and nature" },
      { title: "Partner 1 - Present", description: "First person's current thoughts and feelings" },
      { title: "What Flows Between", description: "The dynamic, challenge, or connection that unites them" },
      { title: "Partner 2 - Essence", description: "Second person's core presence and nature" },
      { title: "Partner 2 - Present", description: "Second person's current thoughts and feelings" },
      { title: "Their Hopes", description: "What each person wishes for in this connection" },
      { title: "The Outcome", description: "Where this relationship is heading" }
    ],
    "comprehensive": [
      { title: "Past - Inner World", description: "Thoughts, feelings, and personal resources from your recent past" },
      { title: "Past - Direct Actions", description: "Actions you took recently that shaped your current circumstances" },
      { title: "Past - Outside World", description: "External influences and events from your recent past" },
      { title: "Present - Inner World", description: "Your current thoughts, feelings, and internal state" },
      { title: "Present - Direct Actions", description: "Your current actions and the central issue you're facing" },
      { title: "Present - Outside World", description: "Current external influences, other people, and environmental factors" },
      { title: "Future - Inner World", description: "How your thoughts and feelings will evolve in the near future" },
      { title: "Future - Direct Actions", description: "Actions you'll need to take in the near future" },
      { title: "Future - Outside World", description: "External events and influences approaching in the near future" }
    ]
  }

  // Return spread-specific label if available
  if (spreadId && spreadPositions[spreadId]) {
    return spreadPositions[spreadId][position] || { title: `Position ${position + 1}`, description: "" }
  }

  // Fallback: default by card count
  const cardCount = spreadId ? (spreadId === 'grand-tableau' ? 36 : spreadId.includes('3') ? 3 : spreadId.includes('5') ? 5 : spreadId.includes('7') ? 7 : spreadId.includes('9') ? 9 : 3) : 3

  if (cardCount === 3) {
    const positions = [
      { title: "Card 1", description: "First card" },
      { title: "Card 2", description: "Second card" },
      { title: "Card 3", description: "Third card" }
    ]
    return positions[position] || { title: `Position ${position + 1}`, description: "" }
  } else if (cardCount === 5) {
    const positions = [
      { title: "Card 1", description: "First card" },
      { title: "Card 2", description: "Second card" },
      { title: "Card 3", description: "Third card" },
      { title: "Card 4", description: "Fourth card" },
      { title: "Card 5", description: "Fifth card" }
    ]
    return positions[position] || { title: `Position ${position + 1}`, description: "" }
  } else {
    return { title: `Card ${position + 1}`, description: "" }
  }
}

export function CardInterpretation({ cards, allCards, spreadId, question }: CardInterpretationProps) {
  const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({})
  const [showStructuredAnalysis, setShowStructuredAnalysis] = useState(spreadId === 'structured-reading')

  const toggleCard = (index: number) => {
    setExpandedCards(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  const getCardMeaning = (card: ReadingCard): string => {
    const fullCard = getCardById(allCards, card.id)
    if (!fullCard) return "Card meaning not found"
    return fullCard.uprightMeaning
  }

  const getCardKeywords = (card: ReadingCard): string[] => {
    const fullCard = getCardById(allCards, card.id)
    return fullCard?.keywords || []
  }

  const getAdjacentPairMeaning = (card1: CardType, card2: CardType): string => {
    return `${card1.name} + ${card2.name}: Together these cards suggest a narrative beat where ${card1.name.toLowerCase()} flows into ${card2.name.toLowerCase()}.`
  }

  const isStructuredFiveCard = spreadId === 'structured-reading' && cards.length === 5

  return (
    <div className="animate-in fade-in slide-in-from-bottom-8 delay-300 duration-500">
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Card Meanings
          </CardTitle>
          <p className="mt-2 text-sm text-muted-foreground">
            Interpretations for: &quot;{question}&quot;
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          {cards.map((card, index) => {
            const fullCard = getCardById(allCards, card.id)
            const positionInfo = getPositionInfo(index, spreadId)
            const meaning = getCardMeaning(card)
            const keywords = getCardKeywords(card)
            const isExpanded = expandedCards[index] || false

            return (
              <div
                key={`${card.id}-${index}`}
                className="rounded-lg border border-border bg-card overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => toggleCard(index)}
                  className="w-full p-4 flex items-start justify-between hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0 focus:ring-offset-background transition-colors"
                  aria-expanded={isExpanded}
                >
                  <div className="flex items-center gap-3 flex-1 text-left">
                    <div className="text-2xl flex-shrink-0" aria-hidden="true">
                      {fullCard?.emoji || '🃏'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-foreground font-medium">
                        {fullCard?.name || 'Unknown Card'}
                      </h3>
                      <p className="text-sm text-primary">
                        {positionInfo.title}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <Badge variant="outline" className="border-border text-muted-foreground text-xs">
                      #{card.id}
                    </Badge>
                    <ChevronDown
                      className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-border animate-in fade-in slide-in-from-top-2 duration-200">
                    {positionInfo.description && (
                      <p className="mb-3 text-xs italic text-muted-foreground pt-3">
                        {positionInfo.description}
                      </p>
                    )}

                    <p className="mb-3 text-sm text-foreground leading-relaxed">
                      {meaning}
                    </p>

                    {keywords.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {keywords.map((keyword, keywordIndex) => (
                          <Badge
                            key={keywordIndex}
                            variant="secondary"
                            className="border-border text-xs"
                          >
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      {isStructuredFiveCard && (
        <div className="mt-6 animate-in fade-in slide-in-from-bottom-8 delay-500 duration-500">
          <Card className="border-border bg-card">
            <CardHeader>
              <button
                onClick={() => setShowStructuredAnalysis(!showStructuredAnalysis)}
                className="w-full flex items-center justify-between hover:text-primary transition-colors"
              >
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Structured Analysis Layers
                </CardTitle>
                <ChevronDown
                  className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${
                    showStructuredAnalysis ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <p className="mt-2 text-sm text-muted-foreground">
                Deeper insights: interpretive lenses, adjacent pairs, and timing calculations
              </p>
            </CardHeader>

            {showStructuredAnalysis && (
              <CardContent className="space-y-6 border-t border-border pt-6">
                {/* Adjacent Pairs Section */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-foreground">Adjacent Pairs (Narrative Beats)</h3>
                  <p className="text-xs text-muted-foreground">Each pair tells a micro-clause of the story:</p>
                  <div className="space-y-2">
                    {[0, 1, 2, 3].map((pairIndex) => {
                      const card1 = getCardById(allCards, cards[pairIndex].id)
                      const card2 = getCardById(allCards, cards[pairIndex + 1].id)
                      if (!card1 || !card2) return null
                      return (
                        <div key={`pair-${pairIndex}`} className="rounded-lg bg-muted p-3">
                          <p className="text-sm font-medium text-foreground">
                            Pair {pairIndex + 1}: {card1.name} + {card2.name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {card1.name} flows into {card2.name}—this is a moment of transition or influence between these two forces.
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Interpretive Lenses Section */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-foreground">Interpretive Lenses (Choose One or Layer Them)</h3>
                  <p className="text-xs text-muted-foreground">
                    The five cards can be read through different frameworks depending on your question:
                  </p>
                  <div className="space-y-3">
                    <div className="rounded-lg border border-border bg-muted/50 p-3">
                      <p className="text-sm font-medium text-foreground">Lens A: Past-Present-Future</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Cards 1-2 (past forces) → Card 3 (present moment) → Cards 4-5 (emerging future)
                      </p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/50 p-3">
                      <p className="text-sm font-medium text-foreground">Lens B: Problem-Advice-Outcome</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Cards 1-2 (what holds you back) → Card 3 (the advice or pivot) → Cards 4-5 (the outcome if you follow it)
                      </p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/50 p-3">
                      <p className="text-sm font-medium text-foreground">Lens C: Situation-Action-Result</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Card 1 (your topic/situation) → Cards 2-3 (action or development) → Cards 4-5 (the result or answer)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Timing Calculation Section */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-foreground">Timing Calculation (Optional)</h3>
                  <p className="text-xs text-muted-foreground">
                    Add the pip count of Card 5 (the outcome card). For Lenormand, use the card number (1-36):
                  </p>
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-sm text-foreground">
                      {(() => {
                        const card5 = getCardById(allCards, cards[4].id)
                        if (!card5) return "Unable to calculate timing"
                        const pips = card5.id
                        let timing = ""
                        if (pips <= 10) timing = `${pips} days`
                        else if (pips <= 20) timing = `${pips - 10} weeks`
                        else timing = `${Math.ceil((pips - 20) / 1.5)} months`
                        return `Card 5 (${card5.name}): Card #${pips} = approximately ${timing}`
                      })()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Formula: 1-10 = days, 11-20 = weeks, 21-36 = months
                    </p>
                  </div>
                </div>

                {/* Quick Checklist */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-foreground">Verification Checklist</h3>
                  <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-sm font-medium text-foreground">☑</span>
                      <p className="text-sm text-muted-foreground">Read the five cards as ONE fluent sentence?</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-sm font-medium text-foreground">☑</span>
                      <p className="text-sm text-muted-foreground">Chose one interpretive lens that fits your question?</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-sm font-medium text-foreground">☑</span>
                      <p className="text-sm text-muted-foreground">Examined the four adjacent pairs as narrative beats?</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-sm font-medium text-foreground">☑</span>
                      <p className="text-sm text-muted-foreground">Extracted timing if the question involves timeline?</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-sm font-medium text-foreground">☑</span>
                      <p className="text-sm text-muted-foreground">Identified significators (if the question is about a person)?</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}