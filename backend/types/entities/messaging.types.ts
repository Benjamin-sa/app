/**
 * Simplified Messaging Models
 * Clean, minimal data structures for messaging
 */

export interface MessageThread {
  id: string;
  participants: [string, string]; // Always exactly 2 users
  createdAt: string;
  updatedAt: string;

  // Last message summary for thread list display
  lastMessageId?: string;
  lastMessageContent?: string;
  lastMessageSentBy?: string;
  lastMessageAt?: string;

  // Simple unread counters per user
  unreadCounts: {
    [userId: string]: number;
  };
}

export interface Message {
  id: string;
  threadId: string;
  senderId: string;
  content: string;
  createdAt: string;
  editedAt?: string;
  isDeleted: boolean;

  // Simple read tracking
  readBy: string[]; // Array of user IDs who have read this message
}

// Request/Response types
export interface SendMessageRequest {
  receiverId: string;
  content: string;
}

export interface GetMessagesRequest {
  threadId: string;
  limit?: number;
  before?: string; // Message ID to paginate from
}

export interface ThreadListResponse {
  threads: MessageThread[];
  hasMore: boolean;
}

export interface MessagesResponse {
  messages: Message[];
  hasMore: boolean;
}
