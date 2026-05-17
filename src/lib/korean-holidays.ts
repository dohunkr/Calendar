// @ts-ignore
import solarLunar from 'solarlunar';
import { format, addDays, getDay, isSameDay } from 'date-fns';

export interface Holiday {
  date: Date;
  dateString: string; // YYYY-MM-DD
  name: string;
  isSubstitute: boolean;
}

// Fixed solar holidays in Korea
const FIXED_HOLIDAYS = [
  { month: 1, day: 1, name: '신정', hasSubstitute: false },
  { month: 3, day: 1, name: '삼일절', hasSubstitute: true },
  { month: 5, day: 5, name: '어린이날', hasSubstitute: true },
  { month: 6, day: 6, name: '현충일', hasSubstitute: false },
  { month: 8, day: 15, name: '광복절', hasSubstitute: true },
  { month: 10, day: 3, name: '개천절', hasSubstitute: true },
  { month: 10, day: 9, name: '한글날', hasSubstitute: true },
  { month: 12, day: 25, name: '성탄절', hasSubstitute: true },
];

export function getKoreanHolidays(year: number): Holiday[] {
  const holidays: Holiday[] = [];

  // 1. Add fixed solar holidays
  for (const h of FIXED_HOLIDAYS) {
    const date = new Date(year, h.month - 1, h.day);
    holidays.push({
      date,
      dateString: format(date, 'yyyy-MM-dd'),
      name: h.name,
      isSubstitute: false,
    });
  }

  // 2. Add lunar holidays: Seollal (Lunar 1/1 and day before/after), Chuseok (Lunar 8/15 and day before/after), Buddha's Birthday (Lunar 4/8)
  
  // 2a. Seollal
  const lunarNewYearSolar = solarLunar.lunar2solar(year, 1, 1);
  if (lunarNewYearSolar !== -1) {
    const mainDay = new Date(lunarNewYearSolar.cYear, lunarNewYearSolar.cMonth - 1, lunarNewYearSolar.cDay);
    const prevDay = addDays(mainDay, -1);
    const nextDay = addDays(mainDay, 1);

    holidays.push(
      { date: prevDay, dateString: format(prevDay, 'yyyy-MM-dd'), name: '설날 연휴', isSubstitute: false },
      { date: mainDay, dateString: format(mainDay, 'yyyy-MM-dd'), name: '설날', isSubstitute: false },
      { date: nextDay, dateString: format(nextDay, 'yyyy-MM-dd'), name: '설날 연휴', isSubstitute: false }
    );
  }

  // 2b. Chuseok
  const chuseokSolar = solarLunar.lunar2solar(year, 8, 15);
  if (chuseokSolar !== -1) {
    const mainDay = new Date(chuseokSolar.cYear, chuseokSolar.cMonth - 1, chuseokSolar.cDay);
    const prevDay = addDays(mainDay, -1);
    const nextDay = addDays(mainDay, 1);

    holidays.push(
      { date: prevDay, dateString: format(prevDay, 'yyyy-MM-dd'), name: '추석 연휴', isSubstitute: false },
      { date: mainDay, dateString: format(mainDay, 'yyyy-MM-dd'), name: '추석', isSubstitute: false },
      { date: nextDay, dateString: format(nextDay, 'yyyy-MM-dd'), name: '추석 연휴', isSubstitute: false }
    );
  }

  // 2c. Buddha's Birthday (석가탄신일)
  const buddhaSolar = solarLunar.lunar2solar(year, 4, 8);
  if (buddhaSolar !== -1) {
    const mainDay = new Date(buddhaSolar.cYear, buddhaSolar.cMonth - 1, buddhaSolar.cDay);
    holidays.push({
      date: mainDay,
      dateString: format(mainDay, 'yyyy-MM-dd'),
      name: '부처님오신날',
      isSubstitute: false,
    });
  }

  // Sort holidays chronologically
  holidays.sort((a, b) => a.date.getTime() - b.date.getTime());

  // Helper to check if a date is Sunday (0) or Saturday (6)
  const isWeekend = (date: Date) => {
    const day = getDay(date);
    return day === 0 || day === 6;
  };

  const isSunday = (date: Date) => getDay(date) === 0;

  // 3. Process substitute holidays (대체공휴일)
  // Korean Substitute Holiday Rules:
  // - Fixed Solar Holidays (3/1, 5/5, 8/15, 10/3, 10/9, 12/25) that support substitute: if falls on Sat/Sun, next weekday is a substitute holiday.
  // - Buddha's Birthday (음력 4/8): if falls on Sat/Sun, next weekday is substitute.
  // - Seollal & Chuseok: if any of the 3 days overlaps with Sunday or another public holiday, the next non-holiday day is substitute.
  
  const substituteHolidays: Holiday[] = [];

  // A helper function to find the first non-holiday, non-weekend weekday starting from a given date
  const findNextAvailableWeekday = (startDate: Date, existingHolidays: Holiday[]) => {
    let target = addDays(startDate, 1);
    while (true) {
      const day = getDay(target);
      const isWeekendDay = day === 0 || day === 6;
      const isHoliday = existingHolidays.some(h => isSameDay(h.date, target)) || 
                        substituteHolidays.some(h => isSameDay(h.date, target));

      if (!isWeekendDay && !isHoliday) {
        return target;
      }
      target = addDays(target, 1);
    }
  };

  // 3a. Process Solar Holidays & Buddha's Birthday
  const candidates = [
    ...FIXED_HOLIDAYS.filter(h => h.hasSubstitute).map(h => ({
      date: new Date(year, h.month - 1, h.day),
      name: h.name,
    })),
    // Buddha's Birthday also has substitute holidays (established 2023)
    ...(buddhaSolar !== -1 ? [{
      date: new Date(buddhaSolar.cYear, buddhaSolar.cMonth - 1, buddhaSolar.cDay),
      name: '부처님오신날',
    }] : [])
  ];

  for (const c of candidates) {
    if (isWeekend(c.date)) {
      // Find the next weekday that is not already a holiday
      const subDate = findNextAvailableWeekday(c.date, holidays);
      substituteHolidays.push({
        date: subDate,
        dateString: format(subDate, 'yyyy-MM-dd'),
        name: `${c.name} 대체공휴일`,
        isSubstitute: true,
      });
    }
  }

  // 3b. Process Seollal & Chuseok
  // Rule: If any of Seollal/Chuseok 3-day holidays falls on a Sunday (or overlaps with another holiday),
  // then the first non-holiday weekday following the end of the holiday becomes a substitute holiday.
  // Note: Unlike fixed solar holidays, Seollal/Chuseok only get substitute holidays if they overlap with Sunday or another holiday (not Saturday).
  
  const processThreeDayHoliday = (mainLunarSolar: any, name: string) => {
    if (mainLunarSolar === -1) return;
    const mainDay = new Date(mainLunarSolar.cYear, mainLunarSolar.cMonth - 1, mainLunarSolar.cDay);
    const prevDay = addDays(mainDay, -1);
    const nextDay = addDays(mainDay, 1);
    const threeDays = [prevDay, mainDay, nextDay];

    // Check if any of these three days is a Sunday, or if they overlap with another holiday (excluding themselves)
    const hasSundayOverlap = threeDays.some(d => isSunday(d));
    const hasOtherHolidayOverlap = threeDays.some(d => {
      return holidays.some(h => {
        // Must not be Seollal/Chuseok itself
        if (h.name.includes(name)) return false;
        return isSameDay(h.date, d);
      });
    });

    if (hasSundayOverlap || hasOtherHolidayOverlap) {
      // Find next available weekday after the last day (nextDay)
      const subDate = findNextAvailableWeekday(nextDay, holidays);
      substituteHolidays.push({
        date: subDate,
        dateString: format(subDate, 'yyyy-MM-dd'),
        name: `${name} 대체공휴일`,
        isSubstitute: true,
      });
    }
  };

  processThreeDayHoliday(lunarNewYearSolar, '설날');
  processThreeDayHoliday(chuseokSolar, '추석');

  // Combine and sort
  const allHolidays = [...holidays, ...substituteHolidays];
  allHolidays.sort((a, b) => a.date.getTime() - b.date.getTime());

  return allHolidays;
}
