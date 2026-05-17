import React, { useState } from 'react';
import { format, addMonths, subMonths, setYear, getYear } from 'date-fns';
import { generateDecades } from '../lib/date-utils';
import './TopNav.css';

interface TopNavProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onAddEvent: () => void;
  userEmail: string | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export function TopNav({ 
  currentDate, 
  onDateChange, 
  onAddEvent,
  userEmail,
  onOpenAuth,
  onLogout,
  isDarkMode,
  onToggleDarkMode
}: TopNavProps) {
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
        <span>Dohun</span>Calender
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

      <div className="nav-actions">
        <button 
          className="btn-secondary theme-toggle-btn" 
          onClick={onToggleDarkMode} 
          title={isDarkMode ? '라이트 모드' : '다크 모드'}
          aria-label="테마 전환"
        >
          {isDarkMode ? '☀️' : '🌙'}
        </button>
        {userEmail ? (
          <div className="user-badge">
            <span className="user-email">☁️ {userEmail}</span>
            <button className="btn-secondary logout-btn" onClick={onLogout}>로그아웃</button>
          </div>
        ) : (
          <button className="btn-secondary login-btn" onClick={onOpenAuth}>☁️ 클라우드 로그인</button>
        )}
        <button className="btn-primary" onClick={onAddEvent}>+ 일정</button>
      </div>
    </header>
  );
}
