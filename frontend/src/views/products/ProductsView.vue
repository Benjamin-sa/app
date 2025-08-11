<template>
    <GalleryLayout :loading="loading" :is-empty="products.length === 0" :loading-message="$t('products.loading')"
        :filter-title="$t('products.filters.title')" :filter-subtitle="$t('products.filters.subtitle')"
        filter-icon-classes="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg"
        filter-icon-color-classes="text-green-600 dark:text-green-400" :empty-title="$t('products.empty.title')"
        :empty-description="searchQuery ? $t('products.empty.description') : $t('products.empty.noProductsAvailable')"
        :empty-state-icon="ShoppingBagIcon">

        <template #page-header>
            <div
                class="inline-flex items-center justify-center p-3 bg-gradient-to-r from-green-100 to-primary-100 dark:from-green-900/30 dark:to-primary-900/30 rounded-2xl mb-4">
                <ShoppingBagIcon class="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h1
                class="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-green-600 via-primary-600 to-accent-600 bg-clip-text text-transparent">
                🛒 {{ $t('products.title') }}
            </h1>
            <p class="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                {{ $t('products.subtitle') }}
            </p>
            <div class="flex items-center justify-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                <div class="flex items-center space-x-2">
                    <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>{{ $t('products.stats.productsAvailable', { count: products.length }) }}</span>
                </div>
                <div class="flex items-center space-x-2">
                    <ShoppingBagIcon class="w-4 h-4" />
                    <span>{{ $t('products.stats.premiumQuality') }}</span>
                </div>
            </div>
        </template>

        <template #filter-controls>
            <div
                class="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 p-4 sm:p-0 bg-gray-50/50 dark:bg-gray-800/50 sm:bg-transparent rounded-xl sm:rounded-none">
                <!-- Search Bar -->
                <div class="relative flex-1 sm:max-w-xs">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon class="h-4 w-4 text-gray-400" />
                    </div>
                    <input v-model="searchQuery" @input="debouncedSearch"
                        :placeholder="$t('products.searchPlaceholder')"
                        class="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all shadow-sm" />
                </div>

                <!-- Category Filter -->
                <div class="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                    <label
                        class="text-sm font-medium text-gray-700 dark:text-gray-300 sm:whitespace-nowrap">{{ $t('products.category') }}</label>
                    <select v-model="selectedCategory"
                        class="px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent min-w-0 sm:min-w-[140px] shadow-sm">
                        <option value="">🛒 {{ $t('products.categories.all') }}</option>
                        <option v-for="collection in collections" :key="collection.id" :value="collection.handle">
                            {{ collection.title }}
                        </option>
                    </select>
                </div>

                <!-- Clear Filters -->
                <button v-if="searchQuery || selectedCategory" @click="clearFilters"
                    class="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap shadow-sm">
                    {{ $t('products.filters.reset') }}
                </button>

                <!-- Results Count -->
                <div class="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 sm:ml-auto">
                    <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span class="font-medium">{{ products.length }} product{{ products.length !== 1 ? 's' : '' }}
                        found</span>
                </div>
            </div>
        </template>

        <template #empty-action>
            <ActionButton v-if="searchQuery || selectedCategory" @click="clearFilters" :icon="XMarkIcon"
                :activeClasses="'bg-primary-600 hover:bg-primary-700 text-white'"
                :inactiveClasses="'bg-primary-600 hover:bg-primary-700 text-white'" />
        </template>

        <template #grid-content>
            <ProductGrid :products="products" />
        </template>
    </GalleryLayout>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { debounce } from '@/utils/helpers';
import ActionButton from '@/components/common/buttons/ActionButton.vue';
import ProductGrid from '@/components/products/ProductGrid.vue';
import GalleryLayout from '@/layouts/GalleryLayout.vue';
import {
    MagnifyingGlassIcon,
    ShoppingBagIcon,
    XMarkIcon
} from '@heroicons/vue/24/outline';
import { useProductStore } from '@/stores/products';

const productStore = useProductStore();

// Use store state and computed properties
const searchQuery = computed({
    get: () => productStore.searchQuery,
    set: (value) => productStore.setSearchQuery(value)
})

const selectedCategory = computed({
    get: () => productStore.selectedCategory,
    set: (value) => productStore.setSelectedCategory(value)
})

const products = computed(() => productStore.getFilteredProducts)
const collections = computed(() => productStore.getAllCollections)
const loading = computed(() => productStore.isLoading('loadAllProducts') || productStore.isLoading('loadCollections'))

const debouncedSearch = debounce(() => {
    if (searchQuery.value.trim().length >= 2) {
        productStore.searchProducts(searchQuery.value);
    } else if (searchQuery.value.trim().length === 0) {
        // If search is cleared, reload all products
        loadProducts();
    }
}, 300);

const loadProducts = async () => {
    if (selectedCategory.value) {
        await productStore.loadProductsByCollection(selectedCategory.value);
    } else {
        await productStore.loadAllProducts();
    }
};

const loadCollections = async () => {
    await productStore.loadCollections();
};

const clearFilters = () => {
    productStore.clearFilters();
    loadProducts();
};

// Watch for filter changes
watch(selectedCategory, () => {
    loadProducts();
});

// Watch for search query changes
watch(searchQuery, debouncedSearch);

onMounted(() => {
    loadProducts();
    loadCollections();
});
</script>
