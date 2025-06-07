<template>
    <!-- Backdrop -->
    <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
        @click="handleBackdropClick" @keydown.esc="close" tabindex="0">

        <!-- Close Button - Mobile optimized -->
        <button @click="close"
            class="absolute top-2 right-2 sm:top-4 sm:right-4 z-60 p-2 sm:p-3 rounded-full bg-black bg-opacity-60 text-white hover:bg-opacity-80 transition-all duration-200 touch-manipulation">
            <XMarkIcon class="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        <!-- Navigation Buttons (if multiple images) - Mobile optimized -->
        <template v-if="images.length > 1">
            <!-- Previous Button -->
            <button v-if="currentIndex > 0" @click="previousImage"
                class="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 z-60 p-2 sm:p-3 rounded-full bg-black bg-opacity-60 text-white hover:bg-opacity-80 transition-all duration-200 touch-manipulation">
                <ChevronLeftIcon class="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            <!-- Next Button -->
            <button v-if="currentIndex < images.length - 1" @click="nextImage"
                class="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 z-60 p-2 sm:p-3 rounded-full bg-black bg-opacity-60 text-white hover:bg-opacity-80 transition-all duration-200 touch-manipulation">
                <ChevronRightIcon class="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
        </template>

        <!-- Image Counter - Mobile optimized -->
        <div v-if="images.length > 1"
            class="absolute top-2 left-1/2 transform -translate-x-1/2 z-60 px-2 py-1 sm:px-3 sm:py-1 rounded-full bg-black bg-opacity-60 text-white text-xs sm:text-sm">
            {{ currentIndex + 1 }} / {{ images.length }}
        </div>

        <!-- Zoom Controls - Hidden on mobile, shown on desktop -->
        <div
            class="hidden sm:flex absolute bottom-4 left-1/2 transform -translate-x-1/2 z-60 items-center space-x-2 bg-black bg-opacity-60 rounded-full px-4 py-2">
            <button @click="zoomOut" :disabled="zoomLevel <= 0.5"
                class="p-1 rounded text-white hover:bg-white hover:bg-opacity-20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation">
                <MinusIcon class="w-4 h-4" />
            </button>

            <span class="text-white text-sm font-medium min-w-[3rem] text-center">
                {{ Math.round(zoomLevel * 100) }}%
            </span>

            <button @click="zoomIn" :disabled="zoomLevel >= 3"
                class="p-1 rounded text-white hover:bg-white hover:bg-opacity-20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation">
                <PlusIcon class="w-4 h-4" />
            </button>

            <button @click="resetZoom"
                class="p-1 rounded text-white hover:bg-white hover:bg-opacity-20 transition-colors ml-2 touch-manipulation">
                <ArrowsPointingOutIcon class="w-4 h-4" />
            </button>
        </div>

        <!-- Mobile Zoom Controls - Bottom sheet style -->
        <div
            class="sm:hidden absolute bottom-0 left-0 right-0 z-60 bg-black bg-opacity-60 backdrop-blur-sm px-4 py-3 flex items-center justify-center space-x-4">
            <button @click="zoomOut" :disabled="zoomLevel <= 0.5"
                class="p-2 rounded-full bg-white bg-opacity-20 text-white disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation active:bg-opacity-30">
                <MinusIcon class="w-5 h-5" />
            </button>

            <span class="text-white text-sm font-medium min-w-[4rem] text-center">
                {{ Math.round(zoomLevel * 100) }}%
            </span>

            <button @click="zoomIn" :disabled="zoomLevel >= 3"
                class="p-2 rounded-full bg-white bg-opacity-20 text-white disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation active:bg-opacity-30">
                <PlusIcon class="w-5 h-5" />
            </button>

            <button @click="resetZoom"
                class="p-2 rounded-full bg-white bg-opacity-20 text-white touch-manipulation active:bg-opacity-30">
                <ArrowsPointingOutIcon class="w-5 h-5" />
            </button>
        </div>

        <!-- Main Image Container with touch support -->
        <div class="relative w-full h-full flex items-center justify-center p-4 sm:p-8 pb-16 sm:pb-8"
            ref="imageContainer" @wheel.prevent="handleWheel" @mousedown="startPan" @mousemove="handlePan"
            @mouseup="endPan" @mouseleave="endPan" @touchstart="handleTouchStart" @touchmove="handleTouchMove"
            @touchend="handleTouchEnd">

            <img :src="currentImage.url || currentImage" :alt="`Image ${currentIndex + 1}`"
                class="max-w-full max-h-full object-contain transition-transform duration-200 select-none" :class="[
                    zoomLevel > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer',
                    isPanning ? 'cursor-grabbing' : ''
                ]" :style="imageStyle" @load="handleImageLoad" @dragstart.prevent @click="handleImageClick"
                draggable="false" />
        </div>

        <!-- Loading Spinner -->
        <div v-if="imageLoading" class="absolute inset-0 flex items-center justify-center">
            <div class="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-white"></div>
        </div>

        <!-- Touch instructions for mobile -->
        <div
            class="sm:hidden absolute top-16 left-1/2 transform -translate-x-1/2 text-white text-xs bg-black bg-opacity-50 px-3 py-1 rounded-full opacity-70 pointer-events-none">
            Pinch to zoom • Swipe to navigate
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import {
    XMarkIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    PlusIcon,
    MinusIcon,
    ArrowsPointingOutIcon
} from '@heroicons/vue/24/outline';

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
const zoomLevel = ref(1);
const panX = ref(0);
const panY = ref(0);
const isPanning = ref(false);
const lastPanX = ref(0);
const lastPanY = ref(0);
const imageLoading = ref(false);
const imageContainer = ref(null);
const touchStartDistance = ref(0);
const lastTouchDistance = ref(0);
const touchStartX = ref(0);
const touchStartY = ref(0);
const swipeThreshold = 50;

