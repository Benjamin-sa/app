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
                        <VoteButton :value="answer.votes?.score || 0" :user-vote="answer.userVote"
                            @vote="(voteData) => $emit('vote', answer.id, 'answer', voteData)" />
                    </div>

                    <!-- Content -->
                    <div class="flex-1 min-w-0">
                        <!-- Answer Content -->
                        <div class="prose dark:prose-invert max-w-none mb-4" v-html="formatContent(answer.content)">
                        </div>

                        <!-- Meta Information -->
                        <div class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                            <div class="flex items-center space-x-4">
                                <!-- Author -->
                                <div class="flex items-center space-x-2">
                                    <img v-if="answer.author?.avatar" :src="answer.author.avatar"
                                        :alt="answer.author.username" class="w-6 h-6 rounded-full">
                                    <div v-else
                                        class="w-6 h-6 rounded-full bg-primary-500 dark:bg-primary-600 flex items-center justify-center text-white text-xs font-medium">
                                        {{ answer.author?.username?.charAt(0).toUpperCase() }}
                                    </div>
                                    <span class="font-medium text-gray-900 dark:text-gray-100">{{
                                        answer.author?.username }}</span>
                                </div>

                                <!-- Created Date -->
                                <span>{{ formatDate(answer.createdAt) }}</span>

                                <!-- Edited -->
                                <span v-if="answer.editedAt" class="text-xs text-gray-400 dark:text-gray-500">
                                    (edited {{ formatDate(answer.editedAt) }})
                                </span>
                            </div>

                            <!-- Actions -->
                            <div v-if="canEditAnswer(answer)" class="flex items-center space-x-2">
                                <button @click="$emit('edit', answer.id)"
                                    class="text-gray-400 hover:text-primary-600 dark:text-gray-500 dark:hover:text-primary-400 transition-colors"
                                    title="Edit answer">
                                    <PencilIcon class="w-4 h-4" />
                                </button>
                                <button @click="$emit('delete', answer.id)"
                                    class="text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
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
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notification';
import { apiService } from '@/services/api.service';
import { formatDate, formatContent } from '@/utils/helpers';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import VoteButton from '@/components/forum/VoteButton.vue';
import {
    ChatBubbleLeftIcon,
    PencilIcon,
    TrashIcon,
    CheckCircleIcon
} from '@heroicons/vue/24/outline';

const props = defineProps({
    answers: {
        type: Array,
        default: () => []
    },
    loading: {
        type: Boolean,
        default: false
    },
    topicAuthorId: {
        type: String,
        default: null
    }
});

const emit = defineEmits(['vote', 'edit', 'delete', 'mark-best']);

const authStore = useAuthStore();
const notificationStore = useNotificationStore();

const canEditAnswer = (answer) => {
    return authStore.user &&
        (authStore.user.id === answer.author?.id || authStore.user.role === 'admin');
};

const canMarkAsBestAnswer = (answer) => {
    return authStore.user &&
        props.topicAuthorId === authStore.user.id &&
        !props.answers.some(a => a.isBestAnswer);
};

const markAsBestAnswer = async (answerId) => {
    try {
        await apiService.post(`/forum/answers/${answerId}/mark-best`);

        // Update local state
        const answerIndex = props.answers.findIndex(a => a.id === answerId);
        if (answerIndex !== -1) {
            props.answers[answerIndex].isBestAnswer = true;
        }

        notificationStore.success('Best answer marked', 'The answer has been marked as the best answer.');
        emit('mark-best', answerId);
    } catch (error) {
        console.error('Error marking best answer:', error);
        notificationStore.error('Failed to mark best answer', 'Please try again.');
    }
};
</script>
