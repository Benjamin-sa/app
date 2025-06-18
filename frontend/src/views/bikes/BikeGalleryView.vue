<template>
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <!-- Page Title Section (Non-sticky) -->
        <div
            class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-xl border-b border-gray-200/50 dark:border-gray-700/50">
            <div class="container mx-auto px-4 py-6 sm:py-8">
                <div class="text-center space-y-4">
                    <div
                        class="inline-flex items-center justify-center p-3 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl mb-4">
                        <CameraIcon class="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h1
                        class="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                        🏍️ Bike Gallery
                    </h1>
                    <p class="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Discover amazing bikes from our passionate motorcycle community. Browse, explore, and get
                        inspired by the incredible rides shared by fellow enthusiasts.
                    </p>
                    <div class="flex items-center justify-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                        <div class="flex items-center space-x-2">
                            <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span>{{ bikes.length }} bikes available</span>
                        </div>
                        <div class="flex items-center space-x-2">
                            <HeartIcon class="w-4 h-4" />
                            <span>Community driven</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Sticky Filters Section -->
        <div ref="filtersSection" :class="[
            'bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg shadow-lg border-b border-gray-200/50 dark:border-gray-700/50 sticky z-30 transition-all duration-300',
            isFiltersSticky ? 'top-0' : navbarStore.isVisible ? 'top-16' : 'top-0'
        ]">
            <div class="container mx-auto px-4 py-3 sm:py-4">
                <div class="flex flex-col space-y-3">
                    <!-- Sticky Header with Mobile Toggle -->
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-3">
                            <div class="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <AdjustmentsHorizontalIcon class="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Filters & Search</h2>
                                <p class="text-xs text-gray-500 dark:text-gray-400">Find your perfect bike</p>
                            </div>
                        </div>

                        <!-- Mobile Filter Toggle -->
                        <button @click="showFilters = !showFilters"
                            class="sm:hidden flex items-center space-x-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg border border-blue-200 dark:border-blue-800 text-sm transition-all duration-200 hover:bg-blue-100 dark:hover:bg-blue-900/30">
                            <AdjustmentsHorizontalIcon class="w-4 h-4" />
                            <span class="font-medium">{{ showFilters ? 'Hide' : 'Show' }} Filters</span>
                        </button>
                    </div>

                    <!-- Filters Controls -->
                    <div
                        :class="['transition-all duration-300 overflow-hidden', showFilters || !isMobile ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 sm:max-h-96 sm:opacity-100']">
                        <div
                            class="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 p-4 sm:p-0 bg-gray-50/50 dark:bg-gray-800/50 sm:bg-transparent rounded-xl sm:rounded-none">
                            <!-- Search Bar -->
                            <div class="relative flex-1 sm:max-w-xs">
                                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MagnifyingGlassIcon class="h-4 w-4 text-gray-400" />
                                </div>
                                <input v-model="searchQuery" @input="debounceSearch"
                                    placeholder="Search bikes by name, brand..."
                                    class="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm" />
                            </div>

                            <!-- Sort Filter -->
                            <div class="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                                <label
                                    class="text-sm font-medium text-gray-700 dark:text-gray-300 sm:whitespace-nowrap">Sort
                                    by:</label>
                                <select v-model="filters.sort" @change="resetAndFetch"
                                    class="px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-0 sm:min-w-[120px] shadow-sm">
                                    <option value="recent">🕒 Recent</option>
                                    <option value="popular">❤️ Popular</option>
                                    <option value="featured">⭐ Featured</option>
                                </select>
                            </div>

                            <!-- Engine Size Filter -->
                            <div class="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                                <label
                                    class="text-sm font-medium text-gray-700 dark:text-gray-300 sm:whitespace-nowrap">Engine:</label>
                                <select v-model="filters.engineSize" @change="resetAndFetch"
                                    class="px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-0 sm:min-w-[110px] shadow-sm">
                                    <option value="">🏍️ All CC</option>
                                    <option value="50">50cc</option>
                                    <option value="125">125cc</option>
                                    <option value="250">250cc</option>
                                    <option value="500">500cc</option>
                                    <option value="750">750cc</option>
                                    <option value="1000">1000cc+</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <!-- Clear Filters -->
                            <button v-if="searchQuery || filters.engineSize || filters.sort !== 'recent'"
                                @click="clearAllFilters"
                                class="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap shadow-sm">
                                Clear All
                            </button>

                            <!-- Results Count -->
                            <div
                                class="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 sm:ml-auto">
                                <div class="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                <span class="font-medium">{{ bikes.length }} bike{{ bikes.length !== 1 ? 's' : '' }}
                                    found</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Content -->
        <div class="container mx-auto px-4 py-6 sm:py-8">
            <!-- Loading State -->
            <LoadingSection v-if="loading && bikes.length === 0" message="Loading awesome bikes..." />

            <!-- Error State -->
            <ErrorSection v-else-if="error && bikes.length === 0" :error="error" @retry="resetAndFetch" />

            <!-- Bikes Grid -->
            <div v-else class="space-y-8">
                <!-- Grid with responsive columns -->
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    <div v-for="bike in bikes" :key="bike.id"
                        class="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1">

                        <!-- Image Container -->
                        <div class="relative aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 cursor-pointer overflow-hidden"
                            @click="handleViewBike(bike, 0)">

                            <!-- Main Image -->
                            <img v-if="bike.main_image || (bike.photos && bike.photos[0])"
                                :src="bike.main_image || bike.photos[0]?.url || bike.photos[0]" :alt="bike.name"
                                class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                                loading="lazy" />

                            <!-- Placeholder -->
                            <div v-else class="flex items-center justify-center h-full">
                                <CameraIcon
                                    class="w-16 h-16 text-gray-400 group-hover:scale-110 transition-transform duration-300" />
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

                            <!-- Like Badge -->
                            <div v-if="bike.like_count > 0"
                                class="absolute top-3 left-3 bg-red-500/90 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                                <HeartIcon class="w-3 h-3 fill-current" />
                                <span>{{ bike.like_count }}</span>
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
                        <div class="p-4 sm:p-5 space-y-3">
                            <!-- Title and Year -->
                            <div class="flex items-start justify-between">
                                <h3
                                    class="font-bold text-gray-900 dark:text-white text-lg leading-tight line-clamp-2 flex-1">
                                    {{ bike.name }}
                                </h3>
                                <span v-if="bike.year"
                                    class="ml-2 px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg text-xs font-semibold flex-shrink-0">
                                    {{ bike.year }}
                                </span>
                            </div>

                            <!-- Brand and Model -->
                            <div v-if="bike.brand || bike.model" class="flex items-center space-x-2 text-sm">
                                <div v-if="bike.brand" class="flex items-center space-x-1">
                                    <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <span class="text-gray-600 dark:text-gray-400 font-medium">{{ bike.brand }}</span>
                                </div>
                                <div v-if="bike.model" class="flex items-center space-x-1">
                                    <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span class="text-gray-600 dark:text-gray-400">{{ bike.model }}</span>
                                </div>
                            </div>

                            <!-- Engine Size -->
                            <div v-if="bike.engine_size"
                                class="inline-flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-lg">
                                <CogIcon class="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                <span class="text-sm font-semibold text-gray-700 dark:text-gray-300">{{ bike.engine_size
                                    }}cc</span>
                            </div>

                            <!-- Description -->
                            <p v-if="bike.description"
                                class="text-gray-600 dark:text-gray-400 text-sm leading-relaxed line-clamp-2">
                                {{ bike.description }}
                            </p>

                            <!-- Action Bar -->
                            <div
                                class="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                                <button @click="handleLikeBike(bike.id)" :class="[
                                    'flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
                                    bike.liked_by_user
                                        ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30'
                                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-red-500'
                                ]">
                                    <HeartIcon :class="['w-4 h-4', bike.liked_by_user ? 'fill-current' : '']" />
                                    <span>{{ bike.like_count || 0 }}</span>
                                </button>

                                <button @click="$router.push(`/bikes/${bike.id}`)"
                                    class="flex items-center space-x-1 px-3 py-1.5 bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/20 dark:hover:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg text-sm font-medium transition-all duration-200">
                                    <EyeIcon class="w-4 h-4" />
                                    <span>View</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Load More Section -->
                <div v-if="hasMore || loading" class="flex justify-center py-8">
                    <ActionButton v-if="!loading" @click="loadMore" variant="secondary" size="lg"
                        class="px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                        Load More Bikes
                    </ActionButton>
                    <div v-else class="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                        <div class="animate-spin rounded-full h-5 w-5 border-2 border-primary-600 border-t-transparent">
                        </div>
                        <span>Loading more bikes...</span>
                    </div>
                </div>

                <!-- End Message -->
                <div v-else-if="bikes.length > 0" class="text-center py-8">
                    <div
                        class="inline-flex items-center space-x-2 px-6 py-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-xl">
                        <CheckCircleIcon class="w-5 h-5" />
                        <span class="font-medium">You've seen all the bikes! 🏍️</span>
                    </div>
                </div>

                <!-- Empty State -->
                <div v-else class="text-center py-16 sm:py-24">
                    <div
                        class="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                        <CameraIcon class="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">No bikes found</h3>
                    <p class="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                        {{ searchQuery ? 'Try adjusting your search terms or filters' :
                            'Be the first to share your bike with the community!' }}
                    </p>
                    <router-link to="/profile" v-if="authStore.user && !searchQuery">
                        <ActionButton variant="primary" size="lg"
                            class="rounded-xl px-8 py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                            Add Your Bike
                        </ActionButton>
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
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notification'
import { apiService } from '@/services/api.service'
import { debounce } from '@/utils/helpers'
import LoadingSection from '@/components/common/sections/LoadingSection.vue'
import ErrorSection from '@/components/common/sections/ErrorSection.vue'
import ActionButton from '@/components/common/buttons/ActionButton.vue'
import ImageViewer from '@/components/common/images/ImageViewer.vue'
import {
    MagnifyingGlassIcon,
    CameraIcon,
    PhotoIcon,
    HeartIcon,
    EyeIcon,
    CogIcon,
    CheckCircleIcon,
    AdjustmentsHorizontalIcon,
} from '@heroicons/vue/24/outline'
import { useRouter } from 'vue-router'
import { useNavbarStore } from '@/stores/navbar';

