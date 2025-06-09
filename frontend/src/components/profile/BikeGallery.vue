<template>
    <div class="space-y-6">
        <!-- Add Bike Button -->
        <div v-if="isOwnProfile" class="flex justify-end">
            <Button @click="$emit('add-bike')" class="flex items-center space-x-2">
                <PlusIcon class="w-4 h-4" />
                <span>Add Bike</span>
            </Button>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="flex justify-center items-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="text-center py-12">
            <p class="text-red-600 dark:text-red-400">{{ error }}</p>
            <Button @click="fetchBikes" class="mt-4" variant="secondary" size="sm">
                Try Again
            </Button>
        </div>

        <!-- Bikes Grid -->
        <div v-else-if="bikes.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div v-for="bike in bikes" :key="bike.id"
                class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <!-- Main Image -->
                <div class="aspect-w-16 aspect-h-12 bg-gray-200 dark:bg-gray-700 cursor-pointer"
                    @click="openImageViewer(bike, 0)">
                    <img v-if="bike.main_image" :src="bike.main_image" :alt="bike.name"
                        class="w-full h-48 object-cover hover:opacity-90 transition-opacity" />
                    <div v-else class="flex items-center justify-center h-48">
                        <CameraIcon class="w-12 h-12 text-gray-400" />
                    </div>
                </div>

                <!-- Bike Info -->
                <div class="p-4">
                    <h3 class="font-semibold text-gray-900 dark:text-white text-lg mb-2">{{ bike.name }}</h3>
                    <div class="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <p v-if="bike.brand"><span class="font-medium">Brand:</span> {{ bike.brand }}</p>
                        <p v-if="bike.model"><span class="font-medium">Model:</span> {{ bike.model }}</p>
                        <p v-if="bike.year"><span class="font-medium">Year:</span> {{ bike.year }}</p>
                        <p v-if="bike.engine_size"><span class="font-medium">Engine:</span> {{ bike.engine_size }}cc</p>
                    </div>
                    <p v-if="bike.description" class="text-gray-700 dark:text-gray-300 text-sm mt-2 line-clamp-2">
                        {{ bike.description }}
                    </p>

                    <!-- Photo Count with clickable link -->
                    <div v-if="bike.photos && bike.photos.length > 1"
                        class="flex items-center mt-3 text-sm text-primary-600 dark:text-primary-400 cursor-pointer hover:underline"
                        @click="openImageViewer(bike, 0)">
                        <PhotoIcon class="w-4 h-4 mr-1" />
                        <span>{{ bike.photos.length }} photos - View gallery</span>
                    </div>

                    <!-- Actions -->
                    <div v-if="isOwnProfile" class="flex justify-end space-x-2 mt-4">
                        <Button size="sm" variant="secondary" @click="$emit('edit-bike', bike)">
                            Edit
                        </Button>
                        <Button size="sm" variant="danger" @click="handleDeleteBike(bike.id)">
                            Delete
                        </Button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-12">
            <CameraIcon class="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {{ isOwnProfile ? 'No bikes added yet' : 'No bikes to show' }}
            </h3>
            <p class="text-gray-600 dark:text-gray-400 mb-4">
                {{ isOwnProfile ? 'Share photos of your 4-takt brommer with the community!' :
                    'This user hasn\'t sharedany bikes yet.' }}
            </p>
            <Button v-if="isOwnProfile" @click="$emit('add-bike')" class="flex items-center space-x-2 mx-auto">
                <PlusIcon class="w-4 h-4" />
                <span>Add Your First Bike</span>
            </Button>
        </div>

        <!-- Image Viewer -->
        <ImageViewer :images="viewerImages" :initialIndex="viewerInitialIndex" :isOpen="showImageViewer"
            @close="closeImageViewer" @change="handleImageChange" />
    </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { apiService } from '@/services/api.service'
import Button from '@/components/common/Button.vue'
import ImageViewer from '@/components/common/ImageViewer.vue'
import { PlusIcon, CameraIcon, PhotoIcon } from '@heroicons/vue/24/outline'

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

const bikes = ref([])
const loading = ref(false)
const error = ref(null)

// Image viewer state
const showImageViewer = ref(false)
const viewerImages = ref([])
const viewerInitialIndex = ref(0)
const currentBike = ref(null)

const fetchBikes = async () => {
    if (!props.userId) return

    try {
        loading.value = true
        error.value = null

        const response = await apiService.get(`/bikes/user/${props.userId}`)
        bikes.value = response.bikes || []
    } catch (err) {
        console.error('Error fetching user bikes:', err)
        error.value = 'Failed to load bikes'
        bikes.value = []
    } finally {
        loading.value = false
    }
}

const handleDeleteBike = async (bikeId) => {
    if (!confirm('Are you sure you want to delete this bike? This action cannot be undone.')) {
        return
    }

    try {
        await apiService.delete(`/bikes/${bikeId}`)
        bikes.value = bikes.value.filter(bike => bike.id !== bikeId)
        emit('delete-bike', bikeId)
    } catch (err) {
        console.error('Error deleting bike:', err)
        error.value = 'Failed to delete bike'
    }
}

const openImageViewer = (bike, initialIndex = 0) => {
    currentBike.value = bike

    // Prepare images for the viewer
    if (bike.photos && bike.photos.length > 0) {
        viewerImages.value = bike.photos.map(photo => ({
            url: photo.url || photo,
            id: photo.id || null
        }))
    } else if (bike.main_image) {
        viewerImages.value = [{ url: bike.main_image, id: null }]
    } else {
        return // No images to show
    }

    viewerInitialIndex.value = initialIndex
    showImageViewer.value = true
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
