import { supabase } from '@/lib/supabase';
import type { ChatRoomWithDetails, ChatMessage } from '@/types/chat.types';
import type { ChatRoomRow, MessageRow } from '@/types/database.types';

const MESSAGE_PAGE_SIZE = 30;

type RoomRow = ChatRoomRow & { created_at: string; updated_at: string };
type MsgRow = MessageRow & { created_at: string };

export interface IChatRepository {
  findRoomsForUser(userId: string): Promise<ChatRoomWithDetails[]>;
  findOrCreateRoom(userId: string, otherUserId: string, bookingId?: string | null): Promise<RoomRow>;
  findMessages(roomId: string, limit?: number, before?: string): Promise<ChatMessage[]>;
  sendMessage(roomId: string, senderId: string, content: string): Promise<ChatMessage>;
  markMessagesRead(roomId: string, userId: string): Promise<void>;
  markMessageDelivered(messageId: string): Promise<void>;
}

class ChatRepository implements IChatRepository {
  async findRoomsForUser(userId: string): Promise<ChatRoomWithDetails[]> {
    const { data: rooms, error } = await supabase
      .from('chat_rooms')
      .select('*')
      .or(`participant_a_id.eq.${userId},participant_b_id.eq.${userId}`)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    if (!rooms || rooms.length === 0) return [];

    const typedRooms = rooms as RoomRow[];
    const otherIds = typedRooms.map((r) =>
      r.participant_a_id === userId ? r.participant_b_id : r.participant_a_id,
    );
    const uniqueIds = [...new Set(otherIds)];

    const { data: users, error: usersErr } = await supabase
      .from('users')
      .select('id, name, profile_image_url')
      .in('id', uniqueIds);

    if (usersErr) throw usersErr;
    const userMap = new Map((users ?? []).map((u) => [u.id, u]));

    const roomIds = typedRooms.map((r) => r.id);

    const { data: recentMessages } = await supabase
      .from('messages')
      .select('*')
      .in('chat_room_id', roomIds)
      .order('created_at', { ascending: false })
      .limit(roomIds.length * 5);

    const lastMsgMap = new Map<string, MsgRow>();
    ((recentMessages ?? []) as MsgRow[]).forEach((m) => {
      if (!lastMsgMap.has(m.chat_room_id)) {
        lastMsgMap.set(m.chat_room_id, m);
      }
    });

    const { data: unreadData } = await supabase
      .from('messages')
      .select('chat_room_id')
      .in('chat_room_id', roomIds)
      .neq('sender_id', userId)
      .eq('status', 'sent');

    const unreadMap = new Map<string, number>();
    (unreadData ?? []).forEach((m) => {
      unreadMap.set(m.chat_room_id, (unreadMap.get(m.chat_room_id) ?? 0) + 1);
    });

    return typedRooms.map((room) => {
      const otherId =
        room.participant_a_id === userId ? room.participant_b_id : room.participant_a_id;
      const other = userMap.get(otherId);
      const last = lastMsgMap.get(room.id);
      return {
        ...room,
        otherParticipant: {
          id: otherId,
          name: other?.name ?? 'Unknown',
          profile_image_url: other?.profile_image_url ?? null,
        },
        lastMessage: last
          ? {
              id: last.id,
              content: last.content,
              sender_id: last.sender_id,
              status: last.status,
              created_at: last.created_at,
            }
          : null,
        unreadCount: unreadMap.get(room.id) ?? 0,
      };
    });
  }

  async findOrCreateRoom(
    userId: string,
    otherUserId: string,
    bookingId?: string | null,
  ): Promise<RoomRow> {
    const { data: existing } = await supabase
      .from('chat_rooms')
      .select('*')
      .or(
        `and(participant_a_id.eq.${userId},participant_b_id.eq.${otherUserId}),and(participant_a_id.eq.${otherUserId},participant_b_id.eq.${userId})`,
      )
      .maybeSingle();

    if (existing) return existing as RoomRow;

    const { data: created, error } = await supabase
      .from('chat_rooms')
      .insert({
        participant_a_id: userId,
        participant_b_id: otherUserId,
        booking_id: bookingId ?? null,
      })
      .select()
      .single();

    if (error) throw error;
    return created as RoomRow;
  }

  async findMessages(
    roomId: string,
    limit = MESSAGE_PAGE_SIZE,
    before?: string,
  ): Promise<ChatMessage[]> {
    let query = supabase
      .from('messages')
      .select('*')
      .eq('chat_room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data, error } = await query;
    if (error) throw error;
    // Return newest-first so inverted FlatList shows them correctly
    return ((data ?? []) as MsgRow[]).map((m) => ({
      id: m.id,
      chat_room_id: m.chat_room_id,
      sender_id: m.sender_id,
      content: m.content,
      status: m.status,
      created_at: m.created_at,
    }));
  }

  async sendMessage(roomId: string, senderId: string, content: string): Promise<ChatMessage> {
    const { data, error } = await supabase
      .from('messages')
      .insert({ chat_room_id: roomId, sender_id: senderId, content })
      .select()
      .single();

    if (error) throw error;
    const msg = data as MsgRow;

    // Bump room updated_at via a no-op update isn't possible on Update: Record<string, never>
    // Instead we rely on a DB trigger for updated_at
    return {
      id: msg.id,
      chat_room_id: msg.chat_room_id,
      sender_id: msg.sender_id,
      content: msg.content,
      status: msg.status,
      created_at: msg.created_at,
    };
  }

  async markMessagesRead(roomId: string, userId: string): Promise<void> {
    await supabase
      .from('messages')
      .update({ status: 'read' })
      .eq('chat_room_id', roomId)
      .neq('sender_id', userId)
      .in('status', ['sent', 'delivered']);
  }

  async markMessageDelivered(messageId: string): Promise<void> {
    await supabase
      .from('messages')
      .update({ status: 'delivered' })
      .eq('id', messageId)
      .eq('status', 'sent');
  }
}

export const chatRepository = new ChatRepository();
