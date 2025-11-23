"use client"

import { useEffect } from 'react'

declare global {
  interface Window {
    kofiwidget2?: {
      init: (text: string, color: string, id: string) => void
      draw: () => void
    }
  }
}

export function KoFiButton() {
  useEffect(() => {
    const drawWidget = () => {
      if (window.kofiwidget2) {
        window.kofiwidget2.draw()
      }
    }

    setTimeout(drawWidget, 100)
  }, [])

  return (
    <div className="flex justify-center py-4">
      {/* Ko-fi widget renders here */}
    </div>
  )
}
