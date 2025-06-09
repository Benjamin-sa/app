<template>
    <div class="space-y-6">
        <!-- Loading State for Edit Mode -->
        <div v-if="isEditMode && !formInitialized" class="flex justify-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>

        <!-- Form -->
        <form v-else @submit.prevent="handleSubmit" class="space-y-6">
            <!-- Title -->
            <div>
                <label for="title" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Topic Title
                </label>
                <input id="title" v-model="form.title" type="text" required
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="Enter a descriptive title for your topic" :disabled="loading">
                <p v-if="form.title && form.title.length < 10"
                    class="mt-1 text-sm text-orange-600 dark:text-orange-400">
                    Title should be at least 10 characters long
                </p>
            </div>

            <!-- Category -->
            <div>
                <label for="category" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                </label>
                <select id="category" v-model="form.category" required
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    :disabled="loading">
                    <option value="">Select a category</option>
                    <option v-for="category in FORUM_CATEGORIES" :key="category" :value="category">
                        {{ getCategoryLabel(category) }}
                    </option>
                </select>
            </div>

            <!-- Content -->
            <div>
                <label for="content" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Content
                </label>
                <textarea id="content" v-model="form.content" rows="8" required
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="Describe your topic in detail. Be specific and provide context to help others understand and respond."
                    :disabled="loading"></textarea>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {{ form.content.length }}/5000 characters
                </p>
                <p v-if="form.content && form.content.length < 20"
                    class="mt-1 text-sm text-orange-600 dark:text-orange-400">
                    Content should be at least 20 characters long
                </p>
            </div>

            <!-- Tags -->
            <div>
                <label for="tags" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tags (optional)
                </label>
                <input id="tags" v-model="tagInput" type="text"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="Enter tags separated by commas (e.g., honda, maintenance, oil-change)"
                    :disabled="loading" @keydown.enter.prevent="addTag" @keydown.comma.prevent="addTag">
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Press Enter or comma to add tags. Use relevant keywords to help others find your topic.
                </p>

                <!-- Tag Display -->
                <div v-if="form.tags.length > 0" class="mt-2 flex flex-wrap gap-2">
                    <span v-for="(tag, index) in form.tags" :key="index"
                        class="inline-flex items-center px-2 py-1 rounded-md text-sm bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200">
                        #{{ tag }}
                        <button type="button" @click="removeTag(index)"
                            class="ml-1 text-primary-600 hover:text-primary-800 dark:text-primary-300 dark:hover:text-primary-100"
                            :disabled="loading">
                            <XMarkIcon class="w-4 h-4" />
                        </button>
                    </span>
                </div>
            </div>

            <!-- Images -->
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Images (optional)
                </label>

                <!-- Existing Images (Edit Mode Only) -->
                <div v-if="isEditMode && form.existingImages.length > 0" class="mb-4">
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">Current images:</p>
                    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        <div v-for="(image, index) in form.existingImages" :key="`existing-${index}`"
                            class="relative group aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                            <img :src="image.url" :alt="`Existing image ${index + 1}`"
                                class="w-full h-full object-cover">
                            <button type="button" @click="removeExistingImage(index)"
                                class="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20"
                                :disabled="loading">
                                <XMarkIcon class="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Upload Button -->
                <div class="mb-4">
                    <input ref="fileInput" type="file" multiple accept="image/*" @change="handleFileSelect"
                        class="hidden" :disabled="loading">
                    <Button type="button" variant="outline" @click="$refs.fileInput.click()"
                        :disabled="loading || totalImagesCount >= 5" class="w-full sm:w-auto">
                        <PhotoIcon class="w-4 h-4 mr-2" />
                        {{ totalImagesCount === 0 ? 'Add Images' : 'Add More Images' }}
                    </Button>
                    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Upload up to 5 images (max {{ isEditMode ? '10MB' : '5MB' }} each). Supported formats: JPG, PNG,
                        WebP
                    </p>
                </div>

                <!-- New Images Preview -->
                <div v-if="form.newImages.length > 0" class="mb-4">
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">{{ isEditMode ? 'New images to upload:' :
                        'Selected images:' }}</p>
                    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        <div v-for="(image, index) in form.newImages" :key="`new-${index}`"
                            class="relative group aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                            <img :src="image.preview" :alt="`Preview ${index + 1}`" class="w-full h-full object-cover">

                            <!-- Remove Button -->
                            <button v-if="!image.uploading" type="button" @click="removeNewImage(index)"
                                class="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20"
                                :disabled="loading">
                                <XMarkIcon class="w-4 h-4" />
                            </button>

                            <!-- Error State -->
                            <div v-if="image.error"
                                class="absolute inset-0 bg-red-500 bg-opacity-75 flex items-center justify-center z-10">
                                <div class="text-white text-center p-2">
                                    <ExclamationTriangleIcon class="w-6 h-6 mx-auto mb-1" />
                                    <p class="text-xs">Upload failed</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Upload Error -->
                <p v-if="uploadError" class="mt-2 text-sm text-red-600 dark:text-red-400">
                    {{ uploadError }}
                </p>
            </div>

            <!-- Error Message -->
            <ErrorMessage v-if="error" :message="error" />

            <!-- Actions -->
            <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button type="button" variant="outline" @click="$emit('cancel')" :disabled="loading">
                    Cancel
                </Button>
                <Button type="submit" :loading="loading" :disabled="!isFormValid">
                    {{ isEditMode ? 'Update Topic' : 'Create Topic' }}
                </Button>
            </div>
        </form>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useNotificationStore } from '@/stores/notification';
