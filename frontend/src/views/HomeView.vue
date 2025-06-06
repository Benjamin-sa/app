<template>
    <div>
        <!-- Hero Section -->
        <section class="bg-gradient-to-br from-primary-600 to-primary-800 text-white">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
                <div class="text-center">
                    <h1 class="text-4xl md:text-6xl font-bold mb-6">
                        Welcome to Motordash
                    </h1>
                    <p class="text-xl md:text-2xl text-primary-100 mb-8 max-w-3xl mx-auto">
                        The ultimate motorcycle community platform where enthusiasts connect, share knowledge, and
                        discover the latest gear.
                    </p>
                    <div class="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button size="lg" @click="$router.push('/forum')"
                            class="bg-white text-primary-600 hover:bg-gray-50">
                            Explore Forum
                        </Button>
                        <Button size="lg" variant="outline" @click="$router.push('/products')"
                            class="border-white text-white hover:bg-white hover:text-primary-600">
                            Browse Products
                        </Button>
                    </div>
                </div>
            </div>
        </section>

        <!-- Features Section -->
        <section class="py-16 bg-white">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center mb-12">
                    <h2 class="text-3xl font-bold text-gray-900 mb-4">
                        Everything You Need in One Place
                    </h2>
                    <p class="text-lg text-gray-600 max-w-2xl mx-auto">
                        Join thousands of motorcycle enthusiasts sharing their passion, knowledge, and experiences.
                    </p>
                </div>

                <div class="grid md:grid-cols-3 gap-8">
                    <div class="text-center">
                        <div
                            class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ChatBubbleLeftRightIcon class="w-8 h-8 text-primary-600" />
                        </div>
                        <h3 class="text-xl font-semibold text-gray-900 mb-2">Active Forum</h3>
                        <p class="text-gray-600">
                            Engage with fellow riders, ask questions, share experiences, and learn from the community.
                        </p>
                    </div>

                    <div class="text-center">
                        <div
                            class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ShoppingBagIcon class="w-8 h-8 text-primary-600" />
                        </div>
                        <h3 class="text-xl font-semibold text-gray-900 mb-2">Product Catalog</h3>
                        <p class="text-gray-600">
                            Discover and review the latest motorcycle gear, parts, and accessories from trusted brands.
                        </p>
                    </div>

                    <div class="text-center">
                        <div
                            class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <UserGroupIcon class="w-8 h-8 text-primary-600" />
                        </div>
                        <h3 class="text-xl font-semibold text-gray-900 mb-2">Community</h3>
                        <p class="text-gray-600">
                            Connect with like-minded riders, build your reputation, and become part of the family.
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <!-- Recent Activity Section -->
        <section class="py-16 bg-gray-50">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class=" gap-12">
                    <!-- Recent Forum Topics -->
                    <div>
                        <div class="flex items-center justify-between mb-6">
                            <h2 class="text-2xl font-bold text-gray-900">Recent Forum Activity</h2>
                            <Button variant="outline" size="sm" @click="$router.push('/forum')">
                                View All
                            </Button>
                        </div>

                        <LoadingSpinner v-if="loadingTopics" />
                        <div v-else-if="recentTopics.length > 0" class="space-y-4">
                            <div v-for="topic in recentTopics" :key="topic.id"
                                class="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                                @click="$router.push(`/forum/topic/${topic.id}`)">
                                <h3 class="font-medium text-gray-900 mb-1">{{ topic.title }}</h3>
                                <p class="text-sm text-gray-600 mb-2">{{ topic.content.substring(0, 100) }}...</p>
                                <div class="flex items-center text-xs text-gray-500">
                                    <span>by {{ topic.authorDisplayName }}</span>
                                    <span class="mx-2">•</span>
                                    <span>{{ formatDate(topic.createdAt) }}</span>
                                    <span class="mx-2">•</span>
                                    <span>{{ topic.answerCount || 0 }} replies</span>
                                </div>
                            </div>
                        </div>
                        <div v-else class="text-center py-8 text-gray-500">
                            No recent topics found
                        </div>
                    </div>

                </div>
            </div>
        </section>

        <!-- CTA Section -->
        <section class="bg-primary-600 text-white py-16">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h2 class="text-3xl font-bold mb-4">Ready to Join the Community?</h2>
                <p class="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
                    Create your account today and become part of the most vibrant motorcycle community online.
                </p>
                <Button v-if="!authStore.isAuthenticated" size="lg" @click="$router.push('/register')"
                    class="bg-white text-primary-600 hover:bg-gray-50">
                    Get Started
                </Button>
                <Button v-else size="lg" @click="$router.push('/forum')"
                    class="bg-white text-primary-600 hover:bg-gray-50">
                    Start Contributing
                </Button>
            </div>
        </section>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { apiService } from '@/services/api.service';
import { formatDate } from '@/utils/helpers';
import Button from '@/components/common/Button.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import {
    ChatBubbleLeftRightIcon,
    ShoppingBagIcon,
    UserGroupIcon,
    StarIcon
} from '@heroicons/vue/24/outline';

const authStore = useAuthStore();

const recentTopics = ref([]);
const featuredProducts = ref([]);
const loadingTopics = ref(false);
const loadingProducts = ref(false);

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

const loadFeaturedProducts = async () => {
    try {
        loadingProducts.value = true;
        const response = await apiService.get('/products', {
            params: { limit: 5, featured: true }
        });
        featuredProducts.value = response.data.products || [];
    } catch (error) {
        console.error('Error loading featured products:', error);
    } finally {
        loadingProducts.value = false;
    }
};

onMounted(() => {
    loadRecentTopics();
    loadFeaturedProducts();
});
</script>
