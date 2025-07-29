<template>
    <button @click="handleClick" :disabled="disabled || loading" :class="buttonClasses" :type="type">
        <!-- Loading Spinner -->
        <svg v-if="loading" class="animate-spin -ml-1 mr-3 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg"
            fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
            </path>
        </svg>

        <slot />
    </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    variant: {
        type: String,
        default: 'primary',
        validator: (value) => ['primary', 'secondary', 'outline', 'ghost', 'white', 'danger'].includes(value)
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
    },
    type: {
        type: String,
        default: 'button',
        validator: (value) => ['button', 'submit', 'reset'].includes(value)
    }
})

const emit = defineEmits(['click'])

const buttonClasses = computed(() => {
    const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

    const sizeClasses = {
        sm: 'px-3 py-2 text-sm rounded-lg',
        md: 'px-4 py-2 text-sm rounded-lg',
        lg: 'px-6 py-3 text-base rounded-xl'
    }

    const variantClasses = {
        primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-sm dark:bg-primary-500 dark:hover:bg-primary-600',
        secondary: 'bg-slate-600 text-white hover:bg-slate-700 focus:ring-slate-500 shadow-sm dark:bg-slate-500 dark:hover:bg-slate-600',
        outline: 'border border-primary-300 dark:border-primary-600 bg-transparent text-primary-700 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 focus:ring-primary-500',
        ghost: 'bg-transparent text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900/20 focus:ring-primary-500',
        white: 'bg-white text-primary-900 hover:bg-primary-50 focus:ring-primary-500 shadow-sm border border-primary-200',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm dark:bg-red-500 dark:hover:bg-red-600'
    }

    return [
        baseClasses,
        sizeClasses[props.size],
        variantClasses[props.variant]
    ].join(' ')
})

const handleClick = (event) => {
    if (props.disabled || props.loading) return
    event.stopPropagation()
    emit('click', event)
}
</script>
