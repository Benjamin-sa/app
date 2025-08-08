<template>
    <div class="flex flex-col h-full">
        <!-- Conversation Header -->
        <div
            class="border-b border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50 transition-all duration-300">
            <div class="flex items-center space-x-3">
                <div class="transition-transform duration-200 hover:scale-105">
                    <AuthorDisplay :user-id="getOtherParticipant()" size="sm" :show-name="false" />
                </div>
                <div class="flex-1">
                    <h3 class="font-medium text-gray-900 dark:text-white transition-colors duration-200">
                        {{ otherParticipantName }}
                    </h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-200">
                        {{ participantCount }} participant{{ participantCount > 1 ? 's' : '' }}
                    </p>
                </div>
                <!-- Optional: Add menu for conversation actions -->
                <div
                    class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer transition-all duration-200 hover:scale-110 active:scale-95">
                    <EllipsisVerticalIcon class="w-5 h-5" />
                </div>
            </div>
        </div>

        <!-- Messages -->
        <div ref="messagesContainer"
            class="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/20 scroll-smooth">
            <!-- Loading messages -->
            <div v-if="loadingMessages" class="flex justify-center py-4">
                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
            </div>

            <!-- Message groups -->
            <div v-else-if="messageGroups.length > 0">
                <TransitionGroup name="message-group" tag="div" class="space-y-4">
                    <div v-for="group in messageGroups" :key="group.date" class="space-y-4">
                        <!-- Date separator -->
                        <div class="flex items-center justify-center py-2">
                            <div class="bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-full text-xs text-gray-600 dark:text-gray-400 
                                       transform transition-all duration-300 hover:scale-105">
                                {{ group.date }}
                            </div>
                        </div>

                        <!-- Messages in this date group -->
                        <TransitionGroup name="message" tag="div" class="space-y-3">
                            <div v-for="(message, index) in group.messages" :key="message.id"
                                :class="['flex transition-all duration-300', message.senderId === authStore.user?.uid ? 'justify-end' : 'justify-start']"
                                :style="{ animationDelay: `${index * 50}ms` }">

                                <div :class="[
                                    'max-w-sm lg:max-w-md px-4 py-3 rounded-2xl relative transform transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]',
                                    message.senderId === authStore.user?.uid
                                        ? 'bg-primary-600 text-white rounded-br-md shadow-lg hover:shadow-xl hover:bg-primary-700'
                                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600',
                                    sendingMessage.value && message.id && message.id.startsWith('temp-') ? 'opacity-70 animate-pulse' : ''
                                ]">
                                    <!-- Message content -->
                                    <div class="text-sm leading-relaxed" v-html="formatContent(message.content)"></div>

                                    <!-- Message metadata -->
                                    <div :class="[
                                        'text-xs mt-2 flex items-center space-x-2 transition-all duration-200',
                                        message.senderId === authStore.user?.uid
                                            ? 'text-primary-100'
                                            : 'text-gray-500 dark:text-gray-400'
                                    ]">
                                        <span class="transition-opacity duration-200">{{
                                            formatMessageTime(message.createdAt) }}</span>

                                        <!-- Read receipts for sent messages -->
                                        <div v-if="message.senderId === authStore.user?.uid" class="flex items-center">
                                            <Transition name="check" mode="out-in">
                                                <CheckIcon v-if="message.readAt"
                                                    class="w-3 h-3 text-green-400 transition-all duration-300" />
                                                <div v-else
                                                    class="w-3 h-3 rounded-full border border-current opacity-50 animate-pulse">
                                                </div>
                                            </Transition>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TransitionGroup>
                    </div>
                </TransitionGroup>
            </div>

            <!-- Empty state -->
            <Transition name="fade" appear>
                <div v-if="!loadingMessages && messageGroups.length === 0"
                    class="flex items-center justify-center py-12">
                    <div class="text-center text-gray-500 dark:text-gray-400">
                        <div class="transform transition-all duration-500 hover:scale-110">
                            <ChatBubbleLeftIcon class="w-12 h-12 mx-auto mb-3 opacity-50" />
                        </div>
                        <p class="font-medium transition-colors duration-300">No messages yet</p>
                        <p class="text-sm transition-colors duration-300">Send a message to start the conversation</p>
                    </div>
                </div>
            </Transition>
        </div>

        <!-- Typing indicator -->
        <Transition name="slide-up">
            <div v-if="showTypingIndicator" class="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                <div class="flex items-center space-x-1 animate-in slide-in-from-bottom duration-300">
                    <div class="flex space-x-1">
                        <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s">
                        </div>
                        <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s">
                        </div>
                    </div>
                    <span class="ml-2 transition-all duration-300">{{ otherParticipantName }} is typing...</span>
                </div>
            </div>
        </Transition>

        <!-- Message Input -->
        <div
            class="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800 transition-all duration-300">
            <form @submit.prevent="sendMessage" class="flex items-end space-x-3">
                <!-- Message input with auto-resize -->
                <div class="flex-1 relative">
                    <textarea ref="messageInput" v-model="newMessage" @keydown="handleKeyDown" @input="handleInput"
                        @focus="onInputFocus" @blur="onInputBlur" placeholder="Type your message..." rows="1" :class="[
                            'w-full px-4 py-3 border rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none max-h-32 transition-all duration-300',
                            inputFocused
                                ? 'border-primary-300 dark:border-primary-600 shadow-lg transform scale-[1.01]'
                                : 'border-gray-300 dark:border-gray-600 shadow-sm',
                            'dark:bg-gray-700 dark:text-white'
                        ]" :disabled="sendingMessage" />

                    <!-- Character counter (optional) -->
                    <Transition name="fade">
                        <div v-if="newMessage.length > 100"
                            class="absolute -top-6 right-2 text-xs text-gray-400 bg-white dark:bg-gray-800 px-2 rounded">
                            {{ newMessage.length }}/1000
                        </div>
                    </Transition>
                </div>

                <!-- Send button -->
                <Transition name="button-scale" mode="out-in">
                    <button v-if="sendingMessage" type="button" disabled
                        class="p-3 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed">
                        <div class="w-5 h-5 animate-spin rounded-full border-2 border-gray-400 border-t-transparent">
                        </div>
                    </button>
                    <button v-else type="submit" :disabled="!newMessage.trim()" :class="[
                        'p-3 rounded-full transition-all duration-200 transform active:scale-95',
                        newMessage.trim()
                            ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg hover:shadow-xl hover:scale-110 active:scale-95'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                    ]">
                        <PaperAirplaneIcon class="w-5 h-5 transform rotate-45 transition-transform duration-200"
                            :class="newMessage.trim() ? 'group-hover:translate-x-0.5 group-hover:-translate-y-0.5' : ''" />
                    </button>
                </Transition>
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
const sendingMessage = ref(false);
const inputFocused = ref(false);
const messageContent = ref(''); // For temporary message display

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
    if (!newMessage.value.trim() || sendingMessage.value) return;

    const messageText = newMessage.value.trim();
    sendingMessage.value = true;

    // Store message content for temp display
    messageContent.value = messageText;

    // Clear input immediately for better UX
    newMessage.value = '';

    // Reset textarea height
    if (messageInput.value) {
        messageInput.value.style.height = 'auto';
    }

    try {
        const result = await messagingStore.sendMessage(getOtherParticipant(), messageText);

        if (result) {
            emit('message-sent', result);
            // Smooth scroll to bottom after message is sent
            await nextTick();
            smoothScrollToBottom();
        }
    } catch (error) {
        console.error('Failed to send message:', error);
        // Restore message on error
        newMessage.value = messageText;
    } finally {
        sendingMessage.value = false;
        messageContent.value = '';
    }
};

