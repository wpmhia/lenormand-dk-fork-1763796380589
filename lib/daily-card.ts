const DAILY_CARD_KEY = 'daily_card_viewed';

export function getDailyCardId(): number {
  const today = new Date().toISOString().slice(0, 10);
  let hash = 0;
  for (let i = 0; i < today.length; i++) {
    hash = ((hash << 5) - hash) + today.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 36 + 1;
}

export function hasViewedDailyCard(): boolean {
  if (typeof window === 'undefined') return false;
  const today = new Date().toISOString().slice(0, 10);
  return localStorage.getItem(DAILY_CARD_KEY) === today;
}

export function markDailyCardViewed(): void {
  if (typeof window === 'undefined') return;
  const today = new Date().toISOString().slice(0, 10);
  localStorage.setItem(DAILY_CARD_KEY, today);
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
