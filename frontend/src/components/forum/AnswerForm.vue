<template>
    <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Enhanced Content -->
        <div class="space-y-2">
            <RichTextEditor v-model="form.content" :label="isEditing ? 'Edit Answer' : 'Your Answer'"
                placeholder="Write your answer here. Be helpful and provide specific details." :disabled="loading"
                :min-length="10" :max-length="2000" id="answer-content" />
        </div>

        <!-- Enhanced Image Upload -->
        <ImageUpload v-model:images="form.images" label="Images (optional)" variant="enhanced" :max-files="3"
            :max-file-size="5 * 1024 * 1024" @error="(err) => error = err" />

        <!-- Error Section -->
        <ErrorSection v-if="error" :error="error" title="Form Error" @retry="() => error = ''" />

        <!-- Enhanced Actions -->
        <div class="flex justify-end space-x-4 pt-6 border-t border-gray-200/50 dark:border-gray-600/50">
            <ActionButton @click="handleCancel" variant="outline" size="lg" :disabled="loading">
                Cancel
            </ActionButton>
            <ActionButton type="submit" size="lg" :loading="loading" :disabled="!isFormValid"
                class="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg">
                {{ isEditing ? 'Update Answer' : 'Post Answer' }}
            </ActionButton>
        </div>
    </form>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useApi } from '@/composables/useApi';
import { useRichTextEditor } from '@/composables/useRichTextEditor';
import { apiService } from '@/services/api.service';
import ActionButton from '@/components/common/buttons/ActionButton.vue';
import RichTextEditor from '@/components/common/forms/RichTextEditor.vue';
import ErrorSection from '@/components/common/sections/ErrorSection.vue';
import ImageUpload from '@/components/common/forms/ImageUpload.vue';

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

// Use the rich text editor composable
const {
    content,
    getTextLength,
    isValid: isContentValid,
    clear: clearContent,
    setContent
} = useRichTextEditor({
    maxLength: 2000,
    minLength: 10,
    placeholder: "Write your answer here. Be helpful and provide specific details."
});

const form = ref({
    content: '',
    images: []
});

// Use the composable
const { loading, error, execute } = useApi();

const isFormValid = computed(() => {
    const contentLength = getTextLength(form.value.content);
    return contentLength >= 10 && contentLength <= 2000;
});

const handleCancel = () => {
    emit('cancel');
};

const handleSubmit = async () => {
    if (!isFormValid.value) return;

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

    const apiCall = () => {
        if (isEditing.value) {
            return apiService.patch(`/forum/answers/${props.answer.id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        } else {
            if (!props.topicId) {
                throw new Error('Topic ID is required for creating answer');
            }
            return apiService.post(`/forum/answers/${props.topicId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        }
    };

    const result = await execute(apiCall, {
        successMessage: `Answer ${isEditing.value ? 'updated' : 'posted'} successfully!`,
        errorMessage: `Failed to ${isEditing.value ? 'update' : 'post'} answer. Please try again.`
    });

    if (result) {
        emit('success', result);

        // Reset form if creating new answer
        if (!isEditing.value) {
            form.value.content = '';
            form.value.images = [];
        }
    }
};

onMounted(() => {
    // Initialize form
    if (!form.value.content) {
        form.value.content = '';
    }
    if (!form.value.images) {
        form.value.images = [];
    }

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
