<template>
    <nav class="text-sm">
        <div class="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
            <template v-for="(item, index) in items" :key="index">
                <router-link v-if="item.to && !item.current" :to="item.to"
                    class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors">
                    {{ item.label }}
                </router-link>
                <span v-else-if="item.current" class="text-gray-700 dark:text-gray-300 font-medium truncate">
                    {{ item.label }}
                </span>
                <span v-else>{{ item.label }}</span>

                <ChevronRightIcon v-if="index < items.length - 1" class="w-4 h-4" />
            </template>
        </div>
    </nav>
</template>

<script setup>
import { ChevronRightIcon } from '@heroicons/vue/24/outline'

defineProps({
    items: {
        type: Array,
        required: true
    }
})
</script>
