<template>
    <div class="container mx-auto px-4 py-16">
        <div class="text-center py-16 bg-red-50 dark:bg-red-900/20 rounded-2xl">
            <div
                class="bg-red-100 dark:bg-red-900/40 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <ExclamationTriangleIcon class="w-10 h-10 text-red-600 dark:text-red-400" />
            </div>
            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">{{ title }}</h3>
            <p class="text-gray-600 dark:text-gray-400 mb-6">{{ error }}</p>
            <ActionButton @click="$emit('retry')" variant="primary" size="lg">
                <ArrowPathIcon class="w-4 h-4 mr-2" />
                {{ retryText }}
            </ActionButton>
        </div>
    </div>
</template>

<script setup>
import ActionButton from '@/components/common/buttons/ActionButton.vue'
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/vue/24/outline'

defineProps({
    error: {
        type: String,
        required: true
    },
    title: {
        type: String,
        default: 'Error Loading Content'
    },
    retryText: {
        type: String,
        default: 'Try Again'
    }
})

defineEmits(['retry'])
</script>
