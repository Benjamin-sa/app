<template>
    <div
        class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 sm:p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
        <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{{ title }}</h2>
            <router-link v-if="viewAllLink" :to="viewAllLink"
                class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium text-sm transition-colors">
                View All →
            </router-link>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <slot name="item" v-for="item in items" :key="item.id" :item="item" />
        </div>
    </div>
</template>

<script setup>
defineProps({
    title: {
        type: String,
        required: true
    },
    items: {
        type: Array,
        default: () => []
    },
    viewAllLink: {
        type: String,
        default: null
    }
})
</script>
