'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AnimatedCard } from '@/components/AnimatedCard'
import { LearningProgressTracker, useLearningProgress } from '@/components/LearningProgressTracker'
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
  Compass,
  TrendingUp,
  Zap,
  CheckCircle2
} from 'lucide-react'

export default function LearnPage() {
  const { completedCount } = useLearningProgress()

  const modules = [
    {
      id: 'introduction',
      title: 'Introduction to Lenormand',
      description: 'Discover the ancient wisdom of Lenormand divination and its rich history. Learn what makes this 36-card oracle unique and powerful.',
      icon: BookOpen,
      duration: '15 min',
      difficulty: 'Beginner',
      color: 'from-primary to-primary/80',
      learningPoints: ['What is Lenormand', 'History overview', 'Why learn Lenormand']
    },
    {
      id: 'history',
      title: 'History & Origins',
      description: 'Explore the fascinating history of Lenormand from 18th century France to modern day. Understand its evolution and cultural significance.',
      icon: Clock,
      duration: '20 min',
      difficulty: 'Beginner',
      color: 'from-primary to-primary/80',
      learningPoints: ['Marie-Anne Lenormand', 'Card origins', 'Cultural evolution']
    },
    {
      id: 'reading-basics',
      title: 'How to Read Lenormand',
      description: 'Master the fundamentals of reading Lenormand cards as meaningful sentences. Learn the core methodology that makes Lenormand powerful.',
      icon: Target,
      duration: '25 min',
      difficulty: 'Beginner',
      color: 'from-primary to-primary/80',
      learningPoints: ['Card combinations', 'Sentence structure', 'Position meanings']
    },
    {
      id: 'card-meanings',
      title: 'Card Meanings & Associations',
      description: 'Learn the traditional meanings and symbolic associations of all 36 cards. Master the language that Lenormand speaks.',
      icon: Sparkles,
      duration: '45 min',
      difficulty: 'Intermediate',
      color: 'from-primary to-primary/80',
      learningPoints: ['All 36 card meanings', 'Keywords & associations', 'Timing & location']
    },
    {
      id: 'spreads',
      title: 'Spreads & Techniques',
      description: 'Discover powerful spreads and advanced reading techniques. From 3-card to Grand Tableau, master diverse reading methods.',
      icon: Compass,
      duration: '30 min',
      difficulty: 'Intermediate',
      color: 'from-primary to-primary/80',
      learningPoints: ['3-card spreads', 'Cross spreads', 'Advanced layouts']
    },
    {
      id: 'advanced',
      title: 'Advanced Concepts',
      description: 'Time associations, playing cards, and cultural interpretations. Take your Lenormand practice to the next level.',
      icon: Lightbulb,
      duration: '35 min',
      difficulty: 'Advanced',
      color: 'from-primary to-primary/80',
      learningPoints: ['Time associations', 'Playing card meanings', 'Professional reading']
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

  const testimonials = [
    {
      name: 'Sarah M.',
      role: 'Spiritual Seeker',
      content: 'This course demystified Lenormand for me. I went from confused to confident in just a week!',
      avatar: '👩'
    },
    {
      name: 'James K.',
      role: 'Professional Reader',
      content: 'The structured approach here is excellent. My reading accuracy improved significantly after reviewing these modules.',
      avatar: '👨'
    },
    {
      name: 'Elena R.',
      role: 'Tarot Enthusiast',
      content: 'As a Tarot reader, learning Lenormand was a natural next step. This course made the transition seamless.',
      avatar: '👩'
    }
  ]

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

              {completedCount > 0 && (
                <div className="flex items-center justify-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm text-primary w-fit mx-auto">
                  <CheckCircle2 className="h-4 w-4" />
                  You&apos;ve completed {completedCount} module{completedCount !== 1 ? 's' : ''}!
                </div>
              )}
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

      {/* Progress Tracker */}
      {completedCount === 0 && (
        <div className="border-t border-border bg-gradient-to-r from-primary/5 via-primary/2 to-primary/5 py-12">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="rounded-2xl border border-primary/20 bg-card/50 p-8 backdrop-blur-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary/80">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">Track Your Learning</h3>
                  <p className="text-sm text-muted-foreground">
                    Mark each module as complete to track your progress through the course. Your progress is saved automatically.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
              <Link href={`/learn/${module.id}`}>
                <Card className="group relative min-h-[280px] overflow-hidden rounded-2xl border border-border bg-card backdrop-blur-sm transition-all hover:border-border/60 hover:shadow-2xl hover:shadow-primary/20">
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
                  <CardContent className="card-content-no-padding relative z-10 space-y-4">
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {module.description}
                    </p>

                    {/* Learning Points */}
                    <div className="space-y-2">
                      {module.learningPoints.map((point, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <div className="h-1 w-1 rounded-full bg-primary"></div>
                          {point}
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between border-t border-border/30 pt-4">
                      <span className="inline-flex items-center rounded-full bg-primary/12 px-2.5 py-1 text-xs font-semibold text-primary ring-1 ring-primary/10 dark:bg-primary dark:text-primary-foreground dark:ring-primary/30">
                        <Clock className="mr-1 h-3 w-3" />
                        {module.duration}
                      </span>
                      <span className="inline-flex items-center text-primary transition-transform group-hover:translate-x-1">
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </AnimatedCard>
          ))}
        </div>

        {/* Why Learn Lenormand */}
        <div className="mb-16 rounded-3xl border border-border bg-card p-8 shadow-2xl backdrop-blur-sm">
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

        {/* Testimonials */}
        <div className="mb-16">
          <div className="mb-8 text-center">
            <h3 className="mb-4 text-2xl font-bold text-foreground">
              What Learners Say
            </h3>
            <p className="text-muted-foreground">
              Join thousands who have transformed their divination practice
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((testimonial, idx) => (
              <Card key={idx} className="border border-border bg-card">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{testimonial.avatar}</div>
                    <div>
                      <p className="font-semibold text-foreground">{testimonial.name}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                   <p className="text-sm leading-relaxed text-muted-foreground">
                     &quot;{testimonial.content}&quot;
                   </p>
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="rounded-3xl border border-border/50 bg-gradient-to-r from-primary/10 to-primary/5 p-8 text-center">
          <Zap className="mx-auto mb-4 h-8 w-8 text-primary" />
          <h3 className="mb-2 text-2xl font-bold text-foreground">
            Ready to Start Your Journey?
          </h3>
          <p className="mx-auto mb-6 max-w-2xl text-muted-foreground">
            Begin with the fundamentals and progress at your own pace. No experience necessary.
          </p>
          <Link href="/learn/introduction">
            <Button size="lg" className="btn-learn">
              Start Learning Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
