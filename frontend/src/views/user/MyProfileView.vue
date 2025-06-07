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
                    <Button variant="secondary" size="sm" @click="editProfile">
                        Edit Profile
                    </Button>
                </template>
            </ProfileHeader>

            <!-- Content Tabs -->
            <ProfileTabs :userProfile="userProfile" :userTopics="userTopics" :userAnswers="userAnswers"
                :userProducts="userProducts" ref="profileTabs">
                <template #default="{ activeTab }">
                    <ProfileTabContent :activeTab="activeTab" :userProfile="userProfile" :userTopics="userTopics"
                        :userAnswers="userAnswers" :userProducts="userProducts" :showUserDetails="true"
                        @vote="handleVote" />
                </template>
            </ProfileTabs>
        </div>

        <EditProfileForm :open="showEditModal" :user="userProfile" @close="showEditModal = false"
            @updated="handleProfileSaved" />
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotification } from '@/composables/useNotification'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ErrorMessage from '@/components/common/ErrorMessage.vue'
import Button from '@/components/common/Button.vue'
import ProfileHeader from '@/components/profile/ProfileHeader.vue'
import ProfileTabs from '@/components/profile/ProfileTabs.vue'
import ProfileTabContent from '@/components/profile/ProfileTabContent.vue'
import EditProfileForm from '@/components/profile/EditProfileForm.vue'
import { apiService } from '@/services/api.service'

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
const profileTabs = ref(null)

const fetchUserProfile = async () => {
    try {
        loading.value = true
        error.value = null

        if (!authStore.user?.uid) {
            router.push('/login')
            return
        }

        const response = await apiService.get(`/forum/users/profile/${authStore.user.uid}`)

        // Handle the nested data structure from API
        if (response.success && response.data) {
            userProfile.value = response.data
        } else {
            // Fallback: if response structure is different, try to extract data
            const { success, ...userData } = response
            userProfile.value = userData
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
        const targetUserId = userProfile.value?.id || userProfile.value?.uid

        // TODO: Uncomment when APIs are ready
        // const topicsResponse = await apiService.getUserTopics(targetUserId)
        // userTopics.value = topicsResponse.topics || []

        // const answersResponse = await apiService.getUserAnswers(targetUserId)
        // userAnswers.value = answersResponse.answers || []

        // const productsResponse = await apiService.get(`/users/${targetUserId}/products`)
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
    showEditModal.value = true;
}

const handleProfileSaved = (updatedProfile) => {
    userProfile.value = { ...userProfile.value, ...updatedProfile }
    showEditModal.value = false
    showNotification('Profile updated successfully!', 'success')
}

const handleVote = async ({ topicId, voteType }) => {
    if (!authStore.isAuthenticated) {
        router.push('/login')
        return
    }

    try {
        await apiService.post(`/forum/topics/${topicId}/vote`, { vote_type: voteType })

        const topicIndex = userTopics.value.findIndex(t => t.id === topicId)
        if (topicIndex !== -1) {
            const topic = userTopics.value[topicIndex]

            if (topic.user_vote === voteType) {
                topic.votes_count += voteType === 'up' ? -1 : 1
                topic.user_vote = null
            } else {
                if (topic.user_vote) {
                    topic.votes_count += topic.user_vote === 'up' ? -2 : 2
                } else {
                    topic.votes_count += voteType === 'up' ? 1 : -1
                }
                topic.user_vote = voteType
            }
        }
    } catch (err) {
        console.error('Error voting on topic:', err)
        showNotification('Failed to vote on topic', 'error')
    }
}

onMounted(() => {
    fetchUserProfile()
})
</script>
