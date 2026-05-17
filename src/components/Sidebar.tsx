import React from 'react';
import { CalendarEvent } from '../lib/types';
import { AIChatInput } from './AIChatInput';
import { format } from 'date-fns';
import './Sidebar.css';

interface SidebarProps {
  events: CalendarEvent[];
  currentDate: Date;
  onEventSelect: (event: CalendarEvent) => void;
  onAIParse: (userInput: string) => Promise<void>;
  isAILoading: boolean;
}

export function Sidebar({ events, currentDate, onEventSelect, onAIParse, isAILoading }: SidebarProps) {
  // Get upcoming events for this month
  const thisMonthEvents = events
    .filter(e => {
      const d = new Date(e.startDate);
      return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
    })
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 5);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Mini Calendar Area</h2>
        {/* Can implement mini calendar later if needed */}
      </div>

      <AIChatInput onSend={onAIParse} isLoading={isAILoading} />

      <div className="sidebar-events">
        <h3 className="section-title">이번 달 주요 일정</h3>
        {thisMonthEvents.length === 0 && <div className="no-events">일정이 없습니다.</div>}
        {thisMonthEvents.map(event => (
          <div key={event.id} className="event-list-item" onClick={() => onEventSelect(event)}>
            <div className="event-title">{event.title}</div>
            <div className="event-time">
              {format(new Date(event.startDate), 'MM.dd HH:mm')}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
