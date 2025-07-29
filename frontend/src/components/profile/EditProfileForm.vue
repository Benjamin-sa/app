<template>
    <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Avatar Upload -->
        <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Profile Picture
            </label>
            <div class="flex items-center space-x-4">
                <div
                    class="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
                    <img v-if="previewUrl || form.avatar_url" :src="previewUrl || form.avatar_url" alt="Profile preview"
                        class="w-16 h-16 object-cover" />
                    <UserIcon v-else class="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
                <div>
                    <input ref="fileInput" type="file" accept="image/*" @change="handleFileSelect" class="hidden" />
                    <ActionButton type="button" variant="secondary" size="sm" @click="$refs.fileInput.click()">
                        Change Photo
                    </ActionButton>
                </div>
            </div>
        </div>

        <!-- Username -->
        <FormField id="username" v-model="form.username" label="Username" type="text" required
            :error="errors.username" />

        <!-- Display Name -->
        <FormField id="displayName" v-model="form.displayName" label="Display Name" type="text"
            placeholder="Your display name" />

        <!-- Bio -->
        <div class="space-y-2">
            <RichTextEditor v-model="form.bio" label="Bio" placeholder="Tell us about yourself..." :min-length="0"
                :max-length="500" />
        </div>

        <!-- Location -->
        <FormField id="location" v-model="form.location" label="Location" type="text" placeholder="City, Country" />

        <!-- Website -->
        <FormField id="website" v-model="form.website" label="Website" type="url" placeholder="https://example.com" />

        <!-- Privacy Settings -->
        <div class="space-y-4">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">Privacy Settings</h3>

            <div class="flex items-center justify-between">
                <div>
                    <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Show email publicly
                    </label>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                        Allow other users to see your email address
                    </p>
                </div>
                <input v-model="form.show_email" type="checkbox"
                    class="h-4 w-4 text-primary-600 focus:ring-primary-500 dark:focus:ring-primary-400 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded" />
            </div>

            <div class="flex items-center justify-between">
                <div>
                    <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Allow messages
                    </label>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                        Allow other users to send you private messages
                    </p>
                </div>
                <input v-model="form.allow_messages" type="checkbox"
                    class="h-4 w-4 text-primary-600 focus:ring-primary-500 dark:focus:ring-primary-400 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded" />
            </div>
        </div>

        <!-- Error Message -->
        <ErrorSection v-if="error" :error="error" title="Profile Update Error" />

        <!-- Form Actions -->
        <div class="flex justify-end space-x-4 pt-6 border-t border-gray-200/50 dark:border-gray-600/50">
            <ActionButton type="button" @click="$emit('cancel')" variant="outline" size="lg" :disabled="loading">
                Cancel
            </ActionButton>
            <ActionButton type="submit" size="lg" :loading="loading" :disabled="!isFormValid"
                class="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white shadow-lg">
                Save Changes
            </ActionButton>
        </div>
    </form>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useApi } from '@/composables/useApi';
import { validateUsername, validateImageFile, createImagePreview } from '@/utils/helpers';
import { apiService } from '@/services/api.service';
import ActionButton from '@/components/common/buttons/ActionButton.vue';
import ErrorSection from '@/components/common/sections/ErrorSection.vue';
import FormField from '@/components/common/forms/FormField.vue';
import RichTextEditor from '@/components/common/forms/RichTextEditor.vue';
import { UserIcon } from '@heroicons/vue/24/outline';

const props = defineProps({
    user: {
        type: Object,
        required: true
    }
});

const emit = defineEmits(['updated', 'cancel']);

// Replace manual loading/error with useApi
const { loading, error, execute } = useApi();

const form = ref({
    username: '',
    displayName: '',
    bio: '',
    location: '',
    website: '',
    avatar_url: '',
    show_email: false,
    allow_messages: true
});

const errors = ref({});
const selectedFile = ref(null);
const previewUrl = ref('');

const isFormValid = computed(() => {
    return form.value.username && form.value.username.length >= 3 && !errors.value.username;
});

// Initialize form with user data
watch(() => props.user, (user) => {
    if (user) {
        form.value = {
            username: user.username || '',
            displayName: user.displayName || user.username || '',
            bio: user.bio || '',
            location: user.location || '',
            website: user.website || '',
            avatar_url: user.avatar || user.avatarThumbnail || '',
            show_email: user.show_email || false,
            allow_messages: user.allow_messages !== false
        };
        previewUrl.value = '';
        selectedFile.value = null;
    }
}, { immediate: true, deep: true });

// Validate username on change
watch(() => form.value.username, (username) => {
    errors.value.username = '';
    if (username && username !== props.user.username) {
        if (!validateUsername(username)) {
            errors.value.username = 'Username must be 3-20 characters and contain only letters, numbers, and underscores';
        }
    }
});

const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Use helper function for validation
    const validation = validateImageFile(file);

    if (!validation.isValid) {
        error.value = validation.error;
        return;
    }

    selectedFile.value = file;

    // Use helper function to create preview
    const imagePreview = createImagePreview(file);
    previewUrl.value = imagePreview.preview;
};

const handleSubmit = async () => {
    if (!isFormValid.value || loading.value) {
        console.log('Form validation failed or loading');
        return;
    }

    const result = await execute(
        async () => {
            const formData = new FormData();

            // Add profile data
            formData.append('username', form.value.username);
            formData.append('displayName', form.value.displayName || form.value.username);
            formData.append('bio', form.value.bio || '');
            formData.append('location', form.value.location || '');
            formData.append('website', form.value.website || '');
            formData.append('show_email', form.value.show_email);
            formData.append('allow_messages', form.value.allow_messages);

            // Add avatar file if selected
            if (selectedFile.value) {
                formData.append('images', selectedFile.value);
            }

            return await apiService.put('/auth/profile', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
        },
        {
            successMessage: 'Profile updated successfully!',
            errorMessage: 'Failed to update profile. Please try again.'
        }
    );

    if (result) {
        emit('updated', result);
    }
};
</script>