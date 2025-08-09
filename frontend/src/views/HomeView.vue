<template>
    <div>
        <!-- Enhanced Hero Section with Modern Gradient -->
        <section
            class="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white overflow-hidden">
            <div class="absolute inset-0 bg-black/10 backdrop-blur-sm"></div>
            <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
                <div class="text-center">
                    <h1
                        class="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-primary-100 bg-clip-text text-transparent">
                        {{ $t('home.welcome') }}
                    </h1>
                    <p class="text-xl md:text-2xl text-primary-100 mb-8 max-w-3xl mx-auto leading-relaxed">
                        {{ $t('home.tagline') }}
                    </p>
                    <div class="flex flex-col sm:flex-row gap-4 justify-center">
                        <ActionButton size="lg" @click="$router.push('/forum')" variant="white"
                            class="transform hover:scale-105 transition-all duration-200">
                            {{ $t('home.exploreForum') }}
                        </ActionButton>
                        <ActionButton size="lg" variant="outline" @click="$router.push('/products')"
                            class="border-white/50 text-white hover:bg-white/10 hover:border-white backdrop-blur-sm transform hover:scale-105 transition-all duration-200">
                            {{ $t('home.browseProducts') }}
                        </ActionButton>
                    </div>
                </div>
            </div>
        </section>

        <!-- Features Section -->
        <section class="py-16 bg-white dark:bg-gray-900">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center mb-12">
                    <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                        {{ $t('home.featuresTitle') }}
                    </h2>
                    <p class="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        {{ $t('home.featuresSubtitle') }}
                    </p>
                </div>

                <div class="grid md:grid-cols-3 gap-8">
                    <div class="text-center">
                        <div
                            class="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ChatBubbleLeftRightIcon class="w-8 h-8 text-primary-600 dark:text-primary-500" />
                        </div>
                        <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">{{
                            $t('home.features.forumTitle') }}</h3>
                        <p class="text-gray-600 dark:text-gray-400">
                            {{ $t('home.features.forumDesc') }}
                        </p>
                    </div>

                    <div class="text-center">
                        <div
                            class="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ShoppingBagIcon class="w-8 h-8 text-primary-600 dark:text-primary-500" />
                        </div>
                        <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">{{
                            $t('home.features.productsTitle') }}</h3>
                        <p class="text-gray-600 dark:text-gray-400">
                            {{ $t('home.features.productsDesc') }}
                        </p>
                    </div>

                    <div class="text-center">
                        <div
                            class="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <UserGroupIcon class="w-8 h-8 text-primary-600 dark:text-primary-500" />
                        </div>
                        <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">{{
                            $t('home.features.communityTitle') }}</h3>
                        <p class="text-gray-600 dark:text-gray-400">
                            {{ $t('home.features.communityDesc') }}
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <!-- Recent Activity Section -->
        <section class="py-16 bg-gray-50 dark:bg-gray-800">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="gap-12">
                    <!-- Recent Forum Topics -->
                    <div>
                        <div class="flex items-center justify-between mb-6">
                            <h2 class="text-2xl font-bold text-gray-900 dark:text-white">{{
                                $t('home.recentActivityTitle') }}</h2>
                            <ActionButton variant="outline" size="sm" @click="$router.push('/forum')">
                                {{ $t('home.viewAll') }}
                            </ActionButton>
                        </div>

                        <LoadingSection v-if="loadingTopics" :message="$t('home.loadingTopics')" />
                        <div v-else-if="recentTopics.length > 0" class="space-y-4">
                            <div v-for="topic in recentTopics" :key="topic.id"
                                class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-6 hover:shadow-xl dark:hover:shadow-gray-900/25 transition-all duration-200 cursor-pointer hover:scale-[1.02] transform"
                                @click="$router.push(`/forum/topic/${topic.id}`)">
                                <h3 class="font-semibold text-gray-900 dark:text-white mb-2 text-lg">{{ topic.title }}
                                </h3>
                                <p class="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{{
                                    stripHtml(topic.content).substring(0, 150) }}{{ stripHtml(topic.content).length >
                                        150 ? '...' : '' }}
                                </p>
                                <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                    <div class="flex items-center space-x-4">
                                        <span class="flex items-center space-x-1">
                                            <span class="font-medium">{{ topic.authorDisplayName }}</span>
                                        </span>
                                        <span class="flex items-center space-x-1">
                                            <span>{{ formatDate(topic.createdAt) }}</span>
                                        </span>
                                        <span
                                            class="flex items-center space-x-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                                            <span>{{ topic.answerCount || 0 }} {{ $t('home.replies') }}</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div v-else class="text-center py-12">
                            <div
                                class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-8">
                                <p class="text-gray-500 dark:text-gray-400 text-lg">{{ $t('home.noTopics') }}</p>
                                <ActionButton v-if="authStore.isAuthenticated" @click="$router.push('/forum')"
                                    variant="primary" size="sm" class="mt-4">
                                    {{ $t('home.exploreCategories') }}
                                </ActionButton>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>

        <!-- CTA Section -->
        <section class="bg-primary-600 text-white py-16">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h2 class="text-3xl font-bold mb-4">{{ $t('home.ctaTitle') }}</h2>
                <p class="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
                    {{ $t('home.ctaDesc') }}
                </p>
                <ActionButton v-if="!authStore.isAuthenticated" size="lg" @click="$router.push('/register')"
                    class="bg-white text-primary-600 hover:bg-gray-50">
                    {{ $t('home.getStarted') }}
                </ActionButton>
                <ActionButton v-else size="lg" @click="$router.push('/forum')"
                    class="bg-white text-primary-600 hover:bg-gray-50">
                    {{ $t('home.startContributing') }}
                </ActionButton>
            </div>
        </section>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { apiService } from '@/services/api.service';
import { formatDate } from '@/utils/helpers';
import ActionButton from '@/components/common/buttons/ActionButton.vue';
import LoadingSection from '@/components/common/sections/LoadingSection.vue';
import {
    ChatBubbleLeftRightIcon,
    ShoppingBagIcon,
    UserGroupIcon
} from '@heroicons/vue/24/outline';

const authStore = useAuthStore();

const recentTopics = ref([]);
const loadingTopics = ref(false);

const loadRecentTopics = async () => {
    try {
        loadingTopics.value = true;
        const response = await apiService.get('/forum/topics', {
            params: { limit: 5, sort: 'createdAt', order: 'desc' }
        });
        recentTopics.value = response.data.topics || [];
    } catch (error) {
        console.error('Error loading recent topics:', error);
    } finally {
        loadingTopics.value = false;
    }
};

// Utility function to strip HTML tags from content
const stripHtml = (html) => {
    if (!html) return '';

    // Create a temporary DOM element to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Get text content and clean up extra whitespace
    return tempDiv.textContent || tempDiv.innerText || '';
};

onMounted(() => {
    loadRecentTopics();
});
</script>
