export interface CalendarEvent {
  id: string;                  // crypto.randomUUID()
  title: string;
  startDate: string;           // ISO 8601
  endDate: string;
  isAllDay: boolean;
  color: string;               // hex — 기본값 #cc785c (coral)
  description?: string;
  recurrence?: 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
  recurrenceEndDate?: string | null;
  notifyMinutesBefore: number; // 기본 15
  createdAt: string;
}

export interface ParsedEvent {
  title: string;
  startDate: string;
  endDate: string;
  isAllDay: boolean;
  recurrence: string | null;
  recurrenceEndDate: string | null;
  description: string;
  color: string;
}

export interface SuggestedSlot {
  startDate: string;
  endDate: string;
  title: string;
  reason: string;
}
