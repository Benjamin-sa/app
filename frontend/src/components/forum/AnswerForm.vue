<template>
    <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Content -->
        <div>
            <label for="content" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ isEditing ? 'Edit Answer' : 'Your Answer' }}
            </label>
            <textarea id="content" v-model="form.content" rows="6" required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-primary-500 focus:border-primary-500"
                placeholder="Write your answer here. Be helpful and provide specific details."
                :disabled="loading"></textarea>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {{ form.content.length }}/2000 characters
            </p>
            <p v-if="form.content && form.content.length < 10" class="mt-1 text-sm text-orange-600">
                Answer should be at least 10 characters long
            </p>
        </div>

        <!-- Image Upload -->
        <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Images (optional)
            </label>

            <!-- Upload Button -->
            <div class="flex items-center space-x-3">
                <input ref="fileInput" type="file" multiple accept="image/*" @change="handleFileSelect"
                    class="hidden" />
                <button type="button" @click="$refs.fileInput.click()"
                    class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                    :disabled="loading">
                    <PhotoIcon class="w-4 h-4 mr-2" />
                    Add Images
                </button>
                <span class="text-sm text-gray-500 dark:text-gray-400">
                    Max 5 images, 10MB each
                </span>
            </div>

            <!-- Image Previews -->
            <div v-if="form.images.length > 0" class="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div v-for="(image, index) in form.images" :key="index" class="relative group">
                    <img :src="image.url" :alt="image.name"
                        class="w-full h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-600" />
                    <button type="button" @click="removeImage(index)"
                        class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <XMarkIcon class="w-4 h-4" />
                    </button>
                    <div
                        class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg truncate">
                        {{ image.name }}
                        <span v-if="image.isNew" class="ml-1 text-blue-300">(new)</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Error Message -->
        <ErrorMessage v-if="error" :message="error" />

        <!-- Actions -->
        <div class="flex justify-end space-x-3">
            <Button type="button" variant="outline" @click="handleCancel" :disabled="loading">
                Cancel
            </Button>
            <Button type="submit" :loading="loading" :disabled="!isFormValid">
                {{ isEditing ? 'Update Answer' : 'Post Answer' }}
            </Button>
        </div>
    </form>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { apiService } from '@/services/api.service';
import Button from '@/components/common/Button.vue';
import ErrorMessage from '@/components/common/ErrorMessage.vue';
import { PhotoIcon, XMarkIcon } from '@heroicons/vue/24/outline';
import { processImageFiles, cleanupImagePreviews } from '@/utils/helpers';

const props = defineProps({
    topicId: {
        type: String,
        default: null
    },
    answer: {
        type: Object,
        default: null
    }
});

const emit = defineEmits(['success', 'cancel']);

const isEditing = computed(() => !!props.answer);

const form = ref({
    content: '',
    images: []
});

const loading = ref(false);
const error = ref('');
const fileInput = ref(null);

const isFormValid = computed(() => {
    return form.value.content.length >= 10 &&
        form.value.content.length <= 2000;
});

const handleFileSelect = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const result = processImageFiles(files, form.value.images.length, 5, 10 * 1024 * 1024);

    if (result.error) {
        error.value = result.error;
        return;
    }

    error.value = '';

    // Add processed images with isNew flag
    const newImages = result.images.map(img => ({
        ...img,
        url: img.preview, // Use preview as url for consistency
        isNew: true
    }));

    form.value.images.push(...newImages);

    // Clear file input
    if (fileInput.value) {
        fileInput.value.value = '';
    }
};

const removeImage = (index) => {
    const image = form.value.images[index];
    // Revoke object URL to prevent memory leaks for new images
    if (image.isNew && image.url) {
        URL.revokeObjectURL(image.url);
    }
    form.value.images.splice(index, 1);
};

const handleCancel = () => {
    // Clean up object URLs
    const newImages = form.value.images.filter(img => img.isNew);
    cleanupImagePreviews(newImages);
    emit('cancel');
};

const handleSubmit = async () => {
    if (!isFormValid.value) return;

    try {
        loading.value = true;
        error.value = '';

        // Create FormData for multipart request
        const formData = new FormData();
        formData.append('content', form.value.content.trim());

        // Add new image files
        const newImages = form.value.images.filter(img => img.isNew);
        newImages.forEach((image) => {
            formData.append(`images`, image.file);
        });

        // Add existing image data (for editing)
        const existingImages = form.value.images.filter(img => !img.isNew);
        if (existingImages.length > 0) {
            formData.append('existingImages', JSON.stringify(existingImages.map(img => ({
                id: img.id,
                url: img.url,
                name: img.name
            }))));
        }

        let response;
        if (isEditing.value) {
            response = await apiService.patch(`/forum/answers/${props.answer.id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
        } else {
            // Make sure we have the topic ID for creating
            if (!props.topicId) {
                throw new Error('Topic ID is required for creating answer');
            }
            response = await apiService.post(`/forum/topics/${props.topicId}/answers`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
        }

        // Clean up object URLs for new images
        cleanupImagePreviews(newImages);

        emit('success', response.data);

        // Reset form if creating new answer
        if (!isEditing.value) {
            form.value.content = '';
            form.value.images = [];
        }
    } catch (err) {
        console.error('Error submitting answer:', err);
        error.value = err.response?.data?.message ||
            err.message ||
            `Failed to ${isEditing.value ? 'update' : 'post'} answer. Please try again.`;
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    if (isEditing.value && props.answer) {
        form.value.content = props.answer.content || '';
        // Map existing images (these don't have the isNew flag)
        form.value.images = (props.answer.images || []).map(img => ({
            ...img,
            isNew: false
        }));
    }
});
</script>
