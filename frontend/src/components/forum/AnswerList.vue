<template>
    <LoadingSection v-if="loading" message="Loading answers..." />

    <div v-else-if="flatAnswers.length === 0" class="p-6 text-center text-gray-500 dark:text-gray-400">
        <ChatBubbleLeftIcon class="mx-auto h-8 w-8 text-gray-400 dark:text-gray-500 mb-2" />
        <p>No answers yet. Be the first to respond!</p>
    </div>

    <div v-else class="space-y-2">
        <AnswerThreadItem v-for="root in answerTree" :key="root.id" :node="root" :depth="0"
            :is-authenticated="authStore.isAuthenticated" :current-user-id="authStore.user?.id"
            :current-user-role="authStore.user?.role" :topic-author-id="props.topicAuthorId"
            :has-best-answer="hasBestAnswer" @reply-to="$emit('reply-to', $event)" @edit="editAnswer($event.id)"
            @delete="deleteAnswer($event.id)" @view-image="openImageModal" @mark-best="markAsBestAnswer($event.id)" />

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
import { apiService } from '@/services/api.service';
import LoadingSection from '@/components/common/sections/LoadingSection.vue';
import AnswerForm from '@/components/forum/AnswerForm.vue';
import Modal from '@/components/common/Modal.vue';
import ActionButton from '@/components/common/buttons/ActionButton.vue';
import AnswerThreadItem from '@/components/forum/AnswerThreadItem.vue';
import {
    ChatBubbleLeftIcon,
} from '@heroicons/vue/24/outline';

const props = defineProps({
    topicId: {
        type: String,
        required: true
    },
    topicAuthorId: {
        type: String,
        default: null
    }
});

const emit = defineEmits(['answer-count-changed', 'reply-to', 'view-image']);

const authStore = useAuthStore();
const forumStore = useForumStore();
const notificationStore = useNotificationStore();

// Local state
const deleting = ref(false);
const showDeleteConfirm = ref(false);
const answerToDelete = ref(null);
const showEditModal = ref(false);
const editingAnswer = ref(null);

// Flat answers from store
const flatAnswers = computed(() => forumStore.getTopicAnswers(props.topicId));

// Derived: has best answer anywhere
const hasBestAnswer = computed(() => flatAnswers.value?.some(a => a.isAccepted));

// Build a tree for nested replies like Reddit
const answerTree = computed(() => {
    const items = (flatAnswers.value || []).map(a => ({ ...a, children: [] }));
    const byId = new Map(items.map(a => [a.id, a]));
    const roots = [];

    for (const item of items) {
        if (item.parentAnswerId && byId.has(item.parentAnswerId)) {
            byId.get(item.parentAnswerId).children.push(item);
        } else {
            roots.push(item);
        }
    }

    const toMillis = (ts) => {
        if (!ts) return 0;
        if (ts._seconds) return ts._seconds * 1000 + Math.floor((ts._nanoseconds || 0) / 1e6);
        return new Date(ts).getTime();
    };

    // Sort roots by createdAt asc (oldest first), children also oldest first
    const sortRec = (nodes) => {
        nodes.sort((a, b) => toMillis(a.createdAt) - toMillis(b.createdAt));
        nodes.forEach(n => n.children && sortRec(n.children));
    };

    sortRec(roots);
    return roots;
});

const loading = computed(() => forumStore.isLoadingTopicAnswers(props.topicId));

const loadAnswers = async () => {
    if (!props.topicId) return;

    try {
        await forumStore.loadAnswers(props.topicId);
        emit('answer-count-changed', flatAnswers.value.length);
    } catch (error) {
        console.error('Error loading answers:', error);
        emit('answer-count-changed', 0);
    }
};

const canEditAnswer = (answer) => {
    return authStore.user &&
        (authStore.user.id === answer.userId || authStore.user.role === 'admin');
};

const editAnswer = (answerId) => {
    const answer = flatAnswers.value.find(a => a.id === answerId);
    if (answer) {
        editingAnswer.value = answer;
        showEditModal.value = true;
    }
};

const cancelEdit = () => {
    editingAnswer.value = null;
    showEditModal.value = false;
};

const handleEditSuccess = async () => {
    cancelEdit();
    notificationStore.success('Answer updated', 'Your answer has been successfully updated.');
    emit('answer-count-changed', flatAnswers.value.length);
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
            emit('answer-count-changed', flatAnswers.value.length);
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
        notificationStore.success('Best answer marked', 'The answer has been marked as the best answer.');
        // Optionally reload answers
        await loadAnswers();
    } catch (error) {
        console.error('Error marking best answer:', error);
        notificationStore.error('Failed to mark best answer', 'Please try again.');
    }
};

const openImageModal = (image) => {
    emit('view-image', image);
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
