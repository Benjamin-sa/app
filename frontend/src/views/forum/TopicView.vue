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
                        <!-- Vote Section -->
                        <div class="flex-shrink-0 order-2 lg:order-1">
                            <VoteButton :value="topic.votes?.score || 0" :user-vote="topic.userVote"
                                :loading="votingLoading" @vote="(voteData) => handleVote(topic.id, 'topic', voteData)"
                                size="lg" />
                        </div>

                        <!-- Main Content -->
                        <div class="flex-1 min-w-0 order-1 lg:order-2">
                            <!-- Category Badge -->
                            <div class="mb-3">
                                <span v-if="topic.category"
                                    class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border"
                                    :class="getCategoryClass(topic.category)">
                                    {{ getCategoryLabel(topic.category) }}
                                </span>
                            </div>

                            <!-- Title -->
                            <h1
                                class="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4 leading-tight">
                                {{ topic.title }}
                            </h1>

                            <!-- Author Info -->
                            <div
                                class="flex items-center space-x-3 mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600">
                                <img v-if="topic.authorAvatar" :src="topic.authorAvatar" :alt="topic.authorDisplayName"
                                    class="w-12 h-12 rounded-full border-2 border-white dark:border-gray-600 shadow-sm">
                                <div v-else
                                    class="w-12 h-12 rounded-full bg-primary-500 dark:bg-primary-600 flex items-center justify-center text-white text-lg font-semibold border-2 border-white dark:border-gray-600 shadow-sm">
                                    {{ topic.authorDisplayName?.charAt(0).toUpperCase() }}
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="font-semibold text-gray-900 dark:text-gray-100 text-lg">{{
                                        topic.authorDisplayName }}</div>
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
                                    <span class="font-medium">{{ formatNumber(topic.answerCount || 0) }}</span>
                                    <span>{{ topic.answerCount === 1 ? 'answer' : 'answers' }}</span>
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
                        {{ formatNumber(answers.length) }} {{ answers.length === 1 ? 'Answer' : 'Answers' }}
                    </h2>
                </div>

                <AnswerList :answers="answers" :loading="answersLoading" :topic-author-id="topic.author?.id"
                    @vote="(answerId, voteData) => handleVote(answerId, 'answer', voteData)" @edit="handleAnswerEdit"
                    @delete="handleAnswerDelete" />
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

        <!-- Image Modal -->
        <Modal v-if="selectedImage" title="" @close="selectedImage = null" size="xl">
            <div class="text-center">
                <img :src="selectedImage" alt="Full size image" class="max-w-full max-h-[80vh] mx-auto rounded-lg">
            </div>
        </Modal>

        <!-- Debug: Simple test modal -->
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
                <EditTopicForm v-if="topic" :topic="topic" @success="handleTopicUpdated"
                    @cancel="showEditTopic = false" />
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
import EditTopicForm from '@/components/forum/EditTopicForm.vue';
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
const answers = ref([]);
const loading = ref(false);
const answersLoading = ref(false);
const deleting = ref(false);
const votingLoading = ref(false);
const showAnswerForm = ref(false);
const showEditTopic = ref(false);
const showDeleteConfirm = ref(false);
const selectedImage = ref(null);
const editLoading = ref(false);

const canEditTopic = computed(() => {
    if (!authStore.user || !topic.value) return false;

    // Author can edit their own topic
    if (authStore.user.id === topic.value.authorId) return true;

    // Admin can edit any topic
    if (authStore.user.role === 'admin') return true;

    return false;
});

const canDeleteTopic = computed(() => {
    if (!authStore.user || !topic.value) return false;

    // Author can delete their own topic
    if (authStore.user.id === topic.value.authorId) return true;

    // Admin can delete any topic
    if (authStore.user.role === 'admin') return true;

    return false;
});

