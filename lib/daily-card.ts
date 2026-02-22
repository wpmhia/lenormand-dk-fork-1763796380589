const DAILY_CARD_CACHE_KEY = 'daily_card_cache_v2';

export interface DailyCardCache {
  date: string;
  cardId: number;
  insight: string;
  drawn: boolean;
}

export function getDailyCardCache(): DailyCardCache | null {
  if (typeof window === 'undefined') return null;
  const today = new Date().toISOString().slice(0, 10);
  
  try {
    const cached = localStorage.getItem(DAILY_CARD_CACHE_KEY);
    if (cached) {
      const data: DailyCardCache = JSON.parse(cached);
      if (data.date === today) {
        return data;
      }
    }
  } catch {
    // Ignore errors
  }
  return null;
}

export function setDailyCardCache(cardId: number, insight: string): void {
  if (typeof window === 'undefined') return;
  const today = new Date().toISOString().slice(0, 10);
  
  try {
    localStorage.setItem(DAILY_CARD_CACHE_KEY, JSON.stringify({
      date: today,
      cardId,
      insight,
      drawn: true
    }));
  } catch {
    // Ignore errors
  }
}

export function markCardDrawn(): void {
  if (typeof window === 'undefined') return;
  const today = new Date().toISOString().slice(0, 10);
  
  try {
    const cached = localStorage.getItem(DAILY_CARD_CACHE_KEY);
    if (cached) {
      const data: DailyCardCache = JSON.parse(cached);
      if (data.date === today) {
        data.drawn = true;
        localStorage.setItem(DAILY_CARD_CACHE_KEY, JSON.stringify(data));
      }
    }
  } catch {
    // Ignore errors
  }
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

export function drawRandomCardId(): number {
  return Math.floor(Math.random() * 36) + 1;
}
