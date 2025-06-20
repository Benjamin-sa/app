<template>
    <AuthLayout>
        <template #header>
            <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                Sign in to your account
            </h2>
            <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                Or
                <router-link to="/register"
                    class="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
                    create a new account
                </router-link>
            </p>
        </template>

        <template #form>
            <form class="mt-8 space-y-6" @submit.prevent="handleLogin">
                <div class="rounded-md shadow-sm -space-y-px">
                    <div>
                        <label for="email-address" class="sr-only">
                            Email address
                        </label>
                        <input id="email-address" v-model="form.email" name="email" type="email" autocomplete="email"
                            required
                            class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                            placeholder="Email address" :disabled="loading">
                    </div>
                    <div>
                        <label for="password" class="sr-only">
                            Password
                        </label>
                        <input id="password" v-model="form.password" name="password" type="password"
                            autocomplete="current-password" required
                            class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                            placeholder="Password" :disabled="loading">
                    </div>
                </div>

                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <input id="remember-me" v-model="form.rememberMe" name="remember-me" type="checkbox"
                            class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700">
                        <label for="remember-me" class="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                            Remember me
                        </label>
                    </div>

                    <div class="text-sm">
                        <router-link to="/forgot-password"
                            class="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
                            Forgot your password?
                        </router-link>
                    </div>
                </div>

                <ErrorSection v-if="error" :error="error" />

                <div>
                    <Button type="submit" size="lg" class="w-full" :loading="loading" :disabled="!isFormValid">
                        Sign in
                    </Button>
                </div>
            </form>
        </template>

        <template #social>
            <Button type="button" variant="outline" size="lg" class="w-full" @click="handleGoogleLogin"
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
                Sign in with Google
            </Button>
        </template>
    </AuthLayout>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notification';
import { validateEmail } from '@/utils/helpers';
import Button from '@/components/common/buttons/ActionButton.vue';
import ErrorSection from '@/components/common/sections/ErrorSection.vue';
import AuthLayout from '@/layouts/AuthLayout.vue';

const router = useRouter();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();

const form = ref({
    email: '',
    password: '',
    rememberMe: false
});

const loading = ref(false);
const googleLoading = ref(false);
const error = ref('');

const isFormValid = computed(() => {
    return validateEmail(form.value.email) && form.value.password.length >= 6;
});

const handleLogin = async () => {
    if (!isFormValid.value) return;

    try {
        loading.value = true;
        error.value = '';

        const result = await authStore.login({
            email: form.value.email,
            password: form.value.password,
            rememberMe: form.value.rememberMe
        });

        if (result.success) {
            notificationStore.success('Welcome back!', 'You have been successfully logged in.');

            // Redirect to intended page or home
            const redirectTo = router.currentRoute.value.query.redirect || '/';
            router.push(redirectTo);
        } else {
            error.value = result.message;
        }
    } catch (err) {
        console.error('Login error:', err);
        error.value = err.message || 'An error occurred during login';
    } finally {
        loading.value = false;
    }
};

const handleGoogleLogin = async () => {
    try {
        googleLoading.value = true;
        error.value = '';

        const result = await authStore.loginWithGoogle();

        if (result.success) {
            notificationStore.success('Welcome!', 'You have been successfully logged in with Google.');

            // Redirect to intended page or home
            const redirectTo = router.currentRoute.value.query.redirect || '/';
            router.push(redirectTo);
        } else {
            error.value = result.message;
        }
    } catch (err) {
        console.error('Google login error:', err);
        error.value = err.message || 'An error occurred during Google login';
    } finally {
        googleLoading.value = false;
    }
};
</script>
