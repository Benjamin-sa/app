<template>
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800"
        :style="{ paddingTop: `${navbarStore.navbarHeight}px` }">
        <!-- Page Title Section (Non-sticky) -->
        <div
            class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-xl border-b border-gray-200/50 dark:border-gray-700/50">
            <div class="container mx-auto px-4 py-6 sm:py-8">
                <div class="text-center space-y-4">
                    <div
                        class="inline-flex items-center justify-center p-3 bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30 rounded-2xl mb-4">
                        <ShoppingBagIcon class="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h1
                        class="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                        🛒 Product Gallery
                    </h1>
                    <p class="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Discover the best motorcycle gear, parts, and accessories. From helmets to performance upgrades,
                        find everything you need for your ride.
                    </p>
                    <div class="flex items-center justify-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                        <div class="flex items-center space-x-2">
                            <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span>{{ products.length }} products available</span>
                        </div>
                        <div class="flex items-center space-x-2">
                            <ShoppingBagIcon class="w-4 h-4" />
                            <span>Premium quality</span>
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
                            <div class="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                <AdjustmentsHorizontalIcon class="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Filters & Search</h2>
                                <p class="text-xs text-gray-500 dark:text-gray-400">Find your perfect product</p>
                            </div>
                        </div>

                        <!-- Mobile Filter Toggle -->
                        <button @click="showFilters = !showFilters"
                            class="sm:hidden flex items-center space-x-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg border border-green-200 dark:border-green-800 text-sm transition-all duration-200 hover:bg-green-100 dark:hover:bg-green-900/30">
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
                                <input v-model="searchQuery" @input="debouncedSearch"
                                    placeholder="Search products by name, description..."
                                    class="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all shadow-sm" />
                            </div>

                            <!-- Category Filter -->
                            <div class="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                                <label
                                    class="text-sm font-medium text-gray-700 dark:text-gray-300 sm:whitespace-nowrap">Category:</label>
                                <select v-model="selectedCategory"
                                    class="px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent min-w-0 sm:min-w-[140px] shadow-sm">
                                    <option value="">🛒 All Categories</option>
                                    <option v-for="collection in collections" :key="collection.id"
                                        :value="collection.handle">
                                        {{ collection.title }}
                                    </option>
                                </select>
                            </div>

                            <!-- Clear Filters -->
                            <button v-if="searchQuery || selectedCategory" @click="clearFilters"
                                class="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap shadow-sm">
                                Clear All
                            </button>

                            <!-- Results Count -->
                            <div
                                class="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 sm:ml-auto">
                                <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span class="font-medium">{{ products.length }} product{{ products.length !== 1 ? 's' :
                                    '' }} found</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Content -->
        <div class="container mx-auto px-4 py-6 sm:py-8">
            <!-- Loading State -->
            <LoadingSection v-if="loading" message="Loading awesome products..." />

            <!-- Empty State -->
            <div v-else-if="products.length === 0" class="text-center py-16 sm:py-24">
                <div
                    class="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                    <ShoppingBagIcon class="w-12 h-12 text-gray-400" />
                </div>
                <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">No products found</h3>
                <p class="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                    {{ searchQuery ? 'Try adjusting your search terms or filters.' :
                        'No products available at the moment.' }}
                </p>
                <ActionButton v-if="searchQuery || selectedCategory" @click="clearFilters" :icon="XMarkIcon"
                    :activeClasses="'bg-primary-600 hover:bg-primary-700 text-white'"
                    :inactiveClasses="'bg-primary-600 hover:bg-primary-700 text-white'" />
            </div>

            <!-- Products Grid -->
            <ProductGrid v-else :products="products" />
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, watch, computed, onUnmounted } from 'vue';
import { debounce } from '@/utils/helpers';
import apiService from '@/services/api.service';
import ActionButton from '@/components/common/buttons/ActionButton.vue';
import ProductGrid from '@/components/products/ProductGrid.vue';
import {
    MagnifyingGlassIcon,
    ShoppingBagIcon,
    XMarkIcon
} from '@heroicons/vue/24/outline';
import { AdjustmentsHorizontalIcon } from '@heroicons/vue/24/outline';
import { useNavbarStore } from '@/stores/navbar';
import LoadingSection from '@/components/common/sections/LoadingSection.vue';

const navbarStore = useNavbarStore();

const searchQuery = ref('');
const selectedCategory = ref('');
const loading = ref(false);

const products = ref([]);
const collections = ref([]);

// Mobile detection and sticky filters
const isMobile = computed(() => window.innerWidth < 640)
const showFilters = ref(false)
const filtersSection = ref(null)
const isFiltersSticky = ref(false)

const debouncedSearch = debounce(() => {
    loadProducts();
}, 300);

const loadProducts = async () => {
    try {
        loading.value = true;

        let response;

        if (selectedCategory.value) {
            // Load products by collection
            response = await apiService.client.get(`/products/collection/${selectedCategory.value}`);
            products.value = response.success && Array.isArray(response.data) ? response.data : [];
        } else {
            // Load all products with images
            response = await apiService.client.get('/products/with-images');
            products.value = response.success && Array.isArray(response.data) ? response.data : [];
        }

        // Apply search filter client-side since backend doesn't support it
        if (searchQuery.value) {
            products.value = products.value.filter(product =>
                product.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                product.description.toLowerCase().includes(searchQuery.value.toLowerCase())
            );
        }
    } catch (error) {
        console.error('Error loading products:', error);
        products.value = [];
    } finally {
        loading.value = false;
    }
};

const loadCollections = async () => {
    try {
        const response = await apiService.get("/products/collections");
        collections.value = response.success && Array.isArray(response.data) ? response.data : [];
    } catch (error) {
        console.error('Error loading collections:', error);
        collections.value = [];
    }
};

const clearFilters = () => {
    searchQuery.value = '';
    selectedCategory.value = '';
    loadProducts();
};

// Handle sticky filters behavior
const handleScroll = () => {
    if (filtersSection.value) {
        const rect = filtersSection.value.getBoundingClientRect()
        const navbarHeight = navbarStore.effectiveNavbarHeight
        isFiltersSticky.value = rect.top <= navbarHeight
    }
}

// Close filters on escape key
const handleEscapeKey = (event) => {
    if (event.key === 'Escape') {
        showFilters.value = false
    }
}

// Watch for filter changes
watch(selectedCategory, () => {
    loadProducts();
});

onMounted(() => {
    loadProducts();
    loadCollections();
    window.addEventListener('scroll', handleScroll)
    window.addEventListener('keydown', handleEscapeKey)
});

// Clean up event listeners
onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
    window.removeEventListener('keydown', handleEscapeKey)
});

</script>
