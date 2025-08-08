<template>
    <div class="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 cursor-pointer"
        @click="$router.push(`/forum/topic/${topic.id}`)">



        <div class="p-4 sm:p-5 space-y-3">
            <!-- Category and Status -->
            <div class="flex items-center justify-between">
                <span v-if="topic.category" class="inline-flex items-center space-x-1">
                    <div class="w-2 h-2 bg-primary-500 rounded-full"></div>
                    <span class="text-sm font-medium text-primary-600 dark:text-primary-400">{{
                        getCategoryLabel(topic.category) }}</span>
                </span>
                <div class="flex items-center space-x-2">
                    <span v-if="topic.isPinned"
                        class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                        <MapPinIcon class="w-3 h-3 mr-1" />
                        Pinned
                    </span>
                    <span v-if="topic.isLocked"
                        class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                        <LockClosedIcon class="w-3 h-3 mr-1" />
                        Locked
                    </span>
                </div>
            </div>

            <!-- Topic Title -->
            <h3
                class="font-bold text-gray-900 dark:text-white text-lg leading-tight line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {{ topic.title }}
            </h3>

            <!-- Content Preview -->
            <p class="text-gray-600 dark:text-gray-400 text-sm leading-relaxed line-clamp-2">
                {{ topic.excerpt || (topic.content ? topic.content.replace(/<[^>]*>/g, '').substring(0, 120) + '...' :
                    '') }}
            </p>

            <!-- Author Section -->
            <div class="flex items-center space-x-2">
                <AuthorDisplay :userId="topic.authorId || topic.userId" size="sm" />
                <span class="text-gray-500 dark:text-gray-400 text-xs">•</span>
                <time class="text-gray-500 dark:text-gray-400 text-xs">{{ formatDate(topic.createdAt) }}</time>
            </div>

            <!-- Stats Row -->
            <div class="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                <div class="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <div class="flex items-center space-x-1">
                        <ChatBubbleLeftIcon class="w-4 h-4" />
                        <span class="font-medium">{{ topic.answerCount || 0 }}</span>
                    </div>
                    <div class="flex items-center space-x-1">
                        <EyeIcon class="w-4 h-4" />
                        <span class="font-medium">{{ formatViewCount(topic.viewCount || 0) }}</span>
                    </div>
                </div>

                <!-- Share Button -->
                <ActionButton @click.stop="sharePost" :icon="ShareIcon"
                    :activeClasses="'p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-primary-500'"
                    :inactiveClasses="'p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-primary-500'" />
            </div>

            <!-- Tags (if available) -->
            <div v-if="topic.tags && topic.tags.length > 0" class="flex flex-wrap gap-1.5">
                <span v-for="tag in topic.tags.slice(0, 3)" :key="tag"
                    class="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    #{{ tag }}
                </span>
                <span v-if="topic.tags.length > 3"
                    class="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                    +{{ topic.tags.length - 3 }} more
                </span>
            </div>
        </div>
    </div>
</template>

<script setup>
import { useNotificationStore } from '@/stores/ui/notification';
import { formatDate, getCategoryLabel } from '@/utils/helpers';
import ActionButton from '@/components/common/buttons/ActionButton.vue';
import AuthorDisplay from '@/components/common/AuthorDisplay.vue';
import {
    ChatBubbleLeftIcon,
    EyeIcon,
    LockClosedIcon,
    MapPinIcon,
    ShareIcon,
} from '@heroicons/vue/24/outline';

const props = defineProps({
    topic: {
        type: Object,
        required: true
    }
});

const notificationStore = useNotificationStore();

const formatViewCount = (count) => {
    if (count >= 1000000) {
        return (count / 1000000).toFixed(1) + 'M';
    } else if (count >= 1000) {
        return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
};

const sharePost = () => {
    if (navigator.share) {
        navigator.share({
            title: props.topic.title,
            url: window.location.origin + `/forum/topic/${props.topic.id}`
        });
    } else {
        // Fallback to clipboard
        navigator.clipboard.writeText(window.location.origin + `/forum/topic/${props.topic.id}`);
        notificationStore.success('Link copied', 'Topic link copied to clipboard');
    }
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
