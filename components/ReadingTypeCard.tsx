"use client"

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight } from 'lucide-react'
import { ReactNode } from 'react'

interface ReadingTypeCardProps {
  icon: ReactNode
  title: string
  description: string
  cardCount: number
}

export function ReadingTypeCard({
  icon,
  title,
  description,
  cardCount
}: ReadingTypeCardProps) {
  return (
    <Link href="/read/new">
      <Card className="group relative h-full cursor-pointer overflow-hidden rounded-2xl border border-border bg-card backdrop-blur-sm transition-all duration-500 hover:scale-105 hover:border-border/60 hover:shadow-2xl hover:shadow-primary/20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
        <CardHeader className="relative z-10 pb-4">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold text-card-foreground group-hover:text-primary">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="card-content-no-padding relative z-10 flex flex-grow flex-col">
          <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
          <div className="flex items-center text-sm font-medium">
            <span className="bg-primary/12 inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold text-primary ring-1 ring-primary/10 dark:bg-primary dark:text-primary-foreground dark:ring-primary/30">
              {cardCount} Cards
            </span>
            <ArrowRight className="ml-2 h-4 w-4 text-primary/60 dark:text-primary/60" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
