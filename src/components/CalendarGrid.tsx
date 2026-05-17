import React from 'react';
import { CalendarEvent } from '../lib/types';
import { getMonthCalendarGrid } from '../lib/date-utils';
import { expandRecurrences } from '../lib/recurrence';
import { EventChip } from './EventChip';
import { format, isSameMonth, isSameDay } from 'date-fns';
import './CalendarGrid.css';

interface CalendarGridProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventSelect: (event: CalendarEvent) => void;
  onDayClick: (date: Date) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarGrid({ currentDate, events, onEventSelect, onDayClick }: CalendarGridProps) {
  const days = getMonthCalendarGrid(currentDate);
  const start = days[0];
  const end = days[days.length - 1];
  
  // Expand recurrences for the view
  const viewEvents = expandRecurrences(events, start, end);

  return (
    <div className="calendar-container">
      <div className="weekdays-header">
        {WEEKDAYS.map(day => (
          <div key={day} className="weekday-cell">{day}</div>
        ))}
      </div>
      <div className="calendar-grid">
        {days.map(day => {
          const isToday = isSameDay(day, new Date());
          const isOtherMonth = !isSameMonth(day, currentDate);
          
          const dayEvents = viewEvents
            .filter(e => isSameDay(new Date(e.startDate), day))
            .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

          return (
            <div 
              key={day.toISOString()} 
              className={`calendar-cell ${isOtherMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}`}
              onClick={() => onDayClick(day)}
            >
              <div className={`day-number ${isToday ? 'today-num' : ''}`}>
                {format(day, 'd')}
              </div>
              <div className="events-container">
                {dayEvents.map(event => (
                  <EventChip 
                    key={event.id} 
                    event={event} 
                    onClick={(e, evt) => {
                      evt.stopPropagation();
                      // Find original event for editing
                      const originalId = event.id.split('_')[0];
                      const originalEvent = events.find(ev => ev.id === originalId) || event;
                      onEventSelect(originalEvent);
                    }} 
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
