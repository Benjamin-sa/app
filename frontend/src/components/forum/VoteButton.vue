<template>
    <!-- Compact horizontal layout for better integration -->
    <div :class="containerClasses">
        <!-- Upvote Button -->
        <button @click="handleVote('up')" :disabled="loading || disabled" :class="upvoteClasses"
            :title="getUpvoteTooltip()">
            <ChevronUpIcon :class="iconClass" />
        </button>

        <!-- Vote Count -->
        <div :class="countClasses">
            <span class="font-bold">{{ formatVoteCount(currentVoteCount) }}</span>
            <span v-if="size === 'lg'" class="text-xs opacity-75">votes</span>
        </div>

        <!-- Downvote Button -->
        <button @click="handleVote('down')" :disabled="loading || disabled" :class="downvoteClasses"
            :title="getDownvoteTooltip()">
            <ChevronDownIcon :class="iconClass" />
        </button>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/vue/24/outline';
import { useAuthStore } from '@/stores/auth';
import { useVotingStore } from '@/stores/voting';
import { useNotificationStore } from '@/stores/ui/notification';

const props = defineProps({
    targetId: {
        type: String,
        required: true
    },
    targetType: {
        type: String,
        required: true,
        validator: (value) => ['topic', 'answer', 'bike', 'profile', 'comment'].includes(value)
    },
    size: {
        type: String,
        default: 'md',
        validator: (value) => ['sm', 'md', 'lg'].includes(value)
    },
    variant: {
        type: String,
        default: 'default',
        validator: (value) => ['default', 'compact', 'minimal'].includes(value)
    },
    disabled: {
        type: Boolean,
        default: false
    }
});

const authStore = useAuthStore();
const votingStore = useVotingStore();
const notificationStore = useNotificationStore();



// Computed properties from voting store
const voteData = computed(() => votingStore.getVoteData(props.targetId, props.targetType));
const currentVoteCount = computed(() => votingStore.getNetVotes(props.targetId, props.targetType));
const currentUserVote = computed(() => votingStore.getUserVote(props.targetId, props.targetType));
const loading = computed(() => votingStore.isLoading(props.targetId, props.targetType));
const containerClasses = computed(() => {
    const base = 'inline-flex items-center rounded-lg border transition-all duration-200';

    const variants = {
        default: 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 shadow-sm',
        compact: 'bg-gray-50/80 dark:bg-gray-900/80 border-gray-200/30 dark:border-gray-700/30',
        minimal: 'bg-transparent border-transparent'
    };

    const sizes = {
        sm: 'gap-1 p-1',
        md: 'gap-1.5 p-1.5',
        lg: 'gap-2 p-2'
    };

    return `${base} ${variants[props.variant]} ${sizes[props.size]}`;
});

const buttonBaseClasses = computed(() => {
    const base = 'rounded-lg transition-all duration-200 flex items-center justify-center relative';

    const sizes = {
        sm: 'p-1.5 min-w-[28px] min-h-[28px]',
        md: 'p-2 min-w-[32px] min-h-[32px]',
        lg: 'p-2.5 min-w-[36px] min-h-[36px]'
    };

    const interactive = (loading.value || props.disabled) ?
        'opacity-50 cursor-not-allowed' :
        'cursor-pointer hover:scale-105 active:scale-95';

    return `${base} ${sizes[props.size]} ${interactive}`;
});

const upvoteClasses = computed(() => {
    const voted = currentUserVote.value === 'up';
    const colors = voted ?
        'text-primary-700 dark:text-primary-400 bg-primary-100 dark:bg-primary-900/40 ring-1 ring-primary-300 dark:ring-primary-600' :
        'text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20';

    return `${buttonBaseClasses.value} ${colors}`;
});

const downvoteClasses = computed(() => {
    const voted = currentUserVote.value === 'down';
    const colors = voted ?
        'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/40 ring-1 ring-red-300 dark:ring-red-600' :
        'text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20';

    return `${buttonBaseClasses.value} ${colors}`;
});

const countClasses = computed(() => {
    const base = 'flex flex-col items-center justify-center text-center min-w-[40px]';

    const sizes = {
        sm: 'text-xs px-2',
        md: 'text-sm px-2.5',
        lg: 'text-base px-3'
    };

    const colors = currentVoteCount.value > 0 ?
        'text-primary-700 dark:text-primary-400' :
        currentVoteCount.value < 0 ?
            'text-red-700 dark:text-red-400' :
            'text-gray-700 dark:text-gray-300';

    return `${base} ${sizes[props.size]} ${colors}`;
});

const iconClass = computed(() => {
    const sizes = {
        sm: 'w-4 h-4',
        md: 'w-4 h-4',
        lg: 'w-5 h-5'
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
    if (!props.targetId) return;

    try {
        await votingStore.loadVotes(props.targetId, props.targetType);
    } catch (error) {
        console.error('Error loading vote data:', error);
    }
};

const handleVote = async (voteType) => {
    if (props.disabled || loading.value) return;

    if (!authStore.isAuthenticated) {
        notificationStore.info('Please sign in to vote.');
        return;
    }

    const previousVote = currentUserVote.value;
    const targetName = props.targetType === 'topic' ? 'topic' :
        props.targetType === 'bike' ? 'bike' :
            props.targetType === 'profile' ? 'profile' :
                props.targetType === 'comment' ? 'comment' : 'answer';

    try {
        const result = await votingStore.toggleVote(props.targetId, props.targetType, voteType);

        if (result) {
            const newVote = currentUserVote.value;

            if (newVote === null) {
                notificationStore.success(`Vote removed from ${targetName}.`);
            } else if (previousVote && previousVote !== newVote) {
                notificationStore.success(`Changed to ${newVote}vote on ${targetName}.`);
            } else if (!previousVote) {
                notificationStore.success(`${newVote === 'up' ? 'Upvoted' : 'Downvoted'} ${targetName}.`);
            }
        }
    } catch (error) {
        console.error('Error handling vote:', error);
        notificationStore.error(`Unable to record your vote on this ${targetName}. Please try again.`);
    }
};

watch(() => authStore.isAuthenticated, (isAuth) => {
    if (isAuth && !currentUserVote.value) {
        loadVoteData();
    }
});

watch(() => props.targetId, () => {
    loadVoteData();
});

const getUpvoteTooltip = () => {
    if (props.disabled || loading.value) return 'Voting disabled';
    if (currentUserVote.value === 'up') return 'Remove upvote';
    if (currentUserVote.value === 'down') return 'Change to upvote';
    return 'Upvote';
};

const getDownvoteTooltip = () => {
    if (props.disabled || loading.value) return 'Voting disabled';
    if (currentUserVote.value === 'down') return 'Remove downvote';
    if (currentUserVote.value === 'up') return 'Change to downvote';
    return 'Downvote';
};

onMounted(() => {
    loadVoteData();
});
</script>