// Unified voting function for both topics and answers
const handleVote = async (targetId, targetType, { voteType, previousVote }) => {
    if (!authStore.isAuthenticated) {
        notificationStore.info('Sign in required', 'Please sign in to vote.');
        return;
    }

    try {
        // Set loading state based on target type
        if (targetType === 'topic') {
            votingLoading.value = true;
        }

        const response = await apiService.vote(targetId.trim(), targetType, voteType);

        if (response.success) {
            // Update the appropriate data based on target type
            if (targetType === 'topic') {
                topic.value.votes = { score: response.data.newVoteCount };
                topic.value.userVote = response.data.userVote;
            } else if (targetType === 'answer') {
                const answerIndex = answers.value.findIndex(a => a.id === targetId);
                if (answerIndex !== -1) {
                    answers.value[answerIndex].votes = { score: response.data.newVoteCount };
                    answers.value[answerIndex].userVote = response.data.userVote;
                }
            }

            // Show user-friendly feedback
            const targetName = targetType === 'topic' ? 'topic' : 'answer';
            if (voteType === null) {
                notificationStore.success('Vote removed', `Your vote on this ${targetName} has been removed.`);
            } else if (previousVote) {
                notificationStore.success('Vote changed', `Changed from ${previousVote}vote to ${voteType}vote on this ${targetName}.`);
            } else {
                notificationStore.success('Vote recorded', `Your ${voteType}vote on this ${targetName} has been recorded.`);
            }
        }
    } catch (error) {
        const targetName = targetType === 'topic' ? 'topic' : 'answer';
        notificationStore.error('Vote failed', `Unable to record your vote on this ${targetName}. Please try again.`, { duration: 5000 });
    } finally {
        if (targetType === 'topic') {
            votingLoading.value = false;
        }
    }
};

const loadTopic = async () => {
    try {
        loading.value = true;
        const response = await apiService.get(`/forum/topics/${route.params.id}`);
        topic.value = response.data;

        // If user is authenticated, get their vote status
        if (authStore.isAuthenticated && topic.value) {
            await loadUserVote();
        }
    } catch (error) {
        console.error('Error loading topic:', error);
        topic.value = null;
    } finally {
        loading.value = false;
    }
};

const loadUserVote = async () => {
    try {
        const response = await apiService.getUserVote(topic.value.id);
        if (response.success) {
            topic.value.userVote = response.data;
        }
    } catch (error) {
        console.error('Error loading user vote:', error);
        // Don't throw error, just log it
    }
};

const loadAnswers = async () => {
    try {
        answersLoading.value = true;
        const response = await apiService.get(`/forum/topics/${route.params.id}/answers`);
        answers.value = response.data.answers || [];
        // Load user votes for answers if authenticated
        if (authStore.isAuthenticated && answers.value.length > 0) {
            await loadAnswerVotes();
        }
    } catch (error) {
        console.error('Error loading answers:', error);
    } finally {
        answersLoading.value = false;
    }
};

const loadAnswerVotes = async () => {
    try {
        const votePromises = answers.value.map(async (answer) => {
            try {
                const response = await apiService.getUserVote(answer.id);
                if (response.success) {
                    answer.userVote = response.data;
                }
            } catch (error) {
                console.error('Error loading answer vote:', error);
            }
        });
        await Promise.all(votePromises);
    } catch (error) {
        console.error('Error loading answer votes:', error);
    }
};

const handleAnswerSuccess = (newAnswer) => {
    answers.value.push(newAnswer);
    showAnswerForm.value = false;
    notificationStore.success('Answer posted!', 'Your answer has been added successfully.');
};

const handleTopicUpdated = (updatedTopic) => {
    topic.value = { ...topic.value, ...updatedTopic };
    showEditTopic.value = false;
    notificationStore.success('Topic updated!', 'Your changes have been saved.');
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

const handleAnswerEdit = (answerId) => {
    // Implementation for editing answers
    console.log('Edit answer:', answerId);
};

const handleAnswerDelete = async (answerId) => {
    try {
        await apiService.delete(`/forum/answers/${answerId}`);
        answers.value = answers.value.filter(a => a.id !== answerId);
        notificationStore.success('Answer deleted', 'The answer has been removed.');
    } catch (error) {
        console.error('Error deleting answer:', error);
        notificationStore.error('Delete failed', 'Unable to delete the answer. Please try again.', { duration: 5000 });
    }
};

const handleEditTopic = () => {
    console.log('Edit topic clicked, topic:', topic.value); // Debug log
    if (!topic.value) {
        notificationStore.error('Error', 'Topic data not available. Please refresh the page.');
        return;
    }
    console.log('Setting showEditTopic to true'); // Debug log
    showEditTopic.value = true;
};

const openImageModal = (imageUrl) => {
    selectedImage.value = imageUrl;
};

watch(() => route.params.id, (newId, oldId) => {
    if (newId !== oldId) {
        loadTopic();
        loadAnswers();
    }
});

// Watch for authentication changes to load votes
watch(() => authStore.isAuthenticated, (isAuth) => {
    if (isAuth && topic.value) {
        loadUserVote();
        if (answers.value.length > 0) {
            loadAnswerVotes();
        }
    }
});

onMounted(() => {
    loadTopic();
    loadAnswers();
});
</script>
