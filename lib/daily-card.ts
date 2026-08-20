const DAILY_CARD_CACHE_KEY = 'daily_card_cache_v2';

function getLocalDateKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export interface DailyCardCache {
  date: string;
  cardId: number;
  drawn: boolean;
}

export function getDailyCardCache(): DailyCardCache | null {
  if (typeof window === 'undefined') return null;
  const today = getLocalDateKey();
  
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

export function setDailyCardCache(cardId: number): void {
  if (typeof window === 'undefined') return;
  const today = getLocalDateKey();
  
  try {
    localStorage.setItem(DAILY_CARD_CACHE_KEY, JSON.stringify({
      date: today,
      cardId,
      drawn: true
    }));
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
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return Math.floor((values[0] / 2 ** 32) * 36) + 1;
}
