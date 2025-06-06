<template>
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div class="max-w-md w-full text-center">
            <div class="mb-8">
                <h1 class="text-9xl font-bold text-gray-300">404</h1>
            </div>

            <div class="mb-8">
                <h2 class="text-3xl font-bold text-gray-900 mb-4">Page Not Found</h2>
                <p class="text-lg text-gray-600 mb-6">
                    Sorry, we couldn't find the page you're looking for.
                </p>
            </div>

            <div class="space-y-4">
                <Button size="lg" @click="$router.push('/')" class="w-full sm:w-auto">
                    Go to Homepage
                </Button>

                <div class="text-center">
                    <button @click="$router.go(-1)" class="text-primary-600 hover:text-primary-500 font-medium">
                        ← Go back to previous page
                    </button>
                </div>
            </div>

            <!-- Helpful Links -->
            <div class="mt-12 pt-8 border-t border-gray-200">
                <h3 class="text-lg font-medium text-gray-900 mb-4">
                    Maybe you're looking for:
                </h3>
                <div class="flex flex-col sm:flex-row gap-4 justify-center">
                    <router-link to="/forum" class="text-primary-600 hover:text-primary-500 font-medium">
                        Forum
                    </router-link>
                    <router-link to="/products" class="text-primary-600 hover:text-primary-500 font-medium">
                        Products
                    </router-link>
                    <router-link v-if="!authStore.isAuthenticated" to="/login"
                        class="text-primary-600 hover:text-primary-500 font-medium">
                        Login
                    </router-link>
                    <router-link v-else to="/profile" class="text-primary-600 hover:text-primary-500 font-medium">
                        Profile
                    </router-link>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth';
import Button from '@/components/common/Button.vue';

const authStore = useAuthStore();
</script>
