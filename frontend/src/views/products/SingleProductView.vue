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
                    <!-- Header -->
                    <ProductHeader :title="item.title" :price="item.price" :collection="primaryCollection"
                        @share="shareProduct" />

                    <!-- Description -->
                    <InfoCard v-if="item.description" title="Description" :icon="InformationCircleIcon">
                        <div class="text-gray-600 dark:text-gray-400 leading-relaxed prose prose-sm max-w-none"
                            v-html="item.description"></div>
                    </InfoCard>

                    <!-- Collections -->
                    <InfoCard v-if="item.collections?.length > 0" title="Collections" :icon="TagIcon">
                        <div class="flex flex-wrap gap-2">
                            <span v-for="collection in item.collections" :key="collection.id"
                                class="inline-flex items-center px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium">
                                {{ collection.title }}
                            </span>
                        </div>
                    </InfoCard>

                    <!-- Action Buttons -->
                    <ProductActions :product="item" :is-in-wishlist="item.isInWishlist" @share="shareProduct"
                        @toggle-wishlist="toggleWishlist" />
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
import InfoCard from '@/components/common/InfoCard.vue'
import ProductHeader from '@/components/products/ProductHeader.vue'
import ProductActions from '@/components/products/ProductActions.vue'
import ProductCard from '@/components/products/ProductCard.vue'
import {
    HeartIcon,
    InformationCircleIcon,
    TagIcon
} from '@heroicons/vue/24/outline'
import BackButton from '@/components/common/buttons/BackButton.vue'

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
