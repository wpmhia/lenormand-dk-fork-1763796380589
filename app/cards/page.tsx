"use client"

import { useState, useEffect, useCallback } from 'react'
import { Card as CardType } from '@/lib/types'
import { Card } from '@/components/Card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Filter, Grid, List } from 'lucide-react'
import Link from 'next/link'
import { getCards } from '@/lib/data'

export default function CardsPage() {
  const [cards, setCards] = useState<CardType[]>([])
  const [filteredCards, setFilteredCards] = useState<CardType[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'number' | 'name'>('number')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [loading, setLoading] = useState(true)

  const filterAndSortCards = useCallback(() => {
    let filtered = cards

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(card =>
        card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.keywords.some(keyword =>
          keyword.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        card.uprightMeaning.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Sort
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

  const getAllKeywords = () => {
    const keywords = new Set<string>()
    cards.forEach(card => {
      card.keywords.forEach(keyword => keywords.add(keyword))
    })
    return Array.from(keywords).sort()
  }

  if (loading) {
    return (
      <div className="page-layout">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-foreground">Loading cards...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-layout">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-foreground">The Sacred Deck</h1>
            <p className="ethereal-glow text-muted-foreground">
              Journey through the 36 archetypes that hold the keys to understanding
            </p>
        </div>

        <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filteredCards.map((card) => (
             <div key={card.id} className="group space-y-1 cursor-pointer">
              <Card card={card} size="md" className="group-hover:scale-105 transition-all duration-600 mx-auto mystical-float" />
              <div className="text-center">
                <div className="font-medium text-foreground text-sm sm:text-xs truncate">{card.name}</div>
                <div className="text-muted-foreground text-sm sm:text-xs">#{card.id}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}