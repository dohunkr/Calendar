import React from 'react';
import { CalendarEvent } from '../lib/types';

interface EventChipProps {
  event: CalendarEvent;
  onClick: (event: CalendarEvent, e: React.MouseEvent) => void;
}

export function EventChip({ event, onClick }: EventChipProps) {
  return (
    <div
      className="event-chip"
      style={{ backgroundColor: event.color }}
      onClick={(e) => onClick(event, e)}
      title={`${event.title} - ${new Date(event.startDate).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`}
    >
      {event.title}
    </div>
  );
}
