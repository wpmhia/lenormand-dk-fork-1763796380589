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
            <BookOpen className="w-5 h-5" />
            How to Read Lenormand Cards
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Learn the basics of Lenormand reading to get more accurate insights
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* What are Lenormand Cards */}
           <Collapsible open={openSections.basics} onOpenChange={() => toggleSection('basics')}>
             <CollapsibleTrigger asChild>
               <Button variant="ghost" className="w-full justify-between p-3 hover:bg-muted">
                 <div className="flex items-center gap-2">
                   <HelpCircle className="w-4 h-4" />
                   <span className="font-medium">What are Lenormand Cards?</span>
                 </div>
                 {openSections.basics ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
               </Button>
             </CollapsibleTrigger>
             <CollapsibleContent className="space-y-3 mt-3 p-4 rounded-lg border bg-card border-border">
               <p className="text-sm leading-relaxed text-muted-foreground">
                Lenormand cards are a 36-card oracle deck originating from 19th century Europe. Unlike Tarot, 
                Lenormand cards are more direct and practical, focusing on everyday situations and concrete outcomes. 
                Each card has specific meanings that combine to create detailed insights about your life.
              </p>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                 <div className="p-3 rounded-lg bg-muted">
                   <h4 className="font-medium mb-1 text-foreground">Direct & Practical</h4>
                   <p className="text-xs text-muted-foreground">Focuses on real-life situations and concrete answers</p>
                 </div>
                 <div className="p-3 rounded-lg bg-muted">
                   <h4 className="font-medium mb-1 text-foreground">Combination-Based</h4>
                   <p className="text-xs text-muted-foreground">Cards modify each other to create nuanced meanings</p>
                 </div>
               </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator className="bg-border" />

          {/* How to Formulate Questions */}
           <Collapsible open={openSections.questions} onOpenChange={() => toggleSection('questions')}>
             <CollapsibleTrigger asChild>
               <Button variant="ghost" className="w-full justify-between p-3 hover:bg-muted">
                 <div className="flex items-center gap-2">
                   <Target className="w-4 h-4" />
                   <span className="font-medium">How to Formulate Questions</span>
                 </div>
                 {openSections.questions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
               </Button>
             </CollapsibleTrigger>
             <CollapsibleContent className="space-y-3 mt-3 p-4 rounded-lg border bg-card border-border">
               <div className="space-y-3">
                 <div>
                   <h4 className="font-medium mb-2 text-foreground">Do&apos;s ✅</h4>
                   <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Be specific and focused</li>
                    <li>• Ask about situations and actions</li>
                    <li>• Use &quot;what,&quot; &quot;how,&quot; or &quot;when&quot; questions</li>
                    <li>• Focus on yourself and your choices</li>
                    <li>• Keep questions open-ended</li>
                  </ul>
                </div>
                 <div>
                   <h4 className="font-medium mb-2 text-foreground">Don&apos;ts ❌</h4>
                   <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Avoid yes/no questions</li>
                    <li>• Don&apos;t ask about others without their consent</li>
                    <li>• Avoid medical, legal, or financial advice</li>
                    <li>• Don&apos;t ask the same question repeatedly</li>
                    <li>• Avoid questions about death or specific timing</li>
                  </ul>
                </div>
              </div>

               <div className="mt-4 p-3 rounded-lg border bg-muted border-border">
                 <div className="flex items-center gap-2 mb-2">
                   <Lightbulb className="w-4 h-4 text-primary" />
                   <h4 className="font-medium text-foreground">Example Questions</h4>
                 </div>
                <div className="space-y-2">
                  {questionExamples.map((category, index) => (
                    <div key={index} className="space-y-1">
                      <Badge variant="outline" className="text-xs bg-muted border-border text-foreground">
                        {category.category}
                      </Badge>
                      <div className="ml-2 space-y-1">
                        {category.examples.slice(0, 2).map((example, i) => (
                          <p key={i} className="text-xs text-muted-foreground italic">&quot;{example}&quot;</p>
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
               <Button variant="ghost" className="w-full justify-between p-3 hover:bg-muted">
                 <div className="flex items-center gap-2">
                   <Target className="w-4 h-4" />
                   <span className="font-medium">Understanding Card Positions</span>
                 </div>
                 {openSections.positions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
               </Button>
             </CollapsibleTrigger>
             <CollapsibleContent className="space-y-3 mt-3 p-4 bg-card rounded-lg border border-border">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 bg-muted rounded-lg">
                  <h4 className="font-medium text-foreground mb-1">3-Card Spread</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li><strong>Past:</strong> What led to this</li>
                    <li><strong>Present:</strong> Current situation</li>
                    <li><strong>Future:</strong> Where it&apos;s heading</li>
                  </ul>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <h4 className="font-medium text-foreground mb-1">5-Card Spread</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li><strong>Past:</strong> Background</li>
                    <li><strong>Present:</strong> Current state</li>
                    <li><strong>Future:</strong> What&apos;s coming</li>
                    <li><strong>Challenge:</strong> Obstacles</li>
                    <li><strong>Advice:</strong> Guidance</li>
                  </ul>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <h4 className="font-medium text-foreground mb-1">9-Card Spread</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li><strong>Center:</strong> Core issue</li>
                    <li><strong>Around:</strong> Influences</li>
                    <li><strong>Corners:</strong> Outcomes</li>
                  </ul>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                <strong>Tip:</strong> Hover over position labels to see detailed explanations of what each position represents in your reading.
              </p>
            </CollapsibleContent>
          </Collapsible>

          <Separator className="bg-border" />

           {/* Reading Tips */}
           <Collapsible open={openSections.tips} onOpenChange={() => toggleSection('tips')}>
             <CollapsibleTrigger asChild>
               <Button variant="ghost" className="w-full justify-between p-3 hover:bg-muted">
                 <div className="flex items-center gap-2">
                   <Lightbulb className="w-4 h-4" />
                   <span className="font-medium">Reading Tips & Best Practices</span>
                 </div>
                 {openSections.tips ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
               </Button>
             </CollapsibleTrigger>
             <CollapsibleContent className="space-y-3 mt-3 p-4 bg-card rounded-lg border border-border">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">Before Reading</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Take a few deep breaths to center yourself</li>
                    <li>• Clear your mind of distractions</li>
                    <li>• Focus on your question while shuffling</li>
                    <li>• Trust your intuition when selecting cards</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">During Reading</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Click cards to see detailed meanings</li>
                    <li>• Look at how cards modify each other</li>
                    <li>• Consider the position meanings</li>
                    <li>• Pay attention to your gut feelings</li>
                  </ul>
                </div>
              </div>
              <div className="mt-3 p-3 bg-muted rounded-lg border border-border">
                <h4 className="font-medium text-foreground mb-1">Pro Tip</h4>
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