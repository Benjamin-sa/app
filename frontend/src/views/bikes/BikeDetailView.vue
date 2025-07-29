<template>
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <!-- Loading State -->
        <LoadingSection v-if="loading" message="Loading bike details..." />

        <!-- Error State -->
        <div v-else-if="error" class="container mx-auto px-4 py-16">
            <ErrorSection :error="error" @retry="fetchBike" />
            <div class="text-center mt-6">
                <ActionButton @click="$router.push('/bikes')" variant="secondary">
                    Back to Gallery
                </ActionButton>
            </div>
        </div>

        <!-- Bike Details -->
        <div v-else-if="bike" class="container mx-auto px-4 py-6 sm:py-8">
            <!-- Back Button -->
            <BackButton label="Back to Gallery" fallback-path="/bikes" />

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <!-- Image Gallery Section -->
                <div class="space-y-4">
                    <!-- Main Image with click handler for ImageViewer -->
                    <div class="relative aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-2xl overflow-hidden cursor-pointer group shadow-lg"
                        @click="openImageViewer">
                        <img v-if="selectedImageSrc" :src="selectedImageSrc" :alt="bike.name"
                            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <div v-else class="flex items-center justify-center h-full">
                            <CameraIcon class="w-20 h-20 text-gray-400" />
                        </div>

                        <!-- View Gallery Overlay -->
                        <div
                            class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <div class="bg-white/20 backdrop-blur-sm rounded-full p-4">
                                <PhotoIcon class="w-8 h-8 text-white" />
                            </div>
                        </div>

                        <!-- Photo Count Badge -->
                        <div v-if="allImages.length > 1"
                            class="absolute top-4 right-4 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm font-medium">
                            {{ allImages.length }} photos
                        </div>
                    </div>

                    <!-- Thumbnail Gallery (only change main image, don't open viewer) -->
                    <div v-if="allImages.length > 1" class="grid grid-cols-4 sm:grid-cols-5 gap-2">
                        <div v-for="(image, index) in allImages.slice(0, 8)" :key="index"
                            class="relative aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden cursor-pointer group transition-all duration-200"
                            :class="[
                                selectedImageSrc === (image.url || image)
                                    ? 'ring-2 ring-primary-500 shadow-lg scale-105'
                                    : 'hover:scale-105 hover:shadow-md'
                            ]" @click="selectThumbnail(image, index)">
                            <img :src="image.url || image" :alt="`${bike.name} - Image ${index + 1}`"
                                class="w-full h-full object-cover" />

                            <!-- Show more overlay for 8th image if there are more -->
                            <div v-if="index === 7 && allImages.length > 8"
                                class="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-semibold text-sm">
                                +{{ allImages.length - 8 }}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Bike Information Section -->
                <div class="space-y-6">
                    <!-- Header -->
                    <div class="space-y-4">
                        <div class="flex items-start justify-between">
                            <div class="flex-1 min-w-0">
                                <h1
                                    class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white leading-tight break-words">
                                    {{ bike.name }}
                                </h1>
                            </div>
                            <div class="flex items-start space-x-3 ml-4">
                                <span v-if="bike.year"
                                    class="px-3 py-1.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg text-sm font-semibold">
                                    {{ bike.year }}
                                </span>
                            </div>
                        </div>

                        <!-- Stats Row with integrated vote button -->
                        <div class="flex items-center justify-between flex-wrap gap-4">
                            <div class="flex items-center flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                                <div class="flex items-center space-x-1">
                                    <EyeIcon class="w-4 h-4" />
                                    <span>{{ bike.view_count || 0 }} views</span>
                                </div>
                                <div class="flex items-center space-x-1">
                                    <CalendarIcon class="w-4 h-4" />
                                    <span>{{ formatDate(bike.createdAt) }}</span>
                                </div>
                            </div>
                            <!-- Vote button positioned on the right, separate from title -->
                            <div class="flex-shrink-0">
                                <VoteButton :target-id="bike.id" target-type="bike" size="md" variant="compact" />
                            </div>
                        </div>
                    </div>

                    <!-- Specifications -->
                    <div
                        class="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
                        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Specifications</h2>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div v-if="bike.brand" class="flex items-center space-x-3">
                                <div class="w-3 h-3 bg-primary-500 rounded-full"></div>
                                <div>
                                    <span class="text-sm text-gray-500 dark:text-gray-400">Brand</span>
                                    <p class="font-semibold text-gray-900 dark:text-white">{{ bike.brand }}</p>
                                </div>
                            </div>
                            <div v-if="bike.model" class="flex items-center space-x-3">
                                <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                                <div>
                                    <span class="text-sm text-gray-500 dark:text-gray-400">Model</span>
                                    <p class="font-semibold text-gray-900 dark:text-white">{{ bike.model }}</p>
                                </div>
                            </div>
                            <div v-if="bike.engine_size" class="flex items-center space-x-3">
                                <CogIcon class="w-5 h-5 text-orange-500" />
                                <div>
                                    <span class="text-sm text-gray-500 dark:text-gray-400">Engine Size</span>
                                    <p class="font-semibold text-gray-900 dark:text-white">{{ bike.engine_size }}cc</p>
                                </div>
                            </div>
                            <div v-if="bike.year" class="flex items-center space-x-3">
                                <CalendarIcon class="w-5 h-5 text-purple-500" />
                                <div>
                                    <span class="text-sm text-gray-500 dark:text-gray-400">Year</span>
                                    <p class="font-semibold text-gray-900 dark:text-white">{{ bike.year }}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Description -->
                    <div v-if="bike.description"
                        class="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
                        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Description</h2>
                        <div class="prose prose-gray dark:prose-invert max-w-none">
                            <p class="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{{
                                bike.description }}</p>
                        </div>
                    </div>

                    <!-- Owner Info -->
                    <div v-if="bike.owner"
                        class="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
                        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Owner</h2>
                        <div class="flex items-center space-x-4">
                            <img v-if="bike.owner.avatar" :src="bike.owner.avatar" :alt="bike.owner.displayName"
                                class="w-12 h-12 rounded-full" />
                            <div v-else class="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center">
                                <span class="text-white font-semibold">
                                    {{ bike.owner.displayName?.charAt(0)?.toUpperCase() }}
                                </span>
                            </div>
                            <div>
                                <h3 class="font-semibold text-gray-900 dark:text-white">{{ bike.owner.displayName }}
                                </h3>
                                <p class="text-sm text-gray-600 dark:text-gray-400">Member since {{
                                    formatDate(bike.owner.createdAt) }}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Action Buttons -->
                    <div class="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                        <ActionButton @click="shareLink" variant="secondary"
                            class="flex items-center justify-center space-x-2 flex-1">
                            <ShareIcon class="w-5 h-5" />
                            <span>Share</span>
                        </ActionButton>

                        <ActionButton @click="showCommentModal = true" variant="outline"
                            class="flex items-center justify-center space-x-2 flex-1">
                            <ChatBubbleLeftIcon class="w-5 h-5" />
                            <span>Comment</span>
                        </ActionButton>
                    </div>
                </div>
            </div>

            <!-- Comments/Discussion Section -->
            <div class="mt-12 space-y-6">
                <!-- Comments Header -->
                <div
                    class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
                    <div
                        class="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 bg-gradient-to-r from-primary-50/80 to-primary-100/80 dark:from-primary-900/50 dark:to-primary-800/50 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-600/50">
                        <h2 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                            <div
                                class="p-1.5 sm:p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg sm:rounded-xl mr-2 sm:mr-3">
                                <ChatBubbleLeftIcon
                                    class="w-5 h-5 sm:w-6 sm:h-6 text-primary-600 dark:text-primary-400" />
                            </div>
                            {{ formatNumber(commentCount) }} {{ commentCount === 1 ? 'Comment' : 'Comments' }}
                        </h2>
                    </div>

                    <!-- Reuse AnswerList for comments -->
                    <AnswerList :topic-id="bike.id" :topic-user-id="bike.owner?.id || bike.userId"
                        @answer-count-changed="updateCommentCount" />
                </div>
            </div>
        </div>

        <!-- Image Viewer (only opens when clicking main image) -->
        <ImageViewer :images="allImages" :initialIndex="selectedImageIndex" :isOpen="showImageViewer"
            @close="closeImageViewer" @change="handleImageChange" />

        <!-- Comment Modal -->
        <Modal v-model="showCommentModal" title="Add Comment" size="xl">
            <AnswerForm v-if="bike && authStore.isAuthenticated" :topic-id="bike.id" @success="handleCommentSuccess"
                @cancel="showCommentModal = false" />
            <div v-else-if="!authStore.isAuthenticated" class="text-center py-8">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Join the Discussion</h3>
                <p class="text-gray-600 dark:text-gray-400 mb-4">Please sign in to share your thoughts about this bike.
                </p>
                <ActionButton @click="$router.push('/login')" variant="primary">
                    Sign In to Comment
                </ActionButton>
            </div>
        </Modal>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notification'
