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
        <div className="grid lg:grid-cols-2 gap-8 items-center mb-8 relative">
          <div className="text-center lg:text-left space-component relative z-10 overflow-visible">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 text-foreground leading-normal relative overflow-visible pb-2">
              <span className="relative inline-block">
                Lenormand
                <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/60 rounded-full opacity-80"></div>
              </span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-primary/60 overflow-visible">
                Intelligence
              </span>
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl text-foreground mb-4 max-w-3xl mx-auto lg:mx-0 leading-relaxed font-light">
              Discover the ancient wisdom of Lenormand through AI-enhanced intuition.
              <span className="text-muted-foreground block mt-2">Experience personalized guidance where technology meets mystical insight.</span>
            </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
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
          <div className="relative z-10 order-last lg:order-last flex justify-center lg:justify-start">
            {/* Remove any visible background or border: transparent wrapper */}
            <div className="hero-image-cell bg-transparent rounded-none p-0">
               <Image
                 src="/images/hero-image.jpg"
                 alt="Mystical Lenormand cards arranged in a reading spread"
                 width={1200}
                 height={800}
                className="block w-full max-w-xs lg:max-w-none lg:w-[75%] h-auto object-contain rounded-md lg:rounded-md shadow-none border-0"
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
         <div className="mb-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 rounded-3xl"></div>
           <div className="text-center mb-6 relative z-10">
              <h2 className="text-4xl font-bold text-center mb-2 text-foreground relative">
               Discover Your Reading
               <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-24 h-0.5 bg-gradient-to-r from-primary to-primary/60 rounded-full"></div>
             </h2>
             <p className="text-center text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">Choose the wisdom that speaks to your soul</p>
          </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 relative z-10 items-stretch">
            <Link href="/read/new">
               <Card className="hover:shadow-2xl hover:shadow-primary/20 cursor-pointer group border border-border hover:border-border/60 bg-card backdrop-blur-sm h-full rounded-2xl overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardHeader className="pb-4 relative z-10">
                  <CardTitle className="flex items-center gap-3 text-lg text-card-foreground font-semibold">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Quick Analysis
                  </CardTitle>
                </CardHeader>
                 <CardContent className="card-content-no-padding relative z-10 flex flex-col flex-grow">
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                      Past, present, and future revealed in focused guidance
                    </p>
                  <div className="flex items-center text-sm font-medium">
                    <span className="inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold bg-primary/12 text-primary dark:bg-primary dark:text-primary-foreground ring-1 ring-primary/10 dark:ring-primary/30">
                      3 Cards
                    </span>
                    <ArrowRight className="w-4 h-4 ml-2 text-primary/60 dark:text-primary/60" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/read/new">
               <Card className="hover:shadow-2xl hover:shadow-primary/20 transition-all duration-500 cursor-pointer group border border-border hover:border-border/60 bg-card backdrop-blur-sm h-full hover:scale-105 rounded-2xl overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardHeader className="pb-4 relative z-10">
                  <CardTitle className="flex items-center gap-3 group-hover:text-primary text-lg text-card-foreground font-semibold">
                    <Heart className="w-5 h-5 text-primary" />
                    Deep Analysis
                  </CardTitle>
                </CardHeader>
                 <CardContent className="card-content-no-padding relative z-10 flex flex-col flex-grow">
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                      Uncover challenges, resources, and outcomes for your situation
                    </p>
                  <div className="flex items-center text-sm font-medium">
                    <span className="inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold bg-primary/12 text-primary dark:bg-primary dark:text-primary-foreground ring-1 ring-primary/10 dark:ring-primary/30">
                      5 Cards
                    </span>
                    <ArrowRight className="w-4 h-4 ml-2 text-primary/60 dark:text-primary/60" />
                  </div>
                </CardContent>
              </Card>
             </Link>

             <Link href="/read/new">
                <Card className="hover:shadow-2xl hover:shadow-primary/20 transition-all duration-500 cursor-pointer group border border-border hover:border-border/60 bg-card backdrop-blur-sm h-full hover:scale-105 rounded-2xl overflow-hidden relative">
                 <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                 <CardHeader className="pb-4 relative z-10">
                   <CardTitle className="flex items-center gap-3 group-hover:text-primary text-lg text-card-foreground font-semibold">
                     <Calendar className="w-5 h-5 text-primary" />
                     Weekly Insights
                   </CardTitle>
                 </CardHeader>
                  <CardContent className="card-content-no-padding relative z-10 flex flex-col flex-grow">
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                      Navigate your week ahead or explore relationship dynamics
                    </p>
                   <div className="flex items-center text-sm font-medium">
                     <span className="inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold bg-primary/12 text-primary dark:bg-primary dark:text-primary-foreground ring-1 ring-primary/10 dark:ring-primary/30">
                       7 Cards
                     </span>
                     <ArrowRight className="w-4 h-4 ml-2 text-primary/60 dark:text-primary/60" />
                   </div>
                 </CardContent>
               </Card>
             </Link>

             <Link href="/read/new">
                <Card className="hover:shadow-2xl hover:shadow-primary/20 transition-all duration-500 cursor-pointer group border border-border hover:border-border/60 bg-card backdrop-blur-sm h-full hover:scale-105 rounded-2xl overflow-hidden relative">
                 <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                 <CardHeader className="pb-4 relative z-10">
                   <CardTitle className="flex items-center gap-3 group-hover:text-primary text-lg text-card-foreground font-semibold">
                     <Shield className="w-5 h-5 text-primary" />
                     Comprehensive
                   </CardTitle>
                 </CardHeader>
                 <CardContent className="card-content-no-padding relative z-10 flex flex-col flex-grow">
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                      Explore inner world, direct actions, and external influences
                    </p>
                  <div className="flex items-center text-sm font-medium">
                    <span className="inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold bg-primary/12 text-primary dark:bg-primary dark:text-primary-foreground ring-1 ring-primary/10 dark:ring-primary/30">
                      9 Cards
                    </span>
                    <ArrowRight className="w-4 h-4 ml-2 text-primary/60 dark:text-primary/60" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/read/new">
               <Card className="hover:shadow-2xl hover:shadow-primary/20 transition-all duration-500 cursor-pointer group border border-border hover:border-border/60 bg-card backdrop-blur-sm h-full hover:scale-105 rounded-2xl overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardHeader className="pb-4 relative z-10">
                  <CardTitle className="flex items-center gap-3 group-hover:text-primary text-lg text-card-foreground font-semibold">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Grand Tableau
                  </CardTitle>
                </CardHeader>
                 <CardContent className="card-content-no-padding relative z-10 flex flex-col flex-grow">
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                      Full deck reading revealing life&apos;s complete mystical pattern
                    </p>
                  <div className="flex items-center text-sm font-medium">
                    <span className="inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold bg-primary/12 text-primary dark:bg-primary dark:text-primary-foreground ring-1 ring-primary/10 dark:ring-primary/30">
                      36 Cards
                    </span>
                    <ArrowRight className="w-4 h-4 ml-2 text-primary/60 dark:text-primary/60" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>

      {/* CTA Section */}
       <div className="container-cta">
         <div className="text-center bg-card backdrop-blur-sm rounded-3xl p-6 border border-border shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-3xl"></div>
          <div className="absolute top-4 left-4 w-16 h-16 bg-primary/20 rounded-full blur-xl"></div>
          <div className="absolute bottom-4 right-4 w-12 h-12 bg-primary/20 rounded-full blur-lg"></div>
          <div className="relative z-10">
             <h2 className="text-4xl font-bold mb-4 text-foreground relative">
               Begin Your Mystical Journey
               <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-48 h-0.5 bg-gradient-to-r from-primary via-primary/80 to-primary/60 rounded-full"></div>
             </h2>
             <p className="text-muted-foreground mb-6 text-xl max-w-2xl mx-auto leading-relaxed">
              Let the cards reveal what your soul already knows
            </p>
            <Link href="/read/new">
              <Button className="btn-hero">
                Discover Your Path
                <ArrowRight className="w-5 h-5 ml-3" />
              </Button>
            </Link>
          </div>
        </div>
      </div>


    </main>
  )
}