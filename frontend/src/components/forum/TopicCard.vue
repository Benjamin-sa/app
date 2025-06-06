<template>
    <div
        class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
        <div class="flex items-start space-x-4">
            <!-- Vote Section -->
            <div class="flex flex-col items-center space-y-1 flex-shrink-0">
                <VoteButton :value="topic.voteCount || 0" :user-vote="topic.userVote" @vote="handleVote" size="sm" />
            </div>

            <!-- Content Section -->
            <div class="flex-1 min-w-0">
                <!-- Header -->
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <h3 class="text-lg font-medium text-gray-900 mb-2">
                            {{ topic.title }}
                        </h3>

                        <!-- Category Badge -->
                        <span v-if="topic.category"
                            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mb-2"
                            :class="getCategoryClass(topic.category)">
                            {{ getCategoryLabel(topic.category) }}
                        </span>
                    </div>

                    <!-- Status Indicators -->
                    <div class="flex items-center space-x-2 ml-4">
                        <span v-if="topic.isPinned" class="inline-flex items-center text-yellow-600" title="Pinned">
                        </span>
                        <span v-if="topic.isLocked" class="inline-flex items-center text-red-600" title="Locked">
                            <LockClosedIcon class="w-4 h-4" />
                        </span>
                    </div>
                </div>

                <!-- Content Preview -->
                <p class="text-gray-600 text-sm mb-3 line-clamp-2">
                    {{ topic.content }}
                </p>

                <!-- Meta Information -->
                <div class="flex items-center justify-between text-sm text-gray-500">
                    <div class="flex items-center space-x-4">
                        <!-- Author -->
                        <div class="flex items-center space-x-2">
                            <img v-if="topic.author?.avatar" :src="topic.author.avatar" :alt="topic.author.username"
                                class="w-6 h-6 rounded-full">
                            <div v-else
                                class="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-medium">
                                {{ topic.author?.username?.charAt(0).toUpperCase() }}
                            </div>
                            <span class="font-medium">{{ topic.author?.username }}</span>
                        </div>

                        <!-- Created Date -->
                        <span>{{ formatDate(topic.createdAt) }}</span>
                    </div>

                    <!-- Stats -->
                    <div class="flex items-center space-x-4">
                        <!-- Answer Count -->
                        <div class="flex items-center space-x-1">
                            <ChatBubbleLeftIcon class="w-4 h-4" />
                            <span>{{ topic.answerCount || 0 }}</span>
                        </div>

                        <!-- View Count -->
                        <div class="flex items-center space-x-1">
                            <EyeIcon class="w-4 h-4" />
                            <span>{{ topic.viewCount || 0 }}</span>
                        </div>

                        <!-- Last Activity -->
                        <div v-if="topic.lastActivity" class="flex items-center space-x-1">
                            <ClockIcon class="w-4 h-4" />
                            <span>{{ formatDate(topic.lastActivity) }}</span>
                        </div>
                    </div>
                </div>

                <!-- Tags -->
                <div v-if="topic.tags && topic.tags.length > 0" class="mt-3 flex flex-wrap gap-1">
                    <span v-for="tag in topic.tags" :key="tag"
                        class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                        #{{ tag }}
                    </span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notification';
import { apiService } from '@/services/api.service';
import { formatDate } from '@/utils/helpers';
import VoteButton from '@/components/forum/VoteButton.vue';
import {
    ChatBubbleLeftIcon,
    EyeIcon,
    ClockIcon,
    LockClosedIcon
} from '@heroicons/vue/24/outline';

const props = defineProps({
    topic: {
        type: Object,
        required: true
    }
});

const emit = defineEmits(['vote-updated']);

const authStore = useAuthStore();
const notificationStore = useNotificationStore();

const getCategoryClass = (category) => {
    const classes = {
        general: 'bg-blue-100 text-blue-800',
        technical: 'bg-green-100 text-green-800',
        maintenance: 'bg-orange-100 text-orange-800',
        rides: 'bg-purple-100 text-purple-800',
        marketplace: 'bg-yellow-100 text-yellow-800'
    };
    return classes[category] || 'bg-gray-100 text-gray-800';
};

const getCategoryLabel = (category) => {
    const labels = {
        general: 'General',
        technical: 'Technical',
        maintenance: 'Maintenance',
        rides: 'Rides & Events',
        marketplace: 'Marketplace'
    };
    return labels[category] || category;
};

const handleVote = async (voteType) => {
    if (!authStore.isAuthenticated) {
        notificationStore.info('Sign in required', 'Please sign in to vote on topics.');
        return;
    }

    try {
        const response = await apiService.vote(topic.id, 'topic', voteType);


        if (response.success) {
            // Update topic data
            topic.voteCount = response.data.newVoteCount;
            topic.userVote = response.data.userVote;
        }
    } catch (error) {
        console.error('Vote failed:', error);
        // Handle error (show toast, etc.)
    } finally {
        votingLoading.value = false;
    }
};
</script>

<style scoped>
.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
</style>
