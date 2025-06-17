<template>
    <div class="flex flex-col h-full">
        <!-- Conversation Header -->
        <div class="border-b border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
            <div class="flex items-center space-x-3">
                <AuthorDisplay :user-id="getOtherParticipant()" size="sm" :show-name="false" />
                <div class="flex-1">
                    <h3 class="font-medium text-gray-900 dark:text-white">
                        {{ otherParticipantName }}
                    </h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                        {{ participantCount }} participant{{ participantCount > 1 ? 's' : '' }}
                    </p>
                </div>
                <!-- Optional: Add menu for conversation actions -->
                <div class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer">
                    <EllipsisVerticalIcon class="w-5 h-5" />
                </div>
            </div>
        </div>

        <!-- Messages -->
        <div ref="messagesContainer" class="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/20">
            <!-- Loading messages -->
            <div v-if="loadingMessages" class="flex justify-center py-4">
                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
            </div>

            <!-- Message groups -->
            <div v-else-if="messageGroups.length > 0">
                <div v-for="group in messageGroups" :key="group.date" class="space-y-4">
                    <!-- Date separator -->
                    <div class="flex items-center justify-center py-2">
                        <div
                            class="bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-full text-xs text-gray-600 dark:text-gray-400">
                            {{ group.date }}
                        </div>
                    </div>

                    <!-- Messages in this date group -->
                    <div v-for="message in group.messages" :key="message.id"
                        :class="['flex', message.senderId === authStore.user?.uid ? 'justify-end' : 'justify-start']">

                        <div :class="[
                            'max-w-sm lg:max-w-md px-4 py-3 rounded-2xl relative',
                            message.senderId === authStore.user?.uid
                                ? 'bg-primary-600 text-white rounded-br-md'
                                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md border border-gray-200 dark:border-gray-700'
                        ]">
                            <!-- Message content -->
                            <div class="text-sm leading-relaxed" v-html="formatContent(message.content)"></div>

                            <!-- Message metadata -->
                            <div :class="[
                                'text-xs mt-2 flex items-center space-x-2',
                                message.senderId === authStore.user?.uid
                                    ? 'text-primary-100'
                                    : 'text-gray-500 dark:text-gray-400'
                            ]">
                                <span>{{ formatMessageTime(message.createdAt) }}</span>

                                <!-- Read receipts for sent messages -->
                                <div v-if="message.senderId === authStore.user?.uid" class="flex items-center">
                                    <CheckIcon v-if="message.readAt" class="w-3 h-3" />
                                    <div v-else class="w-3 h-3 rounded-full border border-current opacity-50"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Empty state -->
            <div v-else class="flex items-center justify-center py-12">
                <div class="text-center text-gray-500 dark:text-gray-400">
                    <ChatBubbleLeftIcon class="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p class="font-medium">No messages yet</p>
                    <p class="text-sm">Send a message to start the conversation</p>
                </div>
            </div>
        </div>

        <!-- Typing indicator -->
        <div v-if="showTypingIndicator" class="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
            <div class="flex items-center space-x-1">
                <div class="flex space-x-1">
                    <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                    <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                </div>
                <span class="ml-2">{{ otherParticipantName }} is typing...</span>
            </div>
        </div>

        <!-- Message Input -->
        <div class="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
            <form @submit.prevent="sendMessage" class="flex items-end space-x-3">
                <!-- Message input with auto-resize -->
                <div class="flex-1">
                    <textarea ref="messageInput" v-model="newMessage" @keydown="handleKeyDown" @input="handleInput"
                        placeholder="Type your message..." rows="1"
                        class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none max-h-32"
                        :disabled="loading" />
                </div>

                <!-- Send button -->
                <button type="submit" :disabled="loading || !newMessage.trim()" :class="[
                    'p-3 rounded-full transition-colors',
                    newMessage.trim() && !loading
                        ? 'bg-primary-600 hover:bg-primary-700 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                ]">
                    <PaperAirplaneIcon class="w-5 h-5 transform rotate-45" />
                </button>
            </form>
        </div>
    </div>
</template>

