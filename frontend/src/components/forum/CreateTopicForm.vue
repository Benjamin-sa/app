<template>
    <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Title -->
        <div>
            <label for="title" class="block text-sm font-medium text-gray-700 mb-1">
                Topic Title
            </label>
            <input id="title" v-model="form.title" type="text" required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter a descriptive title for your topic" :disabled="loading">
            <p v-if="form.title && form.title.length < 10" class="mt-1 text-sm text-orange-600">
                Title should be at least 10 characters long
            </p>
        </div>

        <!-- Category -->
        <div>
            <label for="category" class="block text-sm font-medium text-gray-700 mb-1">
                Category
            </label>
            <select id="category" v-model="form.category" required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                :disabled="loading">
                <option value="">Select a category</option>
                <option value="general">General Discussion</option>
                <option value="technical">Technical Help</option>
                <option value="maintenance">Maintenance</option>
                <option value="rides">Rides & Events</option>
                <option value="marketplace">Marketplace</option>
            </select>
        </div>

        <!-- Content -->
        <div>
            <label for="content" class="block text-sm font-medium text-gray-700 mb-1">
                Content
            </label>
            <textarea id="content" v-model="form.content" rows="8" required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                placeholder="Describe your topic in detail. Be specific and provide context to help others understand and respond."
                :disabled="loading"></textarea>
            <p class="mt-1 text-sm text-gray-500">
                {{ form.content.length }}/5000 characters
            </p>
            <p v-if="form.content && form.content.length < 20" class="mt-1 text-sm text-orange-600">
                Content should be at least 20 characters long
            </p>
        </div>

        <!-- Tags -->
        <div>
            <label for="tags" class="block text-sm font-medium text-gray-700 mb-1">
                Tags (optional)
            </label>
            <input id="tags" v-model="tagInput" type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter tags separated by commas (e.g., honda, maintenance, oil-change)" :disabled="loading"
                @keydown.enter.prevent="addTag" @keydown.comma.prevent="addTag">
            <p class="mt-1 text-sm text-gray-500">
                Press Enter or comma to add tags. Use relevant keywords to help others find your topic.
            </p>

            <!-- Tag Display -->
            <div v-if="form.tags.length > 0" class="mt-2 flex flex-wrap gap-2">
                <span v-for="(tag, index) in form.tags" :key="index"
                    class="inline-flex items-center px-2 py-1 rounded-md text-sm bg-primary-100 text-primary-800">
                    #{{ tag }}
                    <button type="button" @click="removeTag(index)" class="ml-1 text-primary-600 hover:text-primary-800"
                        :disabled="loading">
                        <XMarkIcon class="w-4 h-4" />
                    </button>
                </span>
            </div>
        </div>

        <!-- Images -->
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
                Images (optional)
            </label>

            <!-- Upload Button -->
            <div class="mb-4">
                <input ref="fileInput" type="file" multiple accept="image/*" @change="handleFileSelect" class="hidden"
                    :disabled="loading">
                <Button type="button" variant="outline" @click="$refs.fileInput.click()"
                    :disabled="loading || form.images.length >= 5" class="w-full sm:w-auto">
                    <PhotoIcon class="w-4 h-4 mr-2" />
                    {{ form.images.length === 0 ? 'Add Images' : 'Add More Images' }}
                </Button>
                <p class="mt-1 text-sm text-gray-500">
                    Upload up to 5 images (max 5MB each). Supported formats: JPG, PNG, WebP
                </p>
            </div>

            <!-- Image Previews -->
            <div v-if="form.images.length > 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                <div v-for="(image, index) in form.images" :key="index"
                    class="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                    <img :src="image.preview" :alt="`Preview ${index + 1}`" class="w-full h-full object-cover">

                    <!-- Upload Progress -->
                    <div v-if="image.uploading"
                        class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <div class="text-white text-center">
                            <div
                                class="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2">
                            </div>
                            <p class="text-sm">{{ image.progress }}%</p>
                        </div>
                    </div>

                    <!-- Remove Button -->
                    <button v-if="!image.uploading" type="button" @click="removeImage(index)"
                        class="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        :disabled="loading">
                        <XMarkIcon class="w-4 h-4" />
                    </button>

                    <!-- Error State -->
                    <div v-if="image.error"
                        class="absolute inset-0 bg-red-500 bg-opacity-75 flex items-center justify-center">
                        <div class="text-white text-center p-2">
                            <ExclamationTriangleIcon class="w-6 h-6 mx-auto mb-1" />
                            <p class="text-xs">Upload failed</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Upload Error -->
            <p v-if="uploadError" class="mt-2 text-sm text-red-600">
                {{ uploadError }}
            </p>
        </div>

        <!-- Error Message -->
        <ErrorMessage v-if="error" :message="error" />

        <!-- Actions -->
        <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="outline" @click="$emit('cancel')" :disabled="loading">
                Cancel
            </Button>
            <Button type="submit" :loading="loading" :disabled="!isFormValid">
                Create Topic
            </Button>
        </div>
    </form>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useForumStore } from '@/stores/forum';
