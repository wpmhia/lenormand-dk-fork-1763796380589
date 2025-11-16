import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AnimatedCard } from '@/components/AnimatedCard'
import {
  BookOpen,
  Clock,
  Star,
  ArrowRight,
  Sparkles,
  Heart,
  Users,
  Lightbulb,
  Target,
  Compass
} from 'lucide-react'

export default function LearnPage() {
  const modules = [
    {
      id: 'introduction',
      title: 'Introduction to Lenormand',
      description: 'Discover the ancient wisdom of Lenormand divination and its rich history',
      icon: BookOpen,
      duration: '15 min',
      difficulty: 'Beginner',
      color: 'from-primary to-primary/80'
    },
    {
      id: 'history',
      title: 'History & Origins',
      description: 'Explore the fascinating history of Lenormand from 18th century France to modern day',
      icon: Clock,
      duration: '20 min',
      difficulty: 'Beginner',
      color: 'from-primary to-primary/80'
    },
    {
      id: 'reading-basics',
      title: 'How to Read Lenormand',
      description: 'Master the fundamentals of reading Lenormand cards as meaningful sentences',
      icon: Target,
      duration: '25 min',
      difficulty: 'Beginner',
      color: 'from-primary to-primary/80'
    },
    {
      id: 'card-meanings',
      title: 'Card Meanings & Associations',
      description: 'Learn the traditional meanings and symbolic associations of all 36 cards',
      icon: Sparkles,
      duration: '45 min',
      difficulty: 'Intermediate',
      color: 'from-primary to-primary/80'
    },
    {
      id: 'spreads',
      title: 'Spreads & Techniques',
      description: 'Discover powerful spreads and advanced reading techniques',
      icon: Compass,
      duration: '30 min',
      difficulty: 'Intermediate',
      color: 'from-primary to-primary/80'
    },
    {
      id: 'advanced',
      title: 'Advanced Concepts',
      description: 'Time associations, playing cards, and cultural interpretations',
      icon: Lightbulb,
      duration: '35 min',
      difficulty: 'Advanced',
      color: 'from-primary to-primary/80'
    }
  ]

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-primary/10 text-primary border-primary/30 dark:bg-primary/20 dark:text-primary dark:border-primary/40'
      case 'Intermediate': return 'bg-muted text-muted-foreground border-border dark:bg-muted/50 dark:text-muted-foreground dark:border-border'
      case 'Advanced': return 'bg-muted text-foreground border-border dark:bg-muted dark:text-foreground dark:border-border'
      default: return 'bg-muted/50 text-muted-foreground border-border/50'
    }
  }

  return (
    <div className="page-layout">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10"></div>
        <div className="container relative mx-auto max-w-6xl px-4 py-16">
          <div className="space-y-8 text-center">
            <Badge className="badge-hero">
              ✨ Master Lenormand Divination
            </Badge>

            <div className="space-y-6">
              <h1 className="text-4xl font-bold leading-tight text-foreground sm:text-5xl lg:text-6xl">
                <span className="relative inline-block">
                  Lenormand
                  <div className="absolute -bottom-2 left-0 right-0 h-1 rounded-full bg-gradient-to-r from-primary via-primary/80 to-primary/60 opacity-80"></div>
                </span>
                <span className="block bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                  Wisdom Course
                </span>
              </h1>

              <p className="mx-auto max-w-3xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
                Embark on a comprehensive journey through the ancient art of Lenormand divination.
                From beginner fundamentals to advanced techniques, master the 36-card oracle that has guided seekers for centuries.
              </p>
            </div>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/learn/introduction">
                 <Button className="btn-learn">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Start Your Journey
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/cards">
                <Button className="btn-learn-outline">
                  <BookOpen className="mr-2 h-5 w-5" />
                  Explore Cards First
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Course Overview */}
      <div className="container mx-auto max-w-6xl px-4 py-16">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground">
            Your Learning Path
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            A structured journey from novice to master, designed to build your confidence and intuition step by step.
          </p>
        </div>

        <div className="mb-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((module, index) => (
            <AnimatedCard key={module.id} delay={index * 0.1} className="cursor-pointer">
              <Card className="group relative min-h-[200px] overflow-hidden rounded-2xl border border-border bg-card backdrop-blur-sm hover:border-border/60 hover:shadow-2xl hover:shadow-primary/20">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
              <CardHeader className="relative z-10 pb-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className={`h-12 w-12 rounded-full bg-gradient-to-r ${module.color} flex items-center justify-center`}>
                    <module.icon className="h-6 w-6 text-white" />
                  </div>
                  <Badge className={getDifficultyColor(module.difficulty)}>
                    {module.difficulty}
                  </Badge>
                </div>
                <CardTitle className="text-lg font-semibold text-card-foreground transition-colors group-hover:text-primary">
                  {module.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="card-content-no-padding relative z-10">
                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                  {module.description}
                </p>
                <div className="flex items-center justify-between">
                   <div className="flex items-center text-sm font-medium">
                     <span className="bg-primary/12 inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold text-primary ring-1 ring-primary/10 dark:bg-primary dark:text-primary-foreground dark:ring-primary/30">
                       <Clock className="mr-1 h-3 w-3" />
                       {module.duration}
                     </span>
                   </div>
                  <Link href={`/learn/${module.id}`}>
                    <Button size="sm" variant="ghost" className="h-auto p-0 text-primary hover:bg-muted hover:text-primary/80">
                      Learn More
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
              </Card>
            </AnimatedCard>
          ))}
        </div>

        {/* Why Learn Lenormand */}
        <div className="rounded-3xl border border-border bg-card p-8 shadow-2xl backdrop-blur-sm">
          <div className="mb-8 text-center">
            <h3 className="mb-4 text-2xl font-bold text-foreground">
              Why Learn Lenormand?
            </h3>
             <p className="text-muted-foreground">
               Discover why Lenormand has captivated diviners for over two centuries
             </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-3 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary/80">
                <Target className="h-8 w-8 text-white" />
              </div>
               <h4 className="font-semibold text-foreground">Direct & Practical</h4>
               <p className="text-sm text-muted-foreground">
                 Unlike Tarot&apos;s esoteric symbolism, Lenormand speaks in everyday language with clear, actionable guidance.
               </p>
            </div>

            <div className="space-y-3 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary/80">
                <Heart className="h-8 w-8 text-white" />
              </div>
               <h4 className="font-semibold text-foreground">Emotional Intelligence</h4>
               <p className="text-sm text-muted-foreground">
                 Lenormand helps you understand relationships, emotions, and interpersonal dynamics with remarkable clarity.
               </p>
            </div>

            <div className="space-y-3 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary/80">
                <Users className="h-8 w-8 text-white" />
              </div>
               <h4 className="font-semibold text-foreground">Community Wisdom</h4>
               <p className="text-sm text-muted-foreground">
                 Join a global community of readers who have used Lenormand for guidance, insight, and personal growth.
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}