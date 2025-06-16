<template>
    <div class="container mx-auto px-4 py-16">
        <div class="text-center py-16 sm:py-24">
            <div
                class="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <ExclamationTriangleIcon class="w-12 h-12 text-gray-400" />
            </div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">{{ title }}</h1>
            <p class="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                {{ description }}
            </p>
            <router-link v-if="link" :to="link">
                <ActionButton :icon="ArrowRightIcon"
                    :activeClasses="'rounded-xl px-8 py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 bg-primary-600 hover:bg-primary-700 text-white'"
                    :inactiveClasses="'rounded-xl px-8 py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 bg-primary-600 hover:bg-primary-700 text-white'" />
            </router-link>
        </div>
    </div>
</template>

<script setup>
import ActionButton from '@/components/common/buttons/ActionButton.vue'
import { ExclamationTriangleIcon, ArrowRightIcon } from '@heroicons/vue/24/outline'

defineProps({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    link: {
        type: String,
        default: null
    }
})
</script>
