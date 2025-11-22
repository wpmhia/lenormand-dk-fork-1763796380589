"use client"

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ReadingTypeCard } from '@/components/ReadingTypeCard'
import {
  Sparkles,
  ArrowRight,
  Heart,
  Shield,
  Calendar
} from 'lucide-react'

export default function Home() {

  return (
    <main className="bg-background text-foreground" role="main">
      {/* Hero Section */}
      <div className="container-hero">
        <div className="relative mb-8 grid items-center gap-8 lg:grid-cols-2">
          <div className="space-component relative z-10 overflow-visible text-center lg:text-left">
            <h1 className="relative mb-4 overflow-visible pb-2 text-4xl font-bold leading-normal text-foreground sm:text-5xl lg:text-6xl xl:text-7xl">
              <span className="relative inline-block">
                Lenormand
                <div className="absolute -bottom-2 left-0 right-0 h-1 rounded-full bg-gradient-to-r from-primary via-primary/80 to-primary/60 opacity-80"></div>
              </span>
              <span className="block overflow-visible bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                Intelligence
              </span>
            </h1>
            <p className="mb-4 max-w-2xl text-lg font-normal leading-relaxed text-foreground sm:text-xl">
              Discover the ancient wisdom of Lenormand through AI-enhanced intuition.
              <span className="mt-2 block text-muted-foreground">Experience personalized guidance where technology meets mystical insight.</span>
            </p>
              <div className="flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">
               <Link href="/read/new">
                 <Button size="lg">
                   ✨ Begin Your Journey
                 </Button>
               </Link>
                <Link href="/cards">
                  <Button variant="outline" size="lg">
                    🔮 Explore Cards
                  </Button>
                </Link>
              </div>
           </div>

          {/* Image column - appears before text on lg and after text on small screens */}
          <div className="relative z-10 order-last flex justify-center lg:order-last lg:justify-start">
            {/* Remove any visible background or border: transparent wrapper */}
            <div className="hero-image-cell rounded-none bg-transparent p-0">
               <Image
                 src="/images/hero-image.jpg"
                 alt="Mystical Lenormand cards arranged in a reading spread"
                 width={1200}
                 height={800}
                className="block h-auto w-full max-w-xs rounded-md border-0 object-contain shadow-none lg:w-[75%] lg:max-w-none lg:rounded-md"
              />
            </div>
          </div>
         </div>
       </div>

        {/* Reading Types */}
         <div className="container-section">
         <div className="relative mb-8">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-primary/5 via-transparent to-primary/5"></div>
           <div className="relative z-10 mb-6 text-center">
              <h2 className="relative mb-2 text-center text-4xl font-bold text-foreground">
               Discover Your Reading
               <div className="absolute -bottom-3 left-1/2 h-0.5 w-24 -translate-x-1/2 transform rounded-full bg-gradient-to-r from-primary to-primary/60"></div>
             </h2>
             <p className="mx-auto max-w-2xl text-center text-lg leading-relaxed text-muted-foreground">Choose the wisdom that speaks to your soul</p>
          </div>
             <div className="relative z-10 grid items-stretch gap-6 md:grid-cols-2 lg:grid-cols-5">
                <ReadingTypeCard
                  icon={<Sparkles className="h-5 w-5 text-primary" />}
                  title="3-Card Reading"
                  description="Three cards flowing as a narrative sentence - the core Lenormand reading method"
                  cardCount={3}
                />
                <ReadingTypeCard
                  icon={<Heart className="h-5 w-5 text-primary" />}
                  title="5-Card Reading"
                  description="Uncover challenges, resources, and outcomes for your situation"
                  cardCount={5}
                />
                <ReadingTypeCard
                  icon={<Calendar className="h-5 w-5 text-primary" />}
                  title="7-Card Reading"
                  description="Week ahead, relationships, or any 7-card spread guidance"
                  cardCount={7}
                />
                <ReadingTypeCard
                  icon={<Shield className="h-5 w-5 text-primary" />}
                  title="9-Card Reading"
                  description="Explore inner world, direct actions, and external influences"
                  cardCount={9}
                />
                <ReadingTypeCard
                  icon={<Sparkles className="h-5 w-5 text-primary" />}
                  title="Master Reading"
                  description="Full deck reading revealing life's complete mystical pattern"
                  cardCount={36}
                />
             </div>
        </div>
      </div>

      {/* CTA Section */}
       <div className="container-cta">
         <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 text-center shadow-2xl backdrop-blur-sm">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10"></div>
          <div className="absolute left-4 top-4 h-16 w-16 rounded-full bg-primary/20 blur-xl"></div>
          <div className="absolute bottom-4 right-4 h-12 w-12 rounded-full bg-primary/20 blur-lg"></div>
          <div className="relative z-10">
             <h2 className="relative mb-4 text-4xl font-bold text-foreground">
               Begin Your Mystical Journey
               <div className="absolute -bottom-2 left-1/2 h-0.5 w-48 -translate-x-1/2 transform rounded-full bg-gradient-to-r from-primary via-primary/80 to-primary/60"></div>
             </h2>
             <p className="mx-auto mb-6 max-w-2xl text-xl leading-relaxed text-muted-foreground">
              Let the cards reveal what your soul already knows
            </p>
            <Link href="/read/new">
              <Button size="lg">
                Discover Your Path
                <ArrowRight className="ml-3 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>


    </main>
  )
}