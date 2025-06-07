<template>
    <div class="flex flex-col items-center space-y-1">
        <!-- Upvote Button -->
        <button @click="handleVote('up')" :disabled="loading || disabled"
            class="p-1.5 sm:p-2 rounded-md transition-all duration-200 border-2 relative min-h-[32px] min-w-[32px] sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center"
            :class="[
                currentUserVote === 'up'
                    ? 'text-primary-700 dark:text-primary-400 bg-primary-100 dark:bg-primary-900/30 border-primary-300 dark:border-primary-600 shadow-md transform scale-105'
                    : 'text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-200 dark:hover:border-primary-600 hover:shadow-sm active:scale-95',
                (loading || disabled) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            ]" :title="getUpvoteTooltip()">
            <ChevronUpIcon :class="iconClass" />
            <!-- Voted indicator -->
            <div v-if="currentUserVote === 'up'"
                class="absolute -top-1 -right-1 w-3 h-3 bg-primary-500 rounded-full border-2 border-white dark:border-gray-800">
            </div>
        </button>

        <!-- Vote Count with enhanced styling -->
        <span
            class="text-xs font-bold px-1.5 py-1 sm:px-2 sm:py-1.5 rounded-md min-w-[2rem] sm:min-w-[2.5rem] text-center border-2 transition-all duration-200"
            :class="[
                currentValue > 0 ? 'text-primary-700 dark:text-primary-400 bg-primary-100 dark:bg-primary-900/30 border-primary-300 dark:border-primary-600' :
                    currentValue < 0 ? 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-600' :
                        'text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600'
            ]">
            {{ formatVoteCount(currentValue) }}
        </span>

        <!-- Downvote Button -->
        <button @click="handleVote('down')" :disabled="loading || disabled"
            class="p-1.5 sm:p-2 rounded-md transition-all duration-200 border-2 relative min-h-[32px] min-w-[32px] sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center"
            :class="[
                currentUserVote === 'down'
                    ? 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-600 shadow-md transform scale-105'
                    : 'text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-600 hover:shadow-sm active:scale-95',
                (loading || disabled) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
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
import { ref, computed, watch } from 'vue';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/vue/24/outline';

const props = defineProps({
    value: {
        type: Number,
        default: 0
    },
    userVote: {
        type: String,
        default: null,
        validator: (value) => [null, 'up', 'down'].includes(value)
    },
    size: {
        type: String,
        default: 'md',
        validator: (value) => ['sm', 'md', 'lg'].includes(value)
    },
    disabled: {
        type: Boolean,
        default: false
    },
    loading: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['vote']);

const currentValue = ref(props.value);
const currentUserVote = ref(props.userVote);

// Watch for prop changes to keep component in sync
watch(() => props.value, (newValue) => {
    currentValue.value = newValue;
});

watch(() => props.userVote, (newUserVote) => {
    currentUserVote.value = newUserVote;
});

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

const handleVote = (voteType) => {
    if (props.disabled || props.loading) return;

    // Determine new vote type (toggle if same, otherwise set new)
    const newVoteType = currentUserVote.value === voteType ? null : voteType;

    // Emit the vote event to parent with the new vote type
    emit('vote', {
        voteType: newVoteType,
        previousVote: currentUserVote.value
    });
};

const getUpvoteTooltip = () => {
    if (props.disabled || props.loading) return 'Voting disabled';
    if (currentUserVote.value === 'up') return 'Remove your upvote';
    if (currentUserVote.value === 'down') return 'Change to upvote';
    return 'Upvote this content';
};

const getDownvoteTooltip = () => {
    if (props.disabled || props.loading) return 'Voting disabled';
    if (currentUserVote.value === 'down') return 'Remove your downvote';
    if (currentUserVote.value === 'up') return 'Change to downvote';
    return 'Downvote this content';
};
</script>
