<template>
    <div class="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 cursor-pointer"
        @click="$router.push(`/forum/category/${category.id}`)">

        <!-- Category Header with Gradient -->
        <div class="relative p-6 bg-gradient-to-br from-primary-500 via-accent-500 to-accent-600">
            <div class="absolute inset-0 bg-black/10 backdrop-blur-sm"></div>
            <div class="relative z-10">
                <!-- Category Icon and Name -->
                <div class="flex items-center space-x-4 mb-4">
                    <div class="flex-shrink-0">
                        <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                            <component :is="getCategoryIcon(category.id)" class="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <div>
                        <h3 class="text-xl font-bold text-white">{{ getCategoryLabel(category.id) }}</h3>
                        <p class="text-primary-100 text-sm">{{ category.description }}</p>
                    </div>
                </div>

                <!-- Quick Stats -->
                <div class="flex items-center justify-between text-white/90">
                    <div class="flex items-center space-x-4 text-sm">
                        <span class="flex items-center">
                            <ChatBubbleLeftIcon class="w-4 h-4 mr-1" />
                            {{ actualTopicCount }} topics
                        </span>
                        <span class="flex items-center">
                            <EyeIcon class="w-4 h-4 mr-1" />
                            {{ category.totalViews || 0 }} views
                        </span>
                    </div>
                    <ChevronRightIcon
                        class="w-5 h-5 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all duration-200" />
                </div>
            </div>
        </div>

        <!-- Recent Topics -->
        <div class="p-6">
            <div v-if="categoryTopics.length > 0" class="space-y-3">
                <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">Recent Topics</h4>

                <!-- Display up to 3 recent topics -->
                <div v-for="topic in categoryTopics.slice(0, 3)" :key="topic.id"
                    class="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                    @click.stop="$router.push(`/forum/topic/${topic.id}`)">

                    <div class="flex-1 min-w-0">
                        <p class="text-base text-gray-900 dark:text-white font-semibold truncate mb-1">
                            {{ topic.title }}
                        </p>
                        <div class="flex items-center justify-between">
                            <div class="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                <AuthorDisplay v-if="topic.userId" :userId="topic.userId" size="sm" :showName="true"
                                    class="ml-1" />
                                <span v-else>Unknown</span>
                                <span class="mx-1">•</span>
                                <span>{{ formatRelativeTime(topic.createdAt) }}</span>
                            </div>
                            <div v-if="topic.answerCount > 0" class="flex items-center text-xs text-gray-400">
                                <ChatBubbleLeftIcon class="w-3 h-3 mr-1" />
                                {{ topic.answerCount }}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Show more link if there are more topics -->
                <div v-if="categoryTopics.length > 3" class="text-center pt-2">
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                        +{{ categoryTopics.length - 3 }} more topics
                    </p>
                </div>
            </div>

            <div v-else class="text-center py-4">
                <div class="text-gray-400 dark:text-gray-500 mb-2">
                    <ChatBubbleLeftIcon class="w-8 h-8 mx-auto" />
                </div>
                <p class="text-sm text-gray-500 dark:text-gray-400">No discussions yet</p>
                <p class="text-xs text-gray-400 dark:text-gray-500">Be the first to start a conversation!</p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { useForumStore } from '@/stores/forum';
import { useTopicsWithUsers } from '@/composables/useTopicsWithUsers';
import { getCategoryLabel } from '@/utils/helpers';
import { formatRelativeTime } from '@/utils/helpers';
import AuthorDisplay from '@/components/common/AuthorDisplay.vue';
import {
    ChatBubbleLeftIcon,
    EyeIcon,
    ChevronRightIcon,
    UserIcon,
    WrenchScrewdriverIcon,
    ChatBubbleBottomCenterTextIcon,
    CogIcon,
    StarIcon,
    CalendarIcon,
    ShoppingBagIcon
} from '@heroicons/vue/24/outline';

const props = defineProps({
    category: {
        type: Object,
        required: true
    }
});

// Initialize forum store
const forumStore = useForumStore();

// Get topics for this category
const categoryTopics = computed(() => {
    return forumStore.getTopicsByCategory(props.category.id);
});

// Use composable to enhance topics with user data
const { topicsWithUsers } = useTopicsWithUsers(categoryTopics);

// Get actual topic count from store instead of relying on category stats
const actualTopicCount = computed(() => {
    return topicsWithUsers.value.length;
});

// Map category IDs to their respective icons
const getCategoryIcon = (categoryId) => {
    const iconMap = {
        'general': ChatBubbleBottomCenterTextIcon,
        'technical': WrenchScrewdriverIcon,
        'maintenance': CogIcon,
        'reviews': StarIcon,
        'events': CalendarIcon,
        'marketplace': ShoppingBagIcon
    };
    return iconMap[categoryId] || ChatBubbleLeftIcon;
};
</script>