const authStore = useAuthStore()
const notificationStore = useNotificationStore()
const router = useRouter()
const navbarStore = useNavbarStore()

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

// Mobile detection and sticky filters
const isMobile = computed(() => window.innerWidth < 640)
const showFilters = ref(false)
const filtersSection = ref(null)
const isFiltersSticky = ref(false)

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

        // Handle the nested API response structure
        const responseData = response.data || response

        if (reset) {
            bikes.value = responseData.bikes || []
        } else {
            bikes.value = [...bikes.value, ...(responseData.bikes || [])]
        }

        hasMore.value = responseData.hasMore || false
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

const clearAllFilters = () => {
    searchQuery.value = ''
    filters.value.engineSize = ''
    filters.value.sort = 'recent'
    resetAndFetch()
}

// Handle sticky filters behavior
const handleScroll = () => {
    if (filtersSection.value) {
        const rect = filtersSection.value.getBoundingClientRect()
        const navbarHeight = navbarStore.effectiveNavbarHeight
        isFiltersSticky.value = rect.top <= navbarHeight
    }

    // Infinite scroll for loading more bikes
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    const windowHeight = window.innerHeight
    const documentHeight = document.documentElement.offsetHeight

    if (scrollTop + windowHeight >= documentHeight - 1000) {
        loadMore()
    }
}

const handleViewBike = (bike, imageIndex = 0) => {
    // Navigate to bike detail page instead of opening image viewer
    router.push(`/bikes/${bike.id}`)
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

// Close filters on route change or escape
const handleEscapeKey = (event) => {
    if (event.key === 'Escape') {
        showFilters.value = false
    }
}

onMounted(() => {
    fetchBikes(true)
    window.addEventListener('scroll', handleScroll)
    window.addEventListener('keydown', handleEscapeKey)
})

onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
    window.removeEventListener('keydown', handleEscapeKey)
})
</script>

<style scoped>
.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

@media (max-width: 640px) {
    .container {
        padding-left: 1rem;
        padding-right: 1rem;
    }
}
</style>
