<template>
    <div class="space-y-4">
        <label v-if="label" class="block text-sm font-semibold text-gray-700 dark:text-gray-300">
            {{ label }}
        </label>

        <!-- Upload Button -->
        <div class="space-y-3">
            <input ref="fileInput" type="file" multiple accept="image/*" @change="handleFileSelect" class="hidden"
                :disabled="disabled" />

            <!-- Upload Area - Dashed Border Style -->
            <div v-if="variant === 'dropzone'"
                class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                <component :is="iconComponent" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p class="text-gray-600 dark:text-gray-400 mb-2">
                    Drop photos here or click to browse
                </p>
                <ActionButton type="button" variant="secondary" @click="$refs.fileInput.click()" :disabled="disabled">
                    Choose Photos
                </ActionButton>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Max {{ maxFiles }} photos, {{ formatFileSize(maxFileSize) }} each
                </p>
            </div>

            <!-- Enhanced Button Style -->
            <ActionButton v-else @click="$refs.fileInput.click()" variant="outline" :size="buttonSize"
                :disabled="disabled || (images && images.length >= maxFiles)" :class="buttonClass">
                <component :is="iconComponent" class="w-4 h-4 mr-2" />
                {{ buttonText }}
            </ActionButton>

            <p v-if="variant !== 'dropzone'" class="text-sm text-gray-500 dark:text-gray-400">
                Max {{ maxFiles }} images, {{ formatFileSize(maxFileSize) }} each
            </p>
        </div>

        <!-- Image Previews -->
        <div v-if="images && images.length > 0" class="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div v-for="(image, index) in images" :key="index"
                class="relative group aspect-square bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-2xl overflow-hidden border border-gray-200/50 dark:border-gray-600/50 hover:border-green-300 dark:hover:border-green-600 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-xl">
                <img :src="getImageUrl(image)" :alt="getImageName(image)" class="w-full h-full object-cover" />

                <!-- Remove Button -->
                <ActionButton @click="removeImage(index)" variant="danger" size="sm"
                    class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg"
                    :disabled="disabled">
                    <XMarkIcon class="w-4 h-4" />
                </ActionButton>

                <!-- Image Info -->
                <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                    <p class="text-white text-xs font-medium truncate">
                        {{ getImageName(image) }}
                        <span v-if="image.isNew" class="ml-1 px-2 py-0.5 bg-blue-500 rounded-full text-xs">
                            new
                        </span>
                    </p>
                </div>
            </div>
        </div>

        <!-- Upload Error -->
        <div v-if="error" class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <div class="flex items-center">
                <ExclamationTriangleIcon class="w-5 h-5 text-red-500 mr-2" />
                <p class="text-sm text-red-600 dark:text-red-400 font-medium">{{ error }}</p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { processImageFiles, cleanupImagePreviews } from '@/utils/helpers'
import ActionButton from '@/components/common/buttons/ActionButton.vue'
import { XMarkIcon, ExclamationTriangleIcon, CameraIcon, PhotoIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
    images: {
        type: Array,
        default: () => []
    },
    label: {
        type: String,
        default: 'Images'
    },
    maxFiles: {
        type: Number,
        default: 5
    },
    maxFileSize: {
        type: Number,
        default: 5 * 1024 * 1024 // 5MB
    },
    disabled: {
        type: Boolean,
        default: false
    },
    variant: {
        type: String,
        default: 'button', // 'button', 'dropzone'
        validator: value => ['button', 'dropzone'].includes(value)
    },
    buttonSize: {
        type: String,
        default: 'md'
    },
    buttonClass: {
        type: String,
        default: ''
    }
})

const emit = defineEmits(['update:images', 'error'])

const fileInput = ref(null)
const error = ref('')

const iconComponent = computed(() => {
    return props.variant === 'dropzone' ? CameraIcon : PhotoIcon
})

const buttonText = computed(() => {
    if (props.images && props.images.length > 0) {
        return 'Add More Images'
    }
    return 'Add Images'
})

const formatFileSize = (bytes) => {
    if (bytes >= 1024 * 1024) {
        return `${(bytes / (1024 * 1024)).toFixed(0)}MB`
    }
    return `${(bytes / 1024).toFixed(0)}KB`
}

const getImageUrl = (image) => {
    return image.url || image.preview || image
}

const getImageName = (image) => {
    return image.name || image.alt || `Image ${Math.random().toString(36).substr(2, 9)}`
}

const handleFileSelect = async (event) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const currentCount = props.images ? props.images.length : 0
    const result = processImageFiles(files, currentCount, props.maxFiles, props.maxFileSize)

    if (result.error) {
        error.value = result.error
        emit('error', result.error)
        return
    }

    error.value = ''

    // Add processed images with isNew flag
    const newImages = result.images.map(img => ({
        ...img,
        url: img.preview,
        isNew: true
    }))

    const updatedImages = [...(props.images || []), ...newImages]
    emit('update:images', updatedImages)

    // Clear file input
    if (fileInput.value) {
        fileInput.value.value = ''
    }
}

const removeImage = (index) => {
    if (!props.images || index < 0 || index >= props.images.length) return

    const image = props.images[index]

    // Revoke object URL to prevent memory leaks for new images
    if (image && image.isNew && image.url) {
        URL.revokeObjectURL(image.url)
    }

    const updatedImages = [...props.images]
    updatedImages.splice(index, 1)
    emit('update:images', updatedImages)
}

// Cleanup method that can be called by parent components
const cleanup = () => {
    if (props.images) {
        const newImages = props.images.filter(img => img.isNew)
        cleanupImagePreviews(newImages)
    }
}

defineExpose({
    cleanup
})
</script>
