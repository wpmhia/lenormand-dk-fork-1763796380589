"use client"

import ReactMarkdown from 'react-markdown'
import { AIReadingResponse } from '@/lib/deepseek'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Sparkles, RefreshCw, AlertCircle, ExternalLink } from 'lucide-react'

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
  const displayContent = aiReading?.reading || ''

  if (isLoading && !displayContent) {
    return (
      <Card className="border-border bg-card/50 backdrop-blur-sm">
        <CardContent className="space-y-4 p-8 text-center">
          <div className="relative mx-auto h-16 w-16">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <Sparkles className="absolute inset-0 m-auto h-6 w-6 animate-pulse text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Generating your reading...</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Consulting the oracle...
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="border-destructive/20 bg-destructive/5">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Interpretation Unavailable</AlertTitle>
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

  if (!displayContent) {
    return null
  }

   return (
     <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
       <Card className="border-border bg-card">
         <CardHeader className="border-b border-border">
           <CardTitle className="flex items-center gap-2 text-primary">
             <Sparkles className="h-5 w-5" />
             AI Interpretation
           </CardTitle>
         </CardHeader>
         <CardContent className="space-y-6 p-6">
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
               }}
             >
               {displayContent}
             </ReactMarkdown>
             {isStreaming && <span className="inline animate-pulse text-primary">▌</span>}
           </div>
           
           {spreadId && (
             <div className="border-t border-border pt-4 text-sm text-muted-foreground">
               <span>Spread: {spreadId}</span>
             </div>
           )}
         </CardContent>
       </Card>
     </div>
   )
}
