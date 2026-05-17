import React, { useState, useEffect } from 'react';
import { CalendarEvent } from '../lib/types';
import { format } from 'date-fns';
import './EventModal.css';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Partial<CalendarEvent>) => void;
  onDelete?: (eventId: string) => void;
  initialData?: Partial<CalendarEvent> | null;
}

export function EventModal({ isOpen, onClose, onSave, onDelete, initialData }: EventModalProps) {
  const [formData, setFormData] = useState<Partial<CalendarEvent>>({
    title: '',
    startDate: '',
    endDate: '',
    isAllDay: false,
    color: '#cc785c',
    description: '',
    recurrence: null,
    recurrenceEndDate: '',
    notifyMinutesBefore: 15,
  });

  useEffect(() => {
    if (initialData && isOpen) {
      setFormData({
        ...initialData,
        startDate: initialData.startDate ? format(new Date(initialData.startDate), "yyyy-MM-dd'T'HH:mm") : '',
        endDate: initialData.endDate ? format(new Date(initialData.endDate), "yyyy-MM-dd'T'HH:mm") : '',
      });
    } else if (isOpen) {
      const now = new Date();
      now.setMinutes(0, 0, 0);
      const start = format(now, "yyyy-MM-dd'T'HH:mm");
      now.setHours(now.getHours() + 1);
      const end = format(now, "yyyy-MM-dd'T'HH:mm");
      
      setFormData({
        title: '',
        startDate: start,
        endDate: end,
        isAllDay: false,
        color: '#cc785c',
        description: '',
        recurrence: null,
        recurrenceEndDate: '',
        notifyMinutesBefore: 15,
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">{initialData?.id ? '일정 수정' : '새 일정'}</h2>
        
        <div className="form-field">
          <label className="form-label">제목</label>
          <input
            className="form-input"
            name="title"
            value={formData.title || ''}
            onChange={handleChange}
            placeholder="이벤트 제목"
            autoFocus
          />
        </div>

        <div className="form-row">
          <div className="form-field half">
            <label className="form-label">시작</label>
            <input
              className="form-input"
              type="datetime-local"
              name="startDate"
              value={formData.startDate || ''}
              onChange={handleChange}
            />
          </div>
          <div className="form-field half">
            <label className="form-label">종료</label>
            <input
              className="form-input"
              type="datetime-local"
              name="endDate"
              value={formData.endDate || ''}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-field flex-row">
          <input
            type="checkbox"
            id="isAllDay"
            name="isAllDay"
            checked={formData.isAllDay || false}
            onChange={handleChange}
          />
          <label htmlFor="isAllDay" className="form-label inline-label">하루 종일</label>
        </div>

        <div className="form-row">
          <div className="form-field half">
            <label className="form-label">반복</label>
            <select className="form-input" name="recurrence" value={formData.recurrence || ''} onChange={handleChange}>
              <option value="">반복 안함</option>
              <option value="daily">매일</option>
              <option value="weekday">매주 평일 (월~금)</option>
              <option value="weekly">매주</option>
              <option value="monthly">매월</option>
              <option value="yearly">매년</option>
            </select>
          </div>
          {formData.recurrence && (
            <div className="form-field half">
              <label className="form-label">반복 종료일</label>
              <input
                className="form-input"
                type="date"
                name="recurrenceEndDate"
                value={formData.recurrenceEndDate || ''}
                onChange={handleChange}
              />
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-field half">
            <label className="form-label">색상</label>
            <input
              className="form-input color-picker"
              type="color"
              name="color"
              value={formData.color || '#cc785c'}
              onChange={handleChange}
            />
          </div>
          <div className="form-field half">
            <label className="form-label">알림 (분 전)</label>
            <input
              className="form-input"
              type="number"
              name="notifyMinutesBefore"
              value={formData.notifyMinutesBefore || 15}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-field">
          <label className="form-label">설명</label>
          <textarea
            className="form-input textarea"
            name="description"
            value={formData.description || ''}
            onChange={handleChange}
            placeholder="상세 설명"
          />
        </div>

        <div className="modal-actions">
          {initialData?.id && onDelete && (
            <button className="btn-secondary delete-btn" onClick={() => onDelete(initialData.id!)}>삭제</button>
          )}
          <div className="action-right">
            <button className="btn-secondary" onClick={onClose}>취소</button>
            <button className="btn-primary" onClick={handleSave} disabled={!formData.title}>저장</button>
          </div>
        </div>
      </div>
    </div>
  );
}
