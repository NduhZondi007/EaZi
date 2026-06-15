import { useCallback } from 'react';
import { useChatStore } from '@/stores/chat.store';
import { useAuthStore, selectProfile } from '@/stores/auth.store';

export function useChat() {
  const profile = useAuthStore(selectProfile);
  const {
    rooms,
    messages,
    activeRoomId,
    isRoomsLoading,
    isMessagesLoading,
    isSending,
    hasMoreMessages,
    error,
    loadRooms,
    loadMessages,
    loadMoreMessages,
    sendMessage,
    findOrCreateRoom,
    markRead,
    setActiveRoom,
    clearError,
  } = useChatStore();

  const loadMyRooms = useCallback(async () => {
    if (!profile) return;
    await loadRooms(profile.id);
  }, [profile, loadRooms]);

  const handleSendMessage = useCallback(
    async (roomId: string, content: string) => {
      if (!profile) return;
      await sendMessage(roomId, profile.id, content);
    },
    [profile, sendMessage],
  );

  const handleFindOrCreateRoom = useCallback(
    async (otherUserId: string, bookingId?: string) => {
      if (!profile) throw new Error('Not authenticated');
      return findOrCreateRoom(profile.id, otherUserId, bookingId);
    },
    [profile, findOrCreateRoom],
  );

  const handleMarkRead = useCallback(
    async (roomId: string) => {
      if (!profile) return;
      await markRead(roomId, profile.id);
    },
    [profile, markRead],
  );

  return {
    rooms,
    messages,
    activeRoomId,
    isRoomsLoading,
    isMessagesLoading,
    isSending,
    hasMoreMessages,
    error,
    loadMyRooms,
    loadMessages,
    loadMoreMessages,
    sendMessage: handleSendMessage,
    findOrCreateRoom: handleFindOrCreateRoom,
    markRead: handleMarkRead,
    setActiveRoom,
    clearError,
  };
}
