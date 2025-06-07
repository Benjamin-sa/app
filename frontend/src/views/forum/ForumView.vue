<template>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
                <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Forum</h1>
                <p class="mt-2 text-gray-600 dark:text-gray-400">
                    Join the conversation with fellow motorcycle enthusiasts
                </p>
            </div>
            <div class="mt-4 sm:mt-0">
                <Button v-if="authStore.isAuthenticated" @click="showCreateTopic = true" class="w-full sm:w-auto">
                    <PlusIcon class="w-4 h-4 mr-2" />
                    New Topic
                </Button>
                <Button v-else @click="$router.push('/login')" variant="outline" class="w-full sm:w-auto">
                    Sign in to post
                </Button>
            </div>
        </div>

        <!-- Filters and Search -->
        <div
            class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <!-- Search -->
                <div class="flex-1 max-w-lg">
                    <div class="relative">
                        <MagnifyingGlassIcon
                            class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                        <input v-model="searchQuery" type="text" placeholder="Search topics..."
                            class="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                            @input="debouncedSearch">
                    </div>
                </div>

                <!-- Filters -->
                <div class="flex flex-wrap gap-3">
                    <select v-model="selectedCategory"
                        class="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                        <option value="">All Categories</option>
                        <option value="general">General Discussion</option>
                        <option value="technical">Technical Help</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="rides">Rides & Events</option>
                        <option value="marketplace">Marketplace</option>
                    </select>

                    <select v-model="sortBy"
                        class="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                        <option value="createdAt">Latest</option>
                        <option value="updatedAt">Recently Active</option>
                        <option value="voteCount">Most Popular</option>
                    </select>
                </div>
            </div>
        </div>

        <!-- Topics List -->
        <div class="space-y-4">
            <LoadingSpinner v-if="loading" />

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

            <TopicCard v-for="topic in topics" :key="topic.id" :topic="topic"
                @click="$router.push(`/forum/topic/${topic.id}`)" />
        </div>

        <!-- Pagination -->
        <div v-if="hasMore || currentPage > 1" class="mt-8 flex justify-center">
            <nav class="flex items-center space-x-2">
                <Button variant="outline" size="sm" :disabled="currentPage === 1" @click="loadPage(currentPage - 1)">
                    Previous
                </Button>

                <span class="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                    Page {{ currentPage }}
                </span>

                <Button variant="outline" size="sm" :disabled="!hasMore" @click="loadPage(currentPage + 1)">
                    Next
                </Button>
            </nav>
        </div>

        <!-- Create Topic Modal - Working Fallback Implementation -->
        <div v-if="showCreateTopic" class="fixed inset-0 z-50 overflow-y-auto">
            <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <!-- Backdrop -->
                <div class="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
                    @click="showCreateTopic = false"></div>

                <!-- Modal Content -->
                <div
                    class="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-lg relative z-60">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-medium text-gray-900 dark:text-white">Create New Topic</h3>
                        <button @click="showCreateTopic = false"
                            class="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
                            <XMarkIcon class="w-6 h-6" />
                        </button>
                    </div>
                    <CreateTopicForm @success="handleTopicCreated" @cancel="showCreateTopic = false" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { debounce } from '@/utils/helpers';
import { apiService } from '@/services/api.service';
import Button from '@/components/common/Button.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import TopicCard from '@/components/forum/TopicCard.vue';
import CreateTopicForm from '@/components/forum/CreateTopicForm.vue';
import {
    PlusIcon,
    MagnifyingGlassIcon,
    ChatBubbleLeftRightIcon,
    XMarkIcon
} from '@heroicons/vue/24/outline';

const authStore = useAuthStore();

// Local state for this view
const topics = ref([]);
const searchQuery = ref('');
const selectedCategory = ref('');
const sortBy = ref('createdAt');
const currentPage = ref(1);
const hasMore = ref(false);
const showCreateTopic = ref(false);
const loading = ref(false);
const error = ref(null);

const debouncedSearch = debounce(() => {
    currentPage.value = 1;
    loadTopics();
}, 300);

const loadTopics = async () => {
    try {
        loading.value = true;
        error.value = null;

        const result = await apiService.getTopics(
            currentPage.value,
            20,
            searchQuery.value,
            selectedCategory.value
        );

        if (result.success) {
            topics.value = result.data.topics || [];
            hasMore.value = result.data.hasMore || false;
        } else {
            error.value = result.message;
            console.error('Error loading topics:', result.message);
            topics.value = [];
            hasMore.value = false;
        }
    } catch (error) {
        error.value = 'Failed to load topics';
        console.error('Error loading topics:', error);
        topics.value = [];
        hasMore.value = false;
    } finally {
        loading.value = false;
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
watch([selectedCategory, sortBy], () => {
    currentPage.value = 1;
    loadTopics();
});

onMounted(() => {
    loadTopics();
});
</script>
