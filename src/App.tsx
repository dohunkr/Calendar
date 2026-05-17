import React, { useState, useEffect } from 'react';
import { TopNav } from './components/TopNav';
import { Sidebar } from './components/Sidebar';
import { CalendarGrid } from './components/CalendarGrid';
import { EventModal } from './components/EventModal';
import { SuggestedSlotCard } from './components/SuggestedSlotCard';
import { NotificationBanner } from './components/NotificationBanner';
import { CalendarEvent, SuggestedSlot } from './lib/types';
import { loadEvents, saveEvents } from './lib/storage';
import { parseEventFromNaturalLanguage, findAndScheduleFreeSlot } from './lib/nim-api';
import { requestNotificationPermission, scheduleNotification, cancelNotification, initNotifications } from './lib/notifications';
import { addMonths } from 'date-fns';

function App() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showBanner, setShowBanner] = useState(false);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Partial<CalendarEvent> | null>(null);
  
  // AI states
  const [isAILoading, setIsAILoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestedSlot[]>([]);

  useEffect(() => {
    setEvents(loadEvents());
    
    // Check notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      setShowBanner(true);
    } else {
      initNotifications();
    }
  }, []);

  const handleAllowNotifications = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      initNotifications();
    }
    setShowBanner(false);
  };

  const handleSaveEvent = (partialEvent: Partial<CalendarEvent>) => {
    let updatedEvents: CalendarEvent[];
    
    if (partialEvent.id) {
      // Update
      const prevEvent = events.find(e => e.id === partialEvent.id);
      if (prevEvent) cancelNotification(prevEvent.id);
      
      updatedEvents = events.map(e => e.id === partialEvent.id ? { ...e, ...partialEvent } as CalendarEvent : e);
    } else {
      // Create
      const newEvent: CalendarEvent = {
        ...(partialEvent as any),
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      updatedEvents = [...events, newEvent];
      scheduleNotification(newEvent, newEvent.notifyMinutesBefore);
    }
    
    setEvents(updatedEvents);
    saveEvents(updatedEvents);
    setIsModalOpen(false);
    setEditingEvent(null);
  };

  const handleDeleteEvent = (eventId: string) => {
    cancelNotification(eventId);
    const updatedEvents = events.filter(e => e.id !== eventId);
    setEvents(updatedEvents);
    saveEvents(updatedEvents);
    setIsModalOpen(false);
    setEditingEvent(null);
  };

  const handleAIParse = async (userInput: string) => {
    setIsAILoading(true);
    setSuggestions([]);

    try {
      // Check if it's a request to "find time"
      if (userInput.includes('찾아') || userInput.includes('추천') || userInput.includes('빈 시간')) {
        const searchRange = {
          start: new Date(),
          end: addMonths(new Date(), 1)
        };
        const slots = await findAndScheduleFreeSlot(userInput, events, searchRange);
        setSuggestions(slots);
        setIsAILoading(false);
        return;
      }

      // Otherwise, parse as normal event
      const parsed = await parseEventFromNaturalLanguage(userInput, new Date());
      setIsAILoading(false);

      if (parsed) {
        // Open modal with parsed data for confirmation
        setEditingEvent({
          ...parsed,
          notifyMinutesBefore: 15
        });
        setIsModalOpen(true);
      } else {
        alert("일정을 이해하지 못했습니다. 더 구체적으로 적어주세요.");
      }
    } catch (error: any) {
      setIsAILoading(false);
      console.error("AI 파싱 중 오류 발생:", error);
      alert("AI 서비스 통신 중 오류가 발생했습니다. 인터넷 연결 또는 클라우드 설정을 확인하시고 새로고침(F5) 후 다시 시도해 주세요.");
    }
  };

  const handleAcceptSuggestion = (slot: SuggestedSlot) => {
    setEditingEvent({
      title: slot.title,
      startDate: slot.startDate,
      endDate: slot.endDate,
      isAllDay: false,
      color: '#cc785c',
      notifyMinutesBefore: 15
    });
    setIsModalOpen(true);
    setSuggestions(prev => prev.filter(s => s !== slot));
  };

  return (
    <div className="app-container">
      {showBanner && (
        <NotificationBanner 
          onAllow={handleAllowNotifications} 
          onDismiss={() => setShowBanner(false)} 
        />
      )}
      
      <TopNav 
        currentDate={currentDate} 
        onDateChange={setCurrentDate} 
        onAddEvent={() => { setEditingEvent(null); setIsModalOpen(true); }}
      />
      
      <div className="main-content">
        <Sidebar 
          events={events} 
          currentDate={currentDate} 
          onEventSelect={(e) => { setEditingEvent(e); setIsModalOpen(true); }}
          onAIParse={handleAIParse}
          isAILoading={isAILoading}
        />
        
        {/* Render suggestions if any */}
        {suggestions.length > 0 && (
          <div style={{ position: 'absolute', left: 280, top: 80, zIndex: 10 }}>
            {suggestions.map((slot, idx) => (
              <SuggestedSlotCard 
                key={idx} 
                slot={slot} 
                index={idx} 
                onAccept={handleAcceptSuggestion} 
              />
            ))}
          </div>
        )}

        <CalendarGrid 
          currentDate={currentDate} 
          events={events} 
          onEventSelect={(e) => { setEditingEvent(e); setIsModalOpen(true); }}
          onDayClick={(startDate, endDate) => { 
            const s = new Date(startDate);
            const e = new Date(endDate);
            
            // If it's a single day, default to a 1-hour appointment block (9 AM to 10 AM)
            if (s.toDateString() === e.toDateString()) {
              s.setHours(9, 0, 0, 0);
              e.setHours(10, 0, 0, 0);
            }
            
            setEditingEvent({ 
              startDate: s.toISOString(),
              endDate: e.toISOString(),
              isAllDay: s.toDateString() !== e.toDateString(), // Multi-day drag defaults to all-day!
              color: '#cc785c',
              notifyMinutesBefore: 15
            }); 
            setIsModalOpen(true); 
          }}
        />
      </div>

      <EventModal 
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingEvent(null); }}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        initialData={editingEvent}
      />
    </div>
  );
}

export default App;
