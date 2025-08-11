<template>
    <AuthLayout>
        <template #header>
            <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                {{ $t('auth.createAccount') }}
            </h2>
            <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                {{ $t('auth.or') }}
                <router-link to="/login"
                    class="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
                    {{ $t('auth.signInLink') }}
                </router-link>
            </p>
        </template>

        <template #form>
            <form class="mt-8 space-y-6" @submit.prevent="handleRegister">
                <div class="space-y-4">
                    <div>
                        <label for="username" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {{ $t('auth.username') }}
                        </label>
                        <input id="username" v-model="form.username" name="username" type="text" autocomplete="username"
                            required
                            class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            :placeholder="$t('auth.placeholders.username')" :disabled="loading">
                        <p v-if="form.username && !isUsernameValid" class="mt-1 text-sm text-red-600 dark:text-red-400">
                            {{ $t('auth.validation.usernameInvalid') }}
                        </p>
                    </div>

                    <div>
                        <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {{ $t('auth.emailAddress') }}
                        </label>
                        <input id="email" v-model="form.email" name="email" type="email" autocomplete="email" required
                            class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            :placeholder="$t('auth.placeholders.email')" :disabled="loading">
                        <p v-if="form.email && !isEmailValid" class="mt-1 text-sm text-red-600 dark:text-red-400">
                            {{ $t('auth.validation.emailInvalid') }}
                        </p>
                    </div>

                    <div>
                        <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {{ $t('auth.password') }}
                        </label>
                        <input id="password" v-model="form.password" name="password" type="password"
                            autocomplete="new-password" required
                            class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            :placeholder="$t('auth.placeholders.enterPassword')" :disabled="loading">
                        <p v-if="form.password && !isPasswordValid" class="mt-1 text-sm text-red-600 dark:text-red-400">
                            {{ $t('auth.validation.passwordTooShort') }}
                        </p>
                    </div>

                    <div>
                        <label for="confirmPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {{ $t('auth.confirmPassword') }}
                        </label>
                        <input id="confirmPassword" v-model="form.confirmPassword" name="confirmPassword"
                            type="password" autocomplete="new-password" required
                            class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            :placeholder="$t('auth.placeholders.confirmPassword')" :disabled="loading">
                        <p v-if="form.confirmPassword && !isPasswordMatch"
                            class="mt-1 text-sm text-red-600 dark:text-red-400">
                            {{ $t('auth.validation.passwordsDontMatch') }}
                        </p>
                    </div>
                </div>

                <div class="flex items-center">
                    <input id="terms" v-model="form.acceptTerms" name="terms" type="checkbox" required
                        class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700">
                    <label for="terms" class="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                        {{ $t('auth.terms.agreeToTerms') }}
                        <router-link to="/terms"
                            class="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
                            {{ $t('auth.terms.termsOfService') }}
                        </router-link>
                        {{ $t('auth.terms.and') }}
                        <router-link to="/privacy"
                            class="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
                            {{ $t('auth.terms.privacyPolicy') }}
                        </router-link>
                    </label>
                </div>

                <ErrorSection v-if="error" :error="error" />

                <div>
                    <ActionButton type="submit" size="lg" class="w-full" :loading="loading" :disabled="!isFormValid">
                        {{ $t('auth.createAccountButton') }}
                    </ActionButton>
                </div>
            </form>
        </template>

        <template #social>
            <ActionButton type="button" variant="outline" size="lg" class="w-full" @click="handleGoogleRegister"
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
                {{ $t('auth.signUpWithGoogle') }}
            </ActionButton>
        </template>
    </AuthLayout>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/ui/notification';
import { validateEmail, validateUsername } from '@/utils/helpers';
import ActionButton from '@/components/common/buttons/ActionButton.vue';
import ErrorSection from '@/components/common/sections/ErrorSection.vue';
import AuthLayout from '@/layouts/AuthLayout.vue';


const router = useRouter();
const { t } = useI18n();
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

        notificationStore.success(t('auth.welcomeToMotordash'), t('auth.registerSuccess'));

        // Redirect to home or intended page
        const redirectTo = router.currentRoute.value.query.redirect || '/';
        router.push(redirectTo);
    } catch (err) {
        console.error('Registration error:', err);
        error.value = err.message || t('auth.registerError');
    } finally {
        loading.value = false;
    }
};

const handleGoogleRegister = async () => {
    try {
        googleLoading.value = true;
        error.value = '';

        await authStore.loginWithGoogle();

        notificationStore.success(t('auth.welcomeToMotordash'), t('auth.googleRegisterSuccess'));

        // Redirect to home or intended page
        const redirectTo = router.currentRoute.value.query.redirect || '/';
        router.push(redirectTo);
    } catch (err) {
        console.error('Google registration error:', err);
        error.value = err.message || t('auth.googleRegisterError');
    } finally {
        googleLoading.value = false;
    }
};
</script>
