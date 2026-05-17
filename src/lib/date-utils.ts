import { 
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, format, isSameMonth, isSameDay, 
  addMonths, subMonths, setYear, addDays, getYear
} from 'date-fns';

export function getMonthCalendarGrid(date: Date) {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  return eachDayOfInterval({ start: startDate, end: endDate });
}

export function generateDecades(MIN_YEAR = 2025, MAX_YEAR = 2100): { label: string; years: number[] }[] {
  const decades = [];
  for (let decade = 2020; decade <= 2100; decade += 10) {
    const years = [];
    for (let y = decade; y < decade + 10 && y <= MAX_YEAR; y++) {
      if (y >= MIN_YEAR) years.push(y);
    }
    if (years.length > 0) {
      decades.push({ label: `${decade}s`, years });
    }
  }
  return decades;
}
