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
            'border-red-200',
            'text-red-800',
        ],
        warning: [
            'bg-yellow-50',
            'border-yellow-200',
            'text-yellow-800',
        ],
        info: [
            'bg-blue-50',
            'border-blue-200',
            'text-blue-800',
        ],
        success: [
            'bg-green-50',
            'border-green-200',
            'text-green-800',
        ],
    };
    return variants[props.variant];
});

const handleDismiss = () => {
    emit('dismiss');
};
</script>
