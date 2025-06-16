<template>
    <div class="space-y-6">
        <!-- Enhanced Header Section -->
        <div
            class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div class="flex items-center space-x-4">
                    <div
                        class="p-3 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-xl">
                        <CameraIcon class="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h2
                            class="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            {{ isOwnProfile ? '🏍️ My Bike Collection' : `🏍️ ${userProfile?.username || 'User'}'s
                            Bikes` }}
                        </h2>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                            {{ isOwnProfile ? 'Share your awesome rides with the community' :
                                'Explore this user\'s amazing bikes' }}
                        </p>
                        <div class="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                            <div class="flex items-center space-x-1">
                                <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span>{{ bikes.length }} bike{{ bikes.length !== 1 ? 's' : '' }}</span>
                            </div>
                            <div class="flex items-center space-x-1">
                                <HeartIcon class="w-3 h-3" />
                                <span>Community gallery</span>
                            </div>
                        </div>
                    </div>
                </div>

                <ActionButton v-if="isOwnProfile" @click="$emit('add-bike')"
                    class="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300">
                    <PlusIcon class="w-5 h-5" />
                    <span class="font-semibold">Add New Bike</span>
                </ActionButton>
            </div>
        </div>

        <!-- Loading State -->
        <LoadingSection v-if="loading" message="Loading bikes..." />

        <!-- Error State -->
        <div v-else-if="error" class="text-center py-12 bg-red-50 dark:bg-red-900/20 rounded-xl">
            <div
                class="bg-red-100 dark:bg-red-900/40 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <ExclamationTriangleIcon class="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <p class="text-red-600 dark:text-red-400 font-medium mb-4">{{ error }}</p>
            <ActionButton @click="fetchBikes" variant="secondary" size="sm" class="rounded-lg">
                Try Again
            </ActionButton>
        </div>

        <!-- Bikes Grid -->
        <div v-else-if="bikes.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div v-for="bike in bikes" :key="bike.id"
                class="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden transition-all duration-300 hover:scale-[1.02]">

                <!-- Image Container -->
                <div class="relative aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 cursor-pointer overflow-hidden"
                    @click="openImageViewer(bike, 0)">

                    <img v-if="bike.main_image" :src="bike.main_image" :alt="bike.name"
                        class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />

                    <div v-else class="flex items-center justify-center h-full">
                        <CameraIcon
                            class="w-12 h-12 text-gray-400 group-hover:scale-110 transition-transform duration-300" />
                    </div>

                    <!-- Gradient Overlay -->
                    <div
                        class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    </div>

                    <!-- Photo Count Badge -->
                    <div v-if="bike.photos && bike.photos.length > 1"
                        class="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                        <PhotoIcon class="w-3 h-3" />
                        <span>{{ bike.photos.length }}</span>
                    </div>

                    <!-- View Overlay -->
                    <div
                        class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div class="bg-white/20 backdrop-blur-sm rounded-full p-3">
                            <EyeIcon class="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>

                <!-- Content -->
                <div class="p-4 sm:p-5">
                    <!-- Title and Year -->
                    <div class="flex items-start justify-between mb-3">
                        <h3 class="font-bold text-gray-900 dark:text-white text-lg leading-tight flex-1 line-clamp-2">
                            {{ bike.name }}
                        </h3>
                        <span v-if="bike.year"
                            class="ml-2 px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg text-xs font-semibold flex-shrink-0">
                            {{ bike.year }}
                        </span>
                    </div>

                    <!-- Details Grid -->
                    <div class="grid grid-cols-2 gap-2 mb-3 text-sm">
                        <div v-if="bike.brand" class="flex items-center space-x-1">
                            <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span class="text-gray-600 dark:text-gray-400 truncate">{{ bike.brand }}</span>
                        </div>
                        <div v-if="bike.model" class="flex items-center space-x-1">
                            <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span class="text-gray-600 dark:text-gray-400 truncate">{{ bike.model }}</span>
                        </div>
                        <div v-if="bike.engine_size" class="flex items-center space-x-1 col-span-2">
                            <CogIcon class="w-4 h-4 text-gray-500" />
                            <span class="text-gray-700 dark:text-gray-300 font-medium">{{ bike.engine_size }}cc</span>
                        </div>
                    </div>

                    <!-- Description -->
                    <p v-if="bike.description" class="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                        {{ bike.description }}
                    </p>

                    <!-- Actions -->
                    <div v-if="isOwnProfile" class="flex space-x-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <ActionButton size="sm" variant="secondary" @click="$emit('edit-bike', bike)"
                            class="flex-1 rounded-lg font-medium">
                            <PencilIcon class="w-4 h-4 mr-1" />
                            Edit
                        </ActionButton>
                        <ActionButton size="sm" variant="danger" @click="handleDeleteBike(bike.id)"
                            class="rounded-lg font-medium">
                            <TrashIcon class="w-4 h-4" />
                        </ActionButton>
                    </div>
                </div>
            </div>
        </div>

        <!-- Empty State -->
        <div v-else
            class="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-2xl">
            <div
                class="bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/40 dark:to-primary-800/40 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <CameraIcon class="w-10 h-10 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {{ isOwnProfile ? 'No bikes added yet' : 'No bikes to show' }}
            </h3>
            <p class="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                {{ isOwnProfile ? 'Share photos of your awesome rides with the community!' :
                    'This user hasn\'t shared any bikes yet.' }}
            </p>
            <ActionButton v-if="isOwnProfile" @click="$emit('add-bike')"
                class="inline-flex items-center space-x-2 rounded-xl px-8 py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                <PlusIcon class="w-5 h-5" />
                <span>Add Your First Bike</span>
            </ActionButton>
        </div>

        <!-- Image Viewer -->
        <ImageViewer :images="viewerImages" :initialIndex="viewerInitialIndex" :isOpen="showImageViewer"
            @close="closeImageViewer" @change="handleImageChange" />
    </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useApi } from '@/composables/useApi'
import { apiService } from '@/services/api.service'
import ActionButton from '@/components/common/buttons/ActionButton.vue'
import ImageViewer from '@/components/common/images/ImageViewer.vue'
import LoadingSection from '@/components/common/sections/LoadingSection.vue'
import {
    PlusIcon,
    CameraIcon,
    PhotoIcon,
    EyeIcon,
    CogIcon,
    PencilIcon,
    TrashIcon,
    ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'

const props = defineProps({
    userId: {
        type: String,
        required: true
    },
    isOwnProfile: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['add-bike', 'edit-bike', 'delete-bike'])

// Use the composable for different operations
const { loading, error, execute } = useApi();

const bikes = ref([])

// Image viewer state
const showImageViewer = ref(false)
const viewerImages = ref([])
const viewerInitialIndex = ref(0)
const currentBike = ref(null)

const router = useRouter()

const fetchBikes = async () => {
    if (!props.userId) return

    const result = await execute(
        () => apiService.get(`/bikes/user/${props.userId}`),
        {
            showErrorNotification: false // Handle error manually for custom display
        }
    );

    if (result) {
        // Handle the nested API response structure
        const responseData = result.data || result
        bikes.value = responseData.bikes || [];
    } else {
        bikes.value = [];
    }
};

const handleDeleteBike = async (bikeId) => {
    if (!confirm('Are you sure you want to delete this bike? This action cannot be undone.')) {
        return
    }

    const result = await execute(
        () => apiService.delete(`/bikes/${bikeId}`),
        {
            successMessage: 'Bike deleted successfully',
            errorMessage: 'Failed to delete bike. Please try again.'
        }
    );

    if (result) {
        bikes.value = bikes.value.filter(bike => bike.id !== bikeId);
        emit('delete-bike', bikeId);
    }
};

const openImageViewer = (bike, initialIndex = 0) => {
    // For profile bikes, navigate to detail view instead of opening image viewer
    router.push(`/bikes/${bike.id}`)
}

const closeImageViewer = () => {
    showImageViewer.value = false
    viewerImages.value = []
    viewerInitialIndex.value = 0
    currentBike.value = null
}

const handleImageChange = (newIndex) => {
    viewerInitialIndex.value = newIndex
}

// Refresh bikes when saved
const refreshBikes = () => {
    fetchBikes()
}

// Watch for userId changes
watch(() => props.userId, (newUserId) => {
    if (newUserId) {
        fetchBikes()
    }
}, { immediate: true })

onMounted(() => {
    if (props.userId) {
        fetchBikes()
    }
})

// Expose refresh method for parent component
defineExpose({
    refreshBikes
})
</script>

<style scoped>
.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
</style>
