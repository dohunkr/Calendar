import React from 'react';
import { CalendarEvent } from '../lib/types';

interface EventChipProps {
  event: CalendarEvent;
  variant?: 'single' | 'start' | 'middle' | 'end';
  onClick: (event: CalendarEvent, e: React.MouseEvent) => void;
}

export function EventChip({ event, variant = 'single', onClick }: EventChipProps) {
  let chipClass = 'event-chip';
  if (variant !== 'single') {
    chipClass += ` multi-${variant}`;
  }

  return (
    <div
      className={chipClass}
      style={{ backgroundColor: event.color }}
      onClick={(e) => onClick(event, e)}
      title={`${event.title} (${new Date(event.startDate).toLocaleDateString()} ~ ${new Date(event.endDate).toLocaleDateString()})`}
    >
      {event.title}
    </div>
  );
}
