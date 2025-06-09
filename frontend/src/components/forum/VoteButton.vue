<template>
    <div class="flex flex-col items-center space-y-1">
        <!-- Upvote Button -->
        <button @click="handleVote('up')" :disabled="isLoading || disabled"
            class="p-1.5 sm:p-2 rounded-md transition-all duration-200 border-2 relative min-h-[32px] min-w-[32px] sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center"
            :class="[
                currentUserVote === 'up'
                    ? 'text-primary-700 dark:text-primary-400 bg-primary-100 dark:bg-primary-900/30 border-primary-300 dark:border-primary-600 shadow-md transform scale-105'
                    : 'text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-200 dark:hover:border-primary-600 hover:shadow-sm active:scale-95',
                (isLoading || disabled) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            ]" :title="getUpvoteTooltip()">
            <ChevronUpIcon :class="iconClass" />
            <!-- Voted indicator -->
            <div v-if="currentUserVote === 'up'"
                class="absolute -top-1 -right-1 w-3 h-3 bg-primary-500 rounded-full border-2 border-white dark:border-gray-800">
            </div>
        </button>

        <!-- Vote Count -->
        <span
            class="text-xs font-bold px-1.5 py-1 sm:px-2 sm:py-1.5 rounded-md min-w-[2rem] sm:min-w-[2.5rem] text-center border-2 transition-all duration-200"
            :class="[
                currentVoteCount > 0 ? 'text-primary-700 dark:text-primary-400 bg-primary-100 dark:bg-primary-900/30 border-primary-300 dark:border-primary-600' :
                    currentVoteCount < 0 ? 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-600' :
                        'text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600'
            ]">
            {{ formatVoteCount(currentVoteCount) }}
        </span>

        <!-- Downvote Button -->
        <button @click="handleVote('down')" :disabled="isLoading || disabled"
            class="p-1.5 sm:p-2 rounded-md transition-all duration-200 border-2 relative min-h-[32px] min-w-[32px] sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center"
            :class="[
                currentUserVote === 'down'
                    ? 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-600 shadow-md transform scale-105'
                    : 'text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-600 hover:shadow-sm active:scale-95',
                (isLoading || disabled) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            ]" :title="getDownvoteTooltip()">
            <ChevronDownIcon :class="iconClass" />
            <!-- Voted indicator -->
            <div v-if="currentUserVote === 'down'"
                class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-800">
            </div>
        </button>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/vue/24/outline';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notification';
import { apiService } from '@/services/api.service';

const props = defineProps({
    targetId: {
        type: String,
        required: true
    },
    targetType: {
        type: String,
        required: true,
        validator: (value) => ['topic', 'answer'].includes(value)
    },
    size: {
        type: String,
        default: 'md',
        validator: (value) => ['sm', 'md', 'lg'].includes(value)
    },
    disabled: {
        type: Boolean,
        default: false
    }
});

const authStore = useAuthStore();
const notificationStore = useNotificationStore();

const currentVoteCount = ref(0);
const currentUserVote = ref(null);
const isLoading = ref(false);
const dataLoaded = ref(false);

const iconClass = computed(() => {
    const sizes = {
        sm: 'w-3 h-3',
        md: 'w-3.5 h-3.5',
        lg: 'w-4 h-4'
    };
    return sizes[props.size];
});

const formatVoteCount = (count) => {
    if (Math.abs(count) >= 1000000) {
        return (count / 1000000).toFixed(1) + 'M';
    } else if (Math.abs(count) >= 1000) {
        return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
};

const loadVoteData = async () => {

    if (!props.targetId || dataLoaded.value) return;

    try {
        isLoading.value = true;

        const voteResponse = await apiService.get(`/forum/votes/${props.targetId}/${props.targetType}`);
        currentVoteCount.value = voteResponse.data.score || 0;
        currentUserVote.value = voteResponse.data.userVote || null;

        dataLoaded.value = true;
    } catch (error) {
        console.error('Error loading vote data:', error);
    } finally {
        isLoading.value = false;
    }
};

const handleVote = async (voteType) => {
    if (props.disabled || isLoading.value) return;

    if (!authStore.isAuthenticated) {
        notificationStore.info('Sign in required', 'Please sign in to vote.');
        return;
    }

    const newVoteType = currentUserVote.value === voteType ? null : voteType;
    const previousVote = currentUserVote.value;

    try {
        isLoading.value = true;

        const response = await apiService.post("/forum/vote", {
            targetId: props.targetId.trim(),
            targetType: props.targetType,
            voteType: newVoteType,
        });

        if (response.success) {
            currentVoteCount.value = response.data.newVoteCount;
            currentUserVote.value = response.data.userVote;

            // Show user-friendly feedback
            const targetName = props.targetType === 'topic' ? 'topic' : 'answer';
            if (newVoteType === null) {
                notificationStore.success('Vote removed', `Your vote on this ${targetName} has been removed.`);
            } else if (previousVote) {
                notificationStore.success('Vote changed', `Changed from ${previousVote}vote to ${newVoteType}vote on this ${targetName}.`);
            } else {
                notificationStore.success('Vote recorded', `Your ${newVoteType}vote on this ${targetName} has been recorded.`);
            }
        }
    } catch (error) {
        console.error('Error voting:', error);
        const targetName = props.targetType === 'topic' ? 'topic' : 'answer';
        notificationStore.error('Vote failed', `Unable to record your vote on this ${targetName}. Please try again.`, { duration: 5000 });
    } finally {
        isLoading.value = false;
    }
};

// Watch for authentication changes
watch(() => authStore.isAuthenticated, (isAuth) => {
    if (isAuth && !currentUserVote.value) {
        loadVoteData();
    } else if (!isAuth) {
        currentUserVote.value = null;
    }
});

// Watch for targetId changes
watch(() => props.targetId, () => {
    dataLoaded.value = false;
    currentVoteCount.value = 0;
    currentUserVote.value = null;
    loadVoteData();
});

const getUpvoteTooltip = () => {
    if (props.disabled || isLoading.value) return 'Voting disabled';
    if (currentUserVote.value === 'up') return 'Remove your upvote';
    if (currentUserVote.value === 'down') return 'Change to upvote';
    return 'Upvote this content';
};

const getDownvoteTooltip = () => {
    if (props.disabled || isLoading.value) return 'Voting disabled';
    if (currentUserVote.value === 'down') return 'Remove your downvote';
    if (currentUserVote.value === 'up') return 'Change to downvote';
    return 'Downvote this content';
};

onMounted(() => {
    loadVoteData();
});
</script>
