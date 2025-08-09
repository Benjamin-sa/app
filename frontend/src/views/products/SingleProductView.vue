<template>
    <DetailPageLayout :loading="loading" :error="error" :item="product" loading-message="Loading product details..."
        :breadcrumb-items="breadcrumbItems" :related-items="relatedProducts" related-title="Related Products"
        view-all-link="/products" not-found-title="Product Not Found"
        not-found-description="The product you're looking for doesn't exist or has been removed." @retry="fetchProduct">

        <template #before-content>
            <BackButton label="Back to Products" fallback-path="/products" />
        </template>

        <template #content="{ item }">
            <!-- Product Details Grid -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                <!-- Product Images -->
                <ImageGallery :images="item.images || []" :alt="item.title" ref="imageGallery">
                    <template #action-button>
                        <ActionButton :icon="HeartIcon" :is-active="item.isInWishlist" :fill-when-active="true"
                            @click="toggleWishlist" />
                    </template>
                </ImageGallery>

                <!-- Product Info -->
                <div class="space-y-6">
                    <!-- Product Header -->
                    <div class="space-y-4">
                        <div class="flex items-start justify-between">
                            <h1
                                class="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white leading-tight flex-1">
                                {{ item.title }}
                            </h1>
                            <button @click="shareProduct"
                                class="p-2 ml-4 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-primary-500 transition-all duration-200">
                                <ShareIcon class="w-5 h-5" />
                            </button>
                        </div>

                        <!-- Price and Collection -->
                        <div
                            class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                            <div class="flex flex-col">
                                <span class="text-3xl sm:text-4xl font-bold text-primary-600 dark:text-primary-400">
                                    €{{ item.price }}
                                </span>
                                <span class="text-sm text-gray-500 dark:text-gray-400">Best Price Guaranteed</span>
                            </div>
                            <span v-if="primaryCollection"
                                class="inline-flex items-center px-4 py-2 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-xl text-sm font-semibold">
                                {{ primaryCollection.title }}
                            </span>
                        </div>
                    </div>

                    <!-- Description -->
                    <div v-if="item.description"
                        class="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
                        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                            <InformationCircleIcon class="w-5 h-5 mr-2 text-primary-600 dark:text-primary-400" />
                            Description
                        </h3>
                        <div class="text-gray-600 dark:text-gray-400 leading-relaxed prose prose-sm max-w-none"
                            v-html="item.description"></div>
                    </div>

                    <!-- Collections -->
                    <div v-if="item.collections?.length > 0"
                        class="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
                        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                            <TagIcon class="w-5 h-5 mr-2 text-primary-600 dark:text-primary-400" />
                            Collections
                        </h3>
                        <div class="flex flex-wrap gap-2">
                            <span v-for="collection in item.collections" :key="collection.id"
                                class="inline-flex items-center px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium">
                                {{ collection.title }}
                            </span>
                        </div>
                    </div>

                    <!-- Action Buttons -->
                    <div class="space-y-3 pt-4">
                        <a :href="`https://motordashbnl.myshopify.com/products/${item.handle}`" target="_blank"
                            rel="noopener noreferrer"
                            class="w-full inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group">
                            <ShoppingCartIcon class="w-5 h-5 mr-2" />
                            Buy on Shopify
                            <ArrowTopRightOnSquareIcon
                                class="w-4 h-4 ml-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
                        </a>

                        <div class="grid grid-cols-2 gap-3">
                            <ActionButton @click="shareProduct" variant="outline"
                                class="rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                                <ShareIcon class="w-5 h-5 mr-2" />
                                Share
                            </ActionButton>
                            <ActionButton @click="toggleWishlist" :variant="item.isInWishlist ? 'secondary' : 'outline'"
                                :class="item.isInWishlist ? 'text-red-500 border-red-300' : ''"
                                class="rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                                <HeartIcon :class="['w-5 h-5 mr-2', item.isInWishlist ? 'fill-current' : '']" />
                                {{ item.isInWishlist ? 'Saved' : 'Save' }}
                            </ActionButton>
                        </div>
                    </div>
                </div>
            </div>
        </template>

        <template #related-item="{ item }">
            <ProductCard :product="item" />
        </template>
    </DetailPageLayout>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/ui/notification'
import { useProductStore } from '@/stores/products'
import DetailPageLayout from '@/layouts/DetailPageLayout.vue'
import ImageGallery from '@/components/common/images/ImageGallery.vue'
import ActionButton from '@/components/common/buttons/ActionButton.vue'
import ProductCard from '@/components/products/ProductCard.vue'
import BackButton from '@/components/common/buttons/BackButton.vue'
import {
    HeartIcon,
    InformationCircleIcon,
    TagIcon,
    ShareIcon,
    ShoppingCartIcon,
    ArrowTopRightOnSquareIcon
} from '@heroicons/vue/24/outline'

const route = useRoute()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()
const productStore = useProductStore()

const loading = ref(false)
const error = ref(null)
const imageGallery = ref(null)

const productId = computed(() => route.params.id)

// Get product from store
const product = computed(() => productStore.getProduct(productId.value))

// Get related products from store
const relatedProducts = computed(() => productStore.getRelatedProducts(productId.value))

const breadcrumbItems = computed(() => [
    { label: 'Home', to: '/' },
    { label: 'Products', to: '/products' },
    { label: product.value?.title || 'Product', current: true }
])

const primaryCollection = computed(() => {
    if (product.value?.collections && product.value.collections.length > 0) {
        return product.value.collections[1] // Skip "All Products" collection
    }
    return null
})

const fetchProduct = async () => {
    try {
        loading.value = true
        error.value = null

        // Load product from store
        const loadedProduct = await productStore.loadProduct(productId.value)

        if (!loadedProduct) {
            error.value = 'Product not found'
            return
        }

        // Fetch related products from the same collection
        if (primaryCollection.value) {
            await productStore.loadRelatedProducts(productId.value, primaryCollection.value.handle)
        }
    } catch (err) {
        console.error('Error fetching product:', err)
        error.value = 'Failed to load product'
    } finally {
        loading.value = false
    }
}

const toggleWishlist = async () => {
    if (!authStore.isAuthenticated) {
        notificationStore.info('Sign in required', 'Please sign in to add products to your wishlist.')
        return
    }

    try {
        const newWishlistState = await productStore.toggleWishlist(productId.value)

        notificationStore.success(
            newWishlistState ? 'Added to wishlist' : 'Removed from wishlist',
            newWishlistState
                ? 'Product added to your wishlist.'
                : 'Product removed from your wishlist.'
        )
    } catch (err) {
        notificationStore.error('Wishlist error', 'Unable to update wishlist. Please try again.')
    }
}

const shareProduct = async () => {
    const url = window.location.href
    const title = `${product.value.title} - Motordash`
    const text = `Check out this product on Motordash: ${product.value.title}`

    if (navigator.share) {
        try {
            await navigator.share({ title, text, url })
        } catch (err) {
            if (err.name !== 'AbortError') {
                fallbackShare(url)
            }
        }
    } else {
        fallbackShare(url)
    }
}

const fallbackShare = async (url) => {
    try {
        await navigator.clipboard.writeText(url)
        notificationStore.success('Link copied', 'Product link copied to clipboard!')
    } catch (err) {
        notificationStore.error('Share failed', 'Failed to copy link')
    }
}

onMounted(() => {
    fetchProduct()
})

// Watch for route changes to handle navigation between products
watch(() => route.params.id, () => {
    if (route.name === 'Product') {
        fetchProduct()
    }
})
</script>
