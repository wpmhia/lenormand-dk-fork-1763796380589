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
  question
}: AIReadingDisplayProps) {
  if (isLoading) {
    return (
      <Card className="border-border bg-card/50 backdrop-blur-sm">
        <CardContent className="p-8 text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-primary animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Generating your reading...</h3>
            <p className="text-muted-foreground text-sm mt-1">
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
                  className="inline-flex items-center gap-1 underline hover:text-destructive-foreground mt-1"
                >
                  View Help <ExternalLink className="w-3 h-3" />
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
            <RefreshCw className="w-3 h-3 mr-2" />
            Try Again
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (!aiReading) {
    return null
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="border-primary/20 bg-card/50 backdrop-blur-sm overflow-hidden">
        <CardHeader className="bg-primary/5 border-b border-primary/10 pb-4">
          <CardTitle className="flex items-center gap-2 text-xl text-primary">
            <Sparkles className="w-5 h-5" />
            AI Interpretation
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="text-foreground/90 leading-relaxed">
            <ReactMarkdown
              components={{
                h1: ({node, ...props}) => <h1 className="text-2xl font-bold mb-4 text-primary" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-xl font-semibold mb-3 mt-6 text-primary/90" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-lg font-semibold mb-2 mt-4 text-primary/80" {...props} />,
                p: ({node, ...props}) => <p className="mb-4 leading-relaxed" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-4 space-y-2" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-4 space-y-2" {...props} />,
                li: ({node, ...props}) => <li className="pl-1" {...props} />,
                blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-primary/30 pl-4 italic my-4 text-muted-foreground" {...props} />,
                strong: ({node, ...props}) => <strong className="font-semibold text-primary" {...props} />,
                em: ({node, ...props}) => <em className="italic text-foreground/80" {...props} />,
                hr: ({node, ...props}) => <hr className="my-6 border-primary/20" {...props} />,
              }}
            >
              {aiReading.reading}
            </ReactMarkdown>
          </div>
          
          {spreadId && (
            <div className="pt-4 border-t border-border mt-4 flex justify-between items-center text-xs text-muted-foreground">
              <span>Spread: {spreadId}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
