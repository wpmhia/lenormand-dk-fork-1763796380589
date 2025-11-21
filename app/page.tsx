"use client"

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useScrollAnimation } from '@/hooks/use-scroll-animation'
import {
  Sparkles,
  ArrowRight,
  Heart,
  Shield,
  Calendar
} from 'lucide-react'

export default function Home() {
   const { ref: readingTypesRef, isVisible: readingTypesVisible } = useScrollAnimation(0.1);

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
            <p className="mx-auto mb-4 max-w-3xl text-lg font-light leading-relaxed text-foreground sm:text-xl lg:mx-0 lg:text-2xl">
              Discover the ancient wisdom of Lenormand through AI-enhanced intuition.
              <span className="mt-2 block text-muted-foreground">Experience personalized guidance where technology meets mystical insight.</span>
            </p>
              <div className="flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">
               <Link href="/read/new">
                 <Button className="btn-hero">
                   ✨ Begin Your Journey
                 </Button>
               </Link>
                <Link href="/cards">
                  <Button className="btn-hero-outline">
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
        <div
          ref={readingTypesRef}
          /* Removed translate-y-* so the section doesn't shift the page flow on mount.
             Keep opacity transition only to avoid a layout shift that makes the page start lower. */
          className={`container-section transition-opacity duration-700 ${readingTypesVisible ? 'opacity-100' : 'opacity-0'}`}
        >
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
            <Link href="/read/new">
               <Card className="group relative h-full cursor-pointer overflow-hidden rounded-2xl border border-border bg-card backdrop-blur-sm hover:border-border/60 hover:shadow-2xl hover:shadow-primary/20">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
                <CardHeader className="relative z-10 pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg font-semibold text-card-foreground">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Quick Analysis
                  </CardTitle>
                </CardHeader>
                 <CardContent className="card-content-no-padding relative z-10 flex flex-grow flex-col">
                    <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                      Past, present, and future revealed in focused guidance
                    </p>
                  <div className="flex items-center text-sm font-medium">
                    <span className="bg-primary/12 inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold text-primary ring-1 ring-primary/10 dark:bg-primary dark:text-primary-foreground dark:ring-primary/30">
                      3 Cards
                    </span>
                    <ArrowRight className="ml-2 h-4 w-4 text-primary/60 dark:text-primary/60" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/read/new">
               <Card className="group relative h-full cursor-pointer overflow-hidden rounded-2xl border border-border bg-card backdrop-blur-sm transition-all duration-500 hover:scale-105 hover:border-border/60 hover:shadow-2xl hover:shadow-primary/20">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
                <CardHeader className="relative z-10 pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg font-semibold text-card-foreground group-hover:text-primary">
                    <Heart className="h-5 w-5 text-primary" />
                    Deep Analysis
                  </CardTitle>
                </CardHeader>
                 <CardContent className="card-content-no-padding relative z-10 flex flex-grow flex-col">
                    <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                      Uncover challenges, resources, and outcomes for your situation
                    </p>
                  <div className="flex items-center text-sm font-medium">
                    <span className="bg-primary/12 inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold text-primary ring-1 ring-primary/10 dark:bg-primary dark:text-primary-foreground dark:ring-primary/30">
                      5 Cards
                    </span>
                    <ArrowRight className="ml-2 h-4 w-4 text-primary/60 dark:text-primary/60" />
                  </div>
                </CardContent>
              </Card>
             </Link>

             <Link href="/read/new">
                <Card className="group relative h-full cursor-pointer overflow-hidden rounded-2xl border border-border bg-card backdrop-blur-sm transition-all duration-500 hover:scale-105 hover:border-border/60 hover:shadow-2xl hover:shadow-primary/20">
                 <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
                 <CardHeader className="relative z-10 pb-4">
                   <CardTitle className="flex items-center gap-3 text-lg font-semibold text-card-foreground group-hover:text-primary">
                     <Calendar className="h-5 w-5 text-primary" />
                     Weekly Insights
                   </CardTitle>
                 </CardHeader>
                  <CardContent className="card-content-no-padding relative z-10 flex flex-grow flex-col">
                    <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                      Navigate your week ahead or explore relationship dynamics
                    </p>
                   <div className="flex items-center text-sm font-medium">
                     <span className="bg-primary/12 inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold text-primary ring-1 ring-primary/10 dark:bg-primary dark:text-primary-foreground dark:ring-primary/30">
                       7 Cards
                     </span>
                     <ArrowRight className="ml-2 h-4 w-4 text-primary/60 dark:text-primary/60" />
                   </div>
                 </CardContent>
               </Card>
             </Link>

             <Link href="/read/new">
                <Card className="group relative h-full cursor-pointer overflow-hidden rounded-2xl border border-border bg-card backdrop-blur-sm transition-all duration-500 hover:scale-105 hover:border-border/60 hover:shadow-2xl hover:shadow-primary/20">
                 <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
                 <CardHeader className="relative z-10 pb-4">
                   <CardTitle className="flex items-center gap-3 text-lg font-semibold text-card-foreground group-hover:text-primary">
                     <Shield className="h-5 w-5 text-primary" />
                     Comprehensive
                   </CardTitle>
                 </CardHeader>
                 <CardContent className="card-content-no-padding relative z-10 flex flex-grow flex-col">
                    <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                      Explore inner world, direct actions, and external influences
                    </p>
                  <div className="flex items-center text-sm font-medium">
                    <span className="bg-primary/12 inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold text-primary ring-1 ring-primary/10 dark:bg-primary dark:text-primary-foreground dark:ring-primary/30">
                      9 Cards
                    </span>
                    <ArrowRight className="ml-2 h-4 w-4 text-primary/60 dark:text-primary/60" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/read/new">
               <Card className="group relative h-full cursor-pointer overflow-hidden rounded-2xl border border-border bg-card backdrop-blur-sm transition-all duration-500 hover:scale-105 hover:border-border/60 hover:shadow-2xl hover:shadow-primary/20">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
                <CardHeader className="relative z-10 pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg font-semibold text-card-foreground group-hover:text-primary">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Grand Tableau
                  </CardTitle>
                </CardHeader>
                 <CardContent className="card-content-no-padding relative z-10 flex flex-grow flex-col">
                    <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                      Full deck reading revealing life&apos;s complete mystical pattern
                    </p>
                  <div className="flex items-center text-sm font-medium">
                    <span className="bg-primary/12 inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold text-primary ring-1 ring-primary/10 dark:bg-primary dark:text-primary-foreground dark:ring-primary/30">
                      36 Cards
                    </span>
                    <ArrowRight className="ml-2 h-4 w-4 text-primary/60 dark:text-primary/60" />
                  </div>
                </CardContent>
              </Card>
            </Link>
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
              <Button className="btn-hero">
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