<script setup>
import { ref, nextTick, watch, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useMessagingStore } from '@/stores/messaging';
import { useUsersStore } from '@/stores/users';
import { formatDate, formatContent, formatTimeAgo, convertFirestoreTimestamp } from '@/utils/helpers';
import AuthorDisplay from '@/components/common/AuthorDisplay.vue';
import {
    ChatBubbleLeftIcon,
    PaperAirplaneIcon,
    EllipsisVerticalIcon,
    CheckIcon
} from '@heroicons/vue/24/outline';

const props = defineProps({
    conversationId: {
        type: String,
        required: true
    },
    conversation: {
        type: Object,
        required: true
    }
});

const emit = defineEmits(['message-sent']);

const authStore = useAuthStore();
const messagingStore = useMessagingStore();
const usersStore = useUsersStore();

const newMessage = ref('');
const messagesContainer = ref(null);
const messageInput = ref(null);
const showTypingIndicator = ref(false);

// Get conversation and messages from store
const conversation = computed(() => messagingStore.getConversation(props.conversationId));
const messages = computed(() => messagingStore.getMessages(props.conversationId));
const loadingMessages = computed(() => messagingStore.isLoadingMessages(props.conversationId));

// Get other participant info
const otherParticipantId = computed(() => {
    if (!conversation.value?.participants) return null;
    return conversation.value.participants.find(
        participantId => participantId !== authStore.user?.uid
    );
});

const otherParticipantName = computed(() => {
    if (!otherParticipantId.value) return 'User';
    return usersStore.getUserDisplayName(otherParticipantId.value);
});

// Group messages by date for better readability
const messageGroups = computed(() => {
    const groups = [];
    let currentGroup = null;

    messages.value.forEach(message => {
        const messageDate = convertFirestoreTimestamp(message.createdAt);
        if (!messageDate) return; // Skip invalid timestamps

        const dateKey = messageDate.toDateString();

        if (!currentGroup || currentGroup.dateKey !== dateKey) {
            currentGroup = {
                dateKey,
                date: formatMessageDate(messageDate),
                messages: []
            };
            groups.push(currentGroup);
        }

        currentGroup.messages.push(message);
    });

    return groups;
});

const participantCount = computed(() => {
    return props.conversation?.participants?.length || 2;
});

// Load messages when conversation changes
const loadMessages = async () => {
    if (!props.conversationId) return;

    await messagingStore.loadMessages(props.conversationId);
    await nextTick();
    scrollToBottom();
};

const sendMessage = async () => {
    if (!newMessage.value.trim()) return;

    const messageContent = newMessage.value.trim();
    newMessage.value = '';

    // Reset textarea height
    if (messageInput.value) {
        messageInput.value.style.height = 'auto';
    }

    const result = await messagingStore.sendMessage(getOtherParticipant(), messageContent);

    if (result) {
        emit('message-sent', result);
        await nextTick();
        scrollToBottom();
    }
};

const getOtherParticipant = () => {
    if (!props.conversation?.participants) return null;

    return props.conversation.participants.find(
        participantId => participantId !== authStore.user?.uid
    );
};

const handleKeyDown = (event) => {
    // Send message on Enter (without Shift)
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
};

const handleInput = () => {
    // Auto-resize textarea
    if (messageInput.value) {
        messageInput.value.style.height = 'auto';
        messageInput.value.style.height = Math.min(messageInput.value.scrollHeight, 128) + 'px';
    }
};

const scrollToBottom = () => {
    if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
};

const formatMessageTime = (timestamp) => {
    const date = convertFirestoreTimestamp(timestamp);
    if (!date) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatMessageDate = (date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString([], {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
};

// Watch for conversation changes
watch(() => props.conversationId, async () => {
    if (props.conversationId) {
        await loadMessages();
        // Load other participant data
        const participantId = getOtherParticipant();
        if (participantId) {
            await usersStore.getUser(participantId);
        }
    }
}, { immediate: true });

onMounted(async () => {
    const participantId = getOtherParticipant();
    if (participantId) {
        await usersStore.getUser(participantId);
    }
});
</script>