const currentImage = computed(() => {
    return props.images[currentIndex.value] || {};
});

const imageStyle = computed(() => {
    return {
        transform: `scale(${zoomLevel.value}) translate(${panX.value}px, ${panY.value}px)`,
        transformOrigin: 'center center'
    };
});

const close = () => {
    resetView();
    emit('close');
};

const previousImage = () => {
    if (currentIndex.value > 0) {
        currentIndex.value--;
        resetView();
        emit('change', currentIndex.value);
    }
};

const nextImage = () => {
    if (currentIndex.value < props.images.length - 1) {
        currentIndex.value++;
        resetView();
        emit('change', currentIndex.value);
    }
};

const zoomIn = () => {
    if (zoomLevel.value < 3) {
        zoomLevel.value = Math.min(3, zoomLevel.value + 0.25);
    }
};

const zoomOut = () => {
    if (zoomLevel.value > 0.5) {
        zoomLevel.value = Math.max(0.5, zoomLevel.value - 0.25);
        // Reset pan if zoomed out too much
        if (zoomLevel.value <= 1) {
            panX.value = 0;
            panY.value = 0;
        }
    }
};

const resetZoom = () => {
    zoomLevel.value = 1;
    panX.value = 0;
    panY.value = 0;
};

const resetView = () => {
    zoomLevel.value = 1;
    panX.value = 0;
    panY.value = 0;
    imageLoading.value = true;
};

const handleWheel = (event) => {
    // Only allow wheel zoom on desktop
    if (window.innerWidth >= 640) {
        const delta = event.deltaY > 0 ? -0.1 : 0.1;
        const newZoom = Math.max(0.5, Math.min(3, zoomLevel.value + delta));
        zoomLevel.value = newZoom;

        if (newZoom <= 1) {
            panX.value = 0;
            panY.value = 0;
        }
    }
};

const startPan = (event) => {
    if (zoomLevel.value > 1) {
        isPanning.value = true;
        lastPanX.value = event.clientX - panX.value;
        lastPanY.value = event.clientY - panY.value;
    }
};

