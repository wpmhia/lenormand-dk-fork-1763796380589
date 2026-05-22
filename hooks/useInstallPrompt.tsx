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

const DISMISSED_KEY = "pwa_install_dismissed_until";
const COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

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

function getIsMobile(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse)").matches;
}

function isOnCooldown(): boolean {
  if (typeof window === "undefined") return false;
  const until = parseInt(localStorage.getItem(DISMISSED_KEY) || "0", 10);
  return Date.now() < until;
}

export function InstallPromptProvider({ children }: { children: React.ReactNode }) {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isOnCooldownState, setIsOnCooldownState] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const deferredRef = useRef<any>(null);
  const triggerCountRef = useRef(0);

  useEffect(() => {
    setIsInstalled(getIsInstalled());
    setIsIOS(getIsIOS());
    setIsMobile(getIsMobile());
    setIsOnCooldownState(isOnCooldown());
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
    !isOnCooldownState &&
    isMobile &&
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
    localStorage.setItem(DISMISSED_KEY, String(Date.now() + COOLDOWN_MS));
    setIsOnCooldownState(true);
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
