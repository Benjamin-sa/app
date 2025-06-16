<template>
    <button @click="handleClick" :disabled="disabled" :class="buttonClasses">
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
    // Legacy props for backward compatibility
    icon: {
        type: Object,
        default: null
    },
    isActive: {
        type: Boolean,
        default: false
    },
    fillWhenActive: {
        type: Boolean,
        default: false
    },
    activeClasses: {
        type: String,
        default: 'bg-red-500/90 text-white hover:bg-red-600/90'
    },
    inactiveClasses: {
        type: String,
        default: 'bg-white/80 text-gray-600 hover:bg-white hover:text-red-500'
    }
})

const emit = defineEmits(['click'])

const buttonClasses = computed(() => {
    // If using legacy icon-only mode
    if (props.icon) {
        return [
            'p-3 rounded-full backdrop-blur-sm transition-all duration-200 shadow-lg',
            props.isActive ? props.activeClasses : props.inactiveClasses
        ]
    }

    // Modern button styles
    const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

    const sizeClasses = {
        sm: 'px-3 py-2 text-sm rounded-lg',
        md: 'px-4 py-2 text-sm rounded-lg',
        lg: 'px-6 py-3 text-base rounded-xl'
    }

    const variantClasses = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-sm dark:bg-blue-500 dark:hover:bg-blue-600',
        secondary: 'bg-slate-600 text-white hover:bg-slate-700 focus:ring-slate-500 shadow-sm dark:bg-slate-500 dark:hover:bg-slate-600',
        outline: 'border border-blue-300 dark:border-blue-600 bg-transparent text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:ring-blue-500',
        ghost: 'bg-transparent text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/20 focus:ring-blue-500',
        white: 'bg-white text-blue-900 hover:bg-blue-50 focus:ring-blue-500 shadow-sm border border-blue-200',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm dark:bg-red-500 dark:hover:bg-red-600'
    }

    return [
        baseClasses,
        sizeClasses[props.size],
        variantClasses[props.variant]
    ]
})

const handleClick = (event) => {
    if (props.disabled) return
    event.stopPropagation()
    emit('click')
}
</script>
