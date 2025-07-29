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
                            {{ category.topicCount || 0 }} topics
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

        <!-- Recent Activity -->
        <div class="p-6">
            <div v-if="category.lastActivity" class="space-y-3">
                <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">Recent Activity</h4>

                <div class="flex items-center space-x-3">
                    <div class="flex-shrink-0">
                        <img v-if="category.lastActivity.userAvatar" :src="category.lastActivity.userAvatar"
                            :alt="category.lastActivity.userName" class="w-8 h-8 rounded-full object-cover">
                        <div v-else
                            class="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                            <UserIcon class="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </div>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm text-gray-900 dark:text-white font-medium truncate">
                            {{ category.lastActivity.topicTitle }}
                        </p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">
                            by {{ category.lastActivity.userName }} • {{
                                formatRelativeTime(category.lastActivity.timestamp) }}
                        </p>
                    </div>
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
import { getCategoryLabel } from '@/utils/helpers';
import { formatRelativeTime } from '@/utils/helpers';
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
