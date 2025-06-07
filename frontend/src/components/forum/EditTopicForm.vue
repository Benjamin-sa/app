<template>
    <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Title -->
        <div>
            <label for="title" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Topic Title
            </label>
            <input id="title" v-model="form.title" type="text" required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-primary-500 focus:border-primary-500 dark:focus:border-primary-400"
                placeholder="Enter a descriptive title for your topic" :disabled="loading">
            <p v-if="form.title && form.title.length < 10" class="mt-1 text-sm text-orange-600 dark:text-orange-400">
                Title should be at least 10 characters long
            </p>
        </div>

        <!-- Category -->
        <div>
            <label for="category" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
            </label>
            <select id="category" v-model="form.category" required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-primary-500 focus:border-primary-500 dark:focus:border-primary-400"
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
            <label for="content" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Content
            </label>
            <textarea id="content" v-model="form.content" rows="8" required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-primary-500 focus:border-primary-500 dark:focus:border-primary-400"
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
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-primary-500 focus:border-primary-500 dark:focus:border-primary-400"
                @keydown.enter.prevent="addTag" @keydown.comma.prevent="addTag">
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Press Enter or comma to add tags
            </p>

            <!-- Tag Display -->
            <div v-if="form.tags.length > 0" class="mt-2 flex flex-wrap gap-2">
                <span v-for="(tag, index) in form.tags" :key="index"
                    class="inline-flex items-center px-2 py-1 text-xs font-medium bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full">
                    {{ tag }}
                    <button type="button" @click="removeTag(index)"
                        class="ml-1 text-primary-600 dark:text-primary-300 hover:text-primary-800 dark:hover:text-primary-100">
                        <XMarkIcon class="w-3 h-3" />
                    </button>
                </span>
            </div>
        </div>

        <!-- Error Message -->
        <ErrorMessage v-if="error" :message="error" />

        <!-- Actions -->
        <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button type="button" variant="outline" @click="$emit('cancel')" :disabled="loading">
                Cancel
            </Button>
            <Button type="submit" :loading="loading" :disabled="!isFormValid">
                Update Topic
            </Button>
        </div>
    </form>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useNotificationStore } from '@/stores/notification';
import { useApi } from '@/composables/useApi';
import { apiService } from '@/services/api.service';
import Button from '@/components/common/Button.vue';
import ErrorMessage from '@/components/common/ErrorMessage.vue';
import { XMarkIcon } from '@heroicons/vue/24/outline';

const props = defineProps({
    topic: {
        type: Object,
        required: true
    }
});

const emit = defineEmits(['success', 'cancel']);

const notificationStore = useNotificationStore();
const { loading, error, execute } = useApi();

const form = ref({
    title: '',
    category: '',
    content: '',
    tags: []
});

const tagInput = ref('');

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

const handleSubmit = async () => {
    if (!isFormValid.value) return;

    const result = await execute(
        () => apiService.put(`/forum/topics/${props.topic.id}`, {
            title: form.value.title.trim(),
            category: form.value.category,
            content: form.value.content.trim(),
            tags: form.value.tags
        }),
        {
            successMessage: 'Your changes have been saved successfully.',
            successTitle: 'Topic updated!',
            showErrorNotification: true,
            notificationStore
        }
    );

    if (result) {
        emit('success', result);
    }
};

onMounted(() => {
    // Pre-populate form with existing topic data
    form.value = {
        title: props.topic.title || '',
        category: props.topic.category || '',
        content: props.topic.content || '',
        tags: [...(props.topic.tags || [])]
    };
});
</script>
