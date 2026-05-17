import { addDays, addWeeks, addMonths, addYears, isBefore, isEqual, isAfter } from 'date-fns';
import { CalendarEvent } from './types';

export function expandRecurrences(events: CalendarEvent[], viewStart: Date, viewEnd: Date): CalendarEvent[] {
  const expanded: CalendarEvent[] = [];

  events.forEach(event => {
    if (!event.recurrence) {
      const start = new Date(event.startDate);
      if (start >= viewStart && start <= viewEnd) {
        expanded.push(event);
      }
      return;
    }

    let currentStart = new Date(event.startDate);
    if (event.recurrence === 'weekday') {
      while (currentStart.getDay() === 0 || currentStart.getDay() === 6) {
        currentStart = addDays(currentStart, 1);
      }
    }
    const duration = new Date(event.endDate).getTime() - new Date(event.startDate).getTime();
    const endDateLimit = event.recurrenceEndDate ? new Date(event.recurrenceEndDate) : new Date(2100, 11, 31);
    const finalLimit = isBefore(endDateLimit, viewEnd) ? endDateLimit : viewEnd;

    while (currentStart <= finalLimit) {
      if (currentStart >= viewStart) {
        expanded.push({
          ...event,
          startDate: currentStart.toISOString(),
          endDate: new Date(currentStart.getTime() + duration).toISOString(),
          // Use original ID as prefix for tracking expanded items
          id: `${event.id}_${currentStart.getTime()}`
        });
      }

      switch (event.recurrence) {
        case 'daily':
          currentStart = addDays(currentStart, 1);
          break;
        case 'weekday':
          currentStart = addDays(currentStart, 1);
          while (currentStart.getDay() === 0 || currentStart.getDay() === 6) {
            currentStart = addDays(currentStart, 1);
          }
          break;
        case 'weekly':
          currentStart = addWeeks(currentStart, 1);
          break;
        case 'monthly':
          currentStart = addMonths(currentStart, 1);
          break;
        case 'yearly':
          currentStart = addYears(currentStart, 1);
          break;
        default:
          currentStart = addDays(currentStart, 1);
      }
    }
  });

  return expanded;
}
