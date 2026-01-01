export function pipToDeadline(pip: number): { text: string; date: Date } {
  const today = new Date();
  const days = Math.min(pip > 14 ? 14 : pip, 14);

  const deadline = new Date(today);
  deadline.setDate(deadline.getDate() + days);

  const nextThursday = getNextDay(deadline, 4);
  const nextFriday = getNextDay(deadline, 5);

  const targetDay =
    nextThursday.getTime() <= deadline.getTime() ? nextFriday : nextThursday;

  const dayName = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ][targetDay.getDay()];

  return {
    text: `by ${dayName} evening`,
    date: targetDay,
  };
}

function getNextDay(from: Date, dayOfWeek: number): Date {
  const result = new Date(from);
  const current = result.getDay();
  const distance = (dayOfWeek + 7 - current) % 7 || 7;
  result.setDate(result.getDate() + distance);
  return result;
}

export function formatDeadlineDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    month: "short",
    day: "numeric",
  };
  return date.toLocaleDateString("en-US", options);
}
