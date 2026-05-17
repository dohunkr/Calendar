import { CalendarEvent } from './types';
import { supabase, isSupabaseConfigured } from './supabase-client';

const STORAGE_KEY = 'antigravity_calendar_events';

// Save local fallback
export function saveLocalEvents(events: CalendarEvent[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  // Dispatch custom event for cross-component reactive sync
  window.dispatchEvent(new Event('calendar-events-updated'));
}

// Load local fallback
export function loadLocalEvents(): CalendarEvent[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

// Sync local events to Supabase cloud (run on login)
export async function syncLocalEventsToCloud(): Promise<void> {
  if (!isSupabaseConfigured) return;
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const localEvents = loadLocalEvents();
    if (localEvents.length === 0) return;

    console.log('[Cloud Sync] Syncing local events to cloud database...');
    
    // Insert or update all local events in Supabase
    const { error } = await supabase
      .from('calendar_events')
      .upsert(
        localEvents.map(event => ({
          id: event.id,
          user_id: user.id,
          title: event.title,
          description: event.description || '',
          start_date: event.startDate,
          end_date: event.endDate,
          color: event.color,
        })),
        { onConflict: 'id' }
      );

    if (error) throw error;
    console.log('[Cloud Sync] Successfully pushed local cache to cloud.');
  } catch (err) {
    console.error('[Cloud Sync] Failed syncing local events:', err);
  }
}

// Load events from cloud and write to local cache (triggers reactive update)
export async function syncFromCloud(): Promise<void> {
  if (!isSupabaseConfigured) return;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    console.log('[Cloud Sync] Loading events from database...');
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', user.id);

    if (error) throw error;

    if (data) {
      const parsedEvents: CalendarEvent[] = data.map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        startDate: item.start_date,
        endDate: item.end_date,
        color: item.color,
      }));
      
      console.log(`[Cloud Sync] Found ${parsedEvents.length} events in cloud. Updating local cache.`);
      saveLocalEvents(parsedEvents);
    }
  } catch (err) {
    console.error('[Cloud Sync] Failed loading from cloud database:', err);
  }
}

// Save events (Local + Cloud if logged in)
export async function saveEvents(events: CalendarEvent[]): Promise<void> {
  // Always save locally first (for instant response and offline fallback)
  saveLocalEvents(events);

  if (!isSupabaseConfigured) return;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Delete events in cloud that are no longer in this new events list (sync deletes)
    const currentIds = events.map(e => e.id);
    if (currentIds.length > 0) {
      const { error: delError } = await supabase
        .from('calendar_events')
        .delete()
        .eq('user_id', user.id)
        .not('id', 'in', `(${currentIds.map(id => `'${id}'`).join(',')})`);
      if (delError) console.warn('[Cloud Sync Warning] Delete cleanup sync failed:', delError);
    } else {
      await supabase
        .from('calendar_events')
        .delete()
        .eq('user_id', user.id);
    }

    // 2. Upsert existing events
    if (events.length > 0) {
      const { error } = await supabase
        .from('calendar_events')
        .upsert(
          events.map(event => ({
            id: event.id,
            user_id: user.id,
            title: event.title,
            description: event.description || '',
            start_date: event.startDate,
            end_date: event.endDate,
            color: event.color,
          }))
        );
      if (error) throw error;
    }
    console.log('[Cloud Sync] Successfully saved events to cloud database.');
  } catch (err) {
    console.error('[Cloud Sync] Failed saving to cloud database:', err);
  }
}

// Load events synchronous read (instantly from local cache)
export function loadEvents(): CalendarEvent[] {
  return loadLocalEvents();
}
