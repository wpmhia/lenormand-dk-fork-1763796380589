"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

const COOKIE_CONSENT_KEY = "lenormand-cookie-consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hasConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!hasConsent) {
      setVisible(true);
    } else if (hasConsent === "false") {
      // User declined - disable GA tracking
      disableGoogleAnalytics();
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "true");
    setVisible(false);
    // GA is already loaded from layout, just enable tracking
    enableGoogleAnalytics();
  };

  const declineCookies = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "false");
    setVisible(false);
    disableGoogleAnalytics();
  };

  const enableGoogleAnalytics = () => {
    if (typeof window === "undefined" || !window.gtag) return;
    const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    if (!gaId) return;
    
    // Enable tracking
    window.gtag("consent", "update", {
      analytics_storage: "granted",
    });
  };

  const disableGoogleAnalytics = () => {
    if (typeof window === "undefined" || !window.gtag) return;
    const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    if (!gaId) return;
    
    // Disable tracking
    window.gtag("consent", "update", {
      analytics_storage: "denied",
    });
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] border-t border-border bg-background p-4 shadow-lg">
      <div className="container mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-center text-sm text-muted-foreground sm:text-left">
          This website uses cookies to enhance the user experience and analyze site usage.
          By clicking &quot;I understand&quot;, you agree to our use of cookies.
        </p>
        <div className="flex shrink-0 gap-2">
          <Button variant="ghost" size="sm" onClick={declineCookies}>
            Decline
          </Button>
          <Button size="sm" onClick={acceptCookies}>
            I understand
          </Button>
        </div>
      </div>
    </div>
  );
}
