type UmamiWindow = Window & {
  umami?: {
    track?: (eventName: string, eventData?: Record<string, unknown>) => void;
  };
};

export function trackEvent(
  eventName: string,
  eventData?: Record<string, unknown>,
) {
  if (typeof window === "undefined") return;

  const umami = (window as UmamiWindow).umami;
  if (typeof umami?.track !== "function") return;

  try {
    umami.track(eventName, eventData);
  } catch {
    // Never let analytics break UX
  }
}
