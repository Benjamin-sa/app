<template>
    <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md dark:hover:shadow-gray-900/25 transition-shadow cursor-pointer overflow-hidden">
        <!-- Image Section (if available) -->
        <div v-if="topic.images && topic.images.length > 0" class="relative h-48 sm:h-32 bg-gray-100 dark:bg-gray-700">
            <img :src="topic.images[0].thumbnailUrl || topic.images[0].url" :alt="topic.title"
                class="w-full h-full object-cover">
            <div v-if="topic.images.length > 1"
                class="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-full">
                +{{ topic.images.length - 1 }} more
            </div>
        </div>

        <div class="p-4 sm:p-6">
            <div class="flex items-start space-x-3 sm:space-x-4">

                <!-- Content Section -->
                <div class="flex-1 min-w-0">
                    <!-- Header with Category -->
                    <div class="flex items-start justify-between mb-2">
                        <div class="flex-1">
                            <!-- Category Badge -->
                            <span v-if="topic.category"
                                class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mb-2"
                                :class="getCategoryClass(topic.category)">
                                {{ getCategoryLabel(topic.category) }}
                            </span>

                            <h3 class="text-base sm:text-lg font-medium text-gray-900 dark:text-white leading-tight">
                                {{ topic.title }}
                            </h3>
                        </div>

                        <!-- Status Indicators -->
                        <div class="flex items-center space-x-1 ml-2 flex-shrink-0">
                            <span v-if="topic.isPinned" class="text-yellow-600 dark:text-yellow-500" title="Pinned">
                                📌
                            </span>
                            <span v-if="topic.isLocked" class="text-red-600 dark:text-red-500" title="Locked">
                                <LockClosedIcon class="w-4 h-4" />
                            </span>
                        </div>
                    </div>

                    <!-- Content Preview -->
                    <p class="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2 leading-relaxed">
                        {{ topic.content }}
                    </p>

                    <!-- Author Section -->
                    <div class="flex items-center space-x-2 mb-3">
                        <img v-if="topic.authorAvatar" :src="topic.authorAvatar"
                            :alt="topic.authorDisplayName || topic.author?.username"
                            class="w-6 h-6 rounded-full object-cover">
                        <div v-else
                            class="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-medium">
                            {{ (topic.authorDisplayName || topic.author?.username)?.charAt(0).toUpperCase() }}
                        </div>
                        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {{ topic.authorDisplayName || topic.author?.username }}
                        </span>
                        <span class="text-xs text-gray-500 dark:text-gray-400">
                            • {{ formatDate(topic.createdAt) }}
                        </span>
                    </div>

                    <!-- Stats Row -->
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                            <!-- Answer Count -->
                            <div class="flex items-center space-x-1">
                                <ChatBubbleLeftIcon class="w-4 h-4" />
                                <span>{{ topic.answerCount || 0 }}</span>
                            </div>

                            <!-- View Count -->
                            <div class="flex items-center space-x-1">
                                <EyeIcon class="w-4 h-4" />
                                <span>{{ formatViewCount(topic.viewCount || 0) }}</span>
                            </div>
                        </div>

                        <!-- Last Activity (desktop only) -->
                        <div v-if="topic.lastActivity"
                            class="hidden sm:flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                            <ClockIcon class="w-3 h-3" />
                            <span>{{ formatDate(topic.lastActivity) }}</span>
                        </div>
                    </div>

                    <!-- Tags (if available) -->
                    <div v-if="topic.tags && topic.tags.length > 0" class="mt-3 flex flex-wrap gap-1">
                        <span v-for="tag in topic.tags.slice(0, 3)" :key="tag"
                            class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                            #{{ tag }}
                        </span>
                        <span v-if="topic.tags.length > 3" class="text-xs text-gray-500 dark:text-gray-400">
                            +{{ topic.tags.length - 3 }} more
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>

import { formatDate, getCategoryClass, getCategoryLabel } from '@/utils/helpers';
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

const formatViewCount = (count) => {
    if (count >= 1000000) {
        return (count / 1000000).toFixed(1) + 'M';
    } else if (count >= 1000) {
        return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
};

</script>

<style scoped>
.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
</style>
