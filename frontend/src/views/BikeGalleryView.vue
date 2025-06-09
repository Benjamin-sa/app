<template>
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
        <!-- Header -->
        <div class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
            <div class="container mx-auto px-4 py-6">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                    <div>
                        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Bike Gallery</h1>
                        <p class="text-gray-600 dark:text-gray-400">Discover amazing bikes from our community</p>
                    </div>

                    <!-- Filters -->
                    <div class="flex flex-wrap items-center space-x-4">
                        <select v-model="filters.sort" @change="resetAndFetch" 
                            class="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md text-sm">
                            <option value="recent">Most Recent</option>
                            <option value="popular">Most Popular</option>
                            <option value="featured">Featured</option>
                        </select>

                        <select v-model="filters.engineSize" @change="resetAndFetch"
                            class="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md text-sm">
                            <option value="">All Engines</option>
                            <option value="50">50cc</option>
                            <option value="125">125cc</option>
                            <option value="250">250cc</option>
                            <option value="other">Other</option>
                        </select>

                        <input v-model="searchQuery" @input="debounceSearch" placeholder="Search bikes..."
                            class="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md text-sm w-64" />
                    </div>
                </div>
            </div>
        </div>

        <!-- Content -->
        <div class="container mx-auto px-4 py-8">
            <!-- Loading State -->
            <div v-if="loading && bikes.length === 0" class="flex justify-center items-center py-12">
                <LoadingSpinner size="lg" />
            </div>

            <!-- Error State -->
            <ErrorMessage v-else-if="error && bikes.length === 0" :message="error" />

            <!-- Bikes Grid -->
            <div v-else class="space-y-8">
                <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    <BikeCard v-for="bike in bikes" :key="bike.id" :bike="bike" 
                        @view="handleViewBike" @like="handleLikeBike" />
                </div>

                <!-- Load More Button / Loading -->
                <div v-if="hasMore || loading" class="flex justify-center py-8">
                    <Button v-if="!loading" @click="loadMore" variant="secondary">
                        Load More Bikes
                    </Button>
                    <LoadingSpinner v-else size="md" />
                </div>

                <!-- End Message -->
                <div v-else-if="bikes.length > 0" class="text-center py-8">
                    <p class="text-gray-600 dark:text-gray-400">You've seen all the bikes! 🏍️</p>
                </div>

                <!-- Empty State -->
                <div v-else class="text-center py-12">
                    <CameraIcon class="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No bikes found</h3>
                    <p class="text-gray-600 dark:text-gray-400 mb-4">
                        {{ searchQuery ? 'Try adjusting your search terms' : 'Be the first to share your bike!' }}
                    </p>
                    <router-link to="/profile" v-if="authStore.user">
                        <Button>Add Your Bike</Button>
                    </router-link>
                </div>
            </div>
        </div>

        <!-- Image Viewer -->
        <ImageViewer :images="viewerImages" :initialIndex="viewerInitialIndex" :isOpen="showImageViewer"
            @close="closeImageViewer" @change="handleImageChange" />
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notification'
import { apiService } from '@/services/api.service'
import { debounce } from '@/utils/helpers'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ErrorMessage from '@/components/common/ErrorMessage.vue'
import Button from '@/components/common/Button.vue'
import ImageViewer from '@/components/common/ImageViewer.vue'
import BikeCard from '@/components/bikes/BikeCard.vue'
import { CameraIcon } from '@heroicons/vue/24/outline'

const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const bikes = ref([])
const loading = ref(false)
const error = ref(null)
const hasMore = ref(true)
const currentPage = ref(1)
const searchQuery = ref('')

const filters = ref({
    sort: 'recent',
    engineSize: ''
})

// Image viewer state
const showImageViewer = ref(false)
const viewerImages = ref([])
const viewerInitialIndex = ref(0)

const fetchBikes = async (reset = false) => {
    try {
        loading.value = true
        if (reset) {
            error.value = null
            currentPage.value = 1
        }

        const params = {
            page: currentPage.value,
            limit: 12,
            sort: filters.value.sort,
            search: searchQuery.value,
            engine_size: filters.value.engineSize
        }

        const response = await apiService.get('/bikes', { params })
        
        if (reset) {
            bikes.value = response.bikes || []
        } else {
            bikes.value = [...bikes.value, ...(response.bikes || [])]
        }

        hasMore.value = response.hasMore || false
        currentPage.value++

    } catch (err) {
        console.error('Error fetching bikes:', err)
        error.value = 'Failed to load bikes'
        if (reset) bikes.value = []
    } finally {
        loading.value = false
    }
}

const resetAndFetch = () => {
    fetchBikes(true)
}

const loadMore = () => {
    if (!loading.value && hasMore.value) {
        fetchBikes(false)
    }
}

const debounceSearch = debounce(() => {
    resetAndFetch()
}, 500)

const handleViewBike = (bike, imageIndex = 0) => {
    if (bike.photos && bike.photos.length > 0) {
        viewerImages.value = bike.photos.map(photo => ({
            url: photo.url || photo,
            id: photo.id || null
        }))
    } else if (bike.main_image) {
        viewerImages.value = [{ url: bike.main_image, id: null }]
    } else {
        return
    }

    viewerInitialIndex.value = imageIndex
    showImageViewer.value = true
}

const closeImageViewer = () => {
    showImageViewer.value = false
    viewerImages.value = []
    viewerInitialIndex.value = 0
}

const handleImageChange = (newIndex) => {
    viewerInitialIndex.value = newIndex
}

const handleLikeBike = async (bikeId) => {
    if (!authStore.user) {
        notificationStore.error('Login Required', 'Please login to like bikes')
        return
    }

    try {
        await apiService.post(`/bikes/${bikeId}/like`)
        
        // Update local bike data
        const bikeIndex = bikes.value.findIndex(b => b.id === bikeId)
        if (bikeIndex !== -1) {
            bikes.value[bikeIndex].liked_by_user = !bikes.value[bikeIndex].liked_by_user
            bikes.value[bikeIndex].like_count += bikes.value[bikeIndex].liked_by_user ? 1 : -1
        }
    } catch (err) {
        console.error('Error liking bike:', err)
        notificationStore.error('Error', 'Failed to like bike')
    }
}

// Infinite scroll
const handleScroll = () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    const windowHeight = window.innerHeight
    const documentHeight = document.documentElement.offsetHeight

    if (scrollTop + windowHeight >= documentHeight - 1000) {
        loadMore()
    }
}

onMounted(() => {
    fetchBikes(true)
    window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
})
</script>
