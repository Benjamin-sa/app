/**
 * Simplified Messaging Store
 * Clean, focused state management
 */

import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { apiService } from "@/services/api.service";
import { useAuthStore } from "@/stores/auth";

export const useMessagingStore = defineStore("Messaging", () => {
  // State
  const threads = ref(new Map());
  const messages = ref(new Map()); // threadId -> messages
  const loading = ref({
    threads: false,
    messages: new Map(),
  });

  // Get auth store reference
  const authStore = useAuthStore();

  // Getters
  const threadsList = computed(() =>
    Array.from(threads.value.values()).sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
  );

  const getThread = computed(() => (threadId) => threads.value.get(threadId));
  const getThreadMessages = computed(
    () => (threadId) => messages.value.get(threadId) || []
  );
  const isLoadingMessages = computed(
    () => (threadId) => loading.value.messages.get(threadId) || false
  );

  const getUnreadCount = computed(() => (threadId, userId) => {
    const thread = threads.value.get(threadId);
    return thread?.unreadCounts[userId] || 0;
  });

  // Get total unread messages count across all threads
  const totalUnreadCount = computed(() => {
    let total = 0;
    const currentUserId = authStore?.user?.uid;
    if (!currentUserId) return 0;

    for (const thread of threads.value.values()) {
      total += thread.unreadCounts?.[currentUserId] || 0;
    }
    return total;
  });

  // Check if user has any unread messages
  const hasUnreadMessages = computed(() => totalUnreadCount.value > 0);

  // Actions

  /**
   * Load user's message threads
   */
  const loadThreads = async () => {
    if (loading.value.threads) return;

    loading.value.threads = true;
    try {
      const response = await apiService.get("/messages/threads");
      if (response.success && response.data.threads) {
        threads.value.clear();
        response.data.threads.forEach((thread) => {
          threads.value.set(thread.id, thread);
        });
      }
    } catch (error) {
      console.error("Failed to load threads:", error);
      throw error;
    } finally {
      loading.value.threads = false;
    }
  };

  /**
   * Load messages for a thread
   */
  const loadMessages = async (threadId) => {
    if (loading.value.messages.get(threadId)) return;

    loading.value.messages.set(threadId, true);
    try {
      const response = await apiService.get(`/messages/threads/${threadId}`);
      if (response.success && response.data.messages) {
        // Store messages in chronological order (oldest first for display)
        const sortedMessages = response.data.messages.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        messages.value.set(threadId, sortedMessages);
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
      throw error;
    } finally {
      loading.value.messages.set(threadId, false);
    }
  };

  /**
   * Send a message
   */
  const sendMessage = async (receiverId, content) => {
    try {
      const response = await apiService.post("/messages", {
        receiverId,
        content,
      });

      if (response.success && response.data) {
        const newMessage = response.data;

        // Add message to local state
        const threadMessages = messages.value.get(newMessage.threadId) || [];
        messages.value.set(newMessage.threadId, [
          ...threadMessages,
          newMessage,
        ]);

        // Update thread with new message info
        const thread = threads.value.get(newMessage.threadId);
        if (thread) {
          Object.assign(thread, {
            lastMessageId: newMessage.id,
            lastMessageContent: newMessage.content,
            lastMessageSentBy: newMessage.senderId,
            lastMessageAt: newMessage.createdAt,
            updatedAt: newMessage.createdAt,
          });
        }

        return newMessage;
      } else {
        throw new Error("Failed to send message");
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      throw error;
    }
  };

  /**
   * Mark thread as read
   */
  const markThreadAsRead = async (threadId, userId) => {
    try {
      await apiService.put(`/messages/threads/${threadId}/read`);

      // Update local state
      const thread = threads.value.get(threadId);
      if (thread) {
        thread.unreadCounts[userId] = 0;
      }

      // Mark all messages in thread as read by this user
      const threadMessages = messages.value.get(threadId);
      if (threadMessages) {
        threadMessages.forEach((message) => {
          if (!message.readBy.includes(userId)) {
            message.readBy.push(userId);
          }
        });
      }
    } catch (error) {
      console.error("Failed to mark as read:", error);
      throw error;
    }
  };

  /**
   * Delete a message
   */
  const deleteMessage = async (messageId) => {
    try {
      await apiService.delete(`/messages/${messageId}`);

      // Update local state - mark as deleted
      for (const [threadId, threadMessages] of messages.value.entries()) {
        const messageIndex = threadMessages.findIndex(
          (m) => m.id === messageId
        );
        if (messageIndex !== -1) {
          threadMessages[messageIndex].isDeleted = true;
          break;
        }
      }
    } catch (error) {
      console.error("Failed to delete message:", error);
      throw error;
    }
  };

  /**
   * Get or create thread with a user
   */
  const getOrCreateThread = async (otherUserId) => {
    // Look for existing thread
    for (const thread of threads.value.values()) {
      if (thread.participants.includes(otherUserId)) {
        return thread.id;
      }
    }

    // Create new thread by sending an empty message (which creates the thread)
    const message = await sendMessage(otherUserId, "👋"); // Friendly default
    return message.threadId;
  };

  /**
   * Auto-load threads when user is authenticated
   */
  const autoLoadThreads = async () => {
    // Only load if user is authenticated and threads aren't already loading/loaded
    if (!authStore?.user?.uid || loading.value.threads) return;

    try {
      await loadThreads();
    } catch (error) {
      console.error("Auto-load threads failed:", error);
      // Don't throw error to avoid disrupting app startup
    }
  };

  /**
   * Clear all data (e.g., on logout)
   */
  const clearAll = () => {
    threads.value.clear();
    messages.value.clear();
    loading.value.threads = false;
    loading.value.messages.clear();
  };

  return {
    // State
    threadsList,
    loading: computed(() => loading.value),

    // Getters
    getThread,
    getThreadMessages,
    isLoadingMessages,
    getUnreadCount,
    totalUnreadCount,
    hasUnreadMessages,

    // Actions
    loadThreads,
    loadMessages,
    sendMessage,
    markThreadAsRead,
    deleteMessage,
    getOrCreateThread,
    autoLoadThreads,
    clearAll,
  };
});
