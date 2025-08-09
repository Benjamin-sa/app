<template>
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">

        <!-- Loading State -->
        <LoadingSection v-if="loading" message="Loading profile..." />

        <!-- Error State -->
        <div v-else-if="error" class="text-center py-12">
            <ExclamationTriangleIcon class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Profile not found</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ error }}</p>
            <div class="mt-6">
                <ActionButton @click="$router.push('/')" variant="primary">
                    Go Home
                </ActionButton>
            </div>
        </div>

        <!-- Profile Content -->
        <div v-else-if="userProfile" class="space-y-4 sm:space-y-6">
            <!-- Back Button -->
            <BackButton :label="isOwnProfile ? 'Back to Home' : 'Back'" fallback-path="/" />

            <!-- Modern Breadcrumb -->
            <BreadcrumbNav :items="[
                { label: 'Home', path: '/' },
                { label: isOwnProfile ? 'My Profile' : userProfile.username || 'Profile', path: null }
            ]" />

            <!-- Enhanced Profile Header -->
            <div
                class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">

                <!-- User Status Bar (if verified, admin, etc.) -->
                <div v-if="userProfile.isVerified || userProfile.isAdmin || userProfile.isModerator"
                    class="bg-gradient-to-r from-primary-50/80 to-primary-100/80 dark:from-primary-900/50 dark:to-primary-800/50 backdrop-blur-sm px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200/50 dark:border-gray-600/50">
                    <div class="flex flex-wrap items-center gap-2 sm:gap-3">
                        <span v-if="userProfile.isVerified"
                            class="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full shadow-lg">
                            <CheckBadgeIcon class="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                            Verified
                        </span>
                        <span v-if="userProfile.isAdmin"
                            class="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full shadow-lg">
                            <ShieldCheckIcon class="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                            Admin
                        </span>
                        <span v-if="userProfile.isModerator"
                            class="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full shadow-lg">
                            <StarIcon class="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                            Moderator
                        </span>
                    </div>
                </div>

                <div class="p-4 sm:p-6 lg:p-8">
                    <div class="space-y-6 lg:space-y-8">
                        <!-- Profile Info Section -->
                        <div class="flex flex-col lg:flex-row lg:items-start lg:space-x-8 space-y-6 lg:space-y-0">
                            <!-- Avatar and Basic Info -->
                            <div class="flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-4 sm:space-y-0">
                                <!-- Avatar -->
                                <div class="relative">
                                    <div
                                        class="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 rounded-full flex items-center justify-center overflow-hidden shadow-xl border-4 border-white dark:border-gray-700">
                                        <img v-if="userProfile.avatar || userProfile.avatar_url"
                                            :src="userProfile.avatar || userProfile.avatar_url"
                                            :alt="userProfile.username" class="w-full h-full object-cover" />
                                        <UserIcon v-else
                                            class="w-12 h-12 sm:w-16 sm:h-16 text-primary-600 dark:text-primary-400" />
                                    </div>
                                    <!-- Online Status Indicator -->
                                    <div v-if="isOnline"
                                        class="absolute bottom-2 right-2 w-6 h-6 bg-green-500 border-2 border-white dark:border-gray-700 rounded-full shadow-lg">
                                    </div>
                                </div>

                                <!-- User Info -->
                                <div class="text-center sm:text-left">
                                    <h1
                                        class="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent leading-tight">
                                        {{ userProfile.displayName || userProfile.username }}
                                    </h1>
                                    <p v-if="userProfile.username && userProfile.displayName"
                                        class="text-lg text-gray-600 dark:text-gray-400 mt-1">
                                        @{{ userProfile.username }}
                                    </p>
                                    <p v-if="userProfile.bio"
                                        class="text-gray-700 dark:text-gray-300 mt-2 text-sm sm:text-base max-w-md">
                                        {{ userProfile.bio }}
                                    </p>

                                    <!-- User Meta Info -->
                                    <div
                                        class="flex flex-wrap justify-center sm:justify-start items-center gap-4 mt-4 text-sm text-gray-600 dark:text-gray-400">
                                        <span v-if="userProfile.location" class="flex items-center">
                                            <MapPinIcon class="w-4 h-4 mr-1" />
                                            {{ userProfile.location }}
                                        </span>
                                        <span class="flex items-center">
                                            <CalendarIcon class="w-4 h-4 mr-1" />
                                            Joined {{ formatDate(userProfile.createdAt || userProfile.joinedDate) }}
                                        </span>
                                        <span v-if="userProfile.lastActive" class="flex items-center">
                                            <ClockIcon class="w-4 h-4 mr-1" />
                                            Last active {{ formatLastActive(userProfile.lastActive) }}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <!-- Actions -->
                            <div class="flex-shrink-0 lg:ml-auto">
                                <div class="flex flex-col sm:flex-row gap-3">
                                    <ActionButton v-if="isOwnProfile" @click="editProfile" variant="primary" size="md">
                                        <PencilIcon class="w-4 h-4 mr-2" />
                                        Edit Profile
                                    </ActionButton>
                                    <div class="flex flex-wrap gap-3">
                                        <!-- Edit Profile Button (if own profile) -->
                                        <ActionButton v-if="isOwnProfile" @click="showEditProfile = true"
                                            variant="primary">
                                            <PencilIcon class="w-4 h-4 mr-2" />
                                            Edit Profile
                                        </ActionButton>

                                        <!-- Message Button (if viewing another user's profile) -->
                                        <StartMessageButton v-else-if="userProfile?.allow_messages"
                                            :user-id="userProfile.uid || userProfile.id"
                                            :user-name="userProfile.displayName || userProfile.username || 'User'" />
                                    </div>
                                    <ActionButton v-if="userProfile.website" @click="visitWebsite" variant="outline"
                                        size="md">
                                        <LinkIcon class="w-4 h-4 mr-2" />
                                        Website
                                    </ActionButton>
                                </div>
                            </div>
                        </div>

                        <!-- Enhanced Stats Section -->
                        <div
                            class="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-gray-200/50 dark:border-gray-600/50">
                            <div
                                class="text-center p-4 bg-gradient-to-br from-primary-50/50 to-primary-100/50 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl border border-primary-200/30 dark:border-primary-700/30">
                                <div class="text-2xl font-bold text-primary-600 dark:text-primary-400">{{
                                    userProfile.topics_created || 0 }}</div>
                                <div class="text-sm text-gray-600 dark:text-gray-400">Topics</div>
                            </div>
                            <div
                                class="text-center p-4 bg-gradient-to-br from-green-50/50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/20 rounded-xl border border-green-200/30 dark:border-green-700/30">
                                <div class="text-2xl font-bold text-green-600 dark:text-green-400">{{
                                    userProfile.answers_posted || 0 }}</div>
                                <div class="text-sm text-gray-600 dark:text-gray-400">Answers</div>
                            </div>
                            <div
                                class="text-center p-4 bg-gradient-to-br from-purple-50/50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl border border-purple-200/30 dark:border-purple-700/30">
                                <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">{{ userBikes.length
                                    || 0 }}</div>
                                <div class="text-sm text-gray-600 dark:text-gray-400">Bikes</div>
                            </div>
                            <div
                                class="text-center p-4 bg-gradient-to-br from-orange-50/50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl border border-orange-200/30 dark:border-orange-700/30">
                                <div class="text-2xl font-bold text-orange-600 dark:text-orange-400">{{
                                    userProfile.reputation || 0 }}</div>
                                <div class="text-sm text-gray-600 dark:text-gray-400">Reputation</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Enhanced Content Tabs -->
            <div
                class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
                <ProfileTabs :userProfile="userProfile" :userTopics="userTopics" :userAnswers="userAnswers"
                    :userBikes="userBikes" :userProducts="userProducts" ref="profileTabs">
                    <template #default="{ activeTab }">
                        <ProfileTabContent :activeTab="activeTab" :userProfile="userProfile" :userTopics="userTopics"
                            :userAnswers="userAnswers" :userBikes="userBikes" :userProducts="userProducts"
                            :showUserDetails="isOwnProfile" @vote="handleVote" @add-bike="handleAddBike"
                            @edit-bike="handleEditBike" @delete-bike="handleDeleteBike" />
                    </template>
                </ProfileTabs>
            </div>
        </div>

        <!-- User Not Found -->
        <div v-else class="text-center py-12">
            <ExclamationTriangleIcon class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">User not found</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                The user profile you're looking for doesn't exist or has been removed.
            </p>
            <div class="mt-6">
                <ActionButton @click="$router.push('/')" variant="primary">
                    Go Home
                </ActionButton>
            </div>
        </div>

        <!-- Edit Profile Modal -->
        <Modal v-model="showEditModal" title="Edit Profile" size="xl">
            <EditProfileForm v-if="userProfile" :user="userProfile" @updated="handleProfileSaved"
                @cancel="showEditModal = false" />
        </Modal>

        <!-- Add/Edit Bike Modal -->
        <AddBikeForm :open="showBikeModal" :bike="editingBike" @close="closeBikeModal" @saved="handleBikeSaved" />
    </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNavbarStore } from '@/stores/ui/navbar'
