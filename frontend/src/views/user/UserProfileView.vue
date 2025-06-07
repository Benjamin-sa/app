<template>
    <div class="container mx-auto px-4 py-8">
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
                    <Button variant="secondary" size="sm" @click="sendMessage">
                        Send Message
                    </Button>
                </template>
            </ProfileHeader>

            <!-- Content Tabs -->
            <ProfileTabs :userProfile="userProfile" :userTopics="userTopics" :userAnswers="userAnswers"
                :userProducts="userProducts" ref="profileTabs">
                <template #default="{ activeTab }">
                    <ProfileTabContent :activeTab="activeTab" :userProfile="userProfile" :userTopics="userTopics"
                        :userAnswers="userAnswers" :userProducts="userProducts" :showUserDetails="false"
                        @vote="handleVote" />
                </template>
            </ProfileTabs>
        </div>

        <!-- User Not Found -->
        <div v-else class="text-center py-12">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">User Not Found</h1>
            <p class="text-gray-600 dark:text-gray-400 mb-6">The user profile you're looking for doesn't exist.</p>
            <router-link to="/" class="btn-primary">Go Home</router-link>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotification } from '@/composables/useNotification'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ErrorMessage from '@/components/common/ErrorMessage.vue'
import Button from '@/components/common/Button.vue'
import ProfileHeader from '@/components/profile/ProfileHeader.vue'
import ProfileTabs from '@/components/profile/ProfileTabs.vue'
import ProfileTabContent from '@/components/profile/ProfileTabContent.vue'
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
const profileTabs = ref(null)

const fetchUserProfile = async () => {
    try {
        loading.value = true
        error.value = null

        const identifier = route.params.id

        if (!identifier) {
            error.value = 'User not found'
            return
        }

        const response = await apiService.get(`/forum/users/profile/${identifier}`)

        userProfile.value = response.data

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
        const targetUserId = userProfile.value?.id || userProfile.value?.uid || route.params.id

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

const sendMessage = () => {
    showNotification('Messaging feature coming soon!', 'info')
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

// Watch for route changes to handle navigation between profiles
watch(() => route.params.id, (newId, oldId) => {
    if (newId !== oldId) {
        userProfile.value = null
        userTopics.value = []
        userAnswers.value = []
        userProducts.value = []

        fetchUserProfile()
    }
})
</script>
