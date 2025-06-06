<template>
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LoadingSpinner v-if="loading" />

        <div v-else-if="topic" class="space-y-6">
            <!-- Breadcrumb -->
            <nav class="flex items-center space-x-2 text-sm text-gray-500">
                <router-link to="/forum" class="hover:text-primary-600">
                    Forum
                </router-link>
                <ChevronRightIcon class="w-4 h-4" />
                <span class="text-gray-900">{{ topic.title }}</span>
            </nav>

            <!-- Topic Header -->
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div class="flex items-start space-x-4">
                    <!-- Vote Section -->
                    <div class="flex-shrink-0">
                        <VoteButton :value="topic.votes?.score || 0" :user-vote="topic.userVote"
                            :loading="votingLoading" @vote="handleTopicVote" size="lg" />
                    </div>

                    <!-- Content -->
                    <div class="flex-1 min-w-0">
                        <!-- Title and Status -->
                        <div class="flex items-start justify-between mb-4">
                            <h1 class="text-2xl font-bold text-gray-900">{{ topic.title }}</h1>
                            <div class="flex items-center space-x-2 ml-4">
                                <span v-if="topic.isPinned"
                                    class="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                                    <MapPinIcon class="w-3 h-3 mr-1" />
                                    Pinned
                                </span>
                                <span v-if="topic.isLocked"
                                    class="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                                    <LockClosedIcon class="w-3 h-3 mr-1" />
                                    Locked
                                </span>
                            </div>
                        </div>

                        <!-- Category -->
                        <span v-if="topic.category"
                            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mb-4"
                            :class="getCategoryClass(topic.category)">
                            {{ getCategoryLabel(topic.category) }}
                        </span>

                        <!-- Content -->
                        <div class="prose max-w-none mb-4" v-html="formatContent(topic.content)"></div>

                        <!-- Tags -->
                        <div v-if="topic.tags && topic.tags.length > 0" class="mb-4 flex flex-wrap gap-2">
                            <span v-for="tag in topic.tags" :key="tag"
                                class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                                #{{ tag }}
                            </span>
                        </div>

                        <!-- Meta Information -->
                        <div
                            class="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-200">
                            <div class="flex items-center space-x-4">
                                <!-- Author -->
                                <div class="flex items-center space-x-2">
                                    <img v-if="topic.author?.avatar" :src="topic.author.avatar"
                                        :alt="topic.author.username" class="w-8 h-8 rounded-full">
                                    <div v-else
                                        class="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-medium">
                                        {{ topic.author?.username?.charAt(0).toUpperCase() }}
                                    </div>
                                    <div>
                                        <div class="font-medium text-gray-900">{{ topic.author?.username }}</div>
                                        <div>{{ formatDate(topic.createdAt) }}</div>
                                    </div>
                                </div>
                            </div>

                            <!-- Stats -->
                            <div class="flex items-center space-x-4">
                                <div class="flex items-center space-x-1">
                                    <EyeIcon class="w-4 h-4" />
                                    <span>{{ topic.viewCount || 0 }} views</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Actions -->
            <div v-if="authStore.isAuthenticated" class="flex justify-between items-center">
                <div class="flex space-x-2">
                    <Button v-if="canEditTopic" variant="outline" size="sm" @click="showEditTopic = true">
                        <PencilIcon class="w-4 h-4 mr-1" />
                        Edit
                    </Button>
                    <Button v-if="canDeleteTopic" variant="outline" size="sm" @click="showDeleteConfirm = true"
                        class="text-red-600 border-red-300 hover:bg-red-50">
                        <TrashIcon class="w-4 h-4 mr-1" />
                        Delete
                    </Button>
                </div>

                <Button v-if="!topic.isLocked" @click="showAnswerForm = true">
                    <ChatBubbleLeftIcon class="w-4 h-4 mr-2" />
                    Post Answer
                </Button>
            </div>

            <!-- Answers Section -->
            <div class="bg-white rounded-lg shadow-sm border border-gray-200">
                <div class="px-6 py-4 border-b border-gray-200">
                    <h2 class="text-lg font-medium text-gray-900">
                        {{ answers.length }} {{ answers.length === 1 ? 'Answer' : 'Answers' }}
                    </h2>
                </div>

                <AnswerList :answers="answers" :loading="answersLoading" @vote="handleAnswerVote"
                    @edit="handleAnswerEdit" @delete="handleAnswerDelete" />
            </div>

            <!-- Answer Form -->
            <div v-if="showAnswerForm && authStore.isAuthenticated && !topic.isLocked"
                class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 class="text-lg font-medium text-gray-900 mb-4">Post Your Answer</h3>
                <AnswerForm :topic-id="topic.id" @success="handleAnswerSuccess" @cancel="showAnswerForm = false" />
            </div>
        </div>

        <div v-else-if="!loading" class="text-center py-12">
            <ExclamationTriangleIcon class="mx-auto h-12 w-12 text-gray-400" />
            <h3 class="mt-2 text-sm font-medium text-gray-900">Topic not found</h3>
            <p class="mt-1 text-sm text-gray-500">
                The topic you're looking for doesn't exist or has been removed.
            </p>
            <div class="mt-6">
                <Button @click="$router.push('/forum')">
                    Back to Forum
                </Button>
            </div>
        </div>

        <!-- Edit Topic Modal -->
        <Modal v-if="showEditTopic" title="Edit Topic" @close="showEditTopic = false">
            <EditTopicForm :topic="topic" @success="handleTopicUpdated" @cancel="showEditTopic = false" />
        </Modal>

        <!-- Delete Confirmation Modal -->
        <Modal v-if="showDeleteConfirm" title="Delete Topic" @close="showDeleteConfirm = false">
            <div class="space-y-4">
                <p class="text-sm text-gray-600">
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
import { formatDate, formatContent } from '@/utils/helpers';
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
    ExclamationTriangleIcon
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

