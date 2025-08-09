<template>
    <nav :class="[
        'bg-white/95 dark:bg-gray-800/95 backdrop-blur-md shadow-sm border-b border-gray-200/50 dark:border-gray-700/50 fixed top-0 left-0 right-0 z-40 transition-all duration-300 ease-out',
        navbarStore.isVisible ? 'translate-y-0' : '-translate-y-full',
        navbarStore.isAtTop ? 'bg-white/95 dark:bg-gray-800/95' : 'bg-white/98 dark:bg-gray-800/98 shadow-md'
    ]">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16">
                <!-- Left side - Logo and main nav -->
                <div class="flex">
                    <!-- Logo -->
                    <div class="flex-shrink-0 flex items-center">
                        <RouterLink to="/" class="flex items-center gap-2">
                            <div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                                <span class="text-white font-bold text-sm">MD</span>
                            </div>
                            <span
                                class="hidden sm:block text-xl font-bold text-gray-900 dark:text-white">Motordash</span>
                        </RouterLink>
                    </div>

                    <!-- Desktop Navigation -->
                    <div class="hidden md:ml-8 md:flex md:space-x-6 lg:space-x-8">
                        <RouterLink to="/"
                            class="inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 transition-colors duration-200"
                            :class="$route.name === 'Home'
                                ? 'text-primary-600 dark:text-primary-400 border-primary-500'
                                : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'">
                            {{ $t('nav.home') }}
                        </RouterLink>
                        <RouterLink to="/forum"
                            class="inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 transition-colors duration-200"
                            :class="$route.name?.startsWith('Forum') || $route.name === 'Topic' || $route.name === 'ForumCategories'
                                ? 'text-primary-600 dark:text-primary-400 border-primary-500'
                                : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'">
                            {{ $t('nav.forum') }}
                        </RouterLink>
                        <RouterLink to="/bikes"
                            class="inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 transition-colors duration-200"
                            :class="$route.name === 'BikeGallery' || $route.name === 'BikeDetail'
                                ? 'text-primary-600 dark:text-primary-400 border-primary-500'
                                : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'">
                            {{ $t('nav.bikes') }}
                        </RouterLink>
                        <RouterLink to="/products"
                            class="inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 transition-colors duration-200"
                            :class="$route.name?.startsWith('Product')
                                ? 'text-primary-600 dark:text-primary-400 border-primary-500'
                                : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'">
                            {{ $t('nav.products') }}
                        </RouterLink>
                        <RouterLink to="/messages"
                            class="inline-flex items-center gap-2 px-1 pt-1 text-sm font-medium border-b-2 transition-colors duration-200"
                            :class="$route.name === 'Messages'
                                ? 'text-primary-600 dark:text-primary-400 border-primary-500'
                                : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'">
                            <span>{{ $t('nav.messages') }}</span>
                            <!-- Unread Messages Badge -->
                            <span v-if="authStore.isAuthenticated && messagingStore.hasUnreadMessages"
                                class="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-semibold text-white bg-red-500 rounded-full min-w-[1.125rem] h-4.5 shadow-sm">
                                {{ messagingStore.totalUnreadCount > 99 ? '99+' : messagingStore.totalUnreadCount }}
                            </span>
                        </RouterLink>
                    </div>
                </div>

                <!-- Right side - Search, Theme toggle and user menu -->
                <div class="flex items-center gap-2 sm:gap-4">
                    <!-- Search Bar - Hidden on small screens -->
                    <div class="hidden lg:block">
                        <div class="relative">
                            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MagnifyingGlassIcon class="h-5 w-5 text-gray-400 dark:text-gray-500" />
                            </div>
                            <input v-model="searchQuery" type="text" :placeholder="$t('nav.searchPlaceholder')"
                                class="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-400 dark:focus:border-primary-400 transition-colors"
                                @keydown.enter="handleSearch" />
                        </div>
                    </div>

                    <!-- Theme Toggle -->
                    <ThemeToggle />

                    <!-- User Menu -->
                    <div v-if="authStore.isAuthenticated" class="relative">
                        <button @click="toggleUserMenu"
                            class="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                            type="button">
                            <img v-if="authStore.userAvatar" :src="authStore.userAvatar"
                                :alt="authStore.userDisplayName" class="w-8 h-8 rounded-full" />
                            <div v-else class="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                                <span class="text-white text-sm font-medium">
                                    {{ authStore.userDisplayName.charAt(0).toUpperCase() }}
                                </span>
                            </div>
                            <ChevronDownIcon class="hidden sm:block w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </button>

                        <!-- User Dropdown -->
                        <Transition enter-active-class="transition ease-out duration-100"
                            enter-from-class="transform opacity-0 scale-95"
                            enter-to-class="transform opacity-100 scale-100"
                            leave-active-class="transition ease-in duration-75"
                            leave-from-class="transform opacity-100 scale-100"
                            leave-to-class="transform opacity-0 scale-95">
                            <div v-if="showUserMenu"
                                class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50"
                                @click="showUserMenu = false">
                                <div class="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                                    <p class="text-sm font-medium text-gray-900 dark:text-white">{{
                                        authStore.userDisplayName }}</p>
                                    <p class="text-sm text-gray-500 dark:text-gray-400">{{ authStore.user?.email }}</p>
                                </div>
                                <RouterLink to="/profile"
                                    class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <UserIcon class="w-4 h-4" />
                                    {{ $t('nav.profile') }}
                                </RouterLink>
                                <hr class="my-1 border-gray-100 dark:border-gray-700" />
                                <button @click="handleLogout"
                                    class="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                                    type="button">
                                    <ArrowRightOnRectangleIcon class="w-4 h-4" />
                                    {{ $t('nav.signOut') }}
                                </button>
                            </div>
                        </Transition>
                    </div>

                    <!-- Login/Register buttons -->
                    <div v-else class="hidden sm:flex sm:items-center sm:gap-2">
                        <RouterLink to="/login"
                            class="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200">
                            {{ $t('nav.login') }}
                        </RouterLink>
                        <RouterLink to="/register" class="btn btn-primary text-sm">
                            {{ $t('nav.signUp') }}
                        </RouterLink>
                    </div>

                    <!-- Mobile menu button -->
                    <button @click="toggleMobileMenu"
                        class="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                        type="button">
                        <Bars3Icon v-if="!showMobileMenu" class="w-6 h-6 text-gray-500 dark:text-gray-400" />
                        <XMarkIcon v-else class="w-6 h-6 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>
            </div>

            <!-- Mobile menu -->
            <Transition enter-active-class="transition ease-out duration-200" enter-from-class="opacity-0 scale-95"
                enter-to-class="opacity-100 scale-100" leave-active-class="transition ease-in duration-150"
                leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-95">
                <div v-if="showMobileMenu"
                    class="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <div class="px-2 pt-2 pb-3 space-y-1">
                        <!-- Search on mobile -->
                        <div class="px-3 pb-3">
                            <div class="relative">
                                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MagnifyingGlassIcon class="h-5 w-5 text-gray-400 dark:text-gray-500" />
                                </div>
                                <input v-model="searchQuery" type="text" :placeholder="$t('nav.searchPlaceholder')"
                                    class="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-400 dark:focus:border-primary-400"
                                    @keydown.enter="handleSearch" />
                            </div>
                        </div>

                        <!-- Navigation links -->
                        <RouterLink to="/"
                            class="block px-3 py-2 text-base font-medium rounded-lg transition-colors duration-200"
                            :class="$route.name === 'Home'
                                ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                                : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'"
                            @click="closeMobileMenu">
                            {{ $t('nav.home') }}
                        </RouterLink>
                        <RouterLink to="/forum"
                            class="block px-3 py-2 text-base font-medium rounded-lg transition-colors duration-200"
                            :class="$route.name?.startsWith('Forum') || $route.name === 'Topic' || $route.name === 'ForumCategories'
                                ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                                : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'"
                            @click="closeMobileMenu">
                            {{ $t('nav.forum') }}
                        </RouterLink>
                        <RouterLink to="/bikes"
                            class="block px-3 py-2 text-base font-medium rounded-lg transition-colors duration-200"
                            :class="$route.name === 'BikeGallery' || $route.name === 'BikeDetail'
                                ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                                : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'"
                            @click="closeMobileMenu">
                            {{ $t('nav.bikes') }}
                        </RouterLink>
                        <RouterLink to="/products"
                            class="block px-3 py-2 text-base font-medium rounded-lg transition-colors duration-200"
                            :class="$route.name?.startsWith('Product')
                                ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                                : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'"
                            @click="closeMobileMenu">
                            {{ $t('nav.products') }}
                        </RouterLink>
                        <RouterLink to="/messages"
                            class="flex items-center justify-between px-3 py-2 text-base font-medium rounded-lg transition-colors duration-200"
                            :class="$route.name === 'Messages'
                                ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                                : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'"
                            @click="closeMobileMenu">
                            <span>{{ $t('nav.messages') }}</span>
                            <!-- Unread Messages Badge -->
                            <span v-if="authStore.isAuthenticated && messagingStore.hasUnreadMessages"
                                class="inline-flex items-center justify-center px-2 py-1 text-xs font-semibold text-white bg-red-500 rounded-full min-w-[1.5rem] h-6 shadow-sm">
                                {{ messagingStore.totalUnreadCount > 99 ? '99+' : messagingStore.totalUnreadCount }}
                            </span>
                        </RouterLink>

                        <!-- User actions for mobile -->
                        <div v-if="authStore.isAuthenticated"
                            class="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                            <div class="flex items-center px-3 pb-3">
                                <img v-if="authStore.userAvatar" :src="authStore.userAvatar"
                                    :alt="authStore.userDisplayName" class="w-10 h-10 rounded-full" />
                                <div v-else
                                    class="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                                    <span class="text-white font-medium">
                                        {{ authStore.userDisplayName.charAt(0).toUpperCase() }}
                                    </span>
                                </div>
                                <div class="ml-3">
                                    <div class="text-base font-medium text-gray-800 dark:text-gray-200">{{
                                        authStore.userDisplayName }}
                                    </div>
                                    <div class="text-sm font-medium text-gray-500 dark:text-gray-400">{{
                                        authStore.user?.email }}</div>
                                </div>
                            </div>
                            <RouterLink to="/profile"
                                class="block px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                                @click="closeMobileMenu">
                                {{ $t('nav.profile') }}
                            </RouterLink>
                            <button @click="handleLogout"
                                class="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                                type="button">
                                {{ $t('nav.signOut') }}
                            </button>
                        </div>
                        <div v-else class="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4 space-y-1">
                            <RouterLink to="/login"
                                class="block px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                                @click="closeMobileMenu">
                                {{ $t('nav.login') }}
                            </RouterLink>
                            <RouterLink to="/register"
                                class="block px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                                @click="closeMobileMenu">
                                {{ $t('nav.signUp') }}
                            </RouterLink>
                        </div>
                    </div>
                </div>
            </Transition>
        </div>
    </nav>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useMessagingStore } from '@/stores/messaging';
