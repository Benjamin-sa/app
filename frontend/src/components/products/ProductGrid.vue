<template>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <ProductCard v-for="product in products" :key="product.id" :product="product"
            @click="$router.push(`/products/${product.id}`)" />
    </div>
</template>

<script setup>
import ProductCard from '@/components/products/ProductCard.vue';

defineProps({
    products: {
        type: Array,
        default: () => []
    }
});
</script>
