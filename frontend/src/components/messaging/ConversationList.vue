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
            <div v-if="conversations.length === 0" class="p-6 text-center text-gray-500 dark:text-gray-400">
                <ChatBubbleLeftIcon class="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p class="font-medium">No conversations yet</p>
                <p class="text-sm">Start a conversation from someone's profile</p>
            </div>

            <div v-else class="space-y-1 p-2">
                <div v-for="conversation in conversations" :key="conversation.id"
                    @click="$emit('select-conversation', conversation)" :class="[
                        'p-3 rounded-lg cursor-pointer transition-colors relative',
                        selectedConversationId === conversation.id
                            ? 'bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-500'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    ]">

                    <div class="flex items-start space-x-3">
                        <!-- Avatar with online status -->
                        <div class="relative flex-shrink-0">
                            <AuthorDisplay :user-id="getOtherParticipant(conversation)" size="sm" :show-name="false" />
                            <!-- Online indicator (placeholder) -->
                            <div
                                class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white dark:border-gray-800 rounded-full">
                            </div>
                        </div>

                        <div class="flex-1 min-w-0">
                            <div class="flex items-center justify-between mb-1">
                                <p class="font-medium text-gray-900 dark:text-white truncate text-sm">
                                    {{ getOtherParticipantName(conversation) }}
                                </p>
                                <span class="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                                    {{ formatTimeAgo(conversation.lastMessageAt) }}
                                </span>
                            </div>

                            <div class="flex items-center justify-between">
                                <p class="text-sm text-gray-600 dark:text-gray-400 truncate flex-1">
                                    <span v-if="conversation.lastMessageBy === authStore.user?.uid"
                                        class="text-gray-500">You: </span>
                                    {{ conversation.lastMessage || 'No messages yet' }}
                                </p>

                                <!-- Unread badge -->
                                <div v-if="getUnreadCount(conversation) > 0"
                                    class="bg-primary-600 text-white text-xs rounded-full px-2 py-0.5 ml-2 flex-shrink-0 min-w-[20px] text-center">
                                    {{ getUnreadCount(conversation) }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { formatTimeAgo } from '@/utils/helpers';
import { apiService } from '@/services/api.service';
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
const userCache = ref(new Map());

const getOtherParticipant = (conversation) => {
    return conversation.participants.find(p => p !== authStore.user?.uid);
};

const getOtherParticipantName = (conversation) => {
    const participantId = getOtherParticipant(conversation);
    const cachedUser = userCache.value.get(participantId);

    if (cachedUser) {
        return cachedUser.displayName || cachedUser.username || 'Unknown User';
    }

    // Fetch user data if not cached
    fetchUserData(participantId);
    return 'Loading...';
};

const fetchUserData = async (userId) => {
    if (!userId || userCache.value.has(userId)) return;

    try {
        const response = await apiService.get(`/forum/users/profile/${userId}`);
        if (response.success) {
            userCache.value.set(userId, response.data);
        }
    } catch (error) {
        console.error('Failed to fetch user data:', error);
        // Set a fallback so we don't keep trying
        userCache.value.set(userId, { displayName: 'Unknown User' });
    }
};

const getUnreadCount = (conversation) => {
    return conversation.unreadCount?.[authStore.user?.uid] || 0;
};

// Preload user data for all conversations
onMounted(() => {
    props.conversations.forEach(conversation => {
        const participantId = getOtherParticipant(conversation);
        if (participantId) {
            fetchUserData(participantId);
        }
    });
});
</script>