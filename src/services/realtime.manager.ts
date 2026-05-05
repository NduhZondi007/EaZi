import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface ChangePayload {
  new: Record<string, unknown>;
  old: Record<string, unknown>;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
}

type ChangeHandler = (payload: ChangePayload) => void;

export class RealtimeManager {
  private channels = new Map<string, RealtimeChannel>();

  subscribeToBooking(bookingId: string, handler: ChangeHandler): () => void {
    const key = `booking:${bookingId}`;
    this.unsubscribeKey(key);

    const channel = supabase
      .channel(key)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `id=eq.${bookingId}`,
        },
        (payload) =>
          handler({
            new: payload.new as Record<string, unknown>,
            old: payload.old as Record<string, unknown>,
            eventType: 'UPDATE',
          }),
      )
      .subscribe();

    this.channels.set(key, channel);
    return () => this.unsubscribeKey(key);
  }

  subscribeToNotifications(userId: string, handler: ChangeHandler): () => void {
    const key = `notifications:${userId}`;
    this.unsubscribeKey(key);

    const channel = supabase
      .channel(key)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) =>
          handler({
            new: payload.new as Record<string, unknown>,
            old: {},
            eventType: 'INSERT',
          }),
      )
      .subscribe();

    this.channels.set(key, channel);
    return () => this.unsubscribeKey(key);
  }

  subscribeToChatMessages(roomId: string, handler: ChangeHandler): () => void {
    const key = `messages:${roomId}`;
    this.unsubscribeKey(key);

    const channel = supabase
      .channel(key)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_room_id=eq.${roomId}`,
        },
        (payload) =>
          handler({
            new: payload.new as Record<string, unknown>,
            old: {},
            eventType: 'INSERT',
          }),
      )
      .subscribe();

    this.channels.set(key, channel);
    return () => this.unsubscribeKey(key);
  }

  private unsubscribeKey(key: string): void {
    const existing = this.channels.get(key);
    if (existing) {
      supabase.removeChannel(existing);
      this.channels.delete(key);
    }
  }

  unsubscribeAll(): void {
    const keys = [...this.channels.keys()];
    keys.forEach((key) => this.unsubscribeKey(key));
  }
}

export const realtimeManager = new RealtimeManager();
