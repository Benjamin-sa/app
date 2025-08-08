<template>
    <div class="h-full flex flex-col">
        <!-- Header -->
        <div class="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Messages</h2>
        </div>

        <!-- Search/Filter (Future enhancement) -->
        <div class="p-4 border-b border-gray-200 dark:border-gray-700">
            <input type="text" placeholder="Search conversations..."
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white text-sm" />
        </div>

        <!-- Conversations List -->
        <div class="flex-1 overflow-y-auto">
            <Transition name="fade" appear>
                <div v-if="conversations.length === 0" class="p-6 text-center text-gray-500 dark:text-gray-400">
                    <div class="transform transition-all duration-500 hover:scale-110">
                        <ChatBubbleLeftIcon class="w-12 h-12 mx-auto mb-3 opacity-50" />
                    </div>
                    <p class="font-medium">No conversations yet</p>
                    <p class="text-sm">Start a conversation from someone's profile</p>
                </div>
            </Transition>

            <TransitionGroup name="conversation" tag="div" class="space-y-1 p-2" v-if="conversations.length > 0">
                <div v-for="(conversation, index) in conversations" :key="conversation.id"
                    @click="$emit('select-conversation', conversation)" :style="{ animationDelay: `${index * 50}ms` }"
                    :class="[
                        'p-3 rounded-lg cursor-pointer transition-all duration-200 relative transform hover:scale-[1.02] active:scale-[0.98]',
                        selectedConversationId === conversation.id
                            ? 'bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-500 shadow-md'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:shadow-sm'
                    ]">

                    <div class="flex items-start space-x-3">
                        <!-- Avatar with online status -->
                        <div class="relative flex-shrink-0 transition-transform duration-200 hover:scale-105">
                            <AuthorDisplay :user-id="getOtherParticipant(conversation)" size="sm" :show-name="false" />
                            <!-- Online indicator (placeholder) -->
                            <div
                                class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white dark:border-gray-800 rounded-full animate-pulse">
                            </div>
                        </div>

                        <div class="flex-1 min-w-0">
                            <div class="flex items-center justify-between mb-1">
                                <p
                                    class="font-medium text-gray-900 dark:text-white truncate text-sm transition-colors duration-200">
                                    {{ getOtherParticipantName(conversation) }}
                                </p>
                                <span
                                    class="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 transition-colors duration-200">
                                    {{ formatTimeAgo(conversation.lastMessageAt) }}
                                </span>
                            </div>

                            <div class="flex items-center justify-between">
                                <p
                                    class="text-sm text-gray-600 dark:text-gray-400 truncate flex-1 transition-colors duration-200">
                                    <span v-if="conversation.lastMessageBy === authStore.user?.uid"
                                        class="text-gray-500">You: </span>
                                    {{ conversation.lastMessage || 'No messages yet' }}
                                </p>

                                <!-- Unread badge -->
                                <Transition name="badge" mode="out-in">
                                    <div v-if="getUnreadCount(conversation) > 0" class="bg-primary-600 text-white text-xs rounded-full px-2 py-0.5 ml-2 flex-shrink-0 min-w-[20px] text-center 
                                               transform transition-all duration-300 hover:scale-110 animate-pulse">
                                        {{ getUnreadCount(conversation) }}
                                    </div>
                                </Transition>
                            </div>
                        </div>
                    </div>
                </div>
            </TransitionGroup>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useUsersStore } from '@/stores/users';
import { formatTimeAgo } from '@/utils/helpers';
import AuthorDisplay from '@/components/common/AuthorDisplay.vue';
import { ChatBubbleLeftIcon } from '@heroicons/vue/24/outline';

const props = defineProps({
    conversations: {
        type: Array,
        default: () => []
    },
    selectedConversationId: {
        type: String,
        default: null
    }
});

const emit = defineEmits(['select-conversation']);

const authStore = useAuthStore();
const usersStore = useUsersStore();

const getOtherParticipant = (conversation) => {
    return conversation.participants.find(p => p !== authStore.user?.uid);
};

const getOtherParticipantName = (conversation) => {
    const participantId = getOtherParticipant(conversation);
    if (!participantId) return 'Unknown User';

    return usersStore.getUserDisplayName(participantId);
};

const getUnreadCount = (conversation) => {
    return conversation.unreadCount?.[authStore.user?.uid] || 0;
};

// Preload user data for all participants when conversations change
const loadAllParticipants = () => {
    const participantIds = props.conversations
        .map(conversation => getOtherParticipant(conversation))
        .filter(Boolean);

    // Batch load all participants
    if (participantIds.length > 0) {
        usersStore.getUsers(participantIds);
    }
};

// Watch for conversation changes and preload user data
computed(() => {
    if (props.conversations.length > 0) {
        loadAllParticipants();
    }
    return props.conversations;
});
</script>

<style scoped>
/* Conversation animations */
.conversation-enter-active {
    transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.conversation-leave-active {
    transition: all 0.3s cubic-bezier(0.55, 0.085, 0.68, 0.53);
}

.conversation-enter-from {
    opacity: 0;
    transform: translateX(-20px) scale(0.95);
}

.conversation-leave-to {
    opacity: 0;
    transform: translateX(20px) scale(0.95);
}

.conversation-move {
    transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
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

/* Badge transition */
.badge-enter-active {
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.badge-leave-active {
    transition: all 0.2s ease-in-out;
}

.badge-enter-from {
    opacity: 0;
    transform: scale(0) rotate(180deg);
}

.badge-leave-to {
    opacity: 0;
    transform: scale(0.5);
}
</style>