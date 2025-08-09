<template>
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8"
        :style="{ paddingTop: `${navbarStore.navbarHeight + 16}px` }">
        <LoadingSection v-if="loading" message="Loading topic..." />

        <div v-else-if="topic" class="space-y-4 sm:space-y-6">
            <!-- Back Button -->
            <BackButton label="Back to Category" :fallback-path="`/forum/category/${topic?.category || 'general'}`" />

            <!-- Modern Breadcrumb -->
            <BreadcrumbNav :items="[
                { label: 'Forum', path: '/forum' },
                { label: getCategoryLabel(topic.category), path: `/forum/category/${topic.category}` },
                { label: topic.title, path: null }
            ]" />

            <!-- Enhanced Topic Header -->
            <div
                class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
                <!-- Topic Status Bar -->
                <div v-if="topic.isPinned || topic.isLocked"
                    class="bg-gradient-to-r from-primary-50/80 to-primary-100/80 dark:from-primary-900/50 dark:to-primary-800/50 backdrop-blur-sm px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200/50 dark:border-gray-600/50">
                    <div class="flex flex-wrap items-center gap-2 sm:gap-3">
                        <span v-if="topic.isPinned"
                            class="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full shadow-lg">
                            <MapPinIcon class="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                            Pinned Topic
                        </span>
                        <span v-if="topic.isLocked"
                            class="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold bg-gradient-to-r from-primary-700 to-primary-800 text-white rounded-full shadow-lg">
                            <LockClosedIcon class="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                            Topic Locked
                        </span>
                    </div>
                </div>

                <div class="p-4 sm:p-6 lg:p-8">
                    <div class="space-y-6 lg:space-y-8">
                        <!-- Modern Category Badge -->
                        <div> <span v-if="topic.category"
                                class="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 text-white shadow-lg">
                                {{ getCategoryLabel(topic.category) }}
                            </span>
                        </div>

                        <!-- Title without vote button to prevent cutoff -->
                        <div>
                            <h1
                                class="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent leading-tight break-words">
                                {{ topic.title }}
                            </h1>
                        </div>

                        <!-- Enhanced Content with better spacing -->
                        <div class="space-y-6">
                            <div class="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed text-base sm:text-lg prose-sm sm:prose-base break-words overflow-wrap-anywhere"
                                v-html="formatContent(topic.content)">
                            </div>

                            <!-- Enhanced Images Gallery -->
                            <div v-if="topic.images && topic.images.length > 0">
                                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                                    <div v-for="(image, index) in topic.images" :key="index"
                                        class="relative group cursor-pointer rounded-xl sm:rounded-2xl overflow-hidden border border-gray-200/50 dark:border-gray-700/50 hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-xl"
                                        @click="openImageModal(image.url)">
                                        <img :src="image.thumbnailUrl || image.url" :alt="`Topic image ${index + 1}`"
                                            class="w-full h-40 sm:h-48 lg:h-56 object-cover">
                                        <div
                                            class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                                            <div class="bg-white/20 backdrop-blur-sm rounded-full p-2 sm:p-3">
                                                <MagnifyingGlassIcon class="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Enhanced Tags -->
                            <div v-if="topic.tags && topic.tags.length > 0" class="flex flex-wrap gap-2 sm:gap-3">
                                <span v-for="tag in topic.tags" :key="tag"
                                    class="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium bg-gradient-to-r from-primary-50 to-primary-100 text-primary-700 dark:from-primary-900/30 dark:to-primary-800/30 dark:text-primary-400 border border-primary-200/50 dark:border-primary-700/50 hover:from-primary-100 hover:to-primary-200 dark:hover:from-primary-900/50 dark:hover:to-primary-800/50 transition-all duration-200 cursor-pointer hover:scale-105">
                                    #{{ tag }}
                                </span>
                            </div>
                        </div>

                        <!-- Enhanced Author Display -->
                        <div
                            class="p-4 sm:p-6 bg-gradient-to-r from-primary-50/80 to-primary-100/80 dark:from-primary-900/30 dark:to-primary-800/30 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-primary-200/50 dark:border-primary-700/50">
                            <div class="flex items-center space-x-3 sm:space-x-4">
                                <AuthorDisplay :userId="topic.userId" size="lg" />
                                <div class="flex-1 min-w-0">
                                    <div class="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                        Posted {{ formatDate(topic.createdAt) }}
                                        <span v-if="topic.updatedAt !== topic.createdAt"
                                            class="block sm:inline sm:ml-2">
                                            • Updated {{ formatDate(topic.updatedAt) }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Enhanced Topic Stats with vote button integrated -->
                        <div
                            class="flex flex-wrap items-center justify-between gap-4 text-sm pt-4 sm:pt-6 border-t border-gray-200/50 dark:border-gray-600/50">
                            <div class="flex flex-wrap gap-4 sm:gap-8">
                                <div class="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                                    <div class="p-1.5 sm:p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                                        <EyeIcon class="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 dark:text-primary-400" />
                                    </div>
                                    <div>
                                        <span
                                            class="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">{{
                                                formatNumber(topic.viewCount || 0) }}</span>
                                        <span class="ml-1 text-xs sm:text-sm">{{ topic.viewCount === 1 ? 'view' :
                                            'views' }}</span>
                                    </div>
                                </div>
                                <div class="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                                    <div class="p-1.5 sm:p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                                        <ChatBubbleLeftIcon
                                            class="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 dark:text-primary-400" />
                                    </div>
                                    <div>
                                        <span
                                            class="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">{{
                                                formatNumber(answerCount) }}</span>
                                        <span class="ml-1 text-xs sm:text-sm">{{ answerCount === 1 ? 'answer' :
                                            'answers' }}</span>
                                    </div>
                                </div>
                                <div v-if="topic.lastActivity"
                                    class="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                                    <div class="p-1.5 sm:p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                                        <ClockIcon
                                            class="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 dark:text-primary-400" />
                                    </div>
                                    <div>
                                        <span class="text-xs sm:text-sm">Last activity {{ formatDate(topic.lastActivity)
                                        }}</span>
                                    </div>
                                </div>
                            </div>
                            <!-- Vote button positioned on the right, away from title -->
                            <div class="flex-shrink-0">
                                <VoteButton :target-id="topic.id" target-type="topic" size="md" variant="default" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Enhanced Actions -->
            <div v-if="authStore.isAuthenticated"
                class="flex flex-col space-y-3 sm:flex-row sm:justify-between sm:items-center sm:space-y-0 p-4 sm:p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50">
                <div class="flex flex-wrap gap-2 sm:gap-3">
                    <ActionButton v-if="canEditTopic" variant="outline" size="sm" @click="handleEditTopic"
                        class="flex-1 sm:flex-none justify-center">
                        <PencilIcon class="w-4 h-4 mr-2" />
                        Edit Topic
                    </ActionButton>
                    <ActionButton v-if="canDeleteTopic" variant="secondary" size="sm" @click="showDeleteConfirm = true"
                        class="flex-1 sm:flex-none justify-center bg-red-600 hover:bg-red-700 text-white">
                        <TrashIcon class="w-4 h-4 mr-2" />
                        Delete
                    </ActionButton>
                </div>
            </div>

            <!-- Enhanced Answers Section -->
            <div
                class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
                <div
                    class="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 bg-gradient-to-r from-primary-50/80 to-primary-100/80 dark:from-primary-900/50 dark:to-primary-800/50 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-600/50">
                    <h2 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                        <div
                            class="p-1.5 sm:p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg sm:rounded-xl mr-2 sm:mr-3">
                            <ChatBubbleLeftIcon class="w-5 h-5 sm:w-6 sm:h-6 text-primary-600 dark:text-primary-400" />
                        </div>
                        {{ formatNumber(answerCount) }} {{ answerCount === 1 ? 'Answer' : 'Answers' }}
                    </h2>
                </div>

                <AnswerList :topic-id="topic.id" :topic-author-id="topic.userId"
                    @answer-count-changed="updateAnswerCount" @reply-to="handleReplyTo" />

                <!-- Post Answer section - inline like Reddit -->
                <div v-if="authStore.isAuthenticated && !topic.isLocked"
                    class="border-t border-gray-200/50 dark:border-gray-700/50">

                    <!-- Show/Hide Answer Form Button -->
                    <div v-if="!showAnswerForm" class="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                        <ActionButton @click="showAnswerForm = true" size="md"
                            class="w-full sm:w-auto bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 hover:from-primary-700 hover:via-primary-800 hover:to-primary-900 text-white shadow-lg">
                            <ChatBubbleLeftIcon class="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                            Post Answer
                        </ActionButton>
                    </div>

                    <!-- Inline Answer Form -->
                    <div v-if="showAnswerForm"
                        class="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 bg-gray-50/50 dark:bg-gray-900/50">
                        <div v-if="replyingTo"
                            class="mb-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                            Replying to <span class="font-medium text-gray-900 dark:text-gray-200">@{{ replyingTo.userId
                            }}</span>
                            <button class="underline hover:text-primary-600" @click="clearReply">clear</button>
                        </div>

                        <AnswerForm v-if="topic" :topic-id="topic.id" :parent-answer-id="replyingTo?.id"
                            @success="handleAnswerSuccess" @cancel="handleAnswerCancel" />
                    </div>
                </div>
            </div>
        </div>

        <div v-else-if="!loading" class="text-center py-12">
            <ExclamationTriangleIcon class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Topic not found</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                The topic you're looking for doesn't exist or has been removed.
            </p>
            <div class="mt-6">
                <ActionButton @click="$router.push('/forum')" variant="primary">
                    Back to Categories
                </ActionButton>
            </div>
        </div>

        <!-- Image Modal - Replace the existing Modal with ImageViewer -->
        <ImageViewer v-if="topic?.images && topic.images.length > 0" :images="topic.images"
            :initial-index="selectedImageIndex" :is-open="showImageViewer" @close="closeImageViewer"
            @change="(index) => selectedImageIndex = index" />

        <!-- Edit Topic Modal -->
        <Modal v-model="showEditTopic" title="Edit Topic" size="full">
            <TopicForm v-if="topic" :topic="topic" @success="handleTopicEditSuccess" @cancel="showEditTopic = false" />
        </Modal>

        <!-- Delete Confirmation Modal -->
        <Modal v-model="showDeleteConfirm" title="Delete Topic" @close="showDeleteConfirm = false">
            <div class="space-y-4">
                <p class="text-sm text-gray-600 dark:text-gray-400">
                    Are you sure you want to delete this topic? This action cannot be undone.
                </p>
                <div class="flex justify-end space-x-3">
                    <ActionButton variant="outline" @click="showDeleteConfirm = false">
                        Cancel
                    </ActionButton>
                    <ActionButton variant="secondary" @click="handleTopicDelete" :loading="deleting"
                        class="bg-red-600 hover:bg-red-700 text-white">
                        Delete Topic
                    </ActionButton>
                </div>
            </div>
        </Modal>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useForumStore } from '@/stores/forum';
