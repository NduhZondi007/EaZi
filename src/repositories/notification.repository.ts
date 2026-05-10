import { supabase } from '@/lib/supabase';
import type { NotificationRow } from '@/types/database.types';

const PAGE_SIZE = 20;

export interface INotificationRepository {
  findByUserId(userId: string, limit?: number, before?: string): Promise<NotificationRow[]>;
  getUnreadCount(userId: string): Promise<number>;
  markRead(notificationId: string): Promise<void>;
  markAllRead(userId: string): Promise<void>;
  markDelivered(notificationId: string): Promise<void>;
}

class NotificationRepository implements INotificationRepository {
  async findByUserId(
    userId: string,
    limit = PAGE_SIZE,
    before?: string,
  ): Promise<NotificationRow[]> {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as NotificationRow[];
  }

  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
    return count ?? 0;
  }

  async markRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) throw error;
  }

  async markAllRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
  }

  async markDelivered(notificationId: string): Promise<void> {
    await supabase
      .from('notifications')
      .update({ delivered: true })
      .eq('id', notificationId)
      .eq('delivered', false);
  }
}

export const notificationRepository = new NotificationRepository();
