<template>
    <div class="flex flex-col items-center space-y-1">
        <!-- Upvote Button -->
        <button @click="handleVote('up')" :disabled="loading || disabled"
            class="p-2 rounded-lg transition-all duration-200 border-2 relative" :class="[
                currentUserVote === 'up'
                    ? 'text-primary-700 bg-primary-100 border-primary-300 shadow-md transform scale-105'
                    : 'text-gray-400 bg-white border-gray-200 hover:text-primary-600 hover:bg-primary-50 hover:border-primary-200 hover:shadow-sm',
                (loading || disabled) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            ]" :title="getUpvoteTooltip()">
            <ChevronUpIcon :class="iconClass" />
            <!-- Voted indicator -->
            <div v-if="currentUserVote === 'up'"
                class="absolute -top-1 -right-1 w-3 h-3 bg-primary-500 rounded-full border-2 border-white">
            </div>
        </button>

        <!-- Vote Count with enhanced styling -->
        <span
            class="text-sm font-bold px-3 py-2 rounded-lg min-w-[3rem] text-center border-2 transition-all duration-200"
            :class="[
                currentValue > 0 ? 'text-primary-700 bg-primary-100 border-primary-300' :
                    currentValue < 0 ? 'text-red-700 bg-red-100 border-red-300' :
                        'text-gray-700 bg-gray-100 border-gray-300'
            ]">
            {{ formatVoteCount(currentValue) }}
        </span>

        <!-- Downvote Button -->
        <button @click="handleVote('down')" :disabled="loading || disabled"
            class="p-2 rounded-lg transition-all duration-200 border-2 relative" :class="[
                currentUserVote === 'down'
                    ? 'text-red-700 bg-red-100 border-red-300 shadow-md transform scale-105'
                    : 'text-gray-400 bg-white border-gray-200 hover:text-red-600 hover:bg-red-50 hover:border-red-200 hover:shadow-sm',
                (loading || disabled) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            ]" :title="getDownvoteTooltip()">
            <ChevronDownIcon :class="iconClass" />
            <!-- Voted indicator -->
            <div v-if="currentUserVote === 'down'"
                class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white">
            </div>
        </button>

        <!-- Voting instruction text -->
        <div v-if="!currentUserVote && !disabled" class="text-xs text-gray-500 text-center max-w-20 leading-tight mt-1">
            Click to vote
        </div>

        <div v-else-if="currentUserVote" class="text-xs text-center max-w-20 leading-tight mt-1"
            :class="currentUserVote === 'up' ? 'text-primary-600' : 'text-red-600'">
            Click again to remove
        </div>
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
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6'
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
