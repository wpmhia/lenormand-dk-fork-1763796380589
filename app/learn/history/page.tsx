import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  MapPin,
  User,
  Crown,
  BookOpen,
  Sparkles
} from 'lucide-react'

export default function HistoryPage() {
  const timeline = [
    {
      year: "1790s",
      title: "Marie Anne Adelaide Lenormand",
      description: "The famous French fortune teller begins her career, gaining fame for her accurate predictions and readings for Napoleon Bonaparte.",
      icon: User,
      color: "from-primary to-primary/80"
    },
    {
      year: "Early 1800s",
      title: "The Petit Lenormand",
      description: "The first Lenormand decks appear, based on Marie Lenormand's system. These early decks feature simple, symbolic imagery.",
      icon: BookOpen,
      color: "from-primary to-primary/80"
    },
    {
      year: "1840s-1860s",
      title: "Golden Age of Cartomancy",
      description: "Lenormand becomes extremely popular in Europe, especially in France and Germany. Various schools of interpretation develop.",
      icon: Crown,
      color: "from-primary to-primary/80"
    },
    {
      year: "Modern Era",
      title: "Global Renaissance",
      description: "Lenormand experiences a worldwide revival, with contemporary artists creating beautiful new decks and innovative interpretations.",
      icon: Sparkles,
      color: "from-primary to-primary/80"
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <div className="sticky top-14 z-40 border-b border-border bg-card/80 backdrop-blur">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/learn">
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Course
              </Button>
            </Link>
             <div className="flex items-center space-x-2">
               <Badge className="border-primary/30 bg-primary/10 text-primary dark:border-primary/40 dark:bg-primary/20 dark:text-primary">
                 Module 2 of 6
               </Badge>
               <Badge className="border-primary/30 bg-primary/10 text-primary dark:border-primary/40 dark:bg-primary/20 dark:text-primary">
                 Beginner
               </Badge>
             </div>
            <Link href="/learn/reading-basics">
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                Next Module
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Module Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary/80">
              <Clock className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
            History & Origins
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Journey through time to discover how Lenormand divination evolved from 18th century France to become a global phenomenon.
          </p>
          <div className="mt-4 flex items-center justify-center space-x-4 text-sm text-primary">
            <div className="flex items-center">
              <Clock className="mr-1 h-4 w-4" />
              20 minutes
            </div>
            <div className="flex items-center">
              <MapPin className="mr-1 h-4 w-4" />
              Beginner Level
            </div>
          </div>
        </div>

        {/* Marie Lenormand */}
        <Card className="mb-8 border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl text-foreground">
              <User className="mr-3 h-6 w-6 text-primary" />
              Marie Anne Adelaide Lenormand
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="leading-relaxed text-muted-foreground">
              Born in 1772 in Alençon, France, Marie Anne Adelaide Lenormand was one of the most famous fortune tellers of the 18th and 19th centuries. Her extraordinary accuracy and high-profile clientele made her a legend in her time.
            </p>
            <p className="leading-relaxed text-muted-foreground">
              Among her famous clients were Napoleon Bonaparte, Empress Josephine, and many other figures of French aristocracy. Her predictions were said to be remarkably accurate, and               she became known as &ldquo;the Sibyl of the Faubourg Saint-Germain.&rdquo;
            </p>
            <div className="rounded-lg border border-border bg-muted p-4">
              <p className="text-sm italic text-foreground">
                &ldquo;Lenormand predicted Napoleon&apos;s defeat at Waterloo and his exile to St. Helena. She also foresaw the restoration of the monarchy and the fall of Charles X.&rdquo;
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Historical Timeline */}
        <Card className="mb-8 border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl text-foreground">
              <Clock className="mr-3 h-6 w-6 text-primary" />
              The Evolution of Lenormand
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {timeline.map((event, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className={`h-12 w-12 rounded-full bg-gradient-to-r ${event.color} mt-1 flex flex-shrink-0 items-center justify-center`}>
                    <event.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="mb-2 flex items-center space-x-3">
                      <Badge className="bg-muted text-muted-foreground">
                        {event.year}
                      </Badge>
                      <h4 className="font-semibold text-foreground">
                        {event.title}
                      </h4>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {event.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Cultural Evolution */}
        <Card className="mb-8 border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl text-foreground">
              <MapPin className="mr-3 h-6 w-6 text-primary" />
              Cultural Schools of Thought
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">French School</h4>
                <p className="text-sm text-muted-foreground">
                  Emphasizes elegance and sophistication. Focuses on courtly imagery and aristocratic symbolism. Known for its poetic interpretations.
                </p>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">German School</h4>
                <p className="text-sm text-muted-foreground">
                  Practical and straightforward. Emphasizes everyday symbolism and concrete meanings. Known for systematic approaches.
                </p>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">Contemporary School</h4>
                <p className="text-sm text-muted-foreground">
                  Blends traditional wisdom with modern interpretations. Incorporates diverse cultural perspectives and innovative symbolism.
                </p>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">Playing Card Associations</h4>
                <p className="text-sm text-muted-foreground">
                  Links Lenormand cards to traditional playing cards (clubs, hearts, diamonds, spades) for additional layers of meaning.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Modern Revival */}
        <Card className="mb-8 border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl text-foreground">
              <Sparkles className="mr-3 h-6 w-6 text-primary" />
              The Modern Renaissance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="leading-relaxed text-muted-foreground">
              In recent decades, Lenormand has experienced a remarkable revival. Contemporary artists and spiritual practitioners have created beautiful new decks that honor traditional meanings while incorporating diverse cultural perspectives.
            </p>
            <p className="leading-relaxed text-muted-foreground">
              Today, Lenormand is practiced worldwide, with readers from every culture adding their unique interpretations and symbolism. This diversity has enriched the system, making it more inclusive and accessible to modern seekers.
            </p>
            <div className="rounded-lg border border-border bg-muted p-4">
              <p className="text-sm text-foreground">
                <strong>Did you know?</strong> Lenormand cards are experiencing their greatest popularity since the 19th century, with new decks being created by artists from around the world.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between border-t border-border pt-8">
          <Link href="/learn/introduction">
            <Button variant="outline" className="border-border text-card-foreground hover:bg-muted">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Introduction
            </Button>
          </Link>
          <Link href="/learn/reading-basics">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              Continue to Reading Basics
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}