const DAILY_CARD_CACHE_KEY = 'daily_card_cache';

export function getDailyCardId(): number {
  const today = new Date().toISOString().slice(0, 10);
  let hash = 0;
  for (let i = 0; i < today.length; i++) {
    hash = ((hash << 5) - hash) + today.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 36 + 1;
}

export function getTodayDateString(): string {
  const today = new Date();
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  };
  return today.toLocaleDateString('en-US', options);
}

export function getCachedDailyInsight(): string | null {
  if (typeof window === 'undefined') return null;
  const today = new Date().toISOString().slice(0, 10);
  try {
    const cached = localStorage.getItem(DAILY_CARD_CACHE_KEY);
    if (cached) {
      const data = JSON.parse(cached);
      if (data.date === today && data.insight) {
        return data.insight;
      }
    }
  } catch {
    // Ignore errors
  }
  return null;
}

export function setCachedDailyInsight(insight: string): void {
  if (typeof window === 'undefined') return;
  const today = new Date().toISOString().slice(0, 10);
  try {
    localStorage.setItem(DAILY_CARD_CACHE_KEY, JSON.stringify({
      date: today,
      insight: insight
    }));
  } catch {
    // Ignore errors
  }
}
