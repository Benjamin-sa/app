<template>
    <button @click="toggleTheme" class="p-2 rounded-lg transition-colors duration-200" :class="[
        currentTheme === 'dark'
            ? 'text-gray-300 hover:text-white hover:bg-gray-700'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
    ]" :title="`Current theme: ${preference}`">

        <!-- Sun icon for light mode -->
        <SunIcon v-if="preference === 'light'" class="w-5 h-5" />
        <!-- Moon icon for dark mode -->
        <MoonIcon v-else-if="preference === 'dark'" class="w-5 h-5" />
        <!-- Computer icon for system mode -->
        <ComputerDesktopIcon v-else class="w-5 h-5" />
    </button>
</template>

<script setup>
import { useThemeStore } from '@/stores/ui/theme';
import {
    SunIcon,
    MoonIcon,
    ComputerDesktopIcon
} from '@heroicons/vue/24/outline';

const themeStore = useThemeStore();

// Use the store's reactive properties directly
const { currentTheme, preference, toggleTheme } = themeStore;
</script>