import { useNotificationStore } from '@/stores/ui/notification';
import { formatDate, formatContent, formatNumber, getCategoryLabel } from '@/utils/helpers';
import ActionButton from '@/components/common/buttons/ActionButton.vue';
import BreadcrumbNav from '@/components/common/nav/BreadcrumbNav.vue';
import LoadingSection from '@/components/common/sections/LoadingSection.vue';
import Modal from '@/components/common/Modal.vue';
import VoteButton from '@/components/forum/VoteButton.vue';
import AnswerList from '@/components/forum/AnswerList.vue';
import AnswerForm from '@/components/forum/AnswerForm.vue';
import TopicForm from '@/components/forum/TopicForm.vue';
import ImageViewer from '@/components/common/images/ImageViewer.vue';
import AuthorDisplay from '@/components/common/AuthorDisplay.vue';
import BackButton from '@/components/common/buttons/BackButton.vue';
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
import { useNavbarStore } from '@/stores/ui/navbar';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const forumStore = useForumStore();
const notificationStore = useNotificationStore();
const navbarStore = useNavbarStore();

// Local state
const showAnswerForm = ref(false);
const showEditTopic = ref(false);
const showDeleteConfirm = ref(false);
const showImageViewer = ref(false);
const selectedImageIndex = ref(0);
const deleting = ref(false);
const replyingTo = ref(null);

