<template>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Modern Header with Professional Gradient Background -->
        <div
            class="relative mb-8 p-8 rounded-2xl bg-gradient-to-br from-primary-600 via-primary-700 to-gray-800 shadow-xl">
            <div class="absolute inset-0 bg-black/10 rounded-2xl backdrop-blur-sm"></div>
            <div class="relative z-10">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div class="text-white">
                        <!-- Breadcrumb Navigation -->
                        <nav class="flex items-center space-x-2 text-primary-200 text-sm mb-3">
                            <router-link to="/forum" class="hover:text-white transition-colors">
                                Forum
                            </router-link>
                            <ChevronRightIcon class="w-4 h-4" />
                            <span class="text-white font-medium">{{ getCategoryLabel(currentCategory) }}</span>
                        </nav>

                        <h1 class="text-4xl font-bold mb-2">{{ getCategoryLabel(currentCategory) }}</h1>
                        <p class="text-primary-100 text-lg">
                            {{ getCategoryDescription(currentCategory) }}
                        </p>
                    </div>
                    <div class="mt-6 sm:mt-0">
                        <ActionButton v-if="authStore.isAuthenticated" @click="showCreateTopic = true" variant="white"
                            size="lg" class="w-full sm:w-auto">
                            <PlusIcon class="w-5 h-5 mr-2" />
                            New Topic
                        </ActionButton>
                        <ActionButton v-else @click="$router.push('/login')" variant="outline" size="lg"
                            class="w-full sm:w-auto border-white text-white hover:bg-white hover:text-gray-900">
                            Sign in to post
                        </ActionButton>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modern Filters and Search Card -->
        <div
            class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6 mb-8">
            <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <!-- Enhanced Search -->
                <div class="flex-1 max-w-lg">
                    <div class="relative group">
                        <MagnifyingGlassIcon
                            class="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 transition-colors group-focus-within:text-primary-500" />
                        <input v-model="searchQuery" type="text" placeholder="Search topics..."
                            class="pl-12 pr-4 py-3 w-full border border-gray-300/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 backdrop-blur-sm"
                            @input="debouncedSearch">
                    </div>
                </div>

                <!-- Enhanced Filters -->
                <div class="flex flex-wrap gap-4">
                    <select v-model="sortBy"
                        class="border border-gray-300/50 dark:border-gray-600/50 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white backdrop-blur-sm transition-all duration-200">
                        <option value="createdAt">Latest</option>
                        <option value="updatedAt">Recently Active</option>
                        <option value="voteCount">Most Popular</option>
                    </select>
                </div>
            </div>
        </div>

        <!-- Topics List -->
        <div class="space-y-4">
            <LoadingSection v-if="loading" message="Loading topics..." />

            <div v-else-if="topics.length === 0" class="text-center py-12">
                <ChatBubbleLeftRightIcon class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No topics found</h3>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {{ searchQuery ? 'Try adjusting your search terms.' : 'Be the first to start a discussion!' }}
                </p>
                <div class="mt-6">
                    <Button v-if="authStore.isAuthenticated && !searchQuery" @click="showCreateTopic = true">
                        <PlusIcon class="w-4 h-4 mr-2" />
                        Create First Topic
                    </Button>
                </div>
            </div>

            <TopicCard v-for="topic in topics" :key="topic.id" :topic="topic" />
        </div>

        <!-- Enhanced Pagination -->
        <div v-if="hasMore || currentPage > 1" class="mt-12 flex justify-center">
            <nav
                class="flex items-center space-x-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-4">
                <ActionButton variant="outline" size="sm" :disabled="currentPage === 1"
                    @click="loadPage(currentPage - 1)" class="disabled:opacity-50">
                    Previous
                </ActionButton>

                <span
                    class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100/50 dark:bg-gray-700/50 rounded-lg backdrop-blur-sm">
                    Page {{ currentPage }}
                </span>

                <ActionButton variant="outline" size="sm" :disabled="!hasMore" @click="loadPage(currentPage + 1)"
                    class="disabled:opacity-50">
                    Next
                </ActionButton>
            </nav>
        </div>

        <!-- Enhanced Create Topic Modal -->
        <div v-if="showCreateTopic" class="fixed inset-0 z-50 overflow-y-auto">
            <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <!-- Enhanced Backdrop -->
                <div class="fixed inset-0 transition-opacity bg-black/60 backdrop-blur-sm"
                    @click="showCreateTopic = false"></div>

                <!-- Enhanced Modal Content -->
                <div
                    class="inline-block w-full max-w-2xl p-8 my-8 overflow-hidden text-left align-middle transition-all transform bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl shadow-2xl rounded-2xl relative z-60 border border-gray-200/50 dark:border-gray-700/50">
                    <div class="flex items-center justify-between mb-6">
                        <h3 class="text-2xl font-bold text-gray-900 dark:text-white">Create New Topic</h3>
                        <IconButton @click="showCreateTopic = false" :icon="XMarkIcon" variant="ghost"
                            class="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                            title="Close modal" />
                    </div>
                    <TopicForm :category="currentCategory" @success="handleTopicCreated"
                        @cancel="showCreateTopic = false" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useForumStore } from '@/stores/forum';
