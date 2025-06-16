<template>
    <div
        class="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <component :is="icon" class="w-5 h-5 mr-2 text-primary-600 dark:text-primary-400" />
            {{ title }}
        </h3>
        <slot />
    </div>
</template>

<script setup>
defineProps({
    title: {
        type: String,
        required: true
    },
    icon: {
        type: Object,
        required: true
    }
})
</script>
