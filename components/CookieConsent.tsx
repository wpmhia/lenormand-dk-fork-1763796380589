"use client";

import { useState, useEffect } from "react";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Cookie, Settings, X } from "lucide-react";

interface CookiePreferences {
  analytics: boolean;
  necessary: boolean;
}

const COOKIE_CONSENT_KEY = "lenormand-cookie-consent";
const COOKIE_PREFERENCES_KEY = "lenormand-cookie-preferences";

export function CookieConsent() {
  const [mounted, setMounted] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    analytics: false,
    necessary: true,
  });

  useEffect(() => {
    setMounted(true);

    const urlParams = new URLSearchParams(window.location.search);
    const testMode = urlParams.get("test-cookies");
    const forceShow = urlParams.get("show-cookies");

    if (testMode === "true" || forceShow === "true") {
      setShowBanner(true);
      return;
    }

    try {
      const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
      const savedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY);

      if (!consent) {
        setShowBanner(true);
      } else if (savedPreferences) {
        try {
          const parsed = JSON.parse(savedPreferences);
          if (parsed && typeof parsed === "object") {
            const hasAnalyticsConsent = parsed.analytics ?? false;
            setPreferences({
              analytics: hasAnalyticsConsent,
              necessary: parsed.necessary ?? true,
            });
            // Load GA if previously consented
            if (hasAnalyticsConsent) {
              loadGoogleAnalytics();
            }
          }
        } catch (error) {
          setPreferences({
            analytics: false,
            necessary: true,
          });
        }
      }
    } catch {
      setShowBanner(true);
    }
  }, []);

  const acceptAll = () => {
    const newPreferences = { analytics: true, necessary: true };
    setPreferences(newPreferences);
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    localStorage.setItem(
      COOKIE_PREFERENCES_KEY,
      JSON.stringify(newPreferences),
    );
    setShowBanner(false);

    // Load Google Analytics
    loadGoogleAnalytics();
  };

  const acceptNecessaryOnly = () => {
    const newPreferences = { analytics: false, necessary: true };
    setPreferences(newPreferences);
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    localStorage.setItem(
      COOKIE_PREFERENCES_KEY,
      JSON.stringify(newPreferences),
    );
    setShowBanner(false);
  };

  const saveSettings = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(preferences));
    setShowBanner(false);
    setShowSettings(false);

    if (preferences.analytics) {
      loadGoogleAnalytics();
    }
  };

  const loadGoogleAnalytics = () => {
    if (typeof window === "undefined") return;

    const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    if (!gaId) return;

    if (window.gtag) return;

    const script1 = document.createElement("script");
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    script1.crossOrigin = "anonymous";

    script1.onload = () => {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function gtag(...args: unknown[]) {
        window.dataLayer!.push(args);
      };
      window.gtag("js", new Date());
      window.gtag("config", gaId);
    };

    document.head.appendChild(script1);
  };

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  if (!showBanner && !showSettings) return null;

  return (
    <>
      {/* Cookie Banner */}
      {showBanner && (
        <div
          id="cookie-banner"
          className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 p-4 pb-safe shadow-lg backdrop-blur-sm md:pb-6"
          role="dialog"
          aria-label="Cookie consent banner"
          aria-describedby="cookie-banner-description"
        >
          <div className="container mx-auto max-w-4xl">
            <div className="flex flex-col items-start gap-4 md:flex-row md:items-center">
              <div className="flex flex-shrink-0 items-center gap-2">
                <Cookie className="h-5 w-5 text-primary" />
                <span className="font-semibold text-foreground">
                  Cookie Preferences
                </span>
              </div>

              <div
                id="cookie-banner-description"
                className="flex-1 text-sm text-muted-foreground"
              >
                We use cookies to enhance your experience. Essential cookies are
                always enabled. Analytics cookies help us understand how you use
                our site.
              </div>

              <div className="flex flex-shrink-0 flex-col gap-2 sm:flex-row">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSettings(true)}
                  className="text-xs"
                >
                  <Settings className="mr-1 h-3 w-3" />
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
                <Button size="sm" onClick={acceptAll} className="text-xs">
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
              <Cookie className="h-5 w-5" />
              Cookie Preferences
            </DialogTitle>
            <DialogDescription>
              Choose which cookies you want to allow. You can change these
              settings at any time.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Necessary Cookies */}
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <div>
                <Label className="font-medium">Essential Cookies</Label>
                <p className="text-sm text-muted-foreground">
                  Required for the website to function properly
                </p>
              </div>
              <Switch checked={preferences.necessary} disabled />
            </div>

            {/* Analytics Cookies */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label className="font-medium">Analytics Cookies</Label>
                <p className="text-sm text-muted-foreground">
                  Help us understand how you use our site to improve your
                  experience
                </p>
              </div>
              <Switch
                checked={preferences.analytics}
                onCheckedChange={(checked) =>
                  setPreferences((prev) => ({ ...prev, analytics: checked }))
                }
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowSettings(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button onClick={saveSettings} className="flex-1">
              Save Preferences
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
