<template>
    <div class="space-y-3 pt-4">
        <a :href="`https://motordashbnl.myshopify.com/products/${product.handle}`" target="_blank"
            rel="noopener noreferrer"
            class="w-full inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group">
            <ShoppingCartIcon class="w-5 h-5 mr-2" />
            Buy on Shopify
            <ArrowTopRightOnSquareIcon
                class="w-4 h-4 ml-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
        </a>

        <div class="grid grid-cols-2 gap-3">
            <ActionButton @click="$emit('share')" :icon="ShareIcon"
                :activeClasses="'rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white'"
                :inactiveClasses="'rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white'" />
            <ActionButton @click="$emit('toggle-wishlist')" :icon="HeartIcon" :isActive="isInWishlist"
                :fillWhenActive="true"
                :activeClasses="'rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-red-500'"
                :inactiveClasses="'rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white'" />
        </div>
    </div>
</template>

<script setup>
import ActionButton from '@/components/common/buttons/ActionButton.vue'
import {
    HeartIcon,
    ShareIcon,
    ShoppingCartIcon,
    ArrowTopRightOnSquareIcon
} from '@heroicons/vue/24/outline'

defineProps({
    product: Object,
    isInWishlist: Boolean
})

defineEmits(['share', 'toggle-wishlist'])
</script>
