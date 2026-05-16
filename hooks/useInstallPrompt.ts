"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface InstallPromptState {
  deferredPrompt: any;
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  dismissed: boolean;
}

const DISMISSED_KEY = "pwa_install_dismissed";

function getIsInstalled(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

function getIsIOS(): boolean {
  if (typeof window === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

export function useInstallPrompt() {
  const [state, setState] = useState<InstallPromptState>({
    deferredPrompt: null,
    isInstallable: false,
    isInstalled: getIsInstalled(),
    isIOS: getIsIOS(),
    dismissed: typeof window !== "undefined" && localStorage.getItem(DISMISSED_KEY) === "true",
  });
  const deferredRef = useRef<any>(null);

  useEffect(() => {
    if (state.isInstalled) return;

    const handler = (e: Event) => {
      e.preventDefault();
      deferredRef.current = e;
      setState((s) => ({
        ...s,
        deferredPrompt: e,
        isInstallable: true,
      }));
    };

    window.addEventListener("beforeinstallprompt", handler);

    const onAppInstalled = () => {
      deferredRef.current = null;
      setState((s) => ({
        ...s,
        deferredPrompt: null,
        isInstallable: false,
        isInstalled: true,
      }));
      if (typeof window !== "undefined" && (window as any).umami) {
        (window as any).umami.track?.("pwa_installed");
      }
    };

    window.addEventListener("appinstalled", onAppInstalled);

    // Detect standalone mode changes (user installs from browser menu)
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setState((s) => ({ ...s, isInstalled: true }));
      }
    };
    mediaQuery.addEventListener("change", onChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", onAppInstalled);
      mediaQuery.removeEventListener("change", onChange);
    };
  }, [state.isInstalled]);

  const showPrompt = useCallback(() => {
    const deferred = deferredRef.current;
    if (deferred) {
      deferred.prompt();
      if (typeof window !== "undefined" && (window as any).umami) {
        (window as any).umami.track?.("pwa_install_prompt_clicked");
      }
      deferred.userChoice.then((choiceResult: { outcome: string }) => {
        if (choiceResult.outcome === "accepted") {
          deferredRef.current = null;
          setState((s) => ({
            ...s,
            deferredPrompt: null,
            isInstallable: false,
            isInstalled: true,
          }));
        }
      });
    }
  }, []);

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISSED_KEY, "true");
    deferredRef.current = null;
    setState((s) => ({
      ...s,
      deferredPrompt: null,
      isInstallable: false,
      dismissed: true,
    }));
    if (typeof window !== "undefined" && (window as any).umami) {
      (window as any).umami.track?.("pwa_install_prompt_dismissed");
    }
  }, []);

  const resetDismiss = useCallback(() => {
    localStorage.removeItem(DISMISSED_KEY);
    setState((s) => ({ ...s, dismissed: false }));
  }, []);

  const canShow =
    !state.isInstalled &&
    !state.dismissed &&
    (state.isInstallable || state.isIOS);

  return {
    canShow,
    isIOS: state.isIOS,
    isInstallable: state.isInstallable,
    showPrompt,
    dismiss,
    resetDismiss,
  };
}
