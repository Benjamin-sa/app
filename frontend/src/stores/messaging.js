import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { apiService } from "@/services/api.service";

export const useMessagingStore = defineStore("messaging", () => {
  // State
  const conversations = ref(new Map()); // Map<conversationId, conversation>
  const messages = ref(new Map()); // Map<conversationId, messages[]>
  const loadingStates = ref(new Map()); // Map<conversationId, boolean>
  const loadingConversations = ref(false);
  const error = ref(null);

  // Getters
  const getConversation = computed(() => {
    return (conversationId) => conversations.value.get(conversationId) || null;
  });

  const getMessages = computed(() => {
    return (conversationId) => messages.value.get(conversationId) || [];
  });

  const isLoadingMessages = computed(() => {
    return (conversationId) => loadingStates.value.get(conversationId) || false;
  });

  const getConversationsList = computed(() => {
    return Array.from(conversations.value.values()).sort((a, b) => {
      // Handle Firestore timestamp format
      const getTimestamp = (timestamp) => {
        if (!timestamp) return 0;
        if (timestamp._seconds) {
          return (
            timestamp._seconds * 1000 +
            Math.floor(timestamp._nanoseconds / 1000000)
          );
        }
        return new Date(timestamp).getTime();
      };

      const aTime = getTimestamp(a.updatedAt || a.lastMessageAt);
      const bTime = getTimestamp(b.updatedAt || b.lastMessageAt);

      return bTime - aTime; // Most recent first
    });
  });

  // Actions
  const setError = (errorMessage) => {
    error.value = errorMessage;
  };

  const clearError = () => {
    error.value = null;
  };

  const setLoadingMessages = (conversationId, isLoading) => {
    if (isLoading) {
      loadingStates.value.set(conversationId, true);
    } else {
      loadingStates.value.delete(conversationId);
    }
  };

  // Load all conversations
  const loadConversations = async () => {
    loadingConversations.value = true;
    clearError();

    try {
      const response = await apiService.get("/messages/conversations");

      if (response.success && response.data) {
        // Check if conversations are directly in data or nested under conversations
        const conversationsArray = response.data.conversations || response.data;

        if (Array.isArray(conversationsArray)) {
          // Clear existing conversations
          conversations.value.clear();

          // Add new conversations to the store
          conversationsArray.forEach((conversation) => {
            conversations.value.set(conversation.id, conversation);
          });

          return conversationsArray;
        } else {
          setError("Invalid conversations data format");
          return [];
        }
      } else {
        setError("Failed to load conversations");
        return [];
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
      setError("Failed to load conversations");
      return [];
    } finally {
      loadingConversations.value = false;
    }
  };

  // Load messages for a specific conversation
  const loadMessages = async (conversationId) => {
    if (!conversationId) return [];

    setLoadingMessages(conversationId, true);
    clearError();

    try {
      const response = await apiService.get(
        `/messages/conversations/${conversationId}`
      );

      if (response.success && response.messages) {
        // Store messages in reverse order (oldest first)
        const conversationMessages = response.messages.reverse();
        messages.value.set(conversationId, conversationMessages);
        return conversationMessages;
      } else {
        setError("Failed to load messages");
        return [];
      }
    } catch (error) {
      console.error("Error loading messages:", error);
      setError("Failed to load messages");
      return [];
    } finally {
      setLoadingMessages(conversationId, false);
    }
  };

  // Send a new message
  const sendMessage = async (receiverId, content) => {
    if (!receiverId || !content?.trim()) return null;

    clearError();

    try {
      const response = await apiService.post("/messages", {
        receiverId,
        content: content.trim(),
      });

      if (response.success && response.data) {
        const newMessage = response.data;

        // Find or create conversation
        let conversationId = newMessage.conversationId;

        // Add message to the appropriate conversation
        if (conversationId) {
          const existingMessages = messages.value.get(conversationId) || [];
          messages.value.set(conversationId, [...existingMessages, newMessage]);

          // Update conversation's last message time
          const conversation = conversations.value.get(conversationId);
          if (conversation) {
            conversation.updatedAt = newMessage.createdAt;
            conversation.lastMessage = {
              content: newMessage.content,
              createdAt: newMessage.createdAt,
              senderId: newMessage.senderId,
            };
          }
        }

        return newMessage;
      } else {
        setError("Failed to send message");
        return null;
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Failed to send message");
      return null;
    }
  };

  // Mark messages as read
  const markAsRead = async (conversationId) => {
    if (!conversationId) return;

    try {
      await apiService.put(`/messages/conversations/${conversationId}/read`);

      // Update local state - mark all messages as read
      const conversationMessages = messages.value.get(conversationId);
      if (conversationMessages) {
        const updatedMessages = conversationMessages.map((msg) => ({
          ...msg,
          readAt: msg.readAt || new Date().toISOString(),
        }));
        messages.value.set(conversationId, updatedMessages);
      }
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  // Add a new message (useful for real-time updates)
  const addMessage = (conversationId, message) => {
    if (!conversationId || !message) return;

    const existingMessages = messages.value.get(conversationId) || [];
    messages.value.set(conversationId, [...existingMessages, message]);

    // Update conversation if exists
    const conversation = conversations.value.get(conversationId);
    if (conversation) {
      conversation.updatedAt = message.createdAt;
      conversation.lastMessage = {
        content: message.content,
        createdAt: message.createdAt,
        senderId: message.senderId,
      };
    }
  };

  // Clear all data (useful for logout)
  const clearAllData = () => {
    conversations.value.clear();
    messages.value.clear();
    loadingStates.value.clear();
    loadingConversations.value = false;
    error.value = null;
  };

  return {
    // State
    loadingConversations,
    error,

    // Getters
    getConversation,
    getMessages,
    isLoadingMessages,
    getConversationsList,

    // Actions
    loadConversations,
    loadMessages,
    sendMessage,
    markAsRead,
    addMessage,
    clearAllData,
    clearError,

    // Direct access for debugging
    conversations: computed(() => conversations.value),
    messages: computed(() => messages.value),
  };
});
