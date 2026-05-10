import type { MessageStatus } from './database.types';

export interface ChatParticipant {
  id: string;
  name: string;
  profile_image_url: string | null;
}

export interface ChatLastMessage {
  id: string;
  content: string;
  sender_id: string;
  status: MessageStatus;
  created_at: string;
}

export interface ChatRoomWithDetails {
  id: string;
  participant_a_id: string;
  participant_b_id: string;
  is_admin_chat: boolean;
  booking_id: string | null;
  created_at: string;
  updated_at: string;
  otherParticipant: ChatParticipant;
  lastMessage: ChatLastMessage | null;
  unreadCount: number;
}

export interface ChatMessage {
  id: string;
  chat_room_id: string;
  sender_id: string;
  content: string;
  status: MessageStatus;
  created_at: string;
}