import { debounce, getCategoryLabel } from '@/utils/helpers';
import { FORUM_CATEGORIES } from '@/utils/constants.repository.js'
import ActionButton from '@/components/common/buttons/ActionButton.vue';
import IconButton from '@/components/common/buttons/IconButton.vue';
import LoadingSection from '@/components/common/sections/LoadingSection.vue';
import TopicCard from '@/components/forum/TopicCard.vue';
import TopicForm from '@/components/forum/TopicForm.vue';
import {
    PlusIcon,
    MagnifyingGlassIcon,
    ChatBubbleLeftRightIcon,
    XMarkIcon,
    ChevronRightIcon
} from '@heroicons/vue/24/outline';
import { useNavbarStore } from '@/stores/navbar';

const route = useRoute();
const authStore = useAuthStore();
const navbarStore = useNavbarStore();
const forumStore = useForumStore();

// Get current category from route params
const currentCategory = computed(() => route.params.categoryId);

// Local state for this view
const searchQuery = ref('');
const sortBy = ref('createdAt');
const currentPage = ref(1);
const hasMore = ref(false);
const showCreateTopic = ref(false);

// Computed properties from store
const topics = computed(() => {
    if (searchQuery.value) {
        return forumStore.searchResults;
    }
    return forumStore.getTopicsByCategory(currentCategory.value);
});

const loading = computed(() => {
    return forumStore.loadingTopics || forumStore.loadingSearch;
});

const error = computed(() => forumStore.error);

// Category descriptions
const getCategoryDescription = (categoryId) => {
    const descriptions = {
        'general': 'General discussions about motorcycles, riding experiences, and community topics',
        'technical': 'Technical support, troubleshooting, and mechanical discussions',
        'maintenance': 'Maintenance schedules, DIY repairs, and service recommendations',
        'reviews': 'Bike reviews, gear recommendations, and product discussions',
        'events': 'Motorcycle events, meetups, rides, and community gatherings',
        'marketplace': 'Buy, sell, and trade motorcycles, parts, and accessories'
    };
    return descriptions[categoryId] || 'Join the conversation with fellow motorcycle enthusiasts';
};

const debouncedSearch = debounce(() => {
    currentPage.value = 1;
    loadTopics();
}, 300);

const loadTopics = async () => {
    try {
        if (searchQuery.value.trim()) {
            // Search topics within current category
            await forumStore.searchTopics(searchQuery.value, {
                category: currentCategory.value,
                limit: 20
            });
            hasMore.value = false; // Search doesn't support pagination yet
        } else {
            // Load regular topics for current category
            const result = await forumStore.loadTopics({
                page: currentPage.value,
                limit: 20,
                category: currentCategory.value,
                sortBy: sortBy.value,
                clearPrevious: currentPage.value === 1 // Clear when loading first page
            });
            hasMore.value = result.hasMore;
        }
    } catch (error) {
        console.error('Error loading topics:', error);
    }
};

const loadPage = (page) => {
    currentPage.value = page;
    loadTopics();
};

const handleTopicCreated = (topic) => {
    showCreateTopic.value = false;
    // Refresh topics list
    currentPage.value = 1;
    loadTopics();
};

// Watch for filter changes
watch([sortBy], () => {
    currentPage.value = 1;
    loadTopics();
});

// Watch for category changes (when navigating between categories)
watch(() => route.params.categoryId, () => {
    currentPage.value = 1;
    searchQuery.value = '';
    loadTopics();
}, { immediate: true });

onMounted(() => {
    loadTopics();
});
</script>
