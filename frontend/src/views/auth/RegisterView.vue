<template>
    <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div class="max-w-md w-full space-y-8">
            <div>
                <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                    Create your account
                </h2>
                <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                    Or
                    <router-link to="/login"
                        class="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
                        sign in to your existing account
                    </router-link>
                </p>
            </div>

            <form class="mt-8 space-y-6" @submit.prevent="handleRegister">
                <div class="space-y-4">
                    <div>
                        <label for="username" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Username
                        </label>
                        <input id="username" v-model="form.username" name="username" type="text" autocomplete="username"
                            required
                            class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            placeholder="Enter your username" :disabled="loading">
                        <p v-if="form.username && !isUsernameValid" class="mt-1 text-sm text-red-600 dark:text-red-400">
                            Username must be 3-20 characters and contain only letters, numbers, and underscores
                        </p>
                    </div>

                    <div>
                        <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Email address
                        </label>
                        <input id="email" v-model="form.email" name="email" type="email" autocomplete="email" required
                            class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            placeholder="Enter your email" :disabled="loading">
                        <p v-if="form.email && !isEmailValid" class="mt-1 text-sm text-red-600 dark:text-red-400">
                            Please enter a valid email address
                        </p>
                    </div>

                    <div>
                        <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Password
                        </label>
                        <input id="password" v-model="form.password" name="password" type="password"
                            autocomplete="new-password" required
                            class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            placeholder="Enter your password" :disabled="loading">
                        <p v-if="form.password && !isPasswordValid" class="mt-1 text-sm text-red-600 dark:text-red-400">
                            Password must be at least 6 characters long
                        </p>
                    </div>

                    <div>
                        <label for="confirmPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Confirm Password
                        </label>
                        <input id="confirmPassword" v-model="form.confirmPassword" name="confirmPassword"
                            type="password" autocomplete="new-password" required
                            class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            placeholder="Confirm your password" :disabled="loading">
                        <p v-if="form.confirmPassword && !isPasswordMatch"
                            class="mt-1 text-sm text-red-600 dark:text-red-400">
                            Passwords do not match
                        </p>
                    </div>
                </div>

                <div class="flex items-center">
                    <input id="terms" v-model="form.acceptTerms" name="terms" type="checkbox" required
                        class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700">
                    <label for="terms" class="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                        I agree to the
                        <router-link to="/terms"
                            class="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
                            Terms of Service
                        </router-link>
                        and
                        <router-link to="/privacy"
                            class="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
                            Privacy Policy
                        </router-link>
                    </label>
                </div>

                <ErrorSection :error="error" @retry="fetchBike" />

                <div>
                    <ActionButton type="submit" size="lg" class="w-full" :loading="loading" :disabled="!isFormValid">
                        Create Account
                    </ActionButton>
                </div>

                <div class="mt-6">
                    <div class="relative">
                        <div class="absolute inset-0 flex items-center">
                            <div class="w-full border-t border-gray-300" />
                        </div>
                        <div class="relative flex justify-center text-sm">
                            <span class="px-2 bg-gray-50 text-gray-500">Or continue with</span>
                        </div>
                    </div>

                    <div class="mt-6">
                        <Button type="button" variant="outline" size="lg" class="w-full" @click="handleGoogleRegister"
                            :loading="googleLoading" :disabled="loading">
                            <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24">
                                <path fill="currentColor"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="currentColor"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="currentColor"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="currentColor"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Sign up with Google
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notification';
import { validateEmail, validateUsername } from '@/utils/helpers';
import ActionButton from '@/components/common/buttons/ActionButton.vue'
import ErrorSection from '@/components/common/sections/ErrorSection.vue'


const router = useRouter();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();

const form = ref({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
});

const loading = ref(false);
const googleLoading = ref(false);
const error = ref('');

const isUsernameValid = computed(() => validateUsername(form.value.username));
const isEmailValid = computed(() => validateEmail(form.value.email));
const isPasswordValid = computed(() => form.value.password.length >= 6);
const isPasswordMatch = computed(() => form.value.password === form.value.confirmPassword);

const isFormValid = computed(() => {
    return isUsernameValid.value &&
        isEmailValid.value &&
        isPasswordValid.value &&
        isPasswordMatch.value &&
        form.value.acceptTerms;
});

const handleRegister = async () => {
    if (!isFormValid.value) return;

    try {
        loading.value = true;
        error.value = '';

        await authStore.register({
            username: form.value.username,
            email: form.value.email,
            password: form.value.password
        });

        notificationStore.success('Welcome to Motordash!', 'Your account has been created successfully.');

        // Redirect to home or intended page
        const redirectTo = router.currentRoute.value.query.redirect || '/';
        router.push(redirectTo);
    } catch (err) {
        console.error('Registration error:', err);
        error.value = err.message || 'An error occurred during registration';
    } finally {
        loading.value = false;
    }
};

const handleGoogleRegister = async () => {
    try {
        googleLoading.value = true;
        error.value = '';

        await authStore.loginWithGoogle();

        notificationStore.success('Welcome to Motordash!', 'Your account has been created successfully with Google.');

        // Redirect to home or intended page
        const redirectTo = router.currentRoute.value.query.redirect || '/';
        router.push(redirectTo);
    } catch (err) {
        console.error('Google registration error:', err);
        error.value = err.message || 'An error occurred during Google registration';
    } finally {
        googleLoading.value = false;
    }
};
</script>
