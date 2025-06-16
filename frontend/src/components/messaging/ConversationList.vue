<template>
    <div class="space-y-2">
        <div v-for="conversation in conversations" :key="conversation.id"
            @click="$emit('select-conversation', conversation)"
            class="p-4 bg-white dark:bg-gray-800 rounded-lg border cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">

            <div class="flex items-center space-x-3">
                <AuthorDisplay :user-id="getOtherParticipant(conversation)" size="sm" />

                <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between">
                        <p class="font-medium text-gray-900 dark:text-white truncate">
                            {{ getOtherParticipantName(conversation) }}
                        </p>
                        <span class="text-sm text-gray-500">
                            {{ formatDate(conversation.lastMessageAt) }}
                        </span>
                    </div>

                    <p class="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {{ conversation.lastMessage }}
                    </p>
                </div>

                <div v-if="conversation.unreadCount?.[authStore.user?.uid] > 0"
                    class="bg-primary-600 text-white text-xs rounded-full px-2 py-1">
                    {{ conversation.unreadCount[authStore.user.uid] }}
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth';
import { formatDate } from '@/utils/helpers';
import AuthorDisplay from '@/components/common/AuthorDisplay.vue';

const props = defineProps({
    conversations: {
        type: Array,
        default: () => []
    }
});

const emit = defineEmits(['select-conversation']);

const authStore = useAuthStore();

const getOtherParticipant = (conversation) => {
    return conversation.participants.find(p => p !== authStore.user?.uid);
};

const getOtherParticipantName = (conversation) => {
    // This would need to be enhanced to fetch user names
    return 'User'; // Placeholder
};
</script>