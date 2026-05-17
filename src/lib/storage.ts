import { CalendarEvent } from './types';

const STORAGE_KEY = 'antigravity_calendar_events';

export function saveEvents(events: CalendarEvent[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  // Dispatch custom event for cross-component sync
  window.dispatchEvent(new Event('calendar-events-updated'));
}

export function loadEvents(): CalendarEvent[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}
