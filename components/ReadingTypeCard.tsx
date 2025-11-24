"use client"

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight } from 'lucide-react'
import { ReactNode } from 'react'

interface ReadingTypeCardProps {
  icon: ReactNode
  title: string
  description: string
  cardCount: number
  badge?: string
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline'
  spreadId?: string
}

export function ReadingTypeCard({
  icon,
  title,
  description,
  cardCount,
  badge,
  badgeVariant = 'secondary',
  spreadId
}: ReadingTypeCardProps) {
  const href = spreadId ? `/read/new?spread=${spreadId}` : '/read/new'
  return (
    <Link href={href}>
      <Card className="group relative h-full cursor-pointer overflow-hidden rounded-2xl border border-border bg-card backdrop-blur-sm transition-all duration-500 hover:scale-105 hover:border-border/60 hover:shadow-2xl hover:shadow-primary/20 flex flex-col">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
         <CardHeader className="relative z-10 pb-3">
           <div className="flex flex-col gap-2">
             <div className="flex items-center justify-between gap-2">
               <CardTitle className="flex items-center gap-2 text-base font-semibold text-card-foreground group-hover:text-primary line-clamp-2">
                 {icon}
                 <span>{title}</span>
               </CardTitle>
             </div>
             {badge && (
               <Badge variant={badgeVariant} className="w-fit whitespace-nowrap text-xs">
                 {badge}
               </Badge>
             )}
           </div>
         </CardHeader>
         <CardContent className="card-content-no-padding relative z-10 flex flex-grow flex-col justify-between pt-0">
           <p className="text-sm leading-relaxed text-muted-foreground">
             {description}
           </p>
           <div className="mt-4 flex items-center text-sm font-medium">
             <span className="bg-primary/12 inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold text-primary ring-1 ring-primary/10 dark:bg-primary dark:text-primary-foreground dark:ring-primary/30">
               {cardCount} Card{cardCount !== 1 ? 's' : ''}
             </span>
             <ArrowRight className="ml-2 h-4 w-4 text-primary/60" />
           </div>
         </CardContent>
       </Card>
     </Link>
  )
}
