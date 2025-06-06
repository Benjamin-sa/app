<template>
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between">
            <div class="flex items-center space-x-4 mb-4 md:mb-0">
                <!-- Avatar -->
                <div class="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
                    <img v-if="user.avatar" :src="user.avatar" :alt="user.username"
                        class="w-20 h-20 rounded-full object-cover" />
                    <svg v-else class="w-10 h-10 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                            clip-rule="evenodd" />
                    </svg>
                </div>

                <!-- User Info -->
                <div>
                    <h1 class="text-2xl font-bold text-gray-900">{{ user.username }}</h1>
                    <p v-if="user.bio" class="text-gray-600 mt-1">{{ user.bio }}</p>
                    <div class="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>Member since {{ formatJoinedDate(user.joinedDate) }}</span>
                        <span v-if="user.location">📍 {{ user.location }}</span>
                    </div>
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex space-x-3">
                <slot name="actions"></slot>
            </div>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
            <div class="text-center">
                <div class="text-2xl font-bold text-gray-900">{{ user.topics_created || 0 }}</div>
                <div class="text-sm text-gray-600">Topics</div>
            </div>
            <div class="text-center">
                <div class="text-2xl font-bold text-gray-900">{{ user.answers_posted || 0 }}</div>
                <div class="text-sm text-gray-600">Answers</div>
            </div>
            <div class="text-center">
                <div class="text-2xl font-bold text-gray-900">{{ user.products_count || 0 }}</div>
                <div class="text-sm text-gray-600">Products</div>
            </div>
            <div class="text-center">
                <div class="text-2xl font-bold text-gray-900">{{ user.reputation || 0 }}</div>
                <div class="text-sm text-gray-600">Reputation</div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { formatDate } from '@/utils/helpers'

defineProps({
    user: {
        type: Object,
        required: true
    }
})

const formatJoinedDate = (timestamp) => {
    if (!timestamp) return 'Unknown'

    // Handle Firebase timestamp format
    if (timestamp._seconds) {
        const date = new Date(timestamp._seconds * 1000)
        return formatDate(date.toISOString())
    }

    // Fallback for regular date strings
    return formatDate(timestamp)
}
</script>
