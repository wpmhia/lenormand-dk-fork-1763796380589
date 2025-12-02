"use client"

import { useState } from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ChevronDown, ChevronUp, BookOpen, HelpCircle, Lightbulb, Target } from 'lucide-react'

interface LenormandGuideProps {
  className?: string
  darkTheme?: boolean
}

export function LenormandGuide({ className, darkTheme = false }: LenormandGuideProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const questionExamples = [
    { category: "Love & Relationships", examples: [
      "What do I need to know about my relationship with [person]?",
      "How can I improve my love life?",
      "What obstacles are preventing me from finding love?",
      "What does the future hold for my current relationship?"
    ]},
    { category: "Career & Work", examples: [
      "What should I focus on in my career right now?",
      "How can I improve my work situation?",
      "What opportunities are coming my way professionally?",
      "Should I take this job opportunity?"
    ]},
    { category: "Personal Growth", examples: [
      "What do I need to work on within myself?",
      "How can I overcome my current challenges?",
      "What lessons am I meant to learn right now?",
      "What's holding me back from personal growth?"
    ]},
    { category: "General Guidance", examples: [
      "What guidance do the cards have for me today?",
      "What energy surrounds my current situation?",
      "What should I be aware of in the coming weeks?",
      "How can I best navigate my current path?"
    ]}
  ]

  return (
    <div className={`space-y-4 ${className}`}>
      <Card className={`${darkTheme
          ? "border-border bg-gradient-to-br from-card/80 to-muted/60 backdrop-blur-sm"
          : "border-border bg-gradient-to-br from-background/80 to-muted/60 backdrop-blur-sm"}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <BookOpen className="h-5 w-5" />
            How to Read Lenormand Cards
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Learn the basics of Lenormand reading to get more accurate insights
          </p>
        </CardHeader>
        <CardContent className="space-y-lg">
          
          {/* What are Lenormand Cards */}
           <Collapsible open={openSections.basics} onOpenChange={() => toggleSection('basics')}>
             <CollapsibleTrigger asChild>
               <Button variant="ghost" className="w-full justify-between p-md hover:bg-muted rounded-lg">
                 <div className="flex items-center gap-md">
                   <HelpCircle className="h-4 w-4" />
                   <span className="font-medium">What are Lenormand Cards?</span>
                 </div>
                 {openSections.basics ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
               </Button>
             </CollapsibleTrigger>
             <CollapsibleContent className="mt-md space-y-md rounded-lg border border-border bg-card p-md">
               <p className="text-sm leading-relaxed text-muted-foreground">
                Lenormand cards are a 36-card oracle deck originating from 19th century Europe. Unlike Tarot, 
                Lenormand cards are more direct and practical, focusing on everyday situations and concrete outcomes. 
                Each card has specific meanings that combine to create detailed insights about your life.
              </p>
               <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                 <div className="rounded-lg bg-muted p-md">
                   <h4 className="mb-sm font-medium text-foreground">Direct & Practical</h4>
                   <p className="text-xs text-muted-foreground">Focuses on real-life situations and concrete answers</p>
                 </div>
                 <div className="rounded-lg bg-muted p-md">
                   <h4 className="mb-sm font-medium text-foreground">Combination-Based</h4>
                   <p className="text-xs text-muted-foreground">Cards modify each other to create nuanced meanings</p>
                 </div>
               </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator className="bg-border" />

          {/* How to Formulate Questions */}
           <Collapsible open={openSections.questions} onOpenChange={() => toggleSection('questions')}>
             <CollapsibleTrigger asChild>
               <Button variant="ghost" className="w-full justify-between p-md hover:bg-muted rounded-lg">
                 <div className="flex items-center gap-md">
                   <Target className="h-4 w-4" />
                   <span className="font-medium">How to Formulate Questions</span>
                 </div>
                 {openSections.questions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
               </Button>
             </CollapsibleTrigger>
             <CollapsibleContent className="mt-md space-y-md rounded-lg border border-border bg-card p-md">
               <div className="space-y-md">
                 <div>
                   <h4 className="mb-2 font-medium text-foreground">Do&apos;s ✅</h4>
                   <ul className="space-y-sm text-sm text-muted-foreground">
                    <li>• Be specific and focused</li>
                    <li>• Ask about situations and actions</li>
                    <li>• Use &quot;what,&quot; &quot;how,&quot; or &quot;when&quot; questions</li>
                    <li>• Focus on yourself and your choices</li>
                    <li>• Keep questions open-ended</li>
                  </ul>
                </div>
                 <div>
                   <h4 className="mb-2 font-medium text-foreground">Don&apos;ts ❌</h4>
                   <ul className="space-y-sm text-sm text-muted-foreground">
                    <li>• Avoid yes/no questions</li>
                    <li>• Don&apos;t ask about others without their consent</li>
                    <li>• Avoid medical, legal, or financial advice</li>
                    <li>• Don&apos;t ask the same question repeatedly</li>
                    <li>• Avoid questions about death or specific timing</li>
                  </ul>
                </div>
              </div>

               <div className="mt-lg rounded-lg border border-border bg-muted p-md">
                 <div className="mb-md flex items-center gap-md">
                   <Lightbulb className="h-4 w-4 text-primary" />
                   <h4 className="font-medium text-foreground">Example Questions</h4>
                 </div>
                <div className="space-y-sm">
                  {questionExamples.map((category, index) => (
                    <div key={index} className="space-y-sm">
                      <Badge variant="outline" className="border-border bg-muted text-xs text-foreground">
                        {category.category}
                      </Badge>
                      <div className="ml-2 space-y-1">
                        {category.examples.slice(0, 2).map((example, i) => (
                          <p key={i} className="text-xs italic text-muted-foreground">&quot;{example}&quot;</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator className="bg-border" />

           {/* Understanding Card Positions */}
           <Collapsible open={openSections.positions} onOpenChange={() => toggleSection('positions')}>
             <CollapsibleTrigger asChild>
               <Button variant="ghost" className="w-full justify-between p-md hover:bg-muted rounded-lg">
                 <div className="flex items-center gap-md">
                   <Target className="h-4 w-4" />
                   <span className="font-medium">Understanding Card Positions</span>
                 </div>
                 {openSections.positions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
               </Button>
             </CollapsibleTrigger>
             <CollapsibleContent className="mt-md space-y-md rounded-lg border border-border bg-card p-md">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-lg bg-muted p-md">
                  <h4 className="mb-sm font-medium text-foreground">3-Card Spread</h4>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li><strong>Past:</strong> What led to this</li>
                    <li><strong>Present:</strong> Current situation</li>
                    <li><strong>Future:</strong> Where it&apos;s heading</li>
                  </ul>
                </div>
                <div className="rounded-lg bg-muted p-md">
                  <h4 className="mb-sm font-medium text-foreground">5-Card Spread</h4>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li><strong>Past:</strong> Background</li>
                    <li><strong>Present:</strong> Current state</li>
                    <li><strong>Future:</strong> What&apos;s coming</li>
                    <li><strong>Challenge:</strong> Obstacles</li>
                    <li><strong>Advice:</strong> Guidance</li>
                  </ul>
                </div>
                <div className="rounded-lg bg-muted p-md">
                  <h4 className="mb-sm font-medium text-foreground">9-Card Spread</h4>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li><strong>Center:</strong> Core issue</li>
                    <li><strong>Around:</strong> Influences</li>
                    <li><strong>Corners:</strong> Outcomes</li>
                  </ul>
                </div>
              </div>
              <p className="mt-md text-sm text-muted-foreground">
                <strong>Tip:</strong> Hover over position labels to see detailed explanations of what each position represents in your reading.
              </p>
            </CollapsibleContent>
          </Collapsible>

          <Separator className="bg-border" />

           {/* Reading Tips */}
           <Collapsible open={openSections.tips} onOpenChange={() => toggleSection('tips')}>
             <CollapsibleTrigger asChild>
               <Button variant="ghost" className="w-full justify-between p-md hover:bg-muted rounded-lg">
                 <div className="flex items-center gap-md">
                   <Lightbulb className="h-4 w-4" />
                   <span className="font-medium">Reading Tips & Best Practices</span>
                 </div>
                 {openSections.tips ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
               </Button>
             </CollapsibleTrigger>
             <CollapsibleContent className="mt-md space-y-md rounded-lg border border-border bg-card p-md">
              <div className="grid grid-cols-1 gap-md md:grid-cols-2">
                <div className="space-y-sm">
                  <h4 className="font-medium text-foreground">Before Reading</h4>
                  <ul className="space-y-sm text-sm text-muted-foreground">
                    <li>• Take a few deep breaths to center yourself</li>
                    <li>• Clear your mind of distractions</li>
                    <li>• Focus on your question while shuffling</li>
                    <li>• Trust your intuition when selecting cards</li>
                  </ul>
                </div>
                <div className="space-y-sm">
                  <h4 className="font-medium text-foreground">During Reading</h4>
                  <ul className="space-y-sm text-sm text-muted-foreground">
                    <li>• Click cards to see detailed meanings</li>
                    <li>• Look at how cards modify each other</li>
                    <li>• Consider the position meanings</li>
                    <li>• Pay attention to your gut feelings</li>
                  </ul>
                </div>
              </div>
              <div className="mt-lg rounded-lg border border-border bg-muted p-md">
                <h4 className="mb-sm font-medium text-foreground">Pro Tip</h4>
                <p className="text-sm text-muted-foreground">
                  Keep a reading journal! Note your questions, cards drawn, and how the reading played out. 
                  This helps you learn patterns and develop your personal connection with the cards.
                </p>
              </div>
            </CollapsibleContent>
          </Collapsible>

        </CardContent>
      </Card>
    </div>
  )
}