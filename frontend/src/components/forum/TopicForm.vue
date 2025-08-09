<template>
    <div class="space-y-8">
        <!-- Enhanced Loading State for Edit Mode -->
        <div v-if="isEditMode && !formInitialized" class="flex justify-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600"></div>
        </div>

        <!-- Enhanced Form -->
        <form v-else @submit.prevent="handleSubmit" class="space-y-8">
            <!-- Enhanced Title -->
            <FormField id="title" v-model="form.title" :label="$t('forum.form.title')" type="text" required variant="enhanced"
                :placeholder="$t('forum.form.titlePlaceholder')" :disabled="loading"
                :help-text="form.title && form.title.length < 10 ? $t('forum.form.titleHelpShort') : ''" />

            <!-- Category Display (read-only when category is provided) -->
            <div v-if="props.category" class="space-y-3">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {{ $t('forum.form.categoryLabel') }}
                </label>
                <div
                    class="px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl">
                    <span class="text-gray-900 dark:text-white font-medium">{{ getCategoryLabel(props.category)
                    }}</span>
                </div>
            </div>

            <!-- Enhanced Category (only show when no category is provided) -->
            <FormField v-else id="category" v-model="form.category" :label="$t('forum.form.categoryLabel')" type="select" required
                variant="enhanced" :placeholder="$t('forum.form.categoryPlaceholder')" :disabled="loading" :options="categoryOptions" />

            <!-- Content -->
            <div>
                <RichTextEditor :key="`rich-editor-${isEditMode ? 'edit' : 'create'}-${formInitialized}`"
                    v-model="form.content" :label="$t('forum.form.contentLabel')"
                    :placeholder="$t('forum.form.contentPlaceholder')"
                    :disabled="loading" :min-length="20" :max-length="5000" />
            </div>

            <!-- Enhanced Tags -->
            <div class="space-y-3">
                <FormField id="tags" v-model="tagInput" :label="$t('forum.form.tagsLabel')" type="text" variant="enhanced"
                    :placeholder="$t('forum.form.tagsPlaceholder')"
                    :disabled="loading"
                    :help-text="$t('forum.form.tagsHelp')"
                    @keydown.enter.prevent="addTag" @keydown.comma.prevent="addTag" />

                <!-- Enhanced Tag Display -->
                <div v-if="form.tags.length > 0" class="flex flex-wrap gap-2">
                    <span v-for="(tag, index) in form.tags" :key="index"
                        class="inline-flex items-center px-3 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-primary-100 to-accent-100 dark:from-primary-900/30 dark:to-accent-900/30 text-primary-800 dark:text-primary-200 border border-primary-200/50 dark:border-primary-800/50 backdrop-blur-sm transition-all duration-200 hover:scale-105">
                        #{{ tag }}
                        <button type="button" @click="removeTag(index)"
                            class="ml-2 text-primary-600 hover:text-primary-800 dark:text-primary-300 dark:hover:text-primary-100 p-0.5 rounded-full hover:bg-primary-200 dark:hover:bg-primary-800 transition-colors"
                            :disabled="loading">
                            <XMarkIcon class="w-3 h-3" />
                        </button>
                    </span>
                </div>
            </div>

            <!-- Enhanced Images -->
            <ImageUpload v-model:images="allImages" :label="$t('forum.form.imagesLabel')" variant="enhanced" :max-files="5"
                :max-file-size="isEditMode ? 10 * 1024 * 1024 : 5 * 1024 * 1024" @error="(err) => error = err" />

            <!-- Enhanced Error Message -->
            <div v-if="error"
                class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <div class="flex items-center">
                    <ExclamationTriangleIcon class="w-5 h-5 text-red-500 mr-2" />
                    <p class="text-sm text-red-600 dark:text-red-400 font-medium">{{ error }}</p>
                </div>
            </div>

            <!-- Enhanced Actions -->
            <div class="flex justify-end space-x-4 pt-8 border-t border-gray-200/50 dark:border-gray-600/50">
                <ActionButton type="button" @click="$emit('cancel')" variant="outline" size="lg" :disabled="loading">
                    {{ $t('forum.form.actions.cancel') }}
                </ActionButton>
                <ActionButton type="submit" size="lg" :loading="loading" :disabled="!isFormValid"
                    class="bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 text-white shadow-lg">
                    {{ isEditMode ? $t('forum.form.actions.saveChanges') : $t('forum.form.actions.postTopic') }}
                </ActionButton>
            </div>
        </form>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useForumStore } from '@/stores/forum';