import { useNotification } from '@/composables/useNotification';
import ThemeToggle from '@/components/common/nav/ThemeToggle.vue';
import { useNavbarStore } from '@/stores/ui/navbar';
import { useI18n } from 'vue-i18n';
import {
    MagnifyingGlassIcon,
    UserIcon,
    PlusIcon,
    ArrowRightOnRectangleIcon,
    ChevronDownIcon,
    Bars3Icon,
    XMarkIcon,
    ChatBubbleLeftRightIcon // potential future use
} from '@heroicons/vue/24/outline';

const { t } = useI18n();

const router = useRouter();
const authStore = useAuthStore();
const messagingStore = useMessagingStore();
const navbarStore = useNavbarStore();
const { success, error } = useNotification();

const searchQuery = ref('');
const showUserMenu = ref(false);
const showMobileMenu = ref(false);

const toggleUserMenu = () => {
    showUserMenu.value = !showUserMenu.value;
    showMobileMenu.value = false;
};

const closeMobileMenu = () => {
    showMobileMenu.value = false;
    navbarStore.setMobileMenuOpen(false);
};

const toggleMobileMenu = () => {
    showMobileMenu.value = !showMobileMenu.value;
    showUserMenu.value = false;
    navbarStore.setMobileMenuOpen(showMobileMenu.value);

    if (showMobileMenu.value) {
        navbarStore.forceShow()
    }
};

