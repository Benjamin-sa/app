<template>
    <div class="space-y-4">
        <!-- Main Image -->
        <div class="relative aspect-square bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden shadow-lg"
            @click="openViewer">
            <img v-if="selectedImage" :src="selectedImage" :alt="alt"
                class="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300" />
            <div v-else class="w-full h-full flex items-center justify-center">
                <PhotoIcon class="w-16 h-16 text-gray-400" />
            </div>

            <!-- Image counter overlay -->
            <div v-if="images.length > 1"
                class="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                {{ selectedIndex + 1 }} / {{ images.length }}
            </div>

            <!-- Action Button Slot -->
            <div class="absolute top-2 left-2">
                <slot name="action-button" />
            </div>

            <!-- Additional Overlays -->
            <slot name="overlays" />
        </div>

        <!-- Thumbnail Grid -->
        <div v-if="images.length > 1" class="grid grid-cols-4 gap-2">
            <div v-for="(image, index) in images.slice(0, 8)" :key="index" :class="[
                'aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden cursor-pointer transition-all duration-200',
                selectedIndex === index
                    ? 'ring-2 ring-primary-500 shadow-lg scale-105'
                    : 'hover:scale-105 hover:shadow-md'
            ]" @click="selectImage(index)">
                <img :src="getImageSrc(image)" :alt="`${alt} ${index + 1}`" class="w-full h-full object-cover" />

                <!-- Show +N indicator for remaining images -->
                <div v-if="index === 7 && images.length > 8"
                    class="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-semibold">
                    +{{ images.length - 8 }}
                </div>
            </div>
        </div>

        <!-- Simple Image Viewer -->
        <ImageViewer :images="images" :initial-index="selectedIndex" :is-open="showViewer" @close="showViewer = false"
            @change="handleViewerChange" />
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { PhotoIcon } from '@heroicons/vue/24/outline'
import ImageViewer from './ImageViewer.vue'

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

const selectedIndex = ref(0)
const showViewer = ref(false)

const selectedImage = computed(() => {
    if (props.images.length === 0) return null
    return getImageSrc(props.images[selectedIndex.value])
})

const getImageSrc = (image) => {
    if (typeof image === 'string') return image
    return image.src || image.url || image
}

const selectImage = (index) => {
    selectedIndex.value = index
}

const openViewer = () => {
    if (props.images.length > 0) {
        showViewer.value = true
    }
}

const handleViewerChange = (newIndex) => {
    selectedIndex.value = newIndex
}

// Initialize selected image
watch(() => props.images, (newImages) => {
    if (newImages.length > 0) {
        selectedIndex.value = Math.min(props.initialIndex, newImages.length - 1)
    }
}, { immediate: true })

defineExpose({
    selectImage,
    openViewer
})
</script>
