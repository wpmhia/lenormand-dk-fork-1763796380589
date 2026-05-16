"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { Smartphone, X } from "lucide-react";

export function InstallPrompt() {
  const { canShow, isIOS, isInstallable, showPrompt, dismiss } = useInstallPrompt();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (canShow) {
      const timer = setTimeout(() => setVisible(true), 2000);
      return () => clearTimeout(timer);
    }
    setVisible(false);
  }, [canShow]);

  if (!visible || !canShow) return null;

  return (
    <div className="mx-auto mt-6 max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="relative rounded-2xl border border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 p-5 shadow-lg shadow-primary/5">
        <button
          onClick={() => { setVisible(false); dismiss(); }}
          className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Smartphone className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1 pr-6">
            <h3 className="text-sm font-semibold text-foreground">
              Add Lenormand.dk to your phone
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Open your readings faster from your home screen — no app store needed.
            </p>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          {isIOS ? (
            <div className="w-full text-xs text-muted-foreground">
              <p className="rounded-lg bg-muted/50 px-3 py-2">
                Tap <strong>Share</strong> <span className="text-sm">{"\u2191"}</span>, then{" "}
                <strong>Add to Home Screen</strong>.
              </p>
            </div>
          ) : (
            <>
              <Button
                size="sm"
                onClick={() => { showPrompt(); setVisible(false); }}
                className="flex-1 gap-1.5 text-xs"
              >
                <Smartphone className="h-3.5 w-3.5" />
                Install app
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => { setVisible(false); dismiss(); }}
                className="flex-none text-xs text-muted-foreground"
              >
                Maybe later
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
