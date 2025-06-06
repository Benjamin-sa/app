<template>
    <div
        class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer relative">
        <!-- Product Image -->
        <div class="aspect-w-4 aspect-h-3 bg-gray-200">
            <img v-if="productImage" :src="productImage" :alt="product.title" class="w-full h-48 object-cover">
            <div v-else class="w-full h-48 flex items-center justify-center bg-gray-100">
                <PhotoIcon class="w-12 h-12 text-gray-400" />
            </div>
        </div>

        <!-- Product Info -->
        <div class="p-4">
            <!-- Brand -->
            <p v-if="productBrand" class="text-sm text-gray-600 mb-1">{{ productBrand }}</p>

            <!-- Name -->
            <h3 class="text-lg font-medium text-gray-900 mb-2 line-clamp-2">
                {{ product.title }}
            </h3>

            <!-- Description -->
            <p v-if="product.description" class="text-sm text-gray-600 mb-3 line-clamp-2">
                {{ product.description }}
            </p>

            <!-- Price and Collections -->
            <div class="flex items-center justify-between mb-4">
                <div class="flex flex-col">
                    <span class="text-2xl font-bold text-primary-600">
                        ${{ product.price }}
                    </span>
                </div>

                <span v-if="primaryCollection" class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium"
                    :class="getCategoryClass(primaryCollection.handle)">
                    {{ primaryCollection.title }}
                </span>
            </div>

            <!-- Quick Actions -->
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                    <!-- Wishlist Button -->
                    <button @click.stop="toggleWishlist" class="p-2 rounded-md hover:bg-gray-100 transition-colors"
                        :class="[
                            product.isInWishlist
                                ? 'text-red-600 hover:text-red-700'
                                : 'text-gray-400 hover:text-red-600'
                        ]" :title="product.isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'">
                        <HeartIcon class="w-5 h-5" :class="{ 'fill-current': product.isInWishlist }" />
                    </button>

                    <!-- Share Button -->
                    <button @click.stop="shareProduct"
                        class="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                        title="Share product">
                        <ShareIcon class="w-5 h-5" />
                    </button>
                </div>

                <!-- View Details Button -->
                <Button size="sm" @click.stop="$router.push(`/products/${product.id}`)">
                    View Details
                </Button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notification';
import { apiService } from '@/services/api.service';
import Button from '@/components/common/Button.vue';
import {
    PhotoIcon,
    HeartIcon,
    ShareIcon
} from '@heroicons/vue/24/outline';

const props = defineProps({
    product: {
        type: Object,
        required: true
    }
});

const authStore = useAuthStore();
const notificationStore = useNotificationStore();

// Get the first image from the images array
const productImage = computed(() => {
    if (props.product.images && props.product.images.length > 0) {
        return props.product.images[0].src;
    }
    return null;
});

// Extract brand from title or collections
const productBrand = computed(() => {
    // Try to extract brand from title (usually the first word)
    if (props.product.title) {
        const words = props.product.title.split(' ');
        return words[0];
    }
    return null;
});

// Get primary collection
const primaryCollection = computed(() => {
    if (props.product.collections && props.product.collections.length > 0) {
        return props.product.collections[0];
    }
    return null;
});

const getCategoryClass = (category) => {
    const classes = {
        helmets: 'bg-blue-100 text-blue-800',
        jackets: 'bg-green-100 text-green-800',
        gloves: 'bg-purple-100 text-purple-800',
        boots: 'bg-orange-100 text-orange-800',
        parts: 'bg-gray-100 text-gray-800',
        accessories: 'bg-yellow-100 text-yellow-800'
    };
    return classes[category] || 'bg-indigo-100 text-indigo-800';
};

const toggleWishlist = async () => {
    if (!authStore.isAuthenticated) {
        notificationStore.info('Sign in required', 'Please sign in to add products to your wishlist.');
        return;
    }

    try {
        if (props.product.isInWishlist) {
            await apiService.client.delete(`/users/wishlist/${props.product.id}`);
            props.product.isInWishlist = false;
            notificationStore.success('Removed from wishlist', 'Product removed from your wishlist.');
        } else {
            await apiService.client.post(`/users/wishlist/${props.product.id}`);
            props.product.isInWishlist = true;
            notificationStore.success('Added to wishlist', 'Product added to your wishlist.');
        }
    } catch (error) {
        console.error('Error toggling wishlist:', error);
        notificationStore.error('Wishlist error', 'Unable to update wishlist. Please try again.');
    }
};

const shareProduct = async () => {
    const url = `${window.location.origin}/products/${props.product.id}`;
    const title = props.product.title;
    const text = `Check out this ${props.product.title} on Motordash!`;

    if (navigator.share) {
        try {
            await navigator.share({ title, text, url });
        } catch (error) {
            if (error.name !== 'AbortError') {
                fallbackShare(url);
            }
        }
    } else {
        fallbackShare(url);
    }
};

const fallbackShare = (url) => {
    navigator.clipboard.writeText(url).then(() => {
        notificationStore.success('Link copied', 'Product link copied to clipboard.');
    }).catch(() => {
        notificationStore.info('Share product', `Copy this link: ${url}`);
    });
};
</script>

<style scoped>
.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.aspect-w-4 {
    position: relative;
    padding-bottom: 75%;
    /* 4:3 aspect ratio */
}

.aspect-w-4>* {
    position: absolute;
    height: 100%;
    width: 100%;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
}
</style>
