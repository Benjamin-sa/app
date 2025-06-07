<template>
    <!-- Simple Modal Structure for Testing -->
    <div v-if="open" class="fixed inset-0 z-50 overflow-y-auto">
        <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <!-- Background overlay -->
            <div class="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 transition-opacity"
                @click="$emit('close')"></div>

            <!-- Modal panel -->
            <div
                class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Edit Profile</h3>

                    <form @submit.prevent="handleSubmit" class="space-y-6">
                        <!-- Avatar Upload -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Profile Picture
                            </label>
                            <div class="flex items-center space-x-4">
                                <div
                                    class="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
                                    <img v-if="previewUrl || form.avatar_url" :src="previewUrl || form.avatar_url"
                                        alt="Profile preview" class="w-16 h-16 object-cover" />
                                    <UserIcon v-else class="w-8 h-8 text-gray-400 dark:text-gray-500" />
                                </div>
                                <div>
                                    <input ref="fileInput" type="file" accept="image/*" @change="handleFileSelect"
                                        class="hidden" />
                                    <Button type="button" variant="secondary" size="sm"
                                        @click="$refs.fileInput.click()">
                                        Change Photo
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <!-- Username -->
                        <div>
                            <label for="username"
                                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Username
                            </label>
                            <input id="username" v-model="form.username" type="text" required
                                class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:focus:border-primary-400"
                                :class="{ 'border-red-300 dark:border-red-500': errors.username }" />
                            <p v-if="errors.username" class="mt-1 text-sm text-red-600 dark:text-red-400">
                                {{ errors.username }}
                            </p>
                        </div>

                        <!-- Display Name -->
                        <div>
                            <label for="displayName"
                                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Display Name
                            </label>
                            <input id="displayName" v-model="form.displayName" type="text"
                                class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:focus:border-primary-400"
                                placeholder="Your display name" />
                        </div>

                        <!-- Bio -->
                        <div>
                            <label for="bio" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Bio
                            </label>
                            <textarea id="bio" v-model="form.bio" rows="3"
                                class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:focus:border-primary-400"
                                placeholder="Tell us about yourself..." />
                        </div>

                        <!-- Location -->
                        <div>
                            <label for="location"
                                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Location
                            </label>
                            <input id="location" v-model="form.location" type="text"
                                class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:focus:border-primary-400"
                                placeholder="City, Country" />
                        </div>

                        <!-- Website -->
                        <div>
                            <label for="website"
                                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Website
                            </label>
                            <input id="website" v-model="form.website" type="url"
                                class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:focus:border-primary-400"
                                placeholder="https://example.com" />
                        </div>

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
                        <ErrorMessage v-if="error" :message="error" />

                        <!-- Actions -->
                        <div class="flex justify-end space-x-3 pt-6">
                            <Button type="button" variant="secondary" @click="$emit('close')" :disabled="loading">
                                Cancel
                            </Button>
                            <Button type="submit" :loading="loading" :disabled="!isFormValid || loading">
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notification';
import { useApi } from '@/composables/useApi';
import { validateUsername } from '@/utils/helpers';
import Button from '@/components/common/Button.vue';
import ErrorMessage from '@/components/common/ErrorMessage.vue';
import { UserIcon } from '@heroicons/vue/24/outline';

const props = defineProps({
    open: {
        type: Boolean,
        required: true
    },
    user: {
        type: Object,
        required: true
    }
});

const emit = defineEmits(['close', 'updated']);

const authStore = useAuthStore();
const notificationStore = useNotificationStore();

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

    // Validate file type
    if (!file.type.startsWith('image/')) {
        notificationStore.error('Invalid file type', 'Please select an image file');
        return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        notificationStore.error('File too large', 'Please select an image smaller than 5MB');
        return;
    }

    selectedFile.value = file;

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
        previewUrl.value = e.target.result;
    };
    reader.readAsDataURL(file);
};

const handleSubmit = async () => {

    if (!isFormValid.value || loading.value) {
        console.log('Form validation failed or loading');
        return;
    }

    const profileDataPayload = {
        username: form.value.username,
        displayName: form.value.displayName || form.value.username,
        bio: form.value.bio,
        location: form.value.location,
        website: form.value.website,
        // Remove avatar from here since it will be sent as a file
        show_email: form.value.show_email,
        allow_messages: form.value.allow_messages
    };

    try {
        const result = await execute(
            () => authStore.updateProfile(profileDataPayload, selectedFile.value),
            {
                showNotification: true,
                notificationStore,
            }
        );

        if (result && result.success) {
            notificationStore.success('Profile updated', 'Your profile has been updated successfully!');
            emit('updated', result.data);
            emit('close');
        } else if (result && !result.success) {
            if (result.errors) {
                errors.value = result.errors;
            }
        }
    } catch (err) {
        console.error('Submit error:', err);
    }
};
</script>