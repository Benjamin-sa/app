<template>
    <div>
        <LoadingSpinner v-if="loading" class="p-6" />

        <div v-else-if="answers.length === 0" class="p-6 text-center text-gray-500 dark:text-gray-400">
            <ChatBubbleLeftIcon class="mx-auto h-8 w-8 text-gray-400 dark:text-gray-500 mb-2" />
            <p>No answers yet. Be the first to respond!</p>
        </div>

        <div v-else class="divide-y divide-gray-200 dark:divide-gray-700">
            <div v-for="answer in answers" :key="answer.id" class="p-6">
                <div class="flex items-start space-x-4">
                    <!-- Vote Section -->
                    <div class="flex-shrink-0">
                        <VoteButton :target-id="answer.id" target-type="answer" />
                    </div>

                    <!-- Content -->
                    <div class="flex-1 min-w-0">
                        <!-- Edit Form -->
                        <div v-if="editingAnswerId === answer.id" class="mb-4">
                            <AnswerForm :answer="answer" @success="handleEditSuccess" @cancel="cancelEdit" />
                        </div>

                        <!-- Answer Content (when not editing) -->
                        <div v-else>
                            <div class="prose dark:prose-invert max-w-none mb-4" v-html="formatContent(answer.content)">
                            </div>

                            <!-- Answer Images -->
                            <div v-if="answer.images && answer.images.length > 0"
                                class="mb-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                                <img v-for="image in answer.images" :key="image.id" :src="image.url"
                                    :alt="image.name || 'Answer image'"
                                    class="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:opacity-90 transition-opacity"
                                    @click="openImageModal(image)" />
                            </div>
                        </div>

                        <!-- Meta Information (hidden when editing) -->
                        <div v-if="editingAnswerId !== answer.id"
                            class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                            <div class="flex items-center space-x-4">
                                <!-- Author -->
                                <AuthorDisplay :user-id="answer.userId" size="sm" />

                                <!-- Created Date -->
                                <span>{{ formatDate(answer.createdAt) }}</span>

                                <!-- Edited -->
                                <span v-if="answer.editedAt" class="text-xs text-gray-400 dark:text-gray-500">
                                    (edited {{ formatDate(answer.editedAt) }})
                                </span>
                            </div>

                            <!-- Actions -->
                            <div v-if="canEditAnswer(answer)" class="flex items-center space-x-2">
                                <button @click="editAnswer(answer.id)"
                                    class="text-gray-400 hover:text-primary-600 dark:text-gray-500 dark:hover:text-primary-400 transition-colors"
                                    title="Edit answer">
                                    <PencilIcon class="w-4 h-4" />
                                </button>
                                <button @click="deleteAnswer(answer.id)"
                                    class="text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
                                    title="Delete answer">
                                    <TrashIcon class="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <!-- Best Answer Badge (hidden when editing) -->
                        <div v-if="answer.isBestAnswer && editingAnswerId !== answer.id"
                            class="mt-2 inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                            <CheckCircleIcon class="w-3 h-3 mr-1" />
                            Best Answer
                        </div>

                        <!-- Mark as Best Answer Button (hidden when editing) -->
                        <div v-else-if="canMarkAsBestAnswer(answer) && editingAnswerId !== answer.id" class="mt-2">
                            <button @click="markAsBestAnswer(answer.id)"
                                class="text-sm text-green-600 hover:text-green-700 dark:text-green-500 dark:hover:text-green-400 font-medium">
                                Mark as best answer
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Delete Confirmation Modal -->
        <Modal v-if="showDeleteConfirm" title="Delete Answer" @close="showDeleteConfirm = false">
            <div class="space-y-4">
                <p class="text-sm text-gray-600 dark:text-gray-400">
                    Are you sure you want to delete this answer? This action cannot be undone.
                </p>
                <div class="flex justify-end space-x-3">
                    <Button variant="outline" @click="showDeleteConfirm = false">
                        Cancel
                    </Button>
                    <Button variant="danger" @click="confirmDelete" :loading="deleting">
                        Delete Answer
                    </Button>
                </div>
            </div>
        </Modal>
    </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notification';
import { apiService } from '@/services/api.service';
import { formatDate, formatContent } from '@/utils/helpers';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import VoteButton from '@/components/forum/VoteButton.vue';
import AuthorDisplay from '@/components/common/AuthorDisplay.vue';
import AnswerForm from '@/components/forum/AnswerForm.vue';
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
const notificationStore = useNotificationStore();

const answers = ref([]);
const loading = ref(false);
const deleting = ref(false);
const showDeleteConfirm = ref(false);
const answerToDelete = ref(null);
const editingAnswerId = ref(null);

const loadAnswers = async () => {
    if (!props.topicId) return;

    try {
        loading.value = true;
        const response = await apiService.get(`/forum/topics/${props.topicId}/answers`);

        // Extract answers from nested response structure
        const answersData = response.data?.answers || [];


        // Map API fields to component expectations
        answers.value = answersData.map(answer => {
            const mappedAnswer = {
                ...answer,
                isBestAnswer: answer.isAccepted, // Map isAccepted to isBestAnswer
                editedAt: answer.updatedAt && answer.createdAt &&
                    answer.updatedAt._seconds !== answer.createdAt._seconds ?
                    answer.updatedAt : null
            };
            return mappedAnswer;
        });

        emit('answer-count-changed', answers.value.length);
    } catch (error) {
        console.error('Error loading answers:', error);
        answers.value = [];
        emit('answer-count-changed', 0);
    } finally {
        loading.value = false;
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
    console.log('Editing answer with ID:', answerId); // Debug log
    editingAnswerId.value = answerId;
};

const cancelEdit = () => {
    editingAnswerId.value = null;
};

const handleEditSuccess = (updatedAnswer) => {
    console.log('Edit success for answer:', updatedAnswer.id); // Debug log
    const answerIndex = answers.value.findIndex(a => a.id === updatedAnswer.id);
    if (answerIndex !== -1) {
        answers.value[answerIndex] = {
            ...answers.value[answerIndex],
            ...updatedAnswer,
            editedAt: new Date()
        };
    }
    editingAnswerId.value = null;
    notificationStore.success('Answer updated', 'Your answer has been successfully updated.');
};

const deleteAnswer = (answerId) => {
    answerToDelete.value = answerId;
    showDeleteConfirm.value = true;
};

const confirmDelete = async () => {
    if (!answerToDelete.value) return;

    try {
        deleting.value = true;
        await apiService.delete(`/forum/answers/${answerToDelete.value}`);

        answers.value = answers.value.filter(a => a.id !== answerToDelete.value);
        emit('answer-count-changed', answers.value.length);

        notificationStore.success('Answer deleted', 'The answer has been removed.');
    } catch (error) {
        console.error('Error deleting answer:', error);
        notificationStore.error('Delete failed', 'Unable to delete the answer. Please try again.', { duration: 5000 });
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
