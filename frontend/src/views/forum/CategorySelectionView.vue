<template>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Modern Header with Professional Gradient Background -->
        <div
            class="relative mb-8 p-8 rounded-2xl bg-gradient-to-br from-primary-600 via-primary-700 to-gray-800 shadow-xl">
            <div class="absolute inset-0 bg-black/10 rounded-2xl backdrop-blur-sm"></div>
            <div class="relative z-10 text-center">
                <div class="text-white">
                    <h1 class="text-4xl font-bold mb-2">Forum Categories</h1>
                    <p class="text-primary-100 text-lg">
                        Choose a category to start or join discussions with fellow motorcycle enthusiasts
                    </p>
                </div>
            </div>
        </div>

        <!-- Search and Stats -->
        <div
            class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6 mb-8">
            <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <!-- Search Categories -->
                <div class="flex-1 max-w-lg">
                    <div class="relative group">
                        <MagnifyingGlassIcon
                            class="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 transition-colors group-focus-within:text-primary-500" />
                        <input v-model="searchQuery" type="text" placeholder="Search categories..."
                            class="pl-12 pr-4 py-3 w-full border border-gray-300/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 backdrop-blur-sm">
                    </div>
                </div>

                <!-- Forum Stats -->
                <div class="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
                    <div class="flex items-center space-x-2">
                        <ChatBubbleLeftIcon class="w-5 h-5" />
                        <span>{{ totalTopics }} Topics</span>
                    </div>
                    <div class="flex items-center space-x-2">
                        <UserIcon class="w-5 h-5" />
                        <span>{{ totalUsers }} Members</span>
                    </div>
                    <div class="flex items-center space-x-2">
                        <EyeIcon class="w-5 h-5" />
                        <span>{{ totalViews }} Views</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Categories Grid -->
        <div v-if="loading" class="text-center py-12">
            <LoadingSection message="Loading categories..." />
        </div>

        <div v-else-if="filteredCategories.length === 0" class="text-center py-12">
            <ChatBubbleLeftRightIcon class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No categories found</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {{ searchQuery ? 'Try adjusting your search terms.' : 'Categories are being set up.' }}
            </p>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <CategoryCard v-for="category in filteredCategories" :key="category.id" :category="category" />
        </div>

        <!-- Quick Actions Footer -->
        <div class="mt-12 text-center">
            <div
                class="inline-flex items-center space-x-4 px-6 py-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50">
                <div class="text-sm text-gray-600 dark:text-gray-400">
                    New to the forum?
                </div>
                <ActionButton @click="$router.push('/register')" variant="outline" size="sm">
                    Join Community
                </ActionButton>
                <ActionButton @click="scrollToTop" variant="ghost" size="sm">
                    Back to Top
                </ActionButton>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useForumStore } from '@/stores/forum';
import { FORUM_CATEGORIES, CATEGORY_LABELS } from '@/utils/constants.repository';
import { getCategoryLabel } from '@/utils/helpers';
import ActionButton from '@/components/common/buttons/ActionButton.vue';
import LoadingSection from '@/components/common/sections/LoadingSection.vue';
import CategoryCard from '@/components/forum/CategoryCard.vue';
import {
    MagnifyingGlassIcon,
    ChatBubbleLeftIcon,
    ChatBubbleLeftRightIcon,
    UserIcon,
    EyeIcon
} from '@heroicons/vue/24/outline';

const forumStore = useForumStore();

// Local state
const searchQuery = ref('');
const loading = ref(true);
const categories = ref([]);

// Computed properties
const filteredCategories = computed(() => {
    if (!searchQuery.value) return categories.value;

    const query = searchQuery.value.toLowerCase();
    return categories.value.filter(category => {
        const label = getCategoryLabel(category.id).toLowerCase();
        const description = category.description.toLowerCase();
        return label.includes(query) || description.includes(query);
    });
});

const totalTopics = computed(() => {
    return categories.value.reduce((sum, cat) => sum + (cat.topicCount || 0), 0);
});

const totalUsers = computed(() => {
    // This would normally come from global forum stats API
    return 1247; // Mock data for now
});

const totalViews = computed(() => {
    return categories.value.reduce((sum, cat) => sum + (cat.totalViews || 0), 0);
});

// Methods
const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Load forum statistics on mount
onMounted(async () => {
    try {
        // Load real category data with statistics
        const categoryData = await forumStore.loadCategoryStats();
        
        if (categoryData && categoryData.length > 0) {
            categories.value = categoryData.map(category => ({
                ...category,
                // Ensure we have the required structure for the UI
                description: category.description || getDefaultCategoryDescription(category.id),
                topicCount: category.topicCount || 0,
                totalViews: category.totalViews || 0,
                lastActivity: category.lastActivity || null
            }));
        } else {
            // Fallback to default categories if API fails
            categories.value = getDefaultCategories();
        }
    } catch (error) {
        console.error('Error loading forum categories:', error);
        // Fallback to default categories
        categories.value = getDefaultCategories();
    } finally {
        loading.value = false;
    }
});

// Helper function to get default category descriptions
const getDefaultCategoryDescription = (categoryId) => {
    const descriptions = {
        [FORUM_CATEGORIES.GENERAL]: 'General discussions about motorcycles, riding experiences, and community topics',
        [FORUM_CATEGORIES.TECHNICAL]: 'Technical support, troubleshooting, and mechanical discussions',
        [FORUM_CATEGORIES.MAINTENANCE]: 'Maintenance schedules, DIY repairs, and service recommendations',
        [FORUM_CATEGORIES.REVIEWS]: 'Bike reviews, gear recommendations, and product discussions',
        [FORUM_CATEGORIES.EVENTS]: 'Motorcycle events, meetups, rides, and community gatherings',
        [FORUM_CATEGORIES.MARKETPLACE]: 'Buy, sell, and trade motorcycles, parts, and accessories'
    };
    return descriptions[categoryId] || 'Join the discussion';
};

// Fallback categories for when API is not available
const getDefaultCategories = () => {
    return [
        {
            id: FORUM_CATEGORIES.GENERAL,
            description: getDefaultCategoryDescription(FORUM_CATEGORIES.GENERAL),
            topicCount: 0,
            totalViews: 0,
            lastActivity: null
        },
        {
            id: FORUM_CATEGORIES.TECHNICAL,
            description: getDefaultCategoryDescription(FORUM_CATEGORIES.TECHNICAL),
            topicCount: 0,
            totalViews: 0,
            lastActivity: null
        },
        {
            id: FORUM_CATEGORIES.MAINTENANCE,
            description: getDefaultCategoryDescription(FORUM_CATEGORIES.MAINTENANCE),
            topicCount: 0,
            totalViews: 0,
            lastActivity: null
        },
        {
            id: FORUM_CATEGORIES.REVIEWS,
            description: getDefaultCategoryDescription(FORUM_CATEGORIES.REVIEWS),
            topicCount: 0,
            totalViews: 0,
            lastActivity: null
        },
        {
            id: FORUM_CATEGORIES.EVENTS,
            description: getDefaultCategoryDescription(FORUM_CATEGORIES.EVENTS),
            topicCount: 0,
            totalViews: 0,
            lastActivity: null
        },
        {
            id: FORUM_CATEGORIES.MARKETPLACE,
            description: getDefaultCategoryDescription(FORUM_CATEGORIES.MARKETPLACE),
            topicCount: 0,
            totalViews: 0,
            lastActivity: null
        }
    ];
};
</script>
