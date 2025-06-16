<template>
    <div class="space-y-4">
        <!-- Main Image -->
        <div
            class="relative aspect-square bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-2xl overflow-hidden shadow-lg">
            <img v-if="selectedImage" :src="selectedImage" :alt="alt"
                class="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
            <div v-else class="w-full h-full flex items-center justify-center">
                <PhotoIcon class="w-24 h-24 text-gray-400" />
            </div>

            <!-- Action Button Slot -->
            <div class="absolute top-4 right-4">
                <slot name="action-button" />
            </div>

            <!-- Additional Overlays -->
            <slot name="overlays" />
        </div>

        <!-- Thumbnail Images -->
        <div v-if="images.length > 1" class="grid grid-cols-4 gap-3">
            <div v-for="(image, index) in images.slice(1, 5)" :key="index" :class="[
                'aspect-square bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-xl overflow-hidden cursor-pointer transition-all duration-200',
                selectedImage === getImageSrc(image)
                    ? 'ring-2 ring-primary-500 shadow-lg scale-105'
                    : 'hover:scale-105 hover:shadow-md'
            ]" @click="selectImage(getImageSrc(image))">
                <img :src="getImageSrc(image)" :alt="alt" class="w-full h-full object-cover" />
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { PhotoIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
    images: {
        type: Array,
        default: () => []
    },
    alt: {
        type: String,
        default: 'Image'
    },
    initialIndex: {
        type: Number,
        default: 0
    }
})

const selectedImage = ref(null)

const getImageSrc = (image) => {
    if (typeof image === 'string') return image
    return image.src || image.url || image
}

const selectImage = (src) => {
    selectedImage.value = src
}

// Initialize selected image
watch(() => props.images, (newImages) => {
    if (newImages.length > 0 && !selectedImage.value) {
        selectedImage.value = getImageSrc(newImages[props.initialIndex] || newImages[0])
    }
}, { immediate: true })

defineExpose({
    selectImage
})
</script>
