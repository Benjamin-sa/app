<template>
    <button @click="handleClick" :disabled="disabled" :class="buttonClasses" :type="type">
        <slot />
    </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    variant: {
        type: String,
        default: 'default',
        validator: (value) => ['default', 'primary', 'secondary', 'ghost'].includes(value)
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
    type: {
        type: String,
        default: 'button',
        validator: (value) => ['button', 'submit', 'reset'].includes(value)
    }
})

const emit = defineEmits(['click'])

const buttonClasses = computed(() => {
    const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed'

    const sizeClasses = {
        sm: 'px-2 py-1 text-sm',
        md: 'px-3 py-2 text-sm',
        lg: 'px-4 py-2 text-base'
    }

    const variantClasses = {
        default: 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg',
        primary: 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg',
        secondary: 'text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg',
        ghost: 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
    }

    return [
        baseClasses,
        sizeClasses[props.size],
        variantClasses[props.variant]
    ].join(' ')
})

const handleClick = (event) => {
    if (props.disabled) return
    emit('click', event)
}
</script>
