import { create } from 'zustand';
import { chatRepository } from '@/repositories/chat.repository';
import type { ChatRoomWithDetails, ChatMessage } from '@/types/chat.types';

interface ChatState {
  rooms: ChatRoomWithDetails[];
  messages: Record<string, ChatMessage[]>;
  activeRoomId: string | null;
  isRoomsLoading: boolean;
  isMessagesLoading: boolean;
  isSending: boolean;
  hasMoreMessages: Record<string, boolean>;
  error: string | null;

  loadRooms(userId: string): Promise<void>;
  loadMessages(roomId: string): Promise<void>;
  loadMoreMessages(roomId: string): Promise<void>;
  sendMessage(roomId: string, senderId: string, content: string): Promise<void>;
  findOrCreateRoom(userId: string, otherUserId: string, bookingId?: string | null): Promise<string>;
  receiveMessage(raw: Record<string, unknown>): void;
  markRead(roomId: string, userId: string): Promise<void>;
  setActiveRoom(roomId: string | null): void;
  clearError(): void;
}

const PAGE_SIZE = 30;

export const useChatStore = create<ChatState>((set, get) => ({
  rooms: [],
  messages: {},
  activeRoomId: null,
  isRoomsLoading: false,
  isMessagesLoading: false,
  isSending: false,
  hasMoreMessages: {},
  error: null,

  async loadRooms(userId: string) {
    set({ isRoomsLoading: true, error: null });
    try {
      const rooms = await chatRepository.findRoomsForUser(userId);
      set({ rooms, isRoomsLoading: false });
    } catch (err) {
      set({
        isRoomsLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load chats',
      });
    }
  },

  async loadMessages(roomId: string) {
    set({ isMessagesLoading: true, error: null });
    try {
      const msgs = await chatRepository.findMessages(roomId, PAGE_SIZE);
      set((state) => ({
        messages: { ...state.messages, [roomId]: msgs },
        hasMoreMessages: { ...state.hasMoreMessages, [roomId]: msgs.length === PAGE_SIZE },
        isMessagesLoading: false,
      }));
    } catch (err) {
      set({
        isMessagesLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load messages',
      });
    }
  },

  async loadMoreMessages(roomId: string) {
    const current = get().messages[roomId] ?? [];
    if (!get().hasMoreMessages[roomId]) return;
    const oldest = current[current.length - 1];
    if (!oldest) return;

    try {
      const older = await chatRepository.findMessages(roomId, PAGE_SIZE, oldest.created_at);
      set((state) => ({
        messages: { ...state.messages, [roomId]: [...(state.messages[roomId] ?? []), ...older] },
        hasMoreMessages: { ...state.hasMoreMessages, [roomId]: older.length === PAGE_SIZE },
      }));
    } catch {
      // Silently fail; user can scroll again to retry
    }
  },

  async sendMessage(roomId: string, senderId: string, content: string) {
    set({ isSending: true });
    try {
      const msg = await chatRepository.sendMessage(roomId, senderId, content);
      set((state) => ({
        messages: { ...state.messages, [roomId]: [msg, ...(state.messages[roomId] ?? [])] },
        isSending: false,
        // Bump the room to top of list with new last message
        rooms: state.rooms.map((r) =>
          r.id === roomId
            ? {
                ...r,
                lastMessage: {
                  id: msg.id,
                  content: msg.content,
                  sender_id: msg.sender_id,
                  status: msg.status,
                  created_at: msg.created_at,
                },
              }
            : r,
        ),
      }));
    } catch (err) {
      set({
        isSending: false,
        error: err instanceof Error ? err.message : 'Failed to send message',
      });
    }
  },

  async findOrCreateRoom(userId: string, otherUserId: string, bookingId?: string | null) {
    const room = await chatRepository.findOrCreateRoom(userId, otherUserId, bookingId);
    return room.id;
  },

  receiveMessage(raw: Record<string, unknown>) {
    const msg: ChatMessage = {
      id: raw.id as string,
      chat_room_id: raw.chat_room_id as string,
      sender_id: raw.sender_id as string,
      content: raw.content as string,
      status: (raw.status as ChatMessage['status']) ?? 'sent',
      created_at: raw.created_at as string,
    };

    set((state) => {
      const existing = state.messages[msg.chat_room_id] ?? [];
      // Prevent duplicates
      if (existing.some((m) => m.id === msg.id)) return state;

      const updatedMessages = [msg, ...existing];
      const updatedRooms = state.rooms.map((r) =>
        r.id === msg.chat_room_id
          ? {
              ...r,
              lastMessage: {
                id: msg.id,
                content: msg.content,
                sender_id: msg.sender_id,
                status: msg.status,
                created_at: msg.created_at,
              },
              unreadCount:
                state.activeRoomId === msg.chat_room_id ? r.unreadCount : r.unreadCount + 1,
            }
          : r,
      );

      return {
        messages: { ...state.messages, [msg.chat_room_id]: updatedMessages },
        rooms: updatedRooms,
      };
    });
  },

  async markRead(roomId: string, userId: string) {
    try {
      await chatRepository.markMessagesRead(roomId, userId);
      set((state) => ({
        rooms: state.rooms.map((r) => (r.id === roomId ? { ...r, unreadCount: 0 } : r)),
        messages: {
          ...state.messages,
          [roomId]: (state.messages[roomId] ?? []).map((m) =>
            m.sender_id !== userId && (m.status === 'sent' || m.status === 'delivered')
              ? { ...m, status: 'read' as const }
              : m,
          ),
        },
      }));
    } catch {
      // Non-critical, ignore
    }
  },

  setActiveRoom(roomId: string | null) {
    set({ activeRoomId: roomId });
  },

  clearError() {
    set({ error: null });
  },
}));

export const selectRooms = (s: ChatState) => s.rooms;
export const selectMessages = (roomId: string) => (s: ChatState) => s.messages[roomId] ?? [];
export const selectIsRoomsLoading = (s: ChatState) => s.isRoomsLoading;
export const selectIsMessagesLoading = (s: ChatState) => s.isMessagesLoading;
export const selectIsSending = (s: ChatState) => s.isSending;
export const selectHasMoreMessages = (roomId: string) => (s: ChatState) =>
  s.hasMoreMessages[roomId] ?? false;
export const selectChatError = (s: ChatState) => s.error;
