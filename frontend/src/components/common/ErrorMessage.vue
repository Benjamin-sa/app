<template>
    <div v-if="message" :class="[
        'flex items-start gap-3 p-4 rounded-lg border',
        variantClasses,
    ]" role="alert">
        <div class="flex-shrink-0">
            <!-- Error Icon -->
            <ExclamationTriangleIcon v-if="variant === 'error'" class="w-5 h-5" />
            <!-- Warning Icon -->
            <ExclamationTriangleIcon v-else-if="variant === 'warning'" class="w-5 h-5" />
            <!-- Info Icon -->
            <InformationCircleIcon v-else-if="variant === 'info'" class="w-5 h-5" />
            <!-- Success Icon -->
            <CheckCircleIcon v-else class="w-5 h-5" />
        </div>

        <div class="flex-1 min-w-0">
            <h3 v-if="title" class="text-sm font-medium mb-1">
                {{ title }}
            </h3>
            <div class="text-sm">
                <slot>{{ message }}</slot>
            </div>
        </div>

        <button v-if="dismissible" @click="handleDismiss" class="flex-shrink-0 ml-auto pl-3" type="button">
            <span class="sr-only">Dismiss</span>
            <XMarkIcon class="w-5 h-5" />
        </button>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import {
    ExclamationTriangleIcon,
    InformationCircleIcon,
    CheckCircleIcon,
    XMarkIcon,
} from '@heroicons/vue/24/outline';

const props = defineProps({
    message: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        default: '',
    },
    variant: {
        type: String,
        default: 'error',
        validator: (value) => ['error', 'warning', 'info', 'success'].includes(value),
    },
    dismissible: {
        type: Boolean,
        default: false,
    },
});

const emit = defineEmits(['dismiss']);

const variantClasses = computed(() => {
    const variants = {
        error: [
            'bg-red-50',
            'dark:bg-red-900/20',
            'border-red-200',
            'dark:border-red-800',
            'text-red-800',
            'dark:text-red-200',
        ],
        warning: [
            'bg-yellow-50',
            'dark:bg-yellow-900/20',
            'border-yellow-200',
            'dark:border-yellow-800',
            'text-yellow-800',
            'dark:text-yellow-200',
        ],
        info: [
            'bg-blue-50',
            'dark:bg-blue-900/20',
            'border-blue-200',
            'dark:border-blue-800',
            'text-blue-800',
            'dark:text-blue-200',
        ],
        success: [
            'bg-green-50',
            'dark:bg-green-900/20',
            'border-green-200',
            'dark:border-green-800',
            'text-green-800',
            'dark:text-green-200',
        ],
    };
    return variants[props.variant];
});

const handleDismiss = () => {
    emit('dismiss');
};
</script>
