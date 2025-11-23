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
    if (window.kofiwidget2) {
      window.kofiwidget2.init('Support a free future', '#a17a45', 'Y8Y81NVDEK')
      window.kofiwidget2.draw()
    }
  }, [])

  return (
    <div className="flex justify-center">
      {/* Ko-fi widget renders here */}
    </div>
  )
}
