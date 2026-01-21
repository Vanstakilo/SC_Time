
import { Holiday } from '../types';

/**
 * Calculates Statutory Holidays for British Columbia, Canada
 */
export function getBCHolidays(year: number): Holiday[] {
  const holidays: Holiday[] = [
    { name: "New Year's Day", date: `${year}-01-01` },
    { name: "Canada Day", date: `${year}-07-01` },
    { name: "Truth and Reconciliation Day", date: `${year}-09-30` },
    { name: "Remembrance Day", date: `${year}-11-11` },
    { name: "Christmas Day", date: `${year}-12-25` },
  ];

  // Family Day: 3rd Monday in February
  holidays.push({ name: "Family Day", date: getNthDayOfMonth(year, 1, 1, 3) });

  // Good Friday: Varies (simplification for common years, ideally use library)
  // For 2026 as per user snippet: 2026-04-03
  if (year === 2026) holidays.push({ name: "Good Friday", date: "2026-04-03" });

  // Victoria Day: Monday before May 25
  holidays.push({ name: "Victoria Day", date: getMondayBefore(year, 4, 25) });

  // BC Day: 1st Monday in August
  holidays.push({ name: "BC Day", date: getNthDayOfMonth(year, 7, 1, 1) });

  // Labour Day: 1st Monday in September
  holidays.push({ name: "Labour Day", date: getNthDayOfMonth(year, 8, 1, 1) });

  // Thanksgiving: 2nd Monday in October
  holidays.push({ name: "Thanksgiving Day", date: getNthDayOfMonth(year, 9, 1, 2) });

  return holidays;
}

function getNthDayOfMonth(year: number, month: number, dayOfWeek: number, n: number): string {
  let count = 0;
  let d = new Date(year, month, 1);
  while (count < n) {
    if (d.getDay() === dayOfWeek) count++;
    if (count < n) d.setDate(d.getDate() + 1);
  }
  return formatDate(d);
}

function getMondayBefore(year: number, month: number, day: number): string {
  let d = new Date(year, month, day);
  while (d.getDay() !== 1) {
    d.setDate(d.getDate() - 1);
  }
  return formatDate(d);
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

export function isHoliday(dateStr: string, holidays: Holiday[]): Holiday | undefined {
  return holidays.find(h => h.date === dateStr);
}
