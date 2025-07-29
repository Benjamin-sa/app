<template>
    <div class="space-y-4">
        <div class="flex items-start justify-between">
            <h1 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white leading-tight flex-1">
                {{ title }}
            </h1>
            <button @click="$emit('share')"
                class="p-2 ml-4 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-primary-500 transition-all duration-200">
                <ShareIcon class="w-5 h-5" />
            </button>
        </div>

        <!-- Price and Collection -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div class="flex flex-col">
                <span class="text-3xl sm:text-4xl font-bold text-primary-600 dark:text-primary-400">
                    €{{ price }}
                </span>
                <span class="text-sm text-gray-500 dark:text-gray-400">Best Price Guaranteed</span>
            </div>
            <span v-if="collection"
                class="inline-flex items-center px-4 py-2 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-xl text-sm font-semibold">
                {{ collection.title }}
            </span>
        </div>
    </div>
</template>

<script setup>
import { ShareIcon } from '@heroicons/vue/24/outline'

defineProps({
    title: String,
    price: [String, Number],
    collection: Object
})

defineEmits(['share'])
</script>
