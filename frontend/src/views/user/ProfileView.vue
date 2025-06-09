<template>
    <div class="container mx-auto px-4 py-8 dark:bg-gray-800">
        <!-- Loading State -->
        <div v-if="loading" class="flex justify-center items-center min-h-64">
            <LoadingSpinner size="lg" />
        </div>

        <!-- Error State -->
        <ErrorMessage v-else-if="error" :message="error" />

        <!-- Profile Content -->
        <div v-else-if="userProfile" class="max-w-4xl mx-auto">
            <!-- Profile Header -->
            <ProfileHeader :user="userProfile">
                <template #actions>
                    <Button v-if="isOwnProfile" variant="secondary" size="sm" @click="editProfile">
                        Edit Profile
                    </Button>
                    <Button v-else variant="secondary" size="sm" @click="sendMessage">
                        Send Message
                    </Button>
                </template>
            </ProfileHeader>

            <!-- Content Tabs -->
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

        <!-- User Not Found -->
        <div v-else class="text-center py-12">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">User Not Found</h1>
            <p class="text-gray-600 dark:text-gray-400 mb-6">The user profile you're looking for doesn't exist.</p>
            <router-link to="/" class="btn-primary">Go Home</router-link>
        </div>

        <EditProfileForm :open="showEditModal" :user="userProfile" @close="showEditModal = false"
            @updated="handleProfileSaved" />

        <AddBikeForm :open="showBikeModal" :bike="editingBike" @close="closeBikeModal" @saved="handleBikeSaved" />
    </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotification } from '@/composables/useNotification'
import { formatDate, debounce } from '@/utils/helpers'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ErrorMessage from '@/components/common/ErrorMessage.vue'
import Button from '@/components/common/Button.vue'
import ProfileHeader from '@/components/profile/ProfileHeader.vue'
import ProfileTabs from '@/components/profile/ProfileTabs.vue'
import ProfileTabContent from '@/components/profile/ProfileTabContent.vue'
import EditProfileForm from '@/components/profile/EditProfileForm.vue'
import AddBikeForm from '@/components/profile/AddBikeForm.vue'
import { apiService } from '@/services/api.service'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { showNotification } = useNotification()

const userProfile = ref(null)
const userTopics = ref([])
const userAnswers = ref([])
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

const sendMessage = () => {
    showNotification('Messaging feature coming soon!', 'info')
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
