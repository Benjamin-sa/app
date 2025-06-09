<template>
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LoadingSpinner v-if="loading" />

        <div v-else-if="topic" class="space-y-6">
            <!-- Breadcrumb -->
            <nav class="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <router-link to="/forum" class="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                    Forum
                </router-link>
                <ChevronRightIcon class="w-4 h-4" />
                <span class="text-gray-900 dark:text-gray-100 font-medium">{{ topic.title }}</span>
            </nav>

            <!-- Topic Header -->
            <div
                class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <!-- Topic Status Bar -->
                <div v-if="topic.isPinned || topic.isLocked"
                    class="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 px-6 py-3 border-b border-gray-200 dark:border-gray-600">
                    <div class="flex items-center space-x-3">
                        <span v-if="topic.isPinned"
                            class="inline-flex items-center px-3 py-1 text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 rounded-full border border-amber-200 dark:border-amber-800">
                            <MapPinIcon class="w-3 h-3 mr-1.5" />
                            Pinned Topic
                        </span>
                        <span v-if="topic.isLocked"
                            class="inline-flex items-center px-3 py-1 text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 rounded-full border border-red-200 dark:border-red-800">
                            <LockClosedIcon class="w-3 h-3 mr-1.5" />
                            Topic Locked
                        </span>
                    </div>
                </div>

                <div class="p-6">
                    <div class="flex flex-col lg:flex-row lg:items-start space-y-6 lg:space-y-0 lg:space-x-6">
                        <!-- Vote Section - Desktop (sidebar) -->
                        <div class="hidden lg:flex flex-shrink-0">
                            <VoteButton :target-id="topic.id" target-type="topic" size="lg" />
                        </div>

                        <!-- Main Content -->
                        <div class="flex-1 min-w-0">
                            <!-- Category Badge -->
                            <div class="mb-3">
                                <span v-if="topic.category"
                                    class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border"
                                    :class="getCategoryClass(topic.category)">
                                    {{ getCategoryLabel(topic.category) }}
                                </span>
                            </div>

                            <!-- Title with Mobile Vote Button -->
                            <div class="flex items-start justify-between mb-4">
                                <h1
                                    class="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 leading-tight flex-1 mr-4">
                                    {{ topic.title }}
                                </h1>
                                <!-- Vote Section - Mobile (inline) -->
                                <div class="lg:hidden flex-shrink-0">
                                    <VoteButton :target-id="topic.id" target-type="topic" size="md" />
                                </div>
                            </div>

                            <!-- Author Info -->
                            <div
                                class="flex items-center space-x-3 mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600">
                                <AuthorDisplay :userId="topic.userId" size="lg" />
                                <div class="flex-1 min-w-0">
                                    <div class="text-sm text-gray-500 dark:text-gray-400">
                                        Posted {{ formatDate(topic.createdAt) }}
                                        <span v-if="topic.updatedAt !== topic.createdAt" class="ml-2">
                                            • Updated {{ formatDate(topic.updatedAt) }}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <!-- Content -->
                            <div class="prose dark:prose-invert max-w-none mb-6 text-gray-700 dark:text-gray-300 leading-relaxed"
                                v-html="formatContent(topic.content)">
                            </div>

                            <!-- Images Gallery -->
                            <div v-if="topic.images && topic.images.length > 0" class="mb-6">
                                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div v-for="(image, index) in topic.images" :key="index"
                                        class="relative group cursor-pointer rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200"
                                        @click="openImageModal(image.url)">
                                        <img :src="image.thumbnailUrl || image.url" :alt="`Topic image ${index + 1}`"
                                            class="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200">
                                        <div
                                            class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center">
                                            <MagnifyingGlassIcon
                                                class="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Tags -->
                            <div v-if="topic.tags && topic.tags.length > 0" class="mb-6 flex flex-wrap gap-2">
                                <span v-for="tag in topic.tags" :key="tag"
                                    class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors cursor-pointer">
                                    #{{ tag }}
                                </span>
                            </div>

                            <!-- Topic Stats -->
                            <div
                                class="flex flex-wrap items-center gap-6 text-sm text-gray-500 dark:text-gray-400 pt-6 border-t border-gray-200 dark:border-gray-600">
                                <div class="flex items-center space-x-1">
                                    <EyeIcon class="w-4 h-4" />
                                    <span class="font-medium">{{ formatNumber(topic.viewCount || 0) }}</span>
                                    <span>{{ topic.viewCount === 1 ? 'view' : 'views' }}</span>
                                </div>
                                <div class="flex items-center space-x-1">
                                    <ChatBubbleLeftIcon class="w-4 h-4" />
                                    <span class="font-medium">{{ formatNumber(answerCount) }}</span>
                                    <span>{{ answerCount === 1 ? 'answer' : 'answers' }}</span>
                                </div>
                                <div v-if="topic.lastActivity" class="flex items-center space-x-1">
                                    <ClockIcon class="w-4 h-4" />
                                    <span>Last activity {{ formatDate(topic.lastActivity) }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Actions -->
            <div v-if="authStore.isAuthenticated"
                class="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
                <div class="flex flex-wrap gap-2">
                    <Button v-if="canEditTopic" variant="outline" size="sm" @click="handleEditTopic"
                        class="border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <PencilIcon class="w-4 h-4 mr-2" />
                        Edit Topic
                    </Button>
                    <Button v-if="canDeleteTopic" variant="outline" size="sm" @click="showDeleteConfirm = true"
                        class="text-red-600 dark:text-red-400 border-red-300 dark:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-400 dark:hover:border-red-500">
                        <TrashIcon class="w-4 h-4 mr-2" />
                        Delete
                    </Button>
                </div>

                <Button v-if="!topic.isLocked" @click="showAnswerForm = true"
                    class="bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                    <ChatBubbleLeftIcon class="w-5 h-5 mr-2" />
                    Post Answer
                </Button>
            </div>

            <!-- Answers Section -->
            <div
                class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div
                    class="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border-b border-gray-200 dark:border-gray-600">
                    <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                        <ChatBubbleLeftIcon class="w-5 h-5 mr-2 text-primary-600 dark:text-primary-400" />
                        {{ formatNumber(answerCount) }} {{ answerCount === 1 ? 'Answer' : 'Answers' }}
                    </h2>
                </div>

                <AnswerList :topic-id="topic.id" :topic-author-id="topic.author?.id"
                    @answer-count-changed="updateAnswerCount" />
            </div>

            <!-- Answer Form -->
            <div v-if="showAnswerForm && authStore.isAuthenticated && !topic.isLocked"
                class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
                    <PencilIcon class="w-5 h-5 mr-2 text-primary-600 dark:text-primary-400" />
                    Post Your Answer
                </h3>
                <AnswerForm :topic-id="topic.id" @success="handleAnswerSuccess" @cancel="showAnswerForm = false" />
            </div>
        </div>

        <div v-else-if="!loading" class="text-center py-12">
            <ExclamationTriangleIcon class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Topic not found</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                The topic you're looking for doesn't exist or has been removed.
            </p>
            <div class="mt-6">
                <Button @click="$router.push('/forum')">
                    Back to Forum
                </Button>
            </div>
        </div>

        <!-- Image Modal - Replace the existing Modal with ImageViewer -->
        <ImageViewer v-if="topic?.images && topic.images.length > 0" :images="topic.images"
            :initial-index="selectedImageIndex" :is-open="showImageViewer" @close="closeImageViewer"
            @change="(index) => selectedImageIndex = index" />

        <div v-if="showEditTopic" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            @click="showEditTopic = false">
            <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
                @click.stop>
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Edit Topic</h2>
                    <button @click="showEditTopic = false" class="text-gray-400 hover:text-gray-600">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                <TopicForm v-if="topic" :topic="topic" @cancel="showEditTopic = false"
                    @success="handleTopicEditSuccess" />
            </div>
        </div>

        <!-- Delete Confirmation Modal -->
        <Modal v-if="showDeleteConfirm" title="Delete Topic" @close="showDeleteConfirm = false">
            <div class="space-y-4">
                <p class="text-sm text-gray-600 dark:text-gray-400">
                    Are you sure you want to delete this topic? This action cannot be undone.
                </p>
                <div class="flex justify-end space-x-3">
                    <Button variant="outline" @click="showDeleteConfirm = false">
                        Cancel
                    </Button>
                    <Button variant="danger" @click="handleTopicDelete" :loading="deleting">
                        Delete Topic
                    </Button>
                </div>
            </div>
        </Modal>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notification';
import { apiService } from '@/services/api.service';
import { formatDate, formatContent, formatNumber, getCategoryClass, getCategoryLabel } from '@/utils/helpers';
import Button from '@/components/common/Button.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import Modal from '@/components/common/Modal.vue';
import VoteButton from '@/components/forum/VoteButton.vue';
import AnswerList from '@/components/forum/AnswerList.vue';
import AnswerForm from '@/components/forum/AnswerForm.vue';
import TopicForm from '@/components/forum/TopicForm.vue';
import ImageViewer from '@/components/common/ImageViewer.vue';
import AuthorDisplay from '@/components/common/AuthorDisplay.vue';
import {
    ChevronRightIcon,
    LockClosedIcon,
    EyeIcon,
    MapPinIcon,
    PencilIcon,
    TrashIcon,
    ChatBubbleLeftIcon,
    ExclamationTriangleIcon,
    MagnifyingGlassIcon,
    ClockIcon
} from '@heroicons/vue/24/outline';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();

const topic = ref(null);
const loading = ref(false);
const deleting = ref(false);
const showAnswerForm = ref(false);
const showEditTopic = ref(false);
const showDeleteConfirm = ref(false);
const showImageViewer = ref(false);
const selectedImageIndex = ref(0);
const answerCount = ref(0);

const canEditTopic = computed(() => {
    if (!authStore.user || !topic.value) return false;

    // Author can edit their own topic
    if (authStore.user.id === topic.value.userId) return true;

    // Admin can edit any topic
    if (authStore.user.role === 'admin') return true;

    return false;
});

const canDeleteTopic = computed(() => {
    if (!authStore.user || !topic.value) return false;

    // Author can delete their own topic
    if (authStore.user.id === topic.value.userId) return true;

    // Admin can delete any topic
    if (authStore.user.role === 'admin') return true;

    return false;
});

const loadTopic = async () => {
    try {
        loading.value = true;
        const response = await apiService.get(`/forum/topics/${route.params.id}`);
        topic.value = response.data;
        answerCount.value = response.data.answerCount || 0;
    } catch (error) {
        console.error('Error loading topic:', error);
        topic.value = null;
    } finally {
        loading.value = false;
    }
};

const updateAnswerCount = (newCount) => {
    answerCount.value = newCount;
};

const handleAnswerSuccess = () => {
    showAnswerForm.value = false;
    answerCount.value += 1;
    notificationStore.success('Answer posted!', 'Your answer has been added successfully.');
};

const handleTopicDelete = async () => {
    try {
        deleting.value = true;
        await apiService.delete(`/forum/topics/${topic.value.id}`);
        notificationStore.success('Topic deleted', 'The topic has been removed.');
        router.push('/forum');
    } catch (error) {
        console.error('Error deleting topic:', error);
        notificationStore.error('Delete failed', 'Unable to delete the topic. Please try again.', { duration: 5000 });
    } finally {
        deleting.value = false;
        showDeleteConfirm.value = false;
    }
};

const handleEditTopic = () => {
    if (!topic.value) {
        notificationStore.error('Error', 'Topic data not available. Please refresh the page.');
        return;
    }
    showEditTopic.value = true;
};

const handleTopicEditSuccess = (updatedTopic) => {
    showEditTopic.value = false;
    // Optionally update the local topic data with the response
    if (updatedTopic?.data) {
        topic.value = { ...topic.value, ...updatedTopic.data };
    }
    // Or reload the topic to get fresh data
    loadTopic();
};

const openImageModal = (imageUrl) => {
    const imageIndex = topic.value.images.findIndex(img =>
        (img.url || img) === imageUrl || (img.thumbnailUrl || img) === imageUrl
    );
    selectedImageIndex.value = imageIndex >= 0 ? imageIndex : 0;
    showImageViewer.value = true;
};

const closeImageViewer = () => {
    showImageViewer.value = false;
};



watch(() => route.params.id, (newId, oldId) => {
    if (newId !== oldId) {
        loadTopic();
    }
});

onMounted(() => {
    loadTopic();
});
</script>
