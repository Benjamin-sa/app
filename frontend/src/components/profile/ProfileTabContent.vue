<template>
    <!-- Topics Tab -->
    <div v-if="activeTab === 'topics'">
        <div v-if="userTopics.length > 0" class="space-y-4">
            <TopicCard v-for="topic in userTopics" :key="topic.id" :topic="topic" @vote="$emit('vote', $event)" />
        </div>
        <div v-else class="text-center py-8 text-gray-500 dark:text-gray-400">
            No topics posted yet.
        </div>
    </div>

    <!-- Answers Tab -->
    <div v-if="activeTab === 'answers'">
        <div v-if="userAnswers.length > 0" class="space-y-6">
            <div v-for="answer in userAnswers" :key="answer.id"
                class="border-l-4 border-primary-200 dark:border-primary-700 pl-4">
                <div class="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    Answer to:
                    <router-link :to="`/forum/topic/${answer.topic_id}`"
                        class="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium">
                        {{ answer.topic_title }}
                    </router-link>
                </div>
                <div class="prose prose-sm max-w-none dark:prose-invert" v-html="formatContent(answer.content)"></div>
                <div class="flex items-center space-x-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                    <span>{{ formatDate(answer.created_at) }}</span>
                    <span>{{ answer.votes_count }} votes</span>
                </div>
            </div>
        </div>
        <div v-else class="text-center py-8 text-gray-500 dark:text-gray-400">
            No answers posted yet.
        </div>
    </div>

    <!-- Products Tab -->
    <div v-if="activeTab === 'products'">
        <div v-if="userProducts.length > 0">
            <ProductGrid :products="userProducts" />
        </div>
        <div v-else class="text-center py-8 text-gray-500 dark:text-gray-400">
            No products listed yet.
        </div>
    </div>

    <!-- About Tab -->
    <div v-if="activeTab === 'about'">
        <div class="space-y-6">
            <div v-if="userProfile.bio">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">About</h3>
                <p class="text-gray-600 dark:text-gray-300">{{ userProfile.bio }}</p>
            </div>

            <!-- User Details -->
            <div v-if="showUserDetails">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">User Details</h3>
                <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">Display Name:</span>
                        <span class="text-gray-900 dark:text-gray-100">{{ userProfile.displayName ||
                            userProfile.username }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">Username:</span>
                        <span class="text-gray-900 dark:text-gray-100">{{ userProfile.username }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">Email:</span>
                        <span class="text-gray-900 dark:text-gray-100">{{ userProfile.email }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">User ID:</span>
                        <span class="text-gray-900 dark:text-gray-100 font-mono text-xs">{{ userProfile.uid ||
                            userProfile.id }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">Reputation:</span>
                        <span class="text-gray-900 dark:text-gray-100 font-semibold">{{ userProfile.reputation || 0
                            }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">Last Active:</span>
                        <span class="text-gray-900 dark:text-gray-100">{{ formatLastActive(userProfile.lastActive)
                            }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">Verified:</span>
                        <span
                            :class="userProfile.isVerified ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'">
                            {{ userProfile.isVerified ? 'Yes' : 'No' }}
                        </span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">Moderator:</span>
                        <span
                            :class="userProfile.isModerator ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'">
                            {{ userProfile.isModerator ? 'Yes' : 'No' }}
                        </span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">Admin:</span>
                        <span
                            :class="userProfile.isAdmin ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'">
                            {{ userProfile.isAdmin ? 'Yes' : 'No' }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Activity Statistics -->
            <div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Activity Statistics</h3>
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">Topics Created:</span>
                        <span class="text-gray-900 dark:text-gray-100 font-semibold">{{ userProfile.topics_created || 0
                            }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">Answers Posted:</span>
                        <span class="text-gray-900 dark:text-gray-100 font-semibold">{{ userProfile.answers_posted || 0
                            }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">Products Listed:</span>
                        <span class="text-gray-900 dark:text-gray-100 font-semibold">{{ userProfile.products_count || 0
                            }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">Total Reputation:</span>
                        <span class="text-gray-900 dark:text-gray-100 font-semibold">{{ userProfile.reputation || 0
                            }}</span>
                    </div>
                </div>
            </div>

            <div v-if="userProfile.interests?.length">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Interests</h3>
                <div class="flex flex-wrap gap-2">
                    <span v-for="interest in userProfile.interests" :key="interest"
                        class="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm">
                        {{ interest }}
                    </span>
                </div>
            </div>

            <div v-if="userProfile.social_links && Object.keys(userProfile.social_links).length">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Social Links</h3>
                <div class="flex space-x-4">
                    <a v-for="(url, platform) in userProfile.social_links" :key="platform" :href="url" target="_blank"
                        rel="noopener noreferrer"
                        class="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 capitalize">
                        {{ platform }}
                    </a>
                </div>
            </div>

            <div
                v-if="!userProfile.bio && !userProfile.interests?.length && (!userProfile.social_links || !Object.keys(userProfile.social_links).length)">
                <p class="text-center py-8 text-gray-500 dark:text-gray-400">No additional information available.</p>
            </div>
        </div>
    </div>
</template>

<script setup>
import TopicCard from '@/components/forum/TopicCard.vue'
import ProductGrid from '@/components/products/ProductGrid.vue'
import { formatDate, formatContent } from '@/utils/helpers'

defineProps({
    activeTab: {
        type: String,
        required: true
    },
    userProfile: {
        type: Object,
        required: true
    },
    userTopics: {
        type: Array,
        default: () => []
    },
    userAnswers: {
        type: Array,
        default: () => []
    },
    userProducts: {
        type: Array,
        default: () => []
    },
    showUserDetails: {
        type: Boolean,
        default: false
    }
})

defineEmits(['vote'])

const formatLastActive = (timestamp) => {
    if (!timestamp) return 'Unknown'

    // Handle Firebase timestamp format
    if (timestamp._seconds) {
        const date = new Date(timestamp._seconds * 1000)
        const now = new Date()
        const diffMs = now - date
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
        const diffDays = Math.floor(diffHours / 24)

        if (diffDays > 0) {
            return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
        } else if (diffHours > 0) {
            return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
        } else {
            return 'Recently'
        }
    }

    // Fallback for regular date strings
    return formatDate(timestamp)
}
</script>