import { useApi } from '@/composables/useApi'
import { apiService } from '@/services/api.service'
import ActionButton from '@/components/common/buttons/ActionButton.vue'
import ErrorSection from '@/components/common/sections/ErrorSection.vue'
import LoadingSection from '@/components/common/sections/LoadingSection.vue'
import ImageViewer from '@/components/common/images/ImageViewer.vue'
import VoteButton from '@/components/forum/VoteButton.vue'
import AnswerList from '@/components/forum/AnswerList.vue'
import AnswerForm from '@/components/forum/AnswerForm.vue'
import Modal from '@/components/common/Modal.vue'
import { useNavbarStore } from '@/stores/navbar'
import {
    CameraIcon,
    PhotoIcon,
    EyeIcon,
    CalendarIcon,
    CogIcon,
    ShareIcon,
    ChatBubbleLeftIcon,
} from '@heroicons/vue/24/outline'
import { formatNumber } from '@/utils/helpers'
import BackButton from '@/components/common/buttons/BackButton.vue'

const route = useRoute()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()
const navbarStore = useNavbarStore()

// Use the API composable
const { loading, error, execute } = useApi()

const bike = ref(null)

// Image handling state
const showImageViewer = ref(false)
const selectedImageIndex = ref(0)
const selectedImageSrc = ref(null)

