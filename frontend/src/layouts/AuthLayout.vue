<template>
    <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div class="max-w-md w-full space-y-8">
            <!-- Header Slot -->
            <div>
                <slot name="header" />
            </div>

            <!-- Form Slot -->
            <slot name="form" />

            <!-- Social Login Slot -->
            <div v-if="$slots.social" class="mt-6">
                <div class="relative">
                    <div class="absolute inset-0 flex items-center">
                        <div class="w-full border-t border-gray-300 dark:border-gray-600" />
                    </div>
                    <div class="relative flex justify-center text-sm">
                        <span class="px-2 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                            Or continue with
                        </span>
                    </div>
                </div>

                <div class="mt-6">
                    <slot name="social" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
// No props needed - this is a pure layout component
</script>
