import { CalendarEvent } from './types';
import { loadEvents } from './storage';

const notificationTimers = new Map<string, number>();

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

export function scheduleNotification(event: CalendarEvent, minutesBefore: number = 15): void {
  const notifyAt = new Date(event.startDate).getTime() - minutesBefore * 60 * 1000;
  const delay = notifyAt - Date.now();
  
  if (delay < 0) return; // Already passed
  
  const timerId = window.setTimeout(() => {
    if (Notification.permission === 'granted') {
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
  const timerId = notificationTimers.get(eventId);
  if (timerId) {
    clearTimeout(timerId);
    notificationTimers.delete(eventId);
  }
}

export async function initNotifications(): Promise<void> {
  if (Notification.permission !== 'granted') return;
  const events = loadEvents();
  const now = new Date();
  
  events
    .filter(e => new Date(e.startDate) > now)
    .forEach(e => scheduleNotification(e, e.notifyMinutesBefore ?? 15));
}