const onInputFocus = () => {
    inputFocused.value = true;
};

const onInputBlur = () => {
    inputFocused.value = false;
};

const smoothScrollToBottom = () => {
    if (messagesContainer.value) {
        messagesContainer.value.scrollTo({
            top: messagesContainer.value.scrollHeight,
            behavior: 'smooth'
        });
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

// Watch for new messages and auto-scroll
watch(messages, async (newMessages, oldMessages) => {
    if (newMessages.length > (oldMessages?.length || 0)) {
        await nextTick();
        smoothScrollToBottom();
    }
}, { deep: true });

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

<style scoped>
/* Message animations */
.message-enter-active {
    transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.message-leave-active {
    transition: all 0.3s cubic-bezier(0.55, 0.085, 0.68, 0.53);
}

.message-enter-from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
}

.message-leave-to {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
}

.message-move {
    transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

/* Message group animations */
.message-group-enter-active {
    transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.message-group-leave-active {
    transition: all 0.3s cubic-bezier(0.55, 0.085, 0.68, 0.53);
}

.message-group-enter-from {
    opacity: 0;
    transform: translateY(30px);
}

.message-group-leave-to {
    opacity: 0;
    transform: translateY(-20px);
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
    transition: all 0.3s ease-in-out;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
    transform: translateY(10px);
}

/* Slide up transition */
.slide-up-enter-active {
    transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.slide-up-leave-active {
    transition: all 0.2s cubic-bezier(0.55, 0.085, 0.68, 0.53);
}

.slide-up-enter-from {
    opacity: 0;
    transform: translateY(20px);
}

.slide-up-leave-to {
    opacity: 0;
    transform: translateY(10px);
}

/* Button scale transition */
.button-scale-enter-active,
.button-scale-leave-active {
    transition: all 0.2s ease-in-out;
}

.button-scale-enter-from,
.button-scale-leave-to {
    opacity: 0;
    transform: scale(0.8);
}

/* Check icon transition */
.check-enter-active {
    transition: all 0.3s ease-in-out;
}

.check-leave-active {
    transition: all 0.2s ease-in-out;
}

.check-enter-from {
    opacity: 0;
    transform: scale(0.5) rotate(-90deg);
}

.check-leave-to {
    opacity: 0;
    transform: scale(0.8);
}

/* Custom bounce animation for typing indicator */
@keyframes bounce-custom {

    0%,
    80%,
    100% {
        transform: scale(0);
        opacity: 0.5;
    }

    40% {
        transform: scale(1);
        opacity: 1;
    }
}

.animate-bounce-custom {
    animation: bounce-custom 1.4s infinite ease-in-out both;
}

/* Smooth scrolling for messages container */
.scroll-smooth {
    scroll-behavior: smooth;
}

/* Pulse animation for unread messages */
@keyframes pulse-subtle {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.8;
    }
}

.animate-pulse-subtle {
    animation: pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>