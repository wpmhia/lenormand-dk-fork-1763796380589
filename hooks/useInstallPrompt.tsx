"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

interface InstallPromptContextValue {
  showInstallPrompt: () => void;
  canShow: boolean;
  isIOS: boolean;
  isInstallable: boolean;
  isVisible: boolean;
  dismiss: () => void;
  install: () => void;
}

const InstallPromptContext = createContext<InstallPromptContextValue>({
  showInstallPrompt: () => {},
  canShow: false,
  isIOS: false,
  isInstallable: false,
  isVisible: false,
  dismiss: () => {},
  install: () => {},
});

export function useInstallPrompt() {
  return useContext(InstallPromptContext);
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

export function InstallPromptProvider({ children }: { children: React.ReactNode }) {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const deferredRef = useRef<any>(null);
  const triggerCountRef = useRef(0);

  useEffect(() => {
    setIsInstalled(getIsInstalled());
    setIsIOS(getIsIOS());
    setDismissed(localStorage.getItem(DISMISSED_KEY) === "true");
  }, []);

  useEffect(() => {
    if (isInstalled) return;

    const handler = (e: Event) => {
      e.preventDefault();
      deferredRef.current = e;
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    const onAppInstalled = () => {
      deferredRef.current = null;
      setIsInstallable(false);
      setIsInstalled(true);
      setIsVisible(false);
      if ((window as any).umami) {
        (window as any).umami.track?.("pwa_installed");
      }
    };

    window.addEventListener("appinstalled", onAppInstalled);

    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) setIsInstalled(true);
    };
    mediaQuery.addEventListener("change", onChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", onAppInstalled);
      mediaQuery.removeEventListener("change", onChange);
    };
  }, [isInstalled]);

  const canShow =
    !isInstalled &&
    !dismissed &&
    (isInstallable || isIOS);

  const showInstallPrompt = useCallback(() => {
    if (!canShow) return false;
    triggerCountRef.current += 1;
    setIsVisible(true);
    if ((window as any).umami) {
      (window as any).umami.track?.("pwa_install_prompt_shown");
    }
    return true;
  }, [canShow]);

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISSED_KEY, "true");
    setDismissed(true);
    setIsVisible(false);
    deferredRef.current = null;
    if ((window as any).umami) {
      (window as any).umami.track?.("pwa_install_prompt_dismissed");
    }
  }, []);

  const install = useCallback(() => {
    const deferred = deferredRef.current;
    if (deferred) {
      deferred.prompt();
      if ((window as any).umami) {
        (window as any).umami.track?.("pwa_install_prompt_clicked");
      }
      deferred.userChoice.then((choiceResult: { outcome: string }) => {
        if (choiceResult.outcome === "accepted") {
          deferredRef.current = null;
          setIsInstallable(false);
          setIsInstalled(true);
          setIsVisible(false);
        }
      });
    }
  }, []);

  return (
    <InstallPromptContext.Provider value={{ showInstallPrompt, canShow, isIOS, isInstallable, isVisible, dismiss, install }}>
      {children}
    </InstallPromptContext.Provider>
  );
}
