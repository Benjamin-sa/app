<template>
    <div class="relative">
        <!-- Button already has dark mode classes -->
        <button @click="toggleDropdown" class="p-2 rounded-lg transition-colors duration-200" :class="[
            isCurrentlyDark
                ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        ]">

            <!-- Sun icon for light mode -->
            <SunIcon v-if="!isCurrentlyDark" class="w-5 h-5" />
            <!-- Moon icon for dark mode -->
            <MoonIcon v-else class="w-5 h-5" />
        </button>

        <!-- Dropdown already has dark mode classes -->
        <Transition enter-active-class="transition ease-out duration-100"
            enter-from-class="transform opacity-0 scale-95" enter-to-class="transform opacity-100 scale-100"
            leave-active-class="transition ease-in duration-75" leave-from-class="transform opacity-100 scale-100"
            leave-to-class="transform opacity-0 scale-95">
            <div v-if="showDropdown" class="absolute right-0 mt-2 w-48 rounded-lg shadow-lg border z-50" :class="[
                isCurrentlyDark
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-white border-gray-200'
            ]" @click="showDropdown = false">

                <div class="py-1">
                    <!-- Light Mode -->
                    <button @click="setTheme('light')"
                        class="flex items-center gap-3 w-full px-4 py-2 text-sm transition-colors" :class="[
                            preference === 'light'
                                ? (isCurrentlyDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900')
                                : (isCurrentlyDark ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-700 hover:bg-gray-100')
                        ]" type="button">
                        <SunIcon class="w-4 h-4" />
                        Light
                        <CheckIcon v-if="preference === 'light'" class="w-4 h-4 ml-auto" />
                    </button>

                    <!-- Dark Mode -->
                    <button @click="setTheme('dark')"
                        class="flex items-center gap-3 w-full px-4 py-2 text-sm transition-colors" :class="[
                            preference === 'dark'
                                ? (isCurrentlyDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900')
                                : (isCurrentlyDark ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-700 hover:bg-gray-100')
                        ]" type="button">
                        <MoonIcon class="w-4 h-4" />
                        Dark
                        <CheckIcon v-if="preference === 'dark'" class="w-4 h-4 ml-auto" />
                    </button>

                    <!-- System Mode -->
                    <button @click="setTheme('system')"
                        class="flex items-center gap-3 w-full px-4 py-2 text-sm transition-colors" :class="[
                            preference === 'system'
                                ? (isCurrentlyDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900')
                                : (isCurrentlyDark ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-700 hover:bg-gray-100')
                        ]" type="button">
                        <ComputerDesktopIcon class="w-4 h-4" />
                        System
                        <CheckIcon v-if="preference === 'system'" class="w-4 h-4 ml-auto" />
                    </button>
                </div>
            </div>
        </Transition>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useThemeStore } from '@/stores/theme';
import {
    SunIcon,
    MoonIcon,
    ComputerDesktopIcon,
    CheckIcon
} from '@heroicons/vue/24/outline';

const themeStore = useThemeStore();
const showDropdown = ref(false);

// Computed properties from store
const { isCurrentlyDark, preference } = themeStore;
const { setTheme } = themeStore;

const toggleDropdown = () => {
    showDropdown.value = !showDropdown.value;
};

const getButtonTitle = () => {
    if (preference === 'system') {
        return `System theme (currently ${isCurrentlyDark ? 'dark' : 'light'})`;
    }
    return `Switch to ${isCurrentlyDark ? 'light' : 'dark'} mode`;
};

// Close dropdown when clicking outside
const handleClickOutside = (event) => {
    if (!event.target.closest('.relative')) {
        showDropdown.value = false;
    }
};

onMounted(() => {
    document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
});
</script>
