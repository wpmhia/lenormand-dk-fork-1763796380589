"use client"

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { AIReadingResponse } from '@/lib/deepseek'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Sparkles, RefreshCw, AlertCircle, ExternalLink, Zap, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'
import { getSpreadLearningLinks } from '@/lib/spreadLearning'


interface AIReadingDisplayProps {
  aiReading: AIReadingResponse | null
  isLoading: boolean
  error: string | null
  errorDetails?: {
    type?: string
    helpUrl?: string
    action?: string
    waitTime?: number
    fields?: string[]
  } | null
  onRetry: () => void
  retryCount?: number
  cards?: Array<{
    id: number
    name: string
    position: number
  }>
  allCards?: any[]
  spreadId?: string
  question?: string
  isStreaming?: boolean
}


export function AIReadingDisplay({
  aiReading,
  isLoading,
  error,
  errorDetails,
  onRetry,
  retryCount = 0,
  cards,
  allCards,
  spreadId,
  question,
  isStreaming = false
}: AIReadingDisplayProps) {
  const [showReadingMethod, setShowReadingMethod] = useState(false)
  const spreadLearningLinks = getSpreadLearningLinks(spreadId)

   // Return content as-is without adding links
   const getContent = (content: string): string => content

     if (isLoading && !aiReading?.practicalTranslation) {
       return (
        <div className="animate-in fade-in slide-in-from-bottom-8 delay-200 duration-500 pointer-events-none loading-skeleton">
           <Card className="border-border bg-card">
             <CardContent className="space-y-4 p-8 text-center">
               <div className="flex items-center justify-center gap-2 mb-4">
                 <Badge variant="default" className="loading-skeleton-pulse">
                   <Zap className="h-3 w-3 mr-1" />
                   Processing
                 </Badge>
               </div>
               <div className="relative mx-auto h-16 w-16">
                 <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
                 <div className="absolute inset-0 loading-spinner rounded-full border-4 border-primary border-t-transparent"></div>
                 <Sparkles className="absolute inset-0 m-auto h-6 w-6 loading-skeleton-pulse text-primary" />
               </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Generating your reading...</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Consulting the oracle...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

   if (error) {
     return (
       <Alert variant="destructive" className="border-destructive/20 bg-destructive/5">
         <div className="flex items-center gap-2 mb-3">
           <AlertCircle className="h-4 w-4" />
           <AlertTitle>Interpretation Unavailable</AlertTitle>
           <Badge variant="destructive" className="ml-auto">Error</Badge>
         </div>
         <AlertDescription className="space-y-3">
           <p>{error}</p>
           {errorDetails && (
             <div className="text-sm opacity-90">
               {errorDetails.action && <p className="font-medium">{errorDetails.action}</p>}
               {errorDetails.helpUrl && (
                 <a 
                   href={errorDetails.helpUrl} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="hover:text-destructive-foreground mt-1 inline-flex items-center gap-1 underline"
                 >
                   View Help <ExternalLink className="h-3 w-3" />
                 </a>
               )}
             </div>
           )}
           <Button 
             variant="outline" 
             size="sm" 
             onClick={onRetry}
             className="border-destructive/30 hover:bg-destructive/10 text-destructive-foreground mt-2"
           >
             <RefreshCw className="mr-2 h-3 w-3" />
             Try Again
           </Button>
         </AlertDescription>
       </Alert>
     )
   }

    if (!aiReading?.practicalTranslation) {
      return null
    }

       return (
         <div className="animate-in fade-in slide-in-from-bottom-8 delay-200 duration-500 space-y-6">
           {/* What it Means - Primary Reading */}
           {aiReading?.practicalTranslation && (
             <Card className="border-border bg-card">
               <CardHeader className="border-b border-border">
                 <div className="space-y-4">
                   <div className="flex items-center justify-between gap-2">
                     <CardTitle className="flex items-center gap-2">
                       <CheckCircle2 className="h-5 w-5 text-primary" />
                       What it Means
                     </CardTitle>
                     <Badge variant="secondary" className="flex items-center gap-1">
                       <CheckCircle2 className="h-3 w-3" />
                       Complete
                     </Badge>
                   </div>
                 </div>
               </CardHeader>
               <CardContent className="space-y-6 p-8">
                 <div className="text-foreground">
                    <ReactMarkdown
                      components={{
                        h1: ({node, ...props}) => <h1 className="mb-4" {...props} />,
                        h2: ({node, ...props}) => <h2 className="mb-3 mt-6" {...props} />,
                        h3: ({node, ...props}) => <h3 className="mb-2 mt-4" {...props} />,
                        p: ({node, ...props}) => <p className="mb-4" {...props} />,
                        ul: ({node, ...props}) => <ul className="mb-4 list-disc space-y-2 pl-6" {...props} />,
                        ol: ({node, ...props}) => <ol className="mb-4 list-decimal space-y-2 pl-6" {...props} />,
                        li: ({node, ...props}) => <li className="pl-1" {...props} />,
                        blockquote: ({node, ...props}) => <blockquote className="my-4 border-l-4 border-border pl-4 italic text-muted-foreground" {...props} />,
                        strong: ({node, ...props}) => <strong className="font-semibold" {...props} />,
                        em: ({node, ...props}) => <em className="italic" {...props} />,
                        hr: ({node, ...props}) => <hr className="my-6 border-border" {...props} />,
                        a: ({node, ...props}: any) => (
                          <a 
                            {...props} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/80 underline"
                          />
                        ),
                      }}
                    >
                     {getContent(aiReading.practicalTranslation)}
                   </ReactMarkdown>
                 </div>

                   {/* Show Reading Method Button */}
                   {spreadLearningLinks && (
                     <div className="border-t border-border pt-6 mt-6">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowReadingMethod(!showReadingMethod)}
                          className="gap-2"
                        >
                          {showReadingMethod ? (
                            <>
                              <ChevronUp className="h-4 w-4" />
                              Hide Reading Method
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4" />
                              Show Reading Method
                            </>
                          )}
                        </Button>

                      {/* Reading Method Details - Only when expanded */}
                      {showReadingMethod && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-3 mt-4">
                          <div className="space-y-2">
                            <h4 className="font-semibold text-muted-foreground">About This Method</h4>
                            <p className="text-sm text-muted-foreground/80">{spreadLearningLinks.description}</p>
                          </div>
                           {aiReading?.reading && (
                             <div className="space-y-3">
                               <div>
                                 <h5 className="font-semibold text-sm text-muted-foreground mb-2">Reading Prophecy</h5>
                                 <div className="p-4 bg-muted/30 rounded border border-border/30">
                                   <p className="text-sm text-foreground/80">{aiReading.reading}</p>
                                 </div>
                               </div>
                             </div>
                           )}
                           <div className="flex flex-wrap gap-2">
                             <a href={spreadLearningLinks.methodologyPage} target="_blank" rel="noopener noreferrer">
                               <Button variant="default" size="sm" className="gap-2 bg-primary/80 hover:bg-primary text-primary-foreground">
                                 Learn the Method
                                 <ExternalLink className="h-3 w-3" />
                               </Button>
                             </a>
                           </div>
                        </div>
                      )}
                    </div>
                  )}
               </CardContent>
             </Card>
           )}
        </div>
      )
}
