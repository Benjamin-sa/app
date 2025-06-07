<template>
    <div class="container mx-auto px-4 py-8">
        <!-- Loading State -->
        <div v-if="loading" class="flex justify-center items-center min-h-64">
            <LoadingSpinner size="lg" />
        </div>

        <!-- Error State -->
        <ErrorMessage v-else-if="error" :message="error" />

        <!-- Product Content -->
        <div v-else-if="product" class="max-w-6xl mx-auto">
            <!-- Breadcrumb -->
            <nav class="mb-6 text-sm">
                <ol class="flex space-x-2">
                    <li><router-link to="/" class="text-primary-600 hover:text-primary-700">Home</router-link></li>
                    <li class="text-gray-400">/</li>
                    <li><router-link to="/products"
                            class="text-primary-600 hover:text-primary-700">Products</router-link></li>
                    <li class="text-gray-400">/</li>
                    <li class="text-gray-600">{{ product.title }}</li>
                </ol>
            </nav>

            <!-- Product Details -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <!-- Product Images -->
                <div class="space-y-4">
                    <div class="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        <img v-if="primaryImage" :src="primaryImage" :alt="product.title"
                            class="w-full h-full object-cover" />
                        <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
                            <svg> class="w-24 h-24" fill="currentColor" viewBox="0 0 20 20"</svg>
                            <path fill-rule="evenodd"
                                d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                                clip-rule="evenodd" />
                        </div>
                    </div>

                    <!-- Additional Images -->
                    <div v-if="product.images && product.images.length > 1" class="grid grid-cols-4 gap-2">
                        <div v-for="(image, index) in product.images.slice(1, 5)" :key="image.id"
                            class="aspect-square bg-gray-100 rounded-md overflow-hidden cursor-pointer hover:opacity-75"
                            @click="selectImage(image.src)">
                            <img :src="image.src" :alt="image.alt || product.title"
                                class="w-full h-full object-cover" />
                        </div>
                    </div>
                </div>

                <!-- Product Info -->
                <div class="space-y-6">
                    <div>
                        <h1 class="text-3xl font-bold text-gray-900 mb-2">{{ product.title }}</h1>
                        <div class="flex items-center space-x-4 mb-4">
                            <span class="text-2xl font-bold text-primary-600">${{ product.price }}</span>
                            <span v-if="primaryCollection"
                                class="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                                {{ primaryCollection.title }}
                            </span>
                        </div>
                    </div>

                    <!-- Description -->
                    <div v-if="product.description">
                        <h3 class="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                        <div class="text-gray-600 leading-relaxed" v-html="product.description"></div>
                    </div>

                    <!-- Collections -->
                    <div v-if="product.collections && product.collections.length > 0">
                        <h3 class="text-lg font-semibold text-gray-900 mb-3">Collections</h3>
                        <div class="flex flex-wrap gap-2">
                            <span v-for="collection in product.collections" :key="collection.id"
                                class="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                                {{ collection.title }}
                            </span>
                        </div>
                    </div>

                    <!-- Action Buttons -->
                    <div class="space-y-3">
                        <a :href="`https://motordash.myshopify.com/products/${product.handle}`" target="_blank"
                            rel="noopener noreferrer" class="w-full btn-primary block text-center">
                            View on Shopify
                            <svg class="w-4 h-4 ml-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </a>
                        <Button variant="secondary" class="w-full" @click="shareProduct">
                            Share Product
                        </Button>
                    </div>
                </div>
            </div>

            <!-- Related Products -->
            <div v-if="relatedProducts.length > 0" class="border-t border-gray-200 pt-8">
                <h2 class="text-2xl font-bold text-gray-900 mb-6">Related Products</h2>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <ProductCard v-for="relatedProduct in relatedProducts" :key="relatedProduct.id"
                        :product="relatedProduct" />
                </div>
            </div>
        </div>

        <!-- Product Not Found -->
        <div v-else class="text-center py-12">
            <h1 class="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
            <p class="text-gray-600 mb-6">The product you're looking for doesn't exist or has been removed.</p>
            <router-link to="/products" class="btn-primary">Browse Products</router-link>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useNotificationStore } from '@/stores/notification'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ErrorMessage from '@/components/common/ErrorMessage.vue'
import Button from '@/components/common/Button.vue'
import ProductCard from '@/components/products/ProductCard.vue'
import apiService from '@/services/api.service'

const route = useRoute()
const notificationStore = useNotificationStore()

const product = ref(null)
const relatedProducts = ref([])
const loading = ref(true)
const error = ref(null)
const selectedImageSrc = ref(null)

const productId = computed(() => route.params.id)

const primaryImage = computed(() => {
    if (selectedImageSrc.value) return selectedImageSrc.value
    if (product.value?.images && product.value.images.length > 0) {
        return product.value.images[0].src
    }
    return null
})

const primaryCollection = computed(() => {
    if (product.value?.collections && product.value.collections.length > 0) {
        return product.value.collections[1] // collectie 0 is voor ALLE producten
    }
    return null
})

const selectImage = (src) => {
    selectedImageSrc.value = src
}

const fetchProduct = async () => {
    try {
        loading.value = true
        error.value = null

        const response = await apiService.client.get(`/products/${productId.value}/with-images`)
        product.value = response

        // Fetch related products from the same collection
        if (primaryCollection.value) {
            await fetchRelatedProducts()
        }
    } catch (err) {
        console.error('Error fetching product:', err)
        error.value = 'Failed to load product'
    } finally {
        loading.value = false
    }
}

const fetchRelatedProducts = async () => {
    try {
        const response = await apiService.client.get(`/products/collection/${primaryCollection.value.handle}`)
        // Filter out current product and limit to 4
        relatedProducts.value = response
            .filter(p => p.id !== productId.value)
            .slice(0, 4)
    } catch (err) {
        console.error('Error fetching related products:', err)
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
        selectedImageSrc.value = null // Reset selected image
        fetchProduct()
    }
})
</script>
