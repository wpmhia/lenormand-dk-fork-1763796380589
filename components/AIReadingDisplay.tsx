"use client"

import { motion } from 'framer-motion'
import { AIReadingResponse } from '@/lib/deepseek'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sparkles, RefreshCw } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface AIReadingDisplayProps {
  aiReading: AIReadingResponse | null
  isLoading?: boolean
  error?: string | null
  onRetry?: () => void
}

export function AIReadingDisplay({
  aiReading,
  isLoading,
  error,
  onRetry
}: AIReadingDisplayProps) {

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <Card className="border-border bg-card backdrop-blur-sm shadow-lg rounded-2xl overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="text-card-foreground text-xl flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              AI Reading
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-muted-foreground">Getting your reading...</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <Card className="border-border bg-card backdrop-blur-sm shadow-lg rounded-2xl overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="text-card-foreground text-xl flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              AI Reading
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <p className="text-muted-foreground mb-4">{error}</p>
              {onRetry && (
                <Button onClick={onRetry} variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  if (!aiReading) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <Card className="border-border bg-card backdrop-blur-sm shadow-lg rounded-2xl overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="text-card-foreground text-xl flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Reading
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown>{aiReading.reading}</ReactMarkdown>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}