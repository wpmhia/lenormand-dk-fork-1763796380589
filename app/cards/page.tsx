"use client"

import { useState, useEffect, useCallback } from 'react'
import { Card as CardType } from '@/lib/types'
import { Card } from '@/components/Card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Search } from 'lucide-react'
import { getCards } from '@/lib/data'

export default function CardsPage() {
  const [cards, setCards] = useState<CardType[]>([])
  const [filteredCards, setFilteredCards] = useState<CardType[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'number' | 'name'>('number')
  const [loading, setLoading] = useState(true)

  const filterAndSortCards = useCallback(() => {
    let filtered = cards

    if (searchTerm) {
      filtered = filtered.filter(card =>
        card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.keywords.some(keyword =>
          keyword.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        card.uprightMeaning.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    filtered = [...filtered].sort((a, b) => {
      if (sortBy === 'number') {
        return a.id - b.id
      } else {
        return a.name.localeCompare(b.name)
      }
    })

    setFilteredCards(filtered)
  }, [cards, searchTerm, sortBy])

  useEffect(() => {
    fetchCards()
  }, [])

  useEffect(() => {
    filterAndSortCards()
  }, [filterAndSortCards])

  const fetchCards = async () => {
    try {
      const cardsData = await getCards()
      setCards(cardsData)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching cards:', error)
      setLoading(false)
    }
  }

  const skeletonCards = Array.from({ length: 12 }).map((_, i) => (
    <div key={`skeleton-${i}`} className="space-component">
      <Skeleton className="aspect-[2.5/3.5] w-full rounded-lg" />
      <div className="space-y-2 mt-2">
        <Skeleton className="h-4 w-24 mx-auto" />
        <Skeleton className="h-3 w-16 mx-auto" />
      </div>
    </div>
  ))

  if (loading) {
    return (
      <div className="container-section">
        <div className="mb-8">
          <h1>The Sacred Deck</h1>
          <p className="ethereal-glow mt-2">
            Journey through the 36 archetypes that hold the keys to understanding
          </p>
        </div>

        <div className="mb-8 flex flex-col gap-4 sm:gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-10 flex-1" />
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            <Skeleton className="h-9 flex-1 sm:w-32" />
            <Skeleton className="h-9 flex-1 sm:w-32" />
          </div>
        </div>

        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {skeletonCards}
        </div>
      </div>
    )
  }

  return (
    <div className="container-section">
      <div className="mb-8">
        <h1>The Sacred Deck</h1>
        <p className="ethereal-glow mt-2">
          Journey through the 36 archetypes that hold the keys to understanding
        </p>
      </div>

        <div className="mb-8 flex flex-col gap-4 sm:gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search cards by name, keyword, or meaning..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            <Button
              variant={sortBy === 'number' ? 'default' : 'outline'}
              onClick={() => setSortBy('number')}
              size="sm"
              className="flex-1 sm:flex-none"
            >
              Sort by Number
            </Button>
            <Button
              variant={sortBy === 'name' ? 'default' : 'outline'}
              onClick={() => setSortBy('name')}
              size="sm"
              className="flex-1 sm:flex-none"
            >
              Sort by Name
            </Button>
          </div>
        </div>

        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
         {filteredCards.map((card) => (
           <div key={card.id} className="space-component">
             <Card 
               card={card} 
               size="md" 
               className="mystical-float group mx-auto group-hover:scale-105" 
             />
             <div className="text-center">
               <div className="truncate text-sm font-medium text-foreground">{card.name}</div>
               <div className="text-xs text-muted-foreground">#{card.id}</div>
             </div>
           </div>
         ))}
       </div>

       {filteredCards.length === 0 && (
         <div className="text-center text-muted-foreground">
           No cards found matching your search. Try different keywords or browse all cards.
         </div>
       )}
     </div>
   )
}
