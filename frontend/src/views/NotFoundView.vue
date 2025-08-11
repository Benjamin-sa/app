<template>
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div class="flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
            <div class="max-w-2xl w-full text-center">
                <!-- Animated 404 with modern design -->
                <div class="mb-12 relative">
                    <div class="absolute inset-0 flex items-center justify-center">
                        <div
                            class="w-80 h-80 bg-gradient-to-br from-primary-100/40 to-accent-100/40 dark:from-primary-900/20 dark:to-accent-900/20 rounded-full blur-3xl animate-pulse">
                        </div>
                    </div>
                    <div class="relative">
                        <h1
                            class="text-8xl sm:text-9xl font-bold bg-gradient-to-r from-primary-600 via-accent-600 to-primary-800 dark:from-primary-400 dark:via-accent-400 dark:to-primary-600 bg-clip-text text-transparent animate-bounce">
                            404
                        </h1>
                        <div
                            class="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-ping">
                        </div>
                        <div
                            class="absolute -bottom-2 -left-2 w-6 h-6 bg-gradient-to-r from-green-400 to-primary-500 rounded-full animate-pulse">
                        </div>
                    </div>
                </div>

                <!-- Enhanced Content Card -->
                <div
                    class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-8 sm:p-12 mb-8">
                    <div class="mb-8">
                        <!-- Icon with gradient background -->
                        <div
                            class="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-primary-500 to-accent-600 rounded-full flex items-center justify-center shadow-lg">
                            <ExclamationTriangleIcon class="w-10 h-10 text-white" />
                        </div>

                        <h2
                            class="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent mb-4">
                            {{ $t('notFound.title') }}
                        </h2>
                        <p class="text-lg text-gray-600 dark:text-gray-300 mb-6 max-w-lg mx-auto">
                            {{ $t('notFound.description') }}
                        </p>
                    </div>

                    <!-- Action Buttons -->
                    <div class="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                        <ActionButton size="lg" @click="$router.push('/')"
                            class="bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200">
                            <HomeIcon class="w-5 h-5 mr-2" />
                            {{ $t('notFound.goHome') }}
                        </ActionButton>

                        <ActionButton variant="outline" size="lg" @click="$router.go(-1)"
                            class="border-2 border-primary-300 dark:border-primary-600 text-primary-700 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 transform hover:-translate-y-0.5 transition-all duration-200">
                            <ArrowLeftIcon class="w-5 h-5 mr-2" />
                            {{ $t('notFound.goBack') }}
                        </ActionButton>
                    </div>
                </div>

                <!-- Enhanced Navigation Links -->
                <div
                    class="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-lg border border-gray-200/30 dark:border-gray-700/30 p-6 sm:p-8">
                    <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center justify-center">
                        <SparklesIcon class="w-6 h-6 mr-2 text-yellow-500" />
                        {{ $t('notFound.maybeYouLookingFor') }}
                    </h3>

                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <router-link to="/forum"
                            class="group flex flex-col items-center p-4 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 border border-primary-200/50 dark:border-primary-700/50 hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200">
                            <ChatBubbleLeftIcon
                                class="w-8 h-8 text-primary-600 dark:text-primary-400 mb-2 group-hover:scale-110 transition-transform duration-200" />
                            <span class="font-medium text-gray-900 dark:text-white">{{ $t('notFound.forum') }}</span>
                        </router-link>

                        <router-link to="/products"
                            class="group flex flex-col items-center p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border border-green-200/50 dark:border-green-700/50 hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200">
                            <ShoppingBagIcon
                                class="w-8 h-8 text-green-600 dark:text-green-400 mb-2 group-hover:scale-110 transition-transform duration-200" />
                            <span class="font-medium text-gray-900 dark:text-white">{{ $t('notFound.products') }}</span>
                        </router-link>

                        <router-link v-if="!authStore.isAuthenticated" to="/login"
                            class="group flex flex-col items-center p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border border-purple-200/50 dark:border-purple-700/50 hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200">
                            <UserIcon
                                class="w-8 h-8 text-purple-600 dark:text-purple-400 mb-2 group-hover:scale-110 transition-transform duration-200" />
                            <span class="font-medium text-gray-900 dark:text-white">{{ $t('notFound.login') }}</span>
                        </router-link>

                        <router-link v-else to="/profile"
                            class="group flex flex-col items-center p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border border-purple-200/50 dark:border-purple-700/50 hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200">
                            <UserCircleIcon
                                class="w-8 h-8 text-purple-600 dark:text-purple-400 mb-2 group-hover:scale-110 transition-transform duration-200" />
                            <span class="font-medium text-gray-900 dark:text-white">{{ $t('notFound.profile') }}</span>
                        </router-link>

                        <router-link to="/bikes"
                            class="group flex flex-col items-center p-4 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 border border-orange-200/50 dark:border-orange-700/50 hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200">
                            <CogIcon
                                class="w-8 h-8 text-orange-600 dark:text-orange-400 mb-2 group-hover:scale-110 transition-transform duration-200" />
                            <span class="font-medium text-gray-900 dark:text-white">{{ $t('notFound.bikes') }}</span>
                        </router-link>
                    </div>
                </div>

                <!-- Fun Easter Egg -->
                <div class="mt-8 text-center">
                    <p class="text-sm text-gray-500 dark:text-gray-400 italic">
                        {{ $t('notFound.easterEgg') }}
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth';
import { useNavbarStore } from '@/stores/ui/navbar';
import ActionButton from '@/components/common/buttons/ActionButton.vue';
import {
    ExclamationTriangleIcon,
    HomeIcon,
    ArrowLeftIcon,
    SparklesIcon,
    ChatBubbleLeftIcon,
    ShoppingBagIcon,
    UserIcon,
    UserCircleIcon,
    CogIcon
} from '@heroicons/vue/24/outline';

const authStore = useAuthStore();
const navbarStore = useNavbarStore();
</script>
