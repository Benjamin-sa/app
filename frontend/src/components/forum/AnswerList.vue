<template>
    <LoadingSection v-if="loading" message="Loading answers..." />

    <div v-else-if="answers.length === 0" class="p-6 text-center text-gray-500 dark:text-gray-400">
        <ChatBubbleLeftIcon class="mx-auto h-8 w-8 text-gray-400 dark:text-gray-500 mb-2" />
        <p>No answers yet. Be the first to respond!</p>
    </div>

    <div v-else class="space-y-4">
        <div v-for="answer in answers" :key="answer.id"
            class="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
            <div class="p-6">
                <div class="flex flex-col gap-4">
                    <!-- Content -->
                    <div class="flex-1 min-w-0">
                        <!-- Answer Content -->
                        <div class="prose dark:prose-invert max-w-none mb-4" v-html="formatContent(answer.content)">
                        </div>

                        <!-- Answer Images -->
                        <div v-if="answer.images && answer.images.length > 0"
                            class="mb-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <img v-for="image in answer.images" :key="image.id" :src="image.url"
                                :alt="image.name || 'Answer image'"
                                class="w-full h-32 object-cover rounded-lg border border-gray-200/50 dark:border-gray-600/50 cursor-pointer hover:opacity-90 hover:scale-[1.02] transition-all duration-200"
                                @click="openImageModal(image)" />
                        </div>

                        <!-- Meta Information -->
                        <div
                            class="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                            <div class="flex items-center space-x-4">
                                <!-- Author -->
                                <AuthorDisplay :user-id="answer.userId" size="sm" />

                                <!-- Created Date -->
                                <span class="flex items-center">
                                    {{ formatDate(answer.createdAt) }}
                                </span>

                                <!-- Edited -->
                                <span v-if="answer.editedAt" class="text-xs text-gray-500 dark:text-gray-500 italic">
                                    (edited {{ formatDate(answer.editedAt) }})
                                </span>
                            </div>

                            <!-- Actions -->
                            <div v-if="canEditAnswer(answer)" class="flex items-center space-x-2">
                                <button @click="editAnswer(answer.id)"
                                    class="p-2 text-gray-400 hover:text-primary-600 dark:text-gray-500 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
                                    title="Edit answer">
                                    <PencilIcon class="w-4 h-4" />
                                </button>
                                <button @click="deleteAnswer(answer.id)"
                                    class="p-2 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                                    title="Delete answer">
                                    <TrashIcon class="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <!-- Best Answer Badge -->
                        <div v-if="answer.isBestAnswer"
                            class="mt-2 inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                            <CheckCircleIcon class="w-3 h-3 mr-1" />
                            Best Answer
                        </div>

                        <!-- Mark as Best Answer Button -->
                        <div v-else-if="canMarkAsBestAnswer(answer)" class="mt-2">
                            <button @click="markAsBestAnswer(answer.id)"
                                class="text-sm text-green-600 hover:text-green-700 dark:text-green-500 dark:hover:text-green-400 font-medium">
                                Mark as best answer
                            </button>
                        </div>
                    </div>

                    <!-- Vote Section - Positioned at bottom -->
                    <div class="flex justify-start pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
                        <VoteButton :target-id="answer.id" target-type="answer" variant="compact" size="sm" />
                    </div>
                </div>
            </div>
        </div>

        <!-- Edit Answer Modal -->
        <Modal v-model="showEditModal" title="Edit Answer" size="xl">
            <AnswerForm v-if="editingAnswer" :topic-id="props.topicId" :answer="editingAnswer"
                @success="handleEditSuccess" @cancel="cancelEdit" />
        </Modal>

        <!-- Delete Confirmation Modal -->
        <Modal v-model="showDeleteConfirm" title="Delete Answer" size="sm">
            <div class="space-y-4">
                <p class="text-sm text-gray-600 dark:text-gray-400">
                    Are you sure you want to delete this answer? This action cannot be undone.
                </p>
            </div>
            <template #footer>
                <ActionButton variant="outline" @click="showDeleteConfirm = false">
                    Cancel
                </ActionButton>
                <ActionButton variant="secondary" @click="confirmDelete" :loading="deleting"
                    class="bg-red-600 hover:bg-red-700 text-white">
                    Delete Answer
                </ActionButton>
            </template>
        </Modal>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useForumStore } from '@/stores/forum';
