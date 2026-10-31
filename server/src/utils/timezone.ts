import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { subDays, addDays } from 'date-fns';

export function isValidTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function getTodayInTimezone(tz: string = 'UTC'): string {
  const safeTz = isValidTimezone(tz) ? tz : 'UTC';
  return formatInTimeZone(new Date(), safeTz, 'yyyy-MM-dd');
}

export function getYesterdayInTimezone(tz: string = 'UTC'): string {
  const safeTz = isValidTimezone(tz) ? tz : 'UTC';
  const now = new Date();
  const yesterday = subDays(now, 1);
  return formatInTimeZone(yesterday, safeTz, 'yyyy-MM-dd');
}

export function getTomorrowInTimezone(tz: string = 'UTC'): string {
  const safeTz = isValidTimezone(tz) ? tz : 'UTC';
  const now = new Date();
  const tomorrow = addDays(now, 1);
  return formatInTimeZone(tomorrow, safeTz, 'yyyy-MM-dd');
}

export function getSecondsUntilMidnight(tz: string = 'UTC'): number {
  const safeTz = isValidTimezone(tz) ? tz : 'UTC';
  const now = new Date();
  
  // Format current time components in user's timezone
  const hours = parseInt(formatInTimeZone(now, safeTz, 'H'), 10);
  const minutes = parseInt(formatInTimeZone(now, safeTz, 'm'), 10);
  const seconds = parseInt(formatInTimeZone(now, safeTz, 's'), 10);

  const secondsPassedToday = hours * 3600 + minutes * 60 + seconds;
  const secondsInDay = 86400;
  return Math.max(0, secondsInDay - secondsPassedToday);
}

export function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