import { useNotification } from '@/composables/useNotification'
import { formatDate, debounce } from '@/utils/helpers'
import LoadingSection from '@/components/common/sections/LoadingSection.vue'
import ActionButton from '@/components/common/buttons/ActionButton.vue'
import BreadcrumbNav from '@/components/common/nav/BreadcrumbNav.vue'
import BackButton from '@/components/common/buttons/BackButton.vue'
import ProfileTabs from '@/components/profile/ProfileTabs.vue'
import ProfileTabContent from '@/components/profile/ProfileTabContent.vue'
import EditProfileForm from '@/components/profile/EditProfileForm.vue'
import AddBikeForm from '@/components/bikes/AddBikeForm.vue'
import Modal from '@/components/common/Modal.vue'
import StartMessageButton from '@/components/common/buttons/StartMessageButton.vue';
import { apiService } from '@/services/api.service'
import {
    UserIcon,
    PencilIcon,
    LinkIcon,
    MapPinIcon,
    CalendarIcon,
    ClockIcon,
    CheckBadgeIcon,
    ShieldCheckIcon,
    StarIcon,
    ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const navbarStore = useNavbarStore()
const { showNotification } = useNotification()

const userProfile = ref(null)
const userTopics = ref([])
const userAnswers = ref([])
const userBikes = ref([])
const userProducts = ref([])
const loading = ref(true)
const error = ref(null)
const showEditModal = ref(false)
const showBikeModal = ref(false)
const editingBike = ref(null)
const profileTabs = ref(null)
const bikeGalleryRef = ref(null)

// Computed property to determine if this is the current user's profile
const isOwnProfile = computed(() => {
    const routeId = route.params.id
    const currentUserId = authStore.user?.uid

    // If no route ID, this is "my profile"
    if (!routeId) return true

    // Compare route ID with current user ID
    return routeId === currentUserId
})

// Computed property to get the target user ID
const targetUserId = computed(() => {
    return route.params.id || authStore.user?.uid
})

// Check if user is online (simplified logic - can be enhanced with real-time data)
const isOnline = computed(() => {
    if (!userProfile.value?.lastActive) return false
    const lastActive = new Date(userProfile.value.lastActive)

    // Check if the date is invalid
    if (isNaN(lastActive.getTime())) return false

    const now = new Date()
    const diffMinutes = (now - lastActive) / (1000 * 60)
    return diffMinutes < 5 // Consider online if active within 5 minutes
})

// Format last active time
const formatLastActive = (lastActive) => {
    if (!lastActive) return 'Never'

    const now = new Date()
    const last = new Date(lastActive)

    // Check if the date is invalid
    if (isNaN(last.getTime())) return 'Never'

    const diffMinutes = Math.floor((now - last) / (1000 * 60))

    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`

    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours}h ago`

    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays}d ago`

    return formatDate(last)
}

const fetchUserProfile = async () => {
    try {
        loading.value = true
        error.value = null

        // For own profile, use data from AuthStore
        if (isOwnProfile.value) {
            if (!authStore.user?.uid) {
                router.push('/login')
                return
            }

            // Use user data directly from AuthStore (already merged with backend data)
            userProfile.value = authStore.user

            // Optionally refresh user data if needed
            if (!authStore.user.username || !authStore.user.bio) {
                await authStore.refreshUserData()
                userProfile.value = authStore.user
            }
        } else {
            // For other profiles, fetch from API
            if (!route.params.id) {
                error.value = 'User not found'
                return
            }

            const response = await apiService.get(`/forum/users/profile/${route.params.id}`)

            // Handle the nested data structure from API
            if (response.success && response.data) {
                userProfile.value = response.data
            } else {
                // Fallback: if response structure is different, try to extract data
                const { success, ...userData } = response
                userProfile.value = userData
            }
        }

        // Fetch user content
        await fetchUserContent()
    } catch (err) {
        console.error('Error fetching user profile:', err)
        error.value = err.response?.data?.message || 'Failed to load user profile'
    } finally {
        loading.value = false
    }
}

const fetchUserContent = async () => {
    try {
        const userId = userProfile.value?.id || userProfile.value?.uid || targetUserId.value

        // TODO: Uncomment when APIs are ready
        // const topicsResponse = await apiService.getUserTopics(userId)
        // userTopics.value = topicsResponse.topics || []

        // const answersResponse = await apiService.getUserAnswers(userId)
        // userAnswers.value = answersResponse.answers || []

        // const productsResponse = await apiService.get(`/users/${userId}/products`)
        // userProducts.value = productsResponse.products || []

        // Temporary: Set empty arrays
        userTopics.value = []
        userAnswers.value = []
        userProducts.value = []
    } catch (err) {
        console.error('Error fetching user content:', err)
    }
}

const editProfile = () => {
    showEditModal.value = true
}

const visitWebsite = () => {
    if (userProfile.value?.website) {
        window.open(userProfile.value.website, '_blank', 'noopener,noreferrer')
    }
}

const handleVote = async (data) => {
    // Handle voting on user's content
    try {
        const { targetId, targetType, voteType } = data
        await apiService.post(`/forum/${targetType}s/${targetId}/vote`, { voteType })
        showNotification('Vote recorded!', 'success')
        // Refresh the relevant content
        if (targetType === 'topic') {
            await fetchUserContent()
        }
    } catch (error) {
        console.error('Error voting:', error)
        showNotification('Failed to record vote', 'error')
    }
}

// Debounce the profile refresh to prevent multiple rapid calls
const debouncedFetchProfile = debounce(fetchUserProfile, 300)





const handleAddBike = () => {
    editingBike.value = null
    showBikeModal.value = true
}

const handleEditBike = (bike) => {
    editingBike.value = bike
    showBikeModal.value = true
}

const handleDeleteBike = async (bikeId) => {
    // BikeGallery now handles this, but we can still show notification
    // The actual deletion is handled in BikeGallery component
}

const closeBikeModal = () => {
    showBikeModal.value = false
    editingBike.value = null
}

const handleBikeSaved = async () => {
    // Refresh bikes in BikeGallery component
    if (bikeGalleryRef.value) {
        bikeGalleryRef.value.refreshBikes()
    }
    closeBikeModal()
}

const handleProfileSaved = async (updatedProfile) => {
    // For own profile, refresh AuthStore data which will automatically update the userProfile
    if (isOwnProfile.value) {
        await authStore.refreshUserData()
        userProfile.value = authStore.user
    } else {
        // For other profiles, use debounced function to prevent multiple rapid API calls
        await debouncedFetchProfile()
    }
    showEditModal.value = false
}


onMounted(() => {
    fetchUserProfile()
})

// Watch for route changes to handle navigation between profiles
watch(() => route.params.id, (newId, oldId) => {
    if (newId !== oldId) {
        userProfile.value = null
        userTopics.value = []
        userAnswers.value = []
        userBikes.value = []
        userProducts.value = []

        fetchUserProfile()
    }
})

// Watch for auth store user changes when viewing own profile
watch(() => authStore.user, (newUser) => {
    if (isOwnProfile.value && newUser) {
        userProfile.value = newUser
    }
}, { deep: true })
</script>
