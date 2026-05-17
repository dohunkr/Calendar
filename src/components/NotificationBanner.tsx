import React from 'react';
import './NotificationBanner.css';

interface NotificationBannerProps {
  onAllow: () => void;
  onDismiss: () => void;
}

export function NotificationBanner({ onAllow, onDismiss }: NotificationBannerProps) {
  return (
    <div className="notification-banner">
      <div className="banner-content">
        <span className="banner-icon">🔔</span>
        <span>일정 알림을 받으려면 권한이 필요합니다.</span>
      </div>
      <div className="banner-actions">
        <button className="btn-ghost-dark" onClick={onDismiss}>나중에</button>
        <button className="btn-primary banner-btn" onClick={onAllow}>허용</button>
      </div>
    </div>
  );
}
