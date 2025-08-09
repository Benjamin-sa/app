<template>
    <!-- Simple Image Viewer Modal -->
    <Teleport to="body">
        <Transition enter-active-class="duration-300 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100"
            leave-active-class="duration-200 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
            <div v-if="isOpen" class="fixed inset-0 bg-black/90 z-50 flex flex-col" @click="handleBackdropClick">

                <!-- Header with controls -->
                <div class="flex items-center justify-between p-4 text-white">
                    <!-- Counter -->
                    <div v-if="images.length > 1" class="text-sm">
                        {{ currentIndex + 1 }} / {{ images.length }}
                    </div>
                    <div v-else></div>

                    <!-- Close button -->
                    <button @click="close" class="p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors">
                        <XMarkIcon class="w-6 h-6" />
                    </button>
                </div>

                <!-- Main image area -->
                <div class="flex-1 flex items-center justify-center px-4 pb-4" @click.stop>
                    <!-- Previous button -->
                    <button v-if="images.length > 1 && currentIndex > 0" @click="previousImage"
                        class="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10">
                        <ChevronLeftIcon class="w-6 h-6" />
                    </button>

                    <!-- Image container -->
                    <div class="relative max-w-full max-h-full">
                        <img :src="currentImageSrc" :alt="`Image ${currentIndex + 1}`"
                            class="max-w-full max-h-full object-contain" @load="imageLoading = false"
                            @error="imageLoading = false" />

                        <!-- Loading spinner -->
                        <div v-if="imageLoading" class="absolute inset-0 flex items-center justify-center">
                            <div class="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent">
                            </div>
                        </div>
                    </div>

                    <!-- Next button -->
                    <button v-if="images.length > 1 && currentIndex < images.length - 1" @click="nextImage"
                        class="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10">
                        <ChevronRightIcon class="w-6 h-6" />
                    </button>
                </div>

                <!-- Bottom navigation for mobile -->
                <div v-if="images.length > 1" class="p-4">
                    <div class="flex items-center justify-center space-x-4">
                        <button @click="previousImage" :disabled="currentIndex === 0"
                            class="p-2 rounded bg-white/20 text-white disabled:opacity-50 disabled:cursor-not-allowed">
                            Previous
                        </button>
                        <button @click="nextImage" :disabled="currentIndex === images.length - 1"
                            class="p-2 rounded bg-white/20 text-white disabled:opacity-50 disabled:cursor-not-allowed">
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline';

const props = defineProps({
    images: {
        type: Array,
        required: true
    },
    initialIndex: {
        type: Number,
        default: 0
    },
    isOpen: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['close', 'change']);

const currentIndex = ref(props.initialIndex);
const imageLoading = ref(false);

const currentImageSrc = computed(() => {
    const image = props.images[currentIndex.value];
    if (!image) return '';

    // Handle different image formats
    if (typeof image === 'string') return image;
    return image.url || image.src || image;
});

const close = () => {
    emit('close');
};

const previousImage = () => {
    if (currentIndex.value > 0) {
        currentIndex.value--;
        imageLoading.value = true;
        emit('change', currentIndex.value);
    }
};

const nextImage = () => {
    if (currentIndex.value < props.images.length - 1) {
        currentIndex.value++;
        imageLoading.value = true;
        emit('change', currentIndex.value);
    }
};

const handleBackdropClick = (event) => {
    // Close if clicking on the backdrop itself
    if (event.target === event.currentTarget) {
        close();
    }
};

const handleKeydown = (event) => {
    if (!props.isOpen) return;

    switch (event.key) {
        case 'Escape':
            close();
            break;
        case 'ArrowLeft':
            event.preventDefault();
            previousImage();
            break;
        case 'ArrowRight':
            event.preventDefault();
            nextImage();
            break;
    }
};

// Watch for prop changes
watch(() => props.initialIndex, (newIndex) => {
    currentIndex.value = newIndex;
    imageLoading.value = true;
});

watch(() => props.isOpen, (isOpen) => {
    if (isOpen) {
        // Prevent background scrolling
        document.body.style.overflow = 'hidden';
        imageLoading.value = true;
    } else {
        // Restore background scrolling
        document.body.style.overflow = '';
    }
});

// Keyboard event listeners
onMounted(() => {
    document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown);
    // Ensure body overflow is restored
    document.body.style.overflow = '';
});
</script>
