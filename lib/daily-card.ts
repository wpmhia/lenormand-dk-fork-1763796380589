const DAILY_CARD_CACHE_KEY = 'daily_card_cache';
const USER_ID_KEY = 'daily_card_user_id';

function getUserId(): string {
  if (typeof window === 'undefined') return 'default';
  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = Math.random().toString(36).substring(2, 15);
    localStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
}

export function getDailyCardId(): number {
  const today = new Date().toISOString().slice(0, 10);
  const userId = getUserId();
  const combined = `${userId}-${today}`;
  
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = ((hash << 5) - hash) + combined.charCodeAt(i);
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

export function getCachedDailyInsight(): { cardId: number; insight: string } | null {
  if (typeof window === 'undefined') return null;
  const today = new Date().toISOString().slice(0, 10);
  const userId = getUserId();
  try {
    const cached = localStorage.getItem(DAILY_CARD_CACHE_KEY);
    if (cached) {
      const data = JSON.parse(cached);
      if (data.date === today && data.userId === userId && data.insight) {
        return { cardId: data.cardId, insight: data.insight };
      }
    }
  } catch {
    // Ignore errors
  }
  return null;
}

export function setCachedDailyInsight(cardId: number, insight: string): void {
  if (typeof window === 'undefined') return;
  const today = new Date().toISOString().slice(0, 10);
  const userId = getUserId();
  try {
    localStorage.setItem(DAILY_CARD_CACHE_KEY, JSON.stringify({
      date: today,
      userId: userId,
      cardId: cardId,
      insight: insight
    }));
  } catch {
    // Ignore errors
  }
}
