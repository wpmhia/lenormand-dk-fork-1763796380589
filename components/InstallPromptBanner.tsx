"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { Smartphone, X } from "lucide-react";

export function InstallPromptBanner() {
  const { isVisible, isIOS, install, dismiss } = useInstallPrompt();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => setMounted(true), 100);
      return () => clearTimeout(timer);
    }
    setMounted(false);
  }, [isVisible]);

  if (!mounted && !isVisible) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-400 ${
        mounted && isVisible
          ? "translate-y-0 opacity-100"
          : "translate-y-full opacity-0 pointer-events-none"
      }`}
    >
      {/* Safe area padding for mobile */}
      <div className="bg-gradient-to-t from-background via-background to-transparent px-0 pt-4" style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom, 0px))" }}>
        <div className="mx-auto max-w-md px-4">
          <div className="relative rounded-2xl border border-primary/20 bg-card shadow-xl shadow-primary/10">
            <button
              onClick={dismiss}
              className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-3 p-4 pr-10">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-foreground">
                  Add Lenormand.dk to your phone
                </h3>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  Open your readings faster from your home screen - no app store needed.
                </p>
              </div>
            </div>

            <div className="px-4 pb-4">
              {isIOS ? (
                <div className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                  Tap <strong>Share</strong> <span className="text-sm">{"\u2191"}</span>, then{" "}
                  <strong>Add to Home Screen</strong>.
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button size="sm" onClick={install} className="flex-1 gap-1.5 text-xs">
                    <Smartphone className="h-3.5 w-3.5" />
                    Install app
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={dismiss}
                    className="flex-none text-xs text-muted-foreground"
                  >
                    Maybe later
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
