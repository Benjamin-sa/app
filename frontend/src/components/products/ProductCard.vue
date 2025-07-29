<template>
    <div class="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 cursor-pointer"
        @click="$router.push(`/products/${product.id}`)">

        <!-- Product Image -->
        <div
            class="relative aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 overflow-hidden">
            <img v-if="productImage" :src="productImage" :alt="product.title"
                class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                loading="lazy">
            <div v-else class="w-full h-full flex items-center justify-center">
                <PhotoIcon class="w-16 h-16 text-gray-400 group-hover:scale-110 transition-transform duration-300" />
            </div>

            <!-- Gradient Overlay -->
            <div
                class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            </div>

            <!-- Price Badge -->
            <div
                class="absolute top-3 right-3 bg-green-500/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm font-bold">
                €{{ product.price }}
            </div>

            <!-- Wishlist Button Overlay -->
            <div class="absolute top-3 left-3">
                <IconButton @click.stop="toggleWishlist" :icon="HeartIcon"
                    :variant="product.isInWishlist ? 'danger' : 'default'" :is-active="product.isInWishlist"
                    class="bg-white/80 hover:bg-white backdrop-blur-sm shadow-lg"
                    :class="product.isInWishlist ? 'text-red-500' : 'text-gray-600 hover:text-red-500'" />
            </div>

            <!-- View Details Overlay -->
            <div
                class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div class="bg-white/20 backdrop-blur-sm rounded-full p-3">
                    <EyeIcon class="w-6 h-6 text-white" />
                </div>
            </div>
        </div>

        <!-- Product Info -->
        <div class="p-4 sm:p-5 space-y-3">
            <!-- Brand and Category -->
            <div class="flex items-center justify-between">
                <span v-if="productBrand" class="inline-flex items-center space-x-1">
                    <div class="w-2 h-2 bg-primary-500 rounded-full"></div>
                    <span class="text-sm font-medium text-gray-600 dark:text-gray-400">{{ productBrand }}</span>
                </span>
                <span v-if="primaryCollection"
                    class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                    {{ primaryCollection.title }}
                </span>
            </div>

            <!-- Product Name -->
            <h3 class="font-bold text-gray-900 dark:text-white text-lg leading-tight line-clamp-2">
                {{ product.title }}
            </h3>

            <!-- Description -->
            <p v-if="product.description" class="text-gray-600 dark:text-gray-400 text-sm leading-relaxed line-clamp-2">
                {{ product.description }}
            </p>

            <!-- Price and Actions -->
            <div class="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                <div class="flex flex-col">
                    <span class="text-2xl font-bold text-primary-600 dark:text-primary-400">
                        €{{ product.price }}
                    </span>
                    <span class="text-xs text-gray-500 dark:text-gray-400">Best Price</span>
                </div>

                <div class="flex items-center space-x-2">
                    <!-- Share Button -->
                    <IconButton @click.stop="shareProduct" :icon="ShareIcon" variant="ghost"
                        class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" title="Share product" />

                    <!-- View Details Button -->
                    <ActionButton @click.stop="$router.push(`/products/${product.id}`)" variant="outline" size="sm"
                        class="bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/20 dark:hover:bg-primary-900/30 text-primary-600 dark:text-primary-400">
                        <EyeIcon class="w-4 h-4 mr-1" />
                        View
                    </ActionButton>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notification';
import { useProductStore } from '@/stores/products';
import ActionButton from '@/components/common/buttons/ActionButton.vue';
import IconButton from '@/components/common/buttons/IconButton.vue';
import {
    PhotoIcon,
    HeartIcon,
    ShareIcon,
    EyeIcon
} from '@heroicons/vue/24/outline';

const props = defineProps({
    product: {
        type: Object,
        required: true
    }
});

const authStore = useAuthStore();
const notificationStore = useNotificationStore();
const productStore = useProductStore();

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
        // [0] is main category and contains all products so it hase no value 
        return props.product.collections[1];
    }
    return null;
});

const toggleWishlist = async () => {
    if (!authStore.isAuthenticated) {
        notificationStore.info('Sign in required', 'Please sign in to add products to your wishlist.');
        return;
    }

    try {
        const newWishlistState = await productStore.toggleWishlist(props.product.id);

        notificationStore.success(
            newWishlistState ? 'Added to wishlist' : 'Removed from wishlist',
            newWishlistState
                ? 'Product added to your wishlist.'
                : 'Product removed from your wishlist.'
        );
    } catch (error) {
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
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
</style>
