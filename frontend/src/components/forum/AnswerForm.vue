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
import { useForumStore } from '@/stores/forum';
import { useRichTextEditor } from '@/composables/useRichTextEditor';
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

const forumStore = useForumStore();

const form = ref({
    content: '',
    images: []
});

const error = ref(null);
const submitting = ref(false);
const isEditing = computed(() => !!props.answer);

// Loading state from local state
const loading = computed(() => {
    return submitting.value;
});

const isFormValid = computed(() => {
    const contentLength = getTextLength(form.value.content);
    return contentLength >= 10 && contentLength <= 2000;
});

// Helper function to get text length from HTML content
const getTextLength = (htmlContent) => {
    if (!htmlContent) return 0;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    return tempDiv.textContent?.length || 0;
};

const handleCancel = () => {
    emit('cancel');
};

const handleSubmit = async () => {
    if (!isFormValid.value || submitting.value) return;

    try {
        submitting.value = true;
        error.value = null;

        const answerData = {
            content: form.value.content.trim()
        };

        let result;
        if (isEditing.value) {
            result = await forumStore.updateAnswer(props.answer.id, answerData, props.topicId);
        } else {
            if (!props.topicId) {
                throw new Error('Topic ID is required for creating answer');
            }
            result = await forumStore.createAnswer(props.topicId, answerData);
        }

        if (result) {
            emit('success', result);

            // Reset form if creating new answer
            if (!isEditing.value) {
                form.value.content = '';
                form.value.images = [];
            }
        }
    } catch (err) {
        console.error('Error submitting answer:', err);
        error.value = `Failed to ${isEditing.value ? 'update' : 'post'} answer. Please try again.`;
    } finally {
        submitting.value = false;
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