const handlePan = (event) => {
    if (isPanning.value && zoomLevel.value > 1) {
        panX.value = event.clientX - lastPanX.value;
        panY.value = event.clientY - lastPanY.value;
    }
};

const endPan = () => {
    isPanning.value = false;
};

// Touch event handlers
const handleTouchStart = (event) => {
    event.preventDefault();

    if (event.touches.length === 1) {
        // Single touch - prepare for pan or swipe
        const touch = event.touches[0];
        touchStartX.value = touch.clientX;
        touchStartY.value = touch.clientY;

        if (zoomLevel.value > 1) {
            isPanning.value = true;
            lastPanX.value = touch.clientX - panX.value;
            lastPanY.value = touch.clientY - panY.value;
        }
    } else if (event.touches.length === 2) {
        // Two fingers - prepare for pinch zoom
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        const distance = Math.sqrt(
            Math.pow(touch2.clientX - touch1.clientX, 2) +
            Math.pow(touch2.clientY - touch1.clientY, 2)
        );
        touchStartDistance.value = distance;
        lastTouchDistance.value = distance;
        isPanning.value = false;
    }
};

const handleTouchMove = (event) => {
    event.preventDefault();

    if (event.touches.length === 1 && isPanning.value && zoomLevel.value > 1) {
        // Single touch pan
        const touch = event.touches[0];
        panX.value = touch.clientX - lastPanX.value;
        panY.value = touch.clientY - lastPanY.value;
    } else if (event.touches.length === 2) {
        // Two finger pinch zoom
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        const distance = Math.sqrt(
            Math.pow(touch2.clientX - touch1.clientX, 2) +
            Math.pow(touch2.clientY - touch1.clientY, 2)
        );

        if (lastTouchDistance.value > 0) {
            const scale = distance / lastTouchDistance.value;
            const newZoom = Math.max(0.5, Math.min(3, zoomLevel.value * scale));
            zoomLevel.value = newZoom;

            if (newZoom <= 1) {
                panX.value = 0;
                panY.value = 0;
            }
        }

        lastTouchDistance.value = distance;
    }
};

const handleTouchEnd = (event) => {
    if (event.touches.length === 0) {
        // Check for swipe gesture
        if (!isPanning.value && zoomLevel.value <= 1) {
            const touchEndX = event.changedTouches[0].clientX;
            const touchEndY = event.changedTouches[0].clientY;
            const deltaX = touchEndX - touchStartX.value;
            const deltaY = touchEndY - touchStartY.value;

            // Only consider horizontal swipes
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > swipeThreshold) {
                if (deltaX > 0 && currentIndex.value > 0) {
                    // Swipe right - previous image
                    previousImage();
                } else if (deltaX < 0 && currentIndex.value < props.images.length - 1) {
                    // Swipe left - next image
                    nextImage();
                }
            }
        }

        isPanning.value = false;
        touchStartDistance.value = 0;
        lastTouchDistance.value = 0;
    }
};

const handleImageClick = (event) => {
    // On mobile, single tap to toggle zoom
    if (window.innerWidth < 640) {
        if (zoomLevel.value <= 1) {
            zoomLevel.value = 2;
        } else {
            resetZoom();
        }
    }
};

const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
        close();
    }
};

const handleImageLoad = () => {
    imageLoading.value = false;
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
        case '+':
        case '=':
            event.preventDefault();
            zoomIn();
            break;
        case '-':
            event.preventDefault();
            zoomOut();
            break;
        case '0':
            event.preventDefault();
            resetZoom();
            break;
    }
};

// Watch for prop changes
watch(() => props.initialIndex, (newIndex) => {
    currentIndex.value = newIndex;
    resetView();
});

watch(() => props.isOpen, (isOpen) => {
    if (isOpen) {
        document.body.style.overflow = 'hidden';
        nextTick(() => {
            if (imageContainer.value) {
                imageContainer.value.focus();
            }
        });
    } else {
        document.body.style.overflow = '';
    }
});

onMounted(() => {
    document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown);
    document.body.style.overflow = '';
});
</script>
