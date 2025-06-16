<template>
    <div class="flex flex-col justify-center items-center py-16 sm:py-24">
        <div class="relative">
            <div class="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 dark:border-primary-800"></div>
            <div class="animate-spin rounded-full h-12 w-12 border-4 border-transparent border-t-primary-600 absolute top-0"></div>
        </div>
        <p class="mt-4 text-gray-600 dark:text-gray-400 animate-pulse">{{ message }}</p>
    </div>
</template>

<script setup>
defineProps({
    message: {
        type: String,
        default: 'Loading...'
    }
})
</script>
