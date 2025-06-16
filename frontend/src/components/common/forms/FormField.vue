<template>
    <div class="space-y-2">
        <label v-if="label" :for="id" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {{ label }}
            <span v-if="required" class="text-red-500 ml-1">*</span>
        </label>

        <!-- Text Input -->
        <input v-if="type !== 'select'" :id="id" :type="type" :value="modelValue"
            @input="$emit('update:modelValue', $event.target.value)" :required="required" :disabled="disabled"
            :placeholder="placeholder" :min="min" :max="max" :class="inputClasses" />

        <!-- Select -->
        <select v-else-if="type === 'select'" :id="id" :value="modelValue"
            @change="$emit('update:modelValue', $event.target.value)" :required="required" :disabled="disabled"
            :class="inputClasses">
            <option v-if="placeholder" value="">{{ placeholder }}</option>
            <option v-for="option in options" :key="option.value" :value="option.value">
                {{ option.label }}
            </option>
        </select>

        <!-- Error Message -->
        <p v-if="error" class="mt-1 text-sm text-red-600 dark:text-red-400">
            {{ error }}
        </p>

        <!-- Help Text -->
        <p v-if="helpText && !error" class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {{ helpText }}
        </p>
    </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    modelValue: {
        type: [String, Number],
        default: ''
    },
    label: {
        type: String,
        default: ''
    },
    type: {
        type: String,
        default: 'text'
    },
    id: {
        type: String,
        required: true
    },
    required: {
        type: Boolean,
        default: false
    },
    disabled: {
        type: Boolean,
        default: false
    },
    placeholder: {
        type: String,
        default: ''
    },
    error: {
        type: String,
        default: ''
    },
    helpText: {
        type: String,
        default: ''
    },
    min: {
        type: [String, Number],
        default: undefined
    },
    max: {
        type: [String, Number],
        default: undefined
    },
    options: {
        type: Array,
        default: () => []
    },
    variant: {
        type: String,
        default: 'default',
        validator: value => ['default', 'enhanced'].includes(value)
    }
})

defineEmits(['update:modelValue'])

const inputClasses = computed(() => {
    const baseClasses = [
        'block',
        'w-full',
        'px-3',
        'py-2',
        'border',
        'rounded-md',
        'shadow-sm',
        'focus:outline-none',
        'focus:ring-primary-500',
        'focus:border-primary-500',
        'dark:focus:border-primary-400',
        'transition-colors',
        'duration-200'
    ]

    // Variant styles
    if (props.variant === 'enhanced') {
        baseClasses.push(
            'px-4',
            'py-3',
            'border-gray-300/50',
            'dark:border-gray-600/50',
            'rounded-xl',
            'focus:ring-2',
            'focus:ring-blue-500/20',
            'focus:border-blue-500',
            'bg-white/50',
            'dark:bg-gray-700/50',
            'backdrop-blur-sm'
        )
    } else {
        baseClasses.push(
            'border-gray-300',
            'dark:border-gray-600',
            'bg-white',
            'dark:bg-gray-700'
        )
    }

    // Text color
    baseClasses.push(
        'text-gray-900',
        'dark:text-white',
        'placeholder-gray-500',
        'dark:placeholder-gray-400'
    )

    // Error state
    if (props.error) {
        baseClasses.push(
            'border-red-300',
            'dark:border-red-500'
        )
    }

    return baseClasses.join(' ')
})
</script>
