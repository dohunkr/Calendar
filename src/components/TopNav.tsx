import React, { useState } from 'react';
import { format, addMonths, subMonths, setYear, getYear } from 'date-fns';
import { generateDecades } from '../lib/date-utils';
import './TopNav.css';

interface TopNavProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onAddEvent: () => void;
}

export function TopNav({ currentDate, onDateChange, onAddEvent }: TopNavProps) {
  const [showYearPicker, setShowYearPicker] = useState(false);
  const decades = generateDecades();

  const handlePrev = () => onDateChange(subMonths(currentDate, 1));
  const handleNext = () => onDateChange(addMonths(currentDate, 1));
  const handleYearChange = (year: number) => {
    onDateChange(setYear(currentDate, year));
    setShowYearPicker(false);
  };

  return (
    <header className="top-nav">
      <div className="nav-brand">
        <span>Anti</span>Gravity Calendar
      </div>
      
      <div className="nav-controls">
        <button className="btn-secondary nav-btn" onClick={handlePrev}>◀</button>
        <div className="date-display" onClick={() => setShowYearPicker(!showYearPicker)}>
          {format(currentDate, 'yyyy. MM')}
          
          {showYearPicker && (
            <div className="year-picker-dropdown">
              {decades.map(d => (
                <div key={d.label} className="decade-group">
                  <div className="decade-label">{d.label}</div>
                  <div className="years-grid">
                    {d.years.map(y => (
                      <button 
                        key={y} 
                        className={`year-btn ${y === getYear(currentDate) ? 'active' : ''}`}
                        onClick={(e) => { e.stopPropagation(); handleYearChange(y); }}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <button className="btn-secondary nav-btn" onClick={handleNext}>▶</button>
      </div>

      <button className="btn-primary" onClick={onAddEvent}>+ 일정</button>
    </header>
  );
}