import { useNotificationStore } from '@/stores/ui/notification';
import { formatDate, formatContent } from '@/utils/helpers';
import LoadingSection from '@/components/common/sections/LoadingSection.vue';
import VoteButton from '@/components/forum/VoteButton.vue';
import AuthorDisplay from '@/components/common/AuthorDisplay.vue';
import AnswerForm from '@/components/forum/AnswerForm.vue';
import Modal from '@/components/common/Modal.vue';
import ActionButton from '@/components/common/buttons/ActionButton.vue';
import {
    ChatBubbleLeftIcon,
    PencilIcon,
    TrashIcon,
    CheckCircleIcon
} from '@heroicons/vue/24/outline';

const props = defineProps({
    topicId: {
        type: String,
        required: true
    },
    topicUserId: {
        type: String,
        default: null
    }
});

const emit = defineEmits(['answer-count-changed']);

const authStore = useAuthStore();
const forumStore = useForumStore();
const notificationStore = useNotificationStore();

// Local state
const deleting = ref(false);
const showDeleteConfirm = ref(false);
const answerToDelete = ref(null);
const showEditModal = ref(false);
const editingAnswer = ref(null);

// Computed properties from store
const answers = computed(() => {
    const topicAnswers = forumStore.getTopicAnswers(props.topicId);
    return topicAnswers.map(answer => ({
        ...answer,
        isBestAnswer: answer.isAccepted, // Map isAccepted to isBestAnswer
        editedAt: answer.updatedAt && answer.createdAt &&
            answer.updatedAt._seconds !== answer.createdAt._seconds ?
            answer.updatedAt : null
    }));
});

const loading = computed(() => forumStore.isLoadingTopicAnswers(props.topicId));

const loadAnswers = async () => {
    if (!props.topicId) return;

    try {
        await forumStore.loadAnswers(props.topicId);
        emit('answer-count-changed', answers.value.length);
    } catch (error) {
        console.error('Error loading answers:', error);
        emit('answer-count-changed', 0);
    }
};

const canEditAnswer = (answer) => {
    return authStore.user &&
        (authStore.user.id === answer.userId || authStore.user.role === 'admin');
};

const canMarkAsBestAnswer = (answer) => {
    return authStore.user &&
        props.topicUserId === authStore.user.id &&
        !answers.value.some(a => a.isBestAnswer);
};

const editAnswer = (answerId) => {
    const answer = answers.value.find(a => a.id === answerId);
    if (answer) {
        editingAnswer.value = answer;
        showEditModal.value = true;
    }
};

const cancelEdit = () => {
    editingAnswer.value = null;
    showEditModal.value = false;
};

const handleEditSuccess = async (updatedAnswer) => {
    cancelEdit();
    notificationStore.success('Answer updated', 'Your answer has been successfully updated.');

    // The store should have updated automatically, but emit the count just in case
    emit('answer-count-changed', answers.value.length);
};

const deleteAnswer = (answerId) => {
    answerToDelete.value = answerId;
    showDeleteConfirm.value = true;
};

const confirmDelete = async () => {
    if (!answerToDelete.value) return;

    try {
        deleting.value = true;
        const success = await forumStore.deleteAnswer(answerToDelete.value, props.topicId);

        if (success) {
            emit('answer-count-changed', answers.value.length);
            notificationStore.success('Answer deleted', 'The answer has been removed.');
        } else {
            notificationStore.error('Delete failed', 'Unable to delete the answer. Please try again.');
        }
    } catch (error) {
        console.error('Error deleting answer:', error);
        notificationStore.error('Delete failed', 'Unable to delete the answer. Please try again.');
    } finally {
        deleting.value = false;
        showDeleteConfirm.value = false;
        answerToDelete.value = null;
    }
};

const markAsBestAnswer = async (answerId) => {
    try {
        await apiService.post(`/forum/answers/${answerId}/mark-best`);

        const answerIndex = answers.value.findIndex(a => a.id === answerId);
        if (answerIndex !== -1) {
            answers.value[answerIndex].isBestAnswer = true;
        }

        notificationStore.success('Best answer marked', 'The answer has been marked as the best answer.');
    } catch (error) {
        console.error('Error marking best answer:', error);
        notificationStore.error('Failed to mark best answer', 'Please try again.');
    }
};

// Watch for topicId changes
watch(() => props.topicId, () => {
    if (props.topicId) {
        loadAnswers();
    }
});

onMounted(() => {
    loadAnswers();
});
</script>
