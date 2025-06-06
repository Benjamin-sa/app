<template>
    <component :is="tag" :class="buttonClasses" :disabled="disabled || loading" :type="type" @click="handleClick">
        <slot name="icon-left" />
        <LoadingSpinner v-if="loading" class="w-4 h-4" />
        <slot v-if="!loading" />
        <slot name="icon-right" />
    </component>
</template>

<script setup>
import { computed } from 'vue';
import LoadingSpinner from './LoadingSpinner.vue';

const props = defineProps({
    variant: {
        type: String,
        default: 'primary',
        validator: (value) => ['primary', 'secondary', 'outline', 'accent', 'danger', 'ghost'].includes(value),
    },
    size: {
        type: String,
        default: 'md',
        validator: (value) => ['xs', 'sm', 'md', 'lg', 'xl'].includes(value),
    },
    disabled: {
        type: Boolean,
        default: false,
    },
    loading: {
        type: Boolean,
        default: false,
    },
    type: {
        type: String,
        default: 'button',
    },
    tag: {
        type: String,
        default: 'button',
    },
    block: {
        type: Boolean,
        default: false,
    },
    rounded: {
        type: Boolean,
        default: false,
    },
});

const emit = defineEmits(['click']);

const buttonClasses = computed(() => {
    const baseClasses = [
        'inline-flex',
        'items-center',
        'justify-center',
        'font-medium',
        'transition-all',
        'duration-200',
        'focus:outline-none',
        'focus:ring-2',
        'focus:ring-offset-2',
        'disabled:opacity-50',
        'disabled:cursor-not-allowed',
        'gap-2',
    ];

    // Block width
    if (props.block) {
        baseClasses.push('w-full');
    }

    // Size classes
    const sizeClasses = {
        xs: ['px-2', 'py-1', 'text-xs'],
        sm: ['px-3', 'py-1.5', 'text-sm'],
        md: ['px-4', 'py-2', 'text-sm'],
        lg: ['px-6', 'py-3', 'text-base'],
        xl: ['px-8', 'py-4', 'text-lg'],
    };
    baseClasses.push(...sizeClasses[props.size]);

    // Border radius
    if (props.rounded) {
        baseClasses.push('rounded-full');
    } else {
        baseClasses.push('rounded-lg');
    }

    // Variant classes
    const variantClasses = {
        primary: [
            'bg-primary-600',
            'dark:bg-primary-500',
            'text-white',
            'border',
            'border-primary-600',
            'dark:border-primary-500',
            'hover:bg-primary-700',
            'dark:hover:bg-primary-600',
            'hover:border-primary-700',
            'dark:hover:border-primary-600',
            'focus:ring-primary-500',
            'dark:focus:ring-primary-400',
        ],
        secondary: [
            'bg-gray-100',
            'dark:bg-gray-700',
            'text-gray-900',
            'dark:text-gray-100',
            'border',
            'border-gray-300',
            'dark:border-gray-600',
            'hover:bg-gray-200',
            'dark:hover:bg-gray-600',
            'hover:border-gray-400',
            'dark:hover:border-gray-500',
            'focus:ring-gray-500',
            'dark:focus:ring-gray-400',
        ],
        outline: [
            'bg-transparent',
            'text-gray-700',
            'dark:text-gray-300',
            'border',
            'border-gray-300',
            'dark:border-gray-600',
            'hover:bg-gray-50',
            'dark:hover:bg-gray-800',
            'hover:border-gray-400',
            'dark:hover:border-gray-500',
            'focus:ring-gray-500',
            'dark:focus:ring-gray-400',
        ],
        accent: [
            'bg-accent-600',
            'dark:bg-accent-500',
            'text-white',
            'border',
            'border-accent-600',
            'dark:border-accent-500',
            'hover:bg-accent-700',
            'dark:hover:bg-accent-600',
            'hover:border-accent-700',
            'dark:hover:border-accent-600',
            'focus:ring-accent-500',
            'dark:focus:ring-accent-400',
        ],
        danger: [
            'bg-red-600',
            'dark:bg-red-500',
            'text-white',
            'border',
            'border-red-600',
            'dark:border-red-500',
            'hover:bg-red-700',
            'dark:hover:bg-red-600',
            'hover:border-red-700',
            'dark:hover:border-red-600',
            'focus:ring-red-500',
            'dark:focus:ring-red-400',
        ],
        ghost: [
            'bg-transparent',
            'text-gray-700',
            'dark:text-gray-300',
            'border',
            'border-transparent',
            'hover:bg-gray-100',
            'dark:hover:bg-gray-800',
            'focus:ring-gray-500',
            'dark:focus:ring-gray-400',
        ],
    }
    // Add fallback to prevent error
    const variantStyles = variantClasses[props.variant] || variantClasses.primary;
    baseClasses.push(...variantStyles);

    return baseClasses;
});

const handleClick = (event) => {
    if (!props.disabled && !props.loading) {
        emit('click', event);
    }
};
</script>
