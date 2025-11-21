"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground">
            404
          </h1>
          <h2 className="text-2xl font-semibold text-foreground">
            Reading Not Found
          </h2>
          <p className="text-muted-foreground">
            The reading page you&apos;re looking for doesn&apos;t exist.
          </p>
        </div>

        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild className="flex items-center gap-2">
            <Link href="/read">
              <Home className="h-4 w-4" />
              Reading Home
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  )
}