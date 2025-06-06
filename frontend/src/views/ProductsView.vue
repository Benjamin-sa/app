<template>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
                <h1 class="text-3xl font-bold text-gray-900">Products</h1>
                <p class="mt-2 text-gray-600">
                    Discover the best motorcycle gear, parts, and accessories
                </p>
            </div>
        </div>

        <!-- Filters and Search -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <!-- Search -->
                <div class="lg:col-span-2">
                    <div class="relative">
                        <MagnifyingGlassIcon
                            class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input v-model="searchQuery" type="text" placeholder="Search products..."
                            class="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                            @input="debouncedSearch">
                    </div>
                </div>

                <!-- Category Filter -->
                <div>
                    <select v-model="selectedCategory"
                        class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500">
                        <option value="">All Collections</option>
                        <option value="helmets">Helmets</option>
                        <option value="jackets">Jackets</option>
                        <option value="gloves">Gloves</option>
                        <option value="boots">Boots</option>
                        <option value="parts">Parts</option>
                        <option value="accessories">Accessories</option>
                    </select>
                </div>
            </div>

            <!-- Clear Filters -->
            <div class="mt-4 pt-4 border-t border-gray-200">
                <div class="flex justify-end">
                    <Button variant="outline" size="sm" @click="clearFilters">
                        Clear Filters
                    </Button>
                </div>
            </div>
        </div>

        <!-- Products Grid -->
        <div class="space-y-6">
            <LoadingSpinner v-if="loading" />

            <div v-else-if="products.length === 0" class="text-center py-12">
                <ShoppingBagIcon class="mx-auto h-12 w-12 text-gray-400" />
                <h3 class="mt-2 text-sm font-medium text-gray-900">No products found</h3>
                <p class="mt-1 text-sm text-gray-500">
                    {{ searchQuery ? 'Try adjusting your search terms or filters.' :
                        'No products available at the moment.' }}</p>
            </div>

            <ProductGrid v-else :products="products" />
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { debounce } from '@/utils/helpers';
import apiService from '@/services/api.service';
import Button from '@/components/common/Button.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import ProductGrid from '@/components/products/ProductGrid.vue';
import {
    MagnifyingGlassIcon,
    ShoppingBagIcon
} from '@heroicons/vue/24/outline';

const searchQuery = ref('');
const selectedCategory = ref('');
const loading = ref(false);

const products = ref([]);

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
            products.value = Array.isArray(response) ? response : [];
        } else {
            // Load all products with images
            response = await apiService.client.get('/products/with-images');
            products.value = Array.isArray(response) ? response : [];
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

const clearFilters = () => {
    searchQuery.value = '';
    selectedCategory.value = '';
    loadProducts();
};

// Watch for filter changes
watch(selectedCategory, () => {
    loadProducts();
});

onMounted(() => {
    loadProducts();
});
</script>