// Computed properties from store
const topic = computed(() => forumStore.getTopic(route.params.id));
const loading = computed(() => forumStore.isLoadingTopic(route.params.id));
const answerCount = computed(() => {
    const answers = forumStore.getTopicAnswers(route.params.id);
    return answers.length;
});

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
        await forumStore.loadTopic(route.params.id);
    } catch (error) {
        console.error('Error loading topic:', error);
        notificationStore.error('Failed to load topic', 'Please try refreshing the page.');
    }
};

const updateAnswerCount = (newCount) => {
    // This is now handled automatically by the store
    // when answers are loaded/added/removed
};

const handleReplyTo = (answer) => {
    replyingTo.value = answer;
    showAnswerForm.value = true;
};

const clearReply = () => {
    replyingTo.value = null;
};

const handleAnswerCancel = () => {
    showAnswerForm.value = false;
    replyingTo.value = null;
};

const handleAnswerSuccess = () => {
    showAnswerForm.value = false;
    replyingTo.value = null;
    // The store will automatically update the answer count
    notificationStore.success('Answer posted!', 'Your answer has been added successfully.');
};

const handleTopicDelete = async () => {
    deleting.value = true;
    try {
        const success = await forumStore.deleteTopic(topic.value.id);
        if (success) {
            notificationStore.success('Topic deleted', 'The topic has been removed.');
            router.push('/forum');
        } else {
            notificationStore.error('Delete failed', 'Unable to delete the topic. Please try again.');
        }
    } catch (error) {
        console.error('Error deleting topic:', error);
        notificationStore.error('Delete failed', 'Unable to delete the topic. Please try again.');
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
    notificationStore.success('Topic updated', 'Your topic has been updated successfully.');
    // The store will automatically have the updated topic
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