const handleSearch = () => {
    if (searchQuery.value.trim()) {
        router.push({
            name: 'ForumCategories',
            query: { search: searchQuery.value.trim() }
        });
        closeMobileMenu();
    }
};

const handleLogout = async () => {
    const result = await authStore.logout();
    if (result.success) {
        success(t('nav.logoutSuccess'));
        router.push('/');
    } else {
        error(result.message);
    }
    showUserMenu.value = false;
    closeMobileMenu();
};

// Close menus when clicking outside
const handleClickOutside = (event) => {
    if (!event.target.closest('.relative')) {
        showUserMenu.value = false;
    }
};

// Optimized scroll handler with RAF throttling
let rafId = null
const handleScroll = () => {
    if (rafId) return

    rafId = requestAnimationFrame(() => {
        const currentScrollY = window.scrollY
        navbarStore.updateScroll(currentScrollY)

        // Close mobile menu when scrolling significantly
        const scrollDiff = Math.abs(currentScrollY - navbarStore.lastScrollY)
        if (showMobileMenu.value && scrollDiff > 50) {
            showMobileMenu.value = false
            navbarStore.setMobileMenuOpen(false)
        }

        rafId = null
    })
}

onMounted(() => {
    document.addEventListener('click', handleClickOutside);
    window.addEventListener('scroll', handleScroll, { passive: true });
    navbarStore.reset()
});

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
    window.removeEventListener('scroll', handleScroll);
    if (rafId) {
        cancelAnimationFrame(rafId)
    }
});
</script>