import { useApi } from '@/composables/useApi';
import { getCategoryLabel } from '@/utils/helpers';
import { FORUM_CATEGORIES } from '@/utils/constants.repository';
import ActionButton from '@/components/common/buttons/ActionButton.vue';
import FormField from '@/components/common/forms/FormField.vue';
import ImageUpload from '@/components/common/forms/ImageUpload.vue';
import RichTextEditor from '@/components/common/forms/RichTextEditor.vue';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline';

const props = defineProps({
    topic: {
        type: Object,
        default: null
    },
    category: {
        type: String,
        default: null
    }
});

const emit = defineEmits(['success', 'cancel']);

const forumStore = useForumStore();

const { error, execute } = useApi();

// Determine if we're in edit mode
const isEditMode = computed(() => !!props.topic);

// Loading state from store
const loading = computed(() => {
    return isEditMode.value ? false : forumStore.isCreatingTopic;
});

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
const formInitialized = ref(false);

// Computed properties
const categoryOptions = computed(() =>
    Object.values(FORUM_CATEGORIES).map(category => ({
        value: category,
        label: getCategoryLabel(category)
    }))
);

const isFormValid = computed(() => {
    const contentLength = getTextLength(form.value.content);
    const categoryValue = props.category || form.value.category;
    return form.value.title.length >= 10 &&
        categoryValue &&
        contentLength >= 20 &&
        contentLength <= 5000;
});

// Helper function to get text length from HTML content
const getTextLength = (htmlContent) => {
    if (!htmlContent) return 0;
    // Create a temporary div to strip HTML tags
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    return tempDiv.textContent?.length || 0;
};

const totalImagesCount = computed(() => {
    return (form.value.existingImages?.length || 0) + (form.value.newImages?.length || 0);
});

// Combined images for ImageUpload component
const allImages = computed({
    get() {
        const existing = (form.value.existingImages || []).map(img => ({
            ...img,
            isNew: false
        }));
        const newImages = (form.value.newImages || []).map(img => ({
            ...img,
            isNew: true
        }));
        return [...existing, ...newImages];
    },
    set(newImages) {
        // Separate existing and new images
        const existing = newImages.filter(img => !img.isNew);
        const newImgs = newImages.filter(img => img.isNew);

        form.value.existingImages = existing;
        form.value.newImages = newImgs;
    }
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
        // Add a small delay to ensure the RichTextEditor can initialize properly
        setTimeout(() => {
            formInitialized.value = true;
        }, 100);
        console.log('Form initialized for edit:', form.value);
    } else {
        // Create mode - reset form and use provided category
        resetForm();
        if (props.category) {
            form.value.category = props.category;
        }
        setTimeout(() => {
            formInitialized.value = true;
        }, 100);
        console.log('Form initialized for create with category:', props.category);
    }
};

const resetForm = () => {
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

// Form submission
const handleSubmit = async () => {
    if (!isFormValid.value) return;

    try {
        // Create FormData for multipart/form-data submission
        const formData = new FormData();

        // Add basic topic data
        formData.append('title', form.value.title.trim());
        formData.append('category', props.category || form.value.category);
        formData.append('content', form.value.content.trim());
        formData.append('tags', JSON.stringify(form.value.tags));

        // Handle images for edit mode
        if (isEditMode.value) {
            // Add existing images to keep (those that weren't removed)
            if (form.value.existingImages && form.value.existingImages.length > 0) {
                formData.append('existingImages', JSON.stringify(form.value.existingImages));
            }

            // Add images to remove
            if (form.value.imagesToRemove && form.value.imagesToRemove.length > 0) {
                formData.append('imagesToRemove', JSON.stringify(form.value.imagesToRemove));
            }
        }

        // Add new image files
        if (form.value.newImages && form.value.newImages.length > 0) {
            form.value.newImages.forEach((imageObj) => {
                // Extract the actual File object from the image preview object
                if (imageObj.file) {
                    formData.append('images', imageObj.file);
                }
            });
        }

        let result;
        if (isEditMode.value) {
            result = await forumStore.updateTopic(props.topic.id, formData);
        } else {
            result = await forumStore.createTopic(formData);
        }

        if (result) {
            if (!isEditMode.value) {
                resetForm();
            }
            emit('success', result);
        }
    } catch (error) {
        console.error('Error submitting topic:', error);
        // Error handling is done in the store
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
