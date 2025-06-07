<template>
    <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Content -->
        <div>
            <label for="content" class="block text-sm font-medium text-gray-700 mb-1">
                Your Answer
            </label>
            <textarea id="content" v-model="form.content" rows="6" required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                placeholder="Write your answer here. Be helpful and provide specific details."
                :disabled="loading"></textarea>
            <p class="mt-1 text-sm text-gray-500">
                {{ form.content.length }}/2000 characters
            </p>
            <p v-if="form.content && form.content.length < 10" class="mt-1 text-sm text-orange-600">
                Answer should be at least 10 characters long
            </p>
        </div>

        <!-- Error Message -->
        <ErrorMessage v-if="error" :message="error" />

        <!-- Actions -->
        <div class="flex justify-end space-x-3">
            <Button type="button" variant="outline" @click="$emit('cancel')" :disabled="loading">
                Cancel
            </Button>
            <Button type="submit" :loading="loading" :disabled="!isFormValid">
                Post Answer
            </Button>
        </div>
    </form>
</template>

<script setup>
import { ref, computed } from 'vue';
import { apiService } from '@/services/api.service';
import Button from '@/components/common/Button.vue';
import ErrorMessage from '@/components/common/ErrorMessage.vue';

const props = defineProps({
    topicId: {
        type: String,
        required: true
    }
});

const emit = defineEmits(['success', 'cancel']);

const form = ref({
    content: ''
});

const loading = ref(false);
const error = ref('');

const isFormValid = computed(() => {
    return form.value.content.length >= 10 && form.value.content.length <= 2000;
});

const handleSubmit = async () => {
    if (!isFormValid.value) return;

    try {
        loading.value = true;
        error.value = '';

        const response = await apiService.post(`/forum/topics/${props.topicId}/answers`, {
            content: form.value.content.trim()
        });

        emit('success', response.data);

        // Reset form
        form.value.content = '';
    } catch (err) {
        console.error('Error posting answer:', err);
        error.value = err.response?.data?.message || 'Failed to post answer. Please try again.';
    } finally {
        loading.value = false;
    }
};
</script>