const canEditTopic = computed(() => {
    return authStore.user && topic.value &&
        (authStore.user.id === topic.value.author?.id ||
            (authStore.user.role === 'admin' && authStore.user.id === topic.value.author?.id));
});

const canDeleteTopic = computed(() => {
    return authStore.user && topic.value &&
        (authStore.user.id === topic.value.author?.id ||
            (authStore.user.role === 'admin' && authStore.user.id === topic.value.author?.id));
});

const getCategoryClass = (category) => {
    const classes = {
        general: 'bg-blue-100 text-blue-800',
        technical: 'bg-green-100 text-green-800',
        maintenance: 'bg-orange-100 text-orange-800',
        rides: 'bg-purple-100 text-purple-800',
        marketplace: 'bg-yellow-100 text-yellow-800'
    };
    return classes[category] || 'bg-gray-100 text-gray-800';
};

const getCategoryLabel = (category) => {
    const labels = {
        general: 'General',
        technical: 'Technical',
        maintenance: 'Maintenance',
        rides: 'Rides & Events',
        marketplace: 'Marketplace'
    };
    return labels[category] || category;
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

const handleTopicVote = async ({ voteType, previousVote }) => {
    if (!authStore.isAuthenticated) {
        notificationStore.info('Sign in required', 'Please sign in to vote on topics.');
        return;
    }

    try {
        votingLoading.value = true;
        const response = await apiService.vote(topic.value.id, 'topic', voteType);

        if (response.success) {
            // Update topic data with server response
            topic.value.votes = { score: response.data.newVoteCount };
            topic.value.userVote = response.data.userVote;

            // Show user-friendly feedback
            if (voteType === null) {
                notificationStore.success('Vote removed', 'Your vote has been removed.');
            } else if (previousVote) {
                notificationStore.success('Vote changed', `Changed from ${previousVote}vote to ${voteType}vote.`);
            } else {
                notificationStore.success('Vote recorded', `Your ${voteType}vote has been recorded.`);
            }
        }
    } catch (error) {
        console.error('Vote failed:', error);
        notificationStore.error('Vote failed', 'Unable to record your vote. Please try again.', { duration: 5000 });
    } finally {
        votingLoading.value = false;
    }
};

const handleAnswerVote = async (answerId, { voteType, previousVote }) => {
    if (!authStore.isAuthenticated) {
        notificationStore.info('Sign in required', 'Please sign in to vote on answers.');
        return;
    }

    try {
        const response = await apiService.vote(answerId, 'answer', voteType);

        if (response.success) {
            const answerIndex = answers.value.findIndex(a => a.id === answerId);
            if (answerIndex !== -1) {
                answers.value[answerIndex].votes = { score: response.data.newVoteCount };
                answers.value[answerIndex].userVote = response.data.userVote;
            }

            // Show user-friendly feedback
            if (voteType === null) {
                notificationStore.success('Vote removed', 'Your vote has been removed.');
            } else if (previousVote) {
                notificationStore.success('Vote changed', `Changed from ${previousVote}vote to ${voteType}vote.`);
            } else {
                notificationStore.success('Vote recorded', `Your ${voteType}vote has been recorded.`);
            }
        }
    } catch (error) {
        console.error('Error voting on answer:', error);
        notificationStore.error('Vote failed', 'Unable to record your vote. Please try again.', { duration: 5000 });
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
