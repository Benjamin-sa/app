<template>
    <button @click="handleClick" :disabled="disabled" :class="buttonClasses" :type="type" :title="title">
        <component :is="icon" :class="iconClass" />
    </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    icon: {
        type: Object,
        required: true
    },
    variant: {
        type: String,
        default: 'default',
        validator: (value) => ['default', 'primary', 'secondary', 'danger', 'ghost'].includes(value)
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
    },
    isActive: {
        type: Boolean,
        default: false
    },
    title: {
        type: String,
        default: ''
    }
})

const emit = defineEmits(['click'])

const buttonClasses = computed(() => {
    const baseClasses = 'inline-flex items-center justify-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

    const sizeClasses = {
        sm: 'p-2',
        md: 'p-3',
        lg: 'p-4'
    }

    const variantClasses = {
        default: props.isActive
            ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300',
        primary: props.isActive
            ? 'bg-primary-600 text-white shadow-lg'
            : 'text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20',
        secondary: props.isActive
            ? 'bg-gray-600 text-white shadow-lg'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/20',
        danger: props.isActive
            ? 'bg-red-600 text-white shadow-lg'
            : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20',
        ghost: 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50'
    }

    return [
        baseClasses,
        sizeClasses[props.size],
        variantClasses[props.variant]
    ].join(' ')
})

const iconClass = computed(() => {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6'
    }
    return sizeClasses[props.size]
})

const handleClick = (event) => {
    if (props.disabled) return
    event.stopPropagation()
    emit('click', event)
}
</script>
