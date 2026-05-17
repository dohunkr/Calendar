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
  onDayClick: (startDate: Date, endDate: Date) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarGrid({ currentDate, events, onEventSelect, onDayClick }: CalendarGridProps) {
  const days = getMonthCalendarGrid(currentDate);
  const start = days[0];
  const end = days[days.length - 1];
  
  // Expand recurrences for the view
  const viewEvents = expandRecurrences(events, start, end);

  // Drag selection states
  const [dragStart, setDragStart] = React.useState<Date | null>(null);
  const [dragCurrent, setDragCurrent] = React.useState<Date | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  // Fetch Korean holidays for current, previous, and next year to cover border months
  const holidays = useMemo(() => {
    const currentYear = currentDate.getFullYear();
    return [
      ...getKoreanHolidays(currentYear - 1),
      ...getKoreanHolidays(currentYear),
      ...getKoreanHolidays(currentYear + 1),
    ];
  }, [currentDate]);

  // Handle global mouseup to cancel dragging safely
  React.useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        if (dragStart && dragCurrent) {
          const earliest = dragStart < dragCurrent ? dragStart : dragCurrent;
          const latest = dragStart < dragCurrent ? dragCurrent : dragStart;
          
          const startRange = new Date(earliest);
          startRange.setHours(9, 0, 0, 0);
          const endRange = new Date(latest);
          endRange.setHours(18, 0, 0, 0);
          
          onDayClick(startRange, endRange);
        }
        setDragStart(null);
        setDragCurrent(null);
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, dragStart, dragCurrent, onDayClick]);

  const handleMouseDown = (day: Date, e: React.MouseEvent) => {
    if (e.button !== 0) return; // Left click only
    
    // Ignore clicks on event chips or buttons
    const target = e.target as HTMLElement;
    if (target.closest('.event-chip') || target.closest('button')) {
      return;
    }

    setDragStart(day);
    setDragCurrent(day);
    setIsDragging(true);
  };

  const handleMouseEnter = (day: Date) => {
    if (!isDragging) return;
    setDragCurrent(day);
  };

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

          // Drag selection check
          const isDragSelected = (() => {
            if (!isDragging || !dragStart || !dragCurrent) return false;
            const t = day.getTime();
            const d1 = dragStart.getTime();
            const d2 = dragCurrent.getTime();
            const min = Math.min(d1, d2);
            const max = Math.max(d1, d2);
            
            const compareDay = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
            const compareMin = new Date(new Date(min).getFullYear(), new Date(min).getMonth(), new Date(min).getDate()).getTime();
            const compareMax = new Date(new Date(max).getFullYear(), new Date(max).getMonth(), new Date(max).getDate()).getTime();
            return compareDay >= compareMin && compareDay <= compareMax;
          })();

          // Filter events that cover this day (either single-day or multi-day span)
          const dayEvents = viewEvents
            .filter(e => {
              const eventStart = new Date(e.startDate);
              const eventEnd = new Date(e.endDate);
              const compareDay = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
              const compareStart = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate()).getTime();
              const compareEnd = new Date(eventEnd.getFullYear(), eventEnd.getMonth(), eventEnd.getDate()).getTime();
              return compareDay >= compareStart && compareDay <= compareEnd;
            })
            // Consistent sorting ensures horizontal chip alignment across multi-day cells
            .sort((a, b) => {
              const startA = new Date(a.startDate).getTime();
              const startB = new Date(b.startDate).getTime();
              if (startA !== startB) return startA - startB;
              
              const durationA = new Date(a.endDate).getTime() - startA;
              const durationB = new Date(b.endDate).getTime() - startB;
              if (durationA !== durationB) return durationB - durationA; // longer duration first
              
              return a.id.localeCompare(b.id);
            });

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
              className={`calendar-cell ${isOtherMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${isHoliday ? 'has-holiday' : ''} ${isDragSelected ? 'drag-selected' : ''}`}
              onMouseDown={(e) => handleMouseDown(day, e)}
              onMouseEnter={() => handleMouseEnter(day)}
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
                {dayEvents.map(event => {
                  const eventStart = new Date(event.startDate);
                  const eventEnd = new Date(event.endDate);
                  const compareDay = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
                  const compareStart = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate()).getTime();
                  const compareEnd = new Date(eventEnd.getFullYear(), eventEnd.getMonth(), eventEnd.getDate()).getTime();
                  
                  let variant: 'single' | 'start' | 'middle' | 'end' = 'single';
                  if (compareStart !== compareEnd) {
                    if (compareDay === compareStart) {
                      variant = 'start';
                    } else if (compareDay === compareEnd) {
                      variant = 'end';
                    } else if (compareDay > compareStart && compareDay < compareEnd) {
                      variant = 'middle';
                    }
                  }

                  return (
                    <EventChip 
                      key={event.id} 
                      event={event} 
                      variant={variant}
                      onClick={(e, evt) => {
                        evt.stopPropagation();
                        // Find original event for editing
                        const originalId = event.id.split('_')[0];
                        const originalEvent = events.find(ev => ev.id === originalId) || event;
                        onEventSelect(originalEvent);
                      }} 
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

