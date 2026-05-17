import React, { useMemo } from 'react';
import { CalendarEvent } from '../lib/types';
import { getMonthCalendarGrid } from '../lib/date-utils';
import { expandRecurrences } from '../lib/recurrence';
import { EventChip } from './EventChip';
import { getKoreanHolidays } from '../lib/korean-holidays';
import { format, isSameMonth, isSameDay, getDay } from 'date-fns';
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

  // Fetch Korean holidays for current, previous, and next year to cover border months
  const holidays = useMemo(() => {
    const currentYear = currentDate.getFullYear();
    return [
      ...getKoreanHolidays(currentYear - 1),
      ...getKoreanHolidays(currentYear),
      ...getKoreanHolidays(currentYear + 1),
    ];
  }, [currentDate]);

  return (
    <div className="calendar-container">
      <div className="weekdays-header">
        {WEEKDAYS.map((day, idx) => {
          const isSundayHeader = idx === 0;
          const isSaturdayHeader = idx === 6;
          return (
            <div 
              key={day} 
              className={`weekday-cell ${isSundayHeader ? 'sunday-header' : ''} ${isSaturdayHeader ? 'saturday-header' : ''}`}
            >
              {day}
            </div>
          );
        })}
      </div>
      <div className="calendar-grid">
        {days.map(day => {
          const isToday = isSameDay(day, new Date());
          const isOtherMonth = !isSameMonth(day, currentDate);
          const dayOfWeek = getDay(day);
          
          // Check if this day is a public holiday
          const holidayMatch = holidays.find(h => isSameDay(h.date, day));
          const isHoliday = !!holidayMatch;
          const isSundayVal = dayOfWeek === 0;
          const isSaturdayVal = dayOfWeek === 6;

          const dayEvents = viewEvents
            .filter(e => isSameDay(new Date(e.startDate), day))
            .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

          // Styling classes for the day cell and text
          let dayClass = 'day-number';
          if (isToday) {
            dayClass += ' today-num';
          } else if (isHoliday || isSundayVal) {
            dayClass += ' holiday-num';
          } else if (isSaturdayVal) {
            dayClass += ' saturday-num';
          }

          return (
            <div 
              key={day.toISOString()} 
              className={`calendar-cell ${isOtherMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${isHoliday ? 'has-holiday' : ''}`}
              onClick={() => onDayClick(day)}
            >
              <div className="day-header-row">
                <div className={dayClass}>
                  {format(day, 'd')}
                </div>
                {holidayMatch && (
                  <span className="holiday-label" title={holidayMatch.name}>
                    {holidayMatch.name}
                  </span>
                )}
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

