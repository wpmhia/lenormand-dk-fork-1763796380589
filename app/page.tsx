import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
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
        <div className="relative mb-8 flex flex-col items-center justify-center gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
          <div className="space-component relative z-10 overflow-visible text-center lg:flex-1 lg:text-left">
            <h1 className="relative mb-4 overflow-visible pb-2 text-4xl font-bold leading-normal text-foreground sm:text-5xl lg:text-6xl xl:text-7xl">
              <span className="relative inline-block">
                Lenormand
                <div className="absolute -bottom-2 left-0 right-0 h-1 rounded-full bg-gradient-to-r from-primary via-primary/80 to-primary/60 opacity-80"></div>
              </span>
              <span className="block overflow-visible bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                Intelligence
              </span>
            </h1>
            <p className="mx-auto mb-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg md:text-xl lg:mx-0">
              Get free AI-powered Lenormand card readings online. Explore card meanings, spreads, and personalized interpretations with our intelligent divination tool.
            </p>
              <div className="flex flex-col items-center gap-4 sm:flex-row lg:items-start lg:justify-start">
                <Link href="/read/new">
                  <Button size="lg">
                    ✨ Get Your Reading
                  </Button>
                </Link>
                <Link href="/cards">
                  <Button variant="outline" size="lg">
                    🔮 Explore Cards
                  </Button>
                </Link>
              </div>
           </div>

            {/* Image column */}
            <div className="relative z-10 flex justify-center lg:flex-1 lg:justify-end">
              <div className="hero-image-cell rounded-none bg-transparent p-0">
                   <Image
                     src="/images/hero-image.jpg"
                     alt="Mystical Lenormand cards arranged in a reading spread"
                     width={432}
                     height={592}
                     priority
                     sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                     className="block h-auto w-full max-w-xs rounded-md border-0 object-contain shadow-none lg:max-w-sm"
                   />
              </div>
            </div>
         </div>
       </div>

         {/* Reading Types */}
          <div className="container-section">
          <div className="relative mb-12">
           <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-primary/5 via-transparent to-primary/5"></div>
            <div className="relative z-10 mb-8 text-center">
               <h2 className="relative mb-4 text-center text-4xl font-bold text-foreground">
                 Explore Your Future
                 <div className="absolute -bottom-3 left-1/2 h-0.5 w-24 -translate-x-1/2 transform rounded-full bg-gradient-to-r from-primary to-primary/60"></div>
               </h2>
              <p className="mx-auto max-w-2xl text-center text-lg leading-relaxed text-muted-foreground">Choose the wisdom that speaks to your soul</p>
           </div>
               <div className="relative z-10 grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-4">
                   <ReadingTypeCard
                     icon={<Shield className="h-5 w-5 text-primary" />}
                     title="Single Card"
                     description="Quick daily guidance for direct answers and immediate action"
                     cardCount={1}
                     badge="Authentic"
                     badgeVariant="default"
                     spreadId="single-card"
                   />
                   <ReadingTypeCard
                     icon={<Sparkles className="h-5 w-5 text-primary" />}
                     title="3-Card Sentence"
                     description="Three cards flowing as a narrative sentence - the core Lenormand reading method"
                     cardCount={3}
                     badge="Authentic"
                     badgeVariant="default"
                     spreadId="sentence-3"
                   />
                   <ReadingTypeCard
                     icon={<Heart className="h-5 w-5 text-primary" />}
                     title="9-Card Reading"
                     description="Deeper exploration of complex situations without overwhelming detail"
                     cardCount={9}
                     badge="Authentic"
                     badgeVariant="default"
                     spreadId="comprehensive"
                   />
                   <ReadingTypeCard
                     icon={<Calendar className="h-5 w-5 text-primary" />}
                     title="Grand Tableau"
                     description="Complete life situation through full 4x9 grid - the most comprehensive reading"
                     cardCount={36}
                     badge="Authentic"
                     badgeVariant="default"
                     spreadId="grand-tableau"
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
                   The Lenormand Tradition, <span className="text-primary">Powered by AI</span>
                  <div className="absolute -bottom-2 left-1/2 h-0.5 w-48 -translate-x-1/2 transform rounded-full bg-gradient-to-r from-primary via-primary/80 to-primary/60"></div>
                </h2>
               <p className="mx-auto mb-6 max-w-2xl text-xl leading-relaxed text-muted-foreground">
                Explore interpretations inspired by historical Lenormand traditions through modern intelligence
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