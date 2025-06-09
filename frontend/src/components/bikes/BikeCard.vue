<template>
    <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <!-- User Info Header -->
        <div class="flex items-center p-4 pb-3">
            <img :src="bike.user?.avatar || '/default-avatar.png'" :alt="bike.user?.displayName"
                class="w-10 h-10 rounded-full object-cover" />
            <div class="ml-3 flex-1">
                <router-link :to="`/profile/${bike.user?.uid}`"
                    class="font-medium text-gray-900 dark:text-white hover:underline">
                    {{ bike.user?.displayName || 'Anonymous' }}
                </router-link>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ formatDate(bike.created_at) }}
                </p>
            </div>
            <div v-if="bike.is_featured"
                class="bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 px-2 py-1 rounded-full text-xs font-medium">
                Featured
            </div>
        </div>

        <!-- Main Image -->
        <div class="relative cursor-pointer group" @click="$emit('view', bike, 0)">
            <img v-if="bike.main_image" :src="bike.main_image" :alt="bike.name"
                class="w-full h-64 sm:h-80 object-cover group-hover:opacity-95 transition-opacity" />
            <div v-else class="w-full h-64 sm:h-80 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <CameraIcon class="w-16 h-16 text-gray-400" />
            </div>

            <!-- Photo Count Overlay -->
            <div v-if="bike.photos && bike.photos.length > 1"
                class="absolute top-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded-full text-sm flex items-center">
                <PhotoIcon class="w-4 h-4 mr-1" />
                {{ bike.photos.length }}
            </div>
        </div>

        <!-- Actions -->
        <div class="px-4 py-3">
            <div class="flex items-center space-x-4 mb-3">
                <button @click="$emit('like', bike.id)"
                    class="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-red-500 transition-colors">
                    <HeartIcon :class="[
                        'w-6 h-6',
                        bike.liked_by_user ? 'text-red-500 fill-current' : ''
                    ]" />
                    <span class="text-sm font-medium">{{ bike.like_count || 0 }}</span>
                </button>

                <button @click="$emit('view', bike, 0)"
                    class="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-primary-500 transition-colors">
                    <EyeIcon class="w-6 h-6" />
                    <span class="text-sm font-medium">{{ bike.view_count || 0 }}</span>
                </button>

                <button class="text-gray-600 dark:text-gray-400 hover:text-primary-500 transition-colors">
                    <ShareIcon class="w-6 h-6" />
                </button>
            </div>

            <!-- Bike Info -->
            <div class="space-y-2">
                <h3 class="font-semibold text-gray-900 dark:text-white text-lg">{{ bike.name }}</h3>

                <div class="flex flex-wrap gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span v-if="bike.brand" class="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{{ bike.brand
                        }}</span>
                    <span v-if="bike.model" class="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{{ bike.model
                        }}</span>
                    <span v-if="bike.year" class="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{{ bike.year }}</span>
                    <span v-if="bike.engine_size" class="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{{
                        bike.engine_size }}cc</span>
                </div>

                <p v-if="bike.description" class="text-gray-700 dark:text-gray-300 text-sm line-clamp-3">
                    {{ bike.description }}
                </p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { formatDate } from '@/utils/helpers'
import { CameraIcon, PhotoIcon, HeartIcon, EyeIcon, ShareIcon } from '@heroicons/vue/24/outline'

defineProps({
    bike: {
        type: Object,
        required: true
    }
})

defineEmits(['view', 'like'])
</script>
