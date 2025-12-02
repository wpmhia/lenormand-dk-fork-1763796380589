"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Star, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface AccuracyTrackerProps {
  aiInterpretationId: string
  deadline: string
  task: string
  onAccuracySubmitted?: () => void
}

export function AccuracyTracker({
  aiInterpretationId,
  deadline,
  task,
  onAccuracySubmitted
}: AccuracyTrackerProps) {
  const [rating, setRating] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async () => {
    if (rating === null) return

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/readings/accuracy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aiInterpretationId,
          accuracyRating: rating,
          accuracyNotes: notes.trim() || undefined
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSubmitted(true)
        toast.success('Thank you for tracking the accuracy!')
        onAccuracySubmitted?.()
      } else {
        toast.error(data.error || 'Failed to submit accuracy')
      }
    } catch (error) {
      console.error('Failed to submit accuracy:', error)
      toast.error('Failed to submit accuracy')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p>Accuracy tracked!</p>
            <p className="text-sm mt-1">Your feedback helps improve future readings.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Track Prediction Accuracy
        </CardTitle>
        <div className="text-sm text-muted-foreground space-y-1">
          <p><strong>Deadline:</strong> {deadline}</p>
          <p><strong>Task:</strong> {task}</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>How accurate was this prediction?</Label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Button
                key={star}
                variant="ghost"
                size="sm"
                className={`p-1 h-8 w-8 ${rating && star <= rating ? 'text-yellow-500' : 'text-muted-foreground'}`}
                onClick={() => setRating(star)}
              >
                <Star className={`h-4 w-4 ${rating && star <= rating ? 'fill-current' : ''}`} />
              </Button>
            ))}
          </div>
          {rating && (
            <p className="text-xs text-muted-foreground">
              {rating === 1 && "Completely inaccurate"}
              {rating === 2 && "Mostly inaccurate"}
              {rating === 3 && "Somewhat accurate"}
              {rating === 4 && "Mostly accurate"}
              {rating === 5 && "Completely accurate"}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes" className="text-sm font-medium">
            What actually happened? (optional)
          </Label>
          <Textarea
            id="notes"
            placeholder="Share details about how this prediction played out..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="resize-none"
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={rating === null || isSubmitting}
          className="w-full gap-2"
        >
          <CheckCircle className="h-4 w-4" />
          {isSubmitting ? 'Submitting...' : 'Submit Accuracy'}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Your accuracy feedback helps us improve our AI readings
        </p>
      </CardContent>
    </Card>
  )
}