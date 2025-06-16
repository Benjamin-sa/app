<template>
    <div class="space-y-8">
        <!-- Grid with responsive columns -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            <ProductCard v-for="product in products" :key="product.id" :product="product" />
        </div>

        <!-- Products Summary -->
        <div v-if="products.length > 0" class="text-center py-6">
            <div
                class="inline-flex items-center space-x-2 px-6 py-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-xl">
                <CheckCircleIcon class="w-5 h-5" />
                <span class="font-medium">Showing {{ products.length }} amazing product{{ products.length !== 1 ? 's' :
                    '' }}! 🛒</span>
            </div>
        </div>
    </div>
</template>

<script setup>
import ProductCard from '@/components/products/ProductCard.vue';
import { CheckCircleIcon } from '@heroicons/vue/24/outline';

defineProps({
    products: {
        type: Array,
        default: () => []
    }
});
</script>
