"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Cookie, Settings, X } from 'lucide-react'

interface CookiePreferences {
  analytics: boolean
  necessary: boolean // Always true for essential cookies
}

const COOKIE_CONSENT_KEY = 'lenormand-cookie-consent'
const COOKIE_PREFERENCES_KEY = 'lenormand-cookie-preferences'

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [preferences, setPreferences] = useState<CookiePreferences>({
    analytics: false,
    necessary: true
  })

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY)
    const savedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY)

    if (!consent) {
      // First visit - show banner
      setShowBanner(true)
    } else if (savedPreferences) {
      // Load saved preferences
      const parsed = JSON.parse(savedPreferences)
      setPreferences(parsed)
    }
  }, [])

  const acceptAll = () => {
    const newPreferences = { analytics: true, necessary: true }
    setPreferences(newPreferences)
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted')
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(newPreferences))
    setShowBanner(false)

    // Load Google Analytics
    loadGoogleAnalytics()
  }

  const acceptNecessaryOnly = () => {
    const newPreferences = { analytics: false, necessary: true }
    setPreferences(newPreferences)
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted')
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(newPreferences))
    setShowBanner(false)
  }

  const saveSettings = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted')
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(preferences))
    setShowBanner(false)
    setShowSettings(false)

    if (preferences.analytics) {
      loadGoogleAnalytics()
    }
  }

  const loadGoogleAnalytics = () => {
    // Load Google Analytics script
    const script1 = document.createElement('script')
    script1.async = true
    script1.src = 'https://www.googletagmanager.com/gtag/js?id=G-ESFQHZSKLQ'
    document.head.appendChild(script1)

    const script2 = document.createElement('script')
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-ESFQHZSKLQ');
    `
    document.head.appendChild(script2)
  }

  if (!showBanner && !showSettings) return null

  return (
    <>
      {/* Cookie Banner */}
      {showBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-card/95 backdrop-blur-sm border-t border-border shadow-lg">
          <div className="container mx-auto max-w-4xl">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="flex items-center gap-2 flex-shrink-0">
                <Cookie className="w-5 h-5 text-primary" />
                <span className="font-semibold text-foreground">Cookie Preferences</span>
              </div>

              <div className="flex-1 text-sm text-muted-foreground">
                We use cookies to enhance your experience. Essential cookies are always enabled.
                Analytics cookies help us understand how you use our site.
              </div>

              <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSettings(true)}
                  className="text-xs"
                >
                  <Settings className="w-3 h-3 mr-1" />
                  Settings
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={acceptNecessaryOnly}
                  className="text-xs"
                >
                  Essential Only
                </Button>
                <Button
                  size="sm"
                  onClick={acceptAll}
                  className="text-xs"
                >
                  Accept All
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cookie Settings Modal */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cookie className="w-5 h-5" />
              Cookie Preferences
            </DialogTitle>
            <DialogDescription>
              Choose which cookies you want to allow. You can change these settings at any time.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Necessary Cookies */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <Label className="font-medium">Essential Cookies</Label>
                <p className="text-sm text-muted-foreground">
                  Required for the website to function properly
                </p>
              </div>
              <Switch checked={preferences.necessary} disabled />
            </div>

            {/* Analytics Cookies */}
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <Label className="font-medium">Analytics Cookies</Label>
                <p className="text-sm text-muted-foreground">
                  Help us understand how you use our site to improve your experience
                </p>
              </div>
              <Switch
                checked={preferences.analytics}
                onCheckedChange={(checked) =>
                  setPreferences(prev => ({ ...prev, analytics: checked }))
                }
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowSettings(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={saveSettings} className="flex-1">
              Save Preferences
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}