const allImages = computed(() => {
    const images = []
    if (bike.value?.main_image) {
        images.push({ url: bike.value.main_image, id: 'main' })
    }
    if (bike.value?.photos) {
        bike.value.photos.forEach((photo, index) => {
            const url = photo.url || photo
            if (url !== bike.value.main_image) {
                images.push({ url, id: photo.id || `photo-${index}` })
            }
        })
    }
    return images
})

// Initialize selected image when bike data loads
const initializeSelectedImage = () => {
    if (allImages.value.length > 0) {
        selectedImageSrc.value = allImages.value[0].url || allImages.value[0]
        selectedImageIndex.value = 0
    }
}

// Handle thumbnail clicks (change main image only)
const selectThumbnail = (image, index) => {
    selectedImageSrc.value = image.url || image
    selectedImageIndex.value = index
}

// Handle main image click (open ImageViewer)
const openImageViewer = () => {
    if (allImages.value.length === 0) return
    showImageViewer.value = true
}

const closeImageViewer = () => {
    showImageViewer.value = false
}

const handleImageChange = (newIndex) => {
    selectedImageIndex.value = newIndex
    selectedImageSrc.value = allImages.value[newIndex]?.url || allImages.value[newIndex]
}

const fetchBike = async () => {
    const result = await execute(
        () => apiService.get(`/bikes/${route.params.id}`),
        {
            showErrorNotification: true,
            errorMessage: 'Failed to load bike details. Please try again.'
        }
    );

    if (result) {
        const responseData = result.data || result;

        if (responseData.bike) {
            bike.value = responseData.bike;
            // Initialize selected image after bike data is loaded
            initializeSelectedImage();
            // Set page title
            document.title = `${bike.value.name} - Bike Gallery - Motordash`;
        } else if (responseData.name) {
            // Direct bike object response
            bike.value = responseData;
            initializeSelectedImage();
            document.title = `${bike.value.name} - Bike Gallery - Motordash`;
        } else {
            notificationStore.error('Bike not found', 'The requested bike could not be found.');
        }
    }
}

const shareLink = async () => {
    const url = window.location.href

    if (navigator.share) {
        try {
            await navigator.share({
                title: bike.value.name,
                text: `Check out this ${bike.value.brand || ''} ${bike.value.model || ''} on Motordash!`,
                url: url
            })
        } catch (err) {
            if (err.name !== 'AbortError') {
                copyToClipboard(url)
            }
        }
    } else {
        copyToClipboard(url)
    }
}

const copyToClipboard = async (text) => {
    try {
        await navigator.clipboard.writeText(text)
        notificationStore.success('Link copied!', 'Share link copied to clipboard')
    } catch (err) {
        notificationStore.error('Failed to copy', 'Could not copy link to clipboard')
    }
}

const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
}

// Comment state
const showCommentModal = ref(false)
const commentCount = ref(0)

onMounted(() => {
    fetchBike()
})

const updateCommentCount = (newCount) => {
    commentCount.value = newCount
}

const handleCommentSuccess = () => {
    showCommentModal.value = false
    commentCount.value += 1
    notificationStore.success('Comment posted!', 'Your comment has been added successfully.')
}
</script>

<style scoped>
.prose {
    max-width: none;
}
</style>