import { useNotificationStore } from '@/stores/notification';
import Button from '@/components/common/Button.vue';
import ErrorMessage from '@/components/common/ErrorMessage.vue';
import { XMarkIcon, PhotoIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline';

const emit = defineEmits(['success', 'cancel']);

const forumStore = useForumStore();
const notificationStore = useNotificationStore();

const form = ref({
    title: '',
    category: '',
    content: '',
    tags: [],
    images: []
});

const tagInput = ref('');
const loading = ref(false);
const error = ref('');
const uploadError = ref('');
const fileInput = ref(null);

const isFormValid = computed(() => {
    return form.value.title.length >= 10 &&
        form.value.category &&
        form.value.content.length >= 20 &&
        form.value.content.length <= 5000;
});

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

const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files);
    uploadError.value = '';

    for (const file of files) {
        // Validate file
        if (!file.type.startsWith('image/')) {
            uploadError.value = 'Please select only image files.';
            continue;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            uploadError.value = 'Images must be smaller than 5MB.';
            continue;
        }

        if (form.value.images.length >= 5) {
            uploadError.value = 'Maximum 5 images allowed.';
            break;
        }

        // Create preview
        const preview = URL.createObjectURL(file);
        const imageObj = {
            file,
            preview,
            uploading: false,
            progress: 0,
            error: false,
            url: null
        };

        form.value.images.push(imageObj);
    }

    // Clear the input
    event.target.value = '';
};

const removeImage = (index) => {
    const image = form.value.images[index];
    if (image.preview) {
        URL.revokeObjectURL(image.preview);
    }
    form.value.images.splice(index, 1);
};

const uploadImages = async () => {
    const uploadPromises = form.value.images.map(async (image, index) => {
        if (image.url || image.uploading || image.error) return;

        try {
            image.uploading = true;
            image.progress = 0;

            const formData = new FormData();
            formData.append('image', image.file);

            const result = await forumStore.uploadImages(formData, (progress) => {
                image.progress = progress;
            });

            if (result.success) {
                image.url = result.data.url;
                image.uploading = false;
            } else {
                throw new Error(result.message || 'Upload failed');
            }
        } catch (err) {
            console.error('Image upload error:', err);
            image.error = true;
            image.uploading = false;
        }
    });

    await Promise.all(uploadPromises);
};

const resetForm = () => {
    // Clean up image previews
    form.value.images.forEach(image => {
        if (image.preview) {
            URL.revokeObjectURL(image.preview);
        }
    });

    form.value = {
        title: '',
        category: '',
        content: '',
        tags: [],
        images: []
    };
    tagInput.value = '';
    error.value = '';
    uploadError.value = '';
};

const handleSubmit = async () => {
    console.log('Form submission started', { isFormValid: isFormValid.value, form: form.value });

    if (!isFormValid.value) {
        console.log('Form validation failed');
        return;
    }

    try {
        loading.value = true;
        error.value = '';

        // Upload images first
        await uploadImages();

        // Check if any image uploads failed
        const failedUploads = form.value.images.filter(img => img.error);
        if (failedUploads.length > 0) {
            error.value = 'Some images failed to upload. Please try again or remove them.';
            loading.value = false;
            return;
        }

        console.log('Calling forumStore.createTopic...');

        const result = await forumStore.createTopic({
            title: form.value.title.trim(),
            category: form.value.category,
            content: form.value.content.trim(),
            tags: form.value.tags,
            images: form.value.images.filter(img => img.url).map(img => img.url)
        });

        console.log('createTopic result:', result);

        if (result.success) {
            notificationStore.success('Topic created!', 'Your topic has been posted successfully.');
            resetForm();
            emit('success', result.data);
        } else {
            error.value = result.message || 'Failed to create topic. Please try again.';
        }
    } catch (err) {
        console.error('Error creating topic:', err);
        error.value = err.response?.data?.message || err.message || 'Failed to create topic. Please try again.';
    } finally {
        loading.value = false;
    }
};
</script>
