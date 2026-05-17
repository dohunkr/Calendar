import { CalendarEvent } from './types';
import { loadEvents } from './storage';
import { expandRecurrences } from './recurrence';

const notificationTimers = new Map<string, any>();

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

export function scheduleNotification(event: CalendarEvent, minutesBefore: number = 15): void {
  // Clear any existing timers for this event/occurrence first to prevent leaks
  cancelNotification(event.id);
  
  const notifyAt = new Date(event.startDate).getTime() - minutesBefore * 60 * 1000;
  const delay = notifyAt - Date.now();
  
  if (delay < 0) return; // Already passed
  
  const timerId = window.setTimeout(() => {
    const api = (window as any).electronAPI;
    if (api && api.showAlarm) {
      // Trigger custom premium desktop alarm
      api.showAlarm({
        title: event.title,
        time: event.startDate,
        description: event.description || ''
      });
    } else if (Notification.permission === 'granted') {
      // Fallback for standard browser
      new Notification(`⏰ ${event.title}`, {
        body: `${minutesBefore}분 후 시작 — ${new Date(event.startDate).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`,
        icon: '/icon-192.png',
        tag: event.id,
        requireInteraction: false,
      });
    }
  }, delay);

  notificationTimers.set(event.id, timerId);
}

export function cancelNotification(eventId: string): void {
  // 1. Clear main timer
  const timerId = notificationTimers.get(eventId);
  if (timerId) {
    clearTimeout(timerId);
    notificationTimers.delete(eventId);
  }
  
  // 2. Clear any expanded recurrence occurrence timers (their keys start with parentId + '_')
  notificationTimers.forEach((value, key) => {
    if (key.startsWith(`${eventId}_`)) {
      clearTimeout(value);
      notificationTimers.delete(key);
    }
  });
}

export async function initNotifications(): Promise<void> {
  const isElectron = !!(window as any).electronAPI;
  if (!isElectron && Notification.permission !== 'granted') return;

  const events = loadEvents();
  const now = new Date();
  
  // Clear all existing timers to perform a clean rescheduling
  notificationTimers.forEach((timerId) => clearTimeout(timerId));
  notificationTimers.clear();
  
  // 1. Filter out all non-recurring future events (no limit, so even events in 6 months get scheduled)
  const nonRecurring = events.filter(
    e => !e.recurrence && new Date(e.startDate).getTime() - (e.notifyMinutesBefore ?? 15) * 60 * 1000 > now.getTime()
  );
  
  // 2. Filter recurring events and expand them for the next 30 days
  const recurring = events.filter(e => !!e.recurrence);
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const expandedRecurring = expandRecurrences(recurring, now, thirtyDaysLater);
  
  // Combine both lists
  const allEventsToSchedule = [...nonRecurring, ...expandedRecurring];
  
  // Schedule them all!
  allEventsToSchedule.forEach(e => {
    scheduleNotification(e, e.notifyMinutesBefore ?? 15);
  });
}

