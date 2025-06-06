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

        <!-- Error Message -->
        <ErrorMessage v-if="error" :message="error" />

        <!-- Actions -->
        <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
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

const form = ref({
    title: '',
    category: '',
    content: '',
    tags: []
});

const tagInput = ref('');
const loading = ref(false);
const error = ref('');

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

    try {
        loading.value = true;
        error.value = '';

        const response = await apiService.put(`/forum/topics/${props.topic.id}`, {
            title: form.value.title.trim(),
            category: form.value.category,
            content: form.value.content.trim(),
            tags: form.value.tags
        });

        notificationStore.success('Topic updated!', 'Your changes have been saved successfully.');
        emit('success', response.data);
    } catch (err) {
        console.error('Error updating topic:', err);
        error.value = err.response?.data?.message || 'Failed to update topic. Please try again.';
    } finally {
        loading.value = false;
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