import { useApi } from '@/composables/useApi';
import { apiService } from '@/services/api.service';
import { getCategoryLabel, processImageFiles, cleanupImagePreviews } from '@/utils/helpers';
import { FORUM_CATEGORIES } from '@/utils/constants.repository';
import Button from '@/components/common/Button.vue';
import ErrorMessage from '@/components/common/ErrorMessage.vue';
import { XMarkIcon, PhotoIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline';

const props = defineProps({
    topic: {
        type: Object,
        default: null
    }
});

const emit = defineEmits(['success', 'cancel']);

const notificationStore = useNotificationStore();
const { loading, error, execute } = useApi();

// Determine if we're in edit mode
const isEditMode = computed(() => !!props.topic);

const form = ref({
    title: '',
    category: '',
    content: '',
    tags: [],
    existingImages: [], // Only used in edit mode
    newImages: [], // New images to upload
    imagesToRemove: [] // Only used in edit mode
});

const tagInput = ref('');
const uploadError = ref('');
const fileInput = ref(null);
const formInitialized = ref(false);

// Computed properties
const isFormValid = computed(() => {
    return form.value.title.length >= 10 &&
        form.value.category &&
        form.value.content.length >= 20 &&
        form.value.content.length <= 5000;
});

const totalImagesCount = computed(() => {
    return (form.value.existingImages?.length || 0) + (form.value.newImages?.length || 0);
});

// Form initialization
const initializeForm = () => {
    if (isEditMode.value && props.topic) {
        console.log('Initializing form with topic:', props.topic);
        form.value = {
            title: props.topic.title || '',
            category: props.topic.category || '',
            content: props.topic.content || '',
            tags: Array.isArray(props.topic.tags) ? [...props.topic.tags] : [],
            existingImages: Array.isArray(props.topic.images) ? [...props.topic.images] : [],
            newImages: [],
            imagesToRemove: []
        };
        formInitialized.value = true;
        console.log('Form initialized for edit:', form.value);
    } else {
        // Create mode - reset form
        resetForm();
        formInitialized.value = true;
        console.log('Form initialized for create');
    }
};

const resetForm = () => {
    // Clean up image previews
    cleanupImagePreviews(form.value.newImages);

    form.value = {
        title: '',
        category: '',
        content: '',
        tags: [],
        existingImages: [],
        newImages: [],
        imagesToRemove: []
    };
    tagInput.value = '';
    uploadError.value = '';
};

// Tag management
const addTag = () => {
    const tag = tagInput.value.trim().toLowerCase();
    if (tag && !form.value.tags.includes(tag) && form.value.tags.length < 10) {
        form.value.tags.push(tag);
        tagInput.value = '';
    }
};

const removeTag = (index) => {
    form.value.tags.splice(index, 1);
};

// Image management
const handleFileSelect = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const maxSize = isEditMode.value ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    const result = processImageFiles(files, totalImagesCount.value, 5, maxSize);

    if (result.error) {
        uploadError.value = result.error;
    } else {
        uploadError.value = '';
        form.value.newImages.push(...result.images);
    }

    // Clear the input
    event.target.value = '';
};

const removeExistingImage = (index) => {
    const removedImage = form.value.existingImages.splice(index, 1)[0];
    form.value.imagesToRemove.push(removedImage.id);
};

const removeNewImage = (index) => {
    const image = form.value.newImages[index];
    if (image.preview) {
        URL.revokeObjectURL(image.preview);
    }
    form.value.newImages.splice(index, 1);
};

// Form submission
const handleSubmit = async () => {
    if (!isFormValid.value) return;

    const result = await execute(async () => {
        // Create FormData to handle both text data and files
        const formData = new FormData();

        // Add text fields
        formData.append('title', form.value.title.trim());
        formData.append('category', form.value.category);
        formData.append('content', form.value.content.trim());
        formData.append('tags', JSON.stringify(form.value.tags));

        if (isEditMode.value) {
            // Edit mode: handle existing images and removals
            formData.append('existingImages', JSON.stringify(form.value.existingImages));

            if (form.value.imagesToRemove.length > 0) {
                formData.append('imagesToRemove', JSON.stringify(form.value.imagesToRemove));
            }
        }

        // Add new image files
        form.value.newImages.forEach((imageData) => {
            formData.append('images', imageData.file);
        });

        // Make API call
        if (isEditMode.value) {
            return await apiService.patch(`/forum/topics/${props.topic.id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
        } else {
            return await apiService.post('/forum/topics', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
        }
    }, {
        successMessage: isEditMode.value
            ? 'Your changes have been saved successfully.'
            : 'Your topic has been posted successfully.',
        successTitle: isEditMode.value ? 'Topic updated!' : 'Topic created!',
        showErrorNotification: true,
        notificationStore
    });

    if (result) {
        if (!isEditMode.value) {
            resetForm();
        }
        emit('success', result);
    }
};

// Watch for topic changes in edit mode
watch(() => props.topic, (newTopic) => {
    if (isEditMode.value && newTopic) {
        initializeForm();
    }
}, { immediate: true });

onMounted(() => {
    initializeForm();
});
</script>
