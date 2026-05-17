import React from 'react';
import { SuggestedSlot } from '../lib/types';
import { format } from 'date-fns';
import './SuggestedSlotCard.css';

interface SuggestedSlotCardProps {
  slot: SuggestedSlot;
  index: number;
  onAccept: (slot: SuggestedSlot) => void;
}

export function SuggestedSlotCard({ slot, index, onAccept }: SuggestedSlotCardProps) {
  return (
    <div className="suggested-slot-card">
      <div className="slot-header">
        <span className="slot-badge">💡 추천 {index + 1}</span>
      </div>
      <div className="slot-title">{slot.title}</div>
      <div className="slot-time">
        {format(new Date(slot.startDate), 'MM.dd(E) HH:mm')} – {format(new Date(slot.endDate), 'HH:mm')}
      </div>
      <div className="slot-reason">"{slot.reason}"</div>
      <div className="slot-actions">
        <button className="btn-primary slot-btn" onClick={() => onAccept(slot)}>
          이걸로 잡기
        </button>
      </div>
    </div>
  );
}
