<template>
    <div :class="[
        'animate-spin rounded-full border-2 border-gray-300 dark:border-gray-600',
        sizeClasses,
        colorClasses,
    ]" role="status" :aria-label="label">
        <span class="sr-only">{{ label }}</span>
    </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    size: {
        type: String,
        default: 'md',
        validator: (value) => ['xs', 'sm', 'md', 'lg', 'xl'].includes(value),
    },
    color: {
        type: String,
        default: 'primary',
        validator: (value) => ['primary', 'white', 'gray'].includes(value),
    },
    label: {
        type: String,
        default: 'Loading...',
    },
});

const sizeClasses = computed(() => {
    const sizes = {
        xs: 'w-3 h-3',
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8',
        xl: 'w-12 h-12',
    };
    return sizes[props.size];
});

const colorClasses = computed(() => {
    const colors = {
        primary: 'border-t-primary-600 dark:border-t-primary-500',
        white: 'border-t-white',
        gray: 'border-t-gray-600 dark:border-t-gray-400',
    };
    return colors[props.color];
});
</script>
