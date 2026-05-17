import React, { useEffect, useState } from 'react';
import { playAlarmSound } from '../lib/chime';
import './AlarmOverlay.css';

export function AlarmOverlay() {
  const [params, setParams] = useState({ title: '', time: '', desc: '' });
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Parse URL search query params
    const searchParams = new URLSearchParams(window.location.search);
    const title = searchParams.get('title') || '일정 알림';
    const time = searchParams.get('time') || '';
    const desc = searchParams.get('desc') || '';
    setParams({ title, time, desc });

    // Play alarm sound loop
    const stopAlarm = playAlarmSound();

    // Clock ticker
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      stopAlarm();
      clearInterval(timer);
    };
  }, []);

  const handleDismiss = () => {
    if ((window as any).electronAPI) {
      (window as any).electronAPI.closeAlarmWindow();
    } else {
      window.close();
    }
  };

  const handleSnooze = () => {
    if ((window as any).electronAPI) {
      // reschedules 5 minutes later
      (window as any).electronAPI.snoozeAlarm(params, 5);
    } else {
      alert('Snoozed for 5 minutes!');
      window.close();
    }
  };

  const formattedCurrentTime = currentTime.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const formattedEventTime = params.time ? new Date(params.time).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }) : '';

  return (
    <div className="alarm-window-container">
      <div className="alarm-pulsing-neon-border" />
      <div className="alarm-card">
        <div className="alarm-header">
          <span className="alarm-icon">⏰</span>
          <span className="alarm-badge">일정 알람</span>
          <span className="alarm-live-clock">{formattedCurrentTime}</span>
        </div>
        
        <div className="alarm-body">
          <h1 className="alarm-title">{params.title}</h1>
          {formattedEventTime && (
            <div className="alarm-time-tag">
              시작 시간: <span>{formattedEventTime}</span>
            </div>
          )}
          {params.desc && <p className="alarm-description">{params.desc}</p>}
        </div>

        <div className="alarm-footer">
          <button className="alarm-btn-secondary" onClick={handleSnooze}>
            💤 5분 뒤 다시 알림
          </button>
          <button className="alarm-btn-primary" onClick={handleDismiss}>
            🔔 알람 끄기
          </button>
        </div>
      </div>
    </div>
  );
}
