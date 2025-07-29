<template>
    <div
        class="fixed inset-0 flex items-end justify-center px-4 py-6 pointer-events-none sm:p-6 sm:items-start sm:justify-end z-50">
        <TransitionGroup name="notification" tag="div" class="w-full flex flex-col items-center space-y-4 sm:items-end">
            <div v-for="notification in notifications" :key="notification.id"
                class="max-w-sm w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 dark:ring-gray-600 dark:ring-opacity-20 overflow-hidden">
                <div class="p-4">
                    <div class="flex items-start">
                        <div class="flex-shrink-0">
                            <!-- Success Icon -->
                            <CheckCircleIcon v-if="notification.type === 'success'" class="h-6 w-6 text-green-400"
                                aria-hidden="true" />
                            <!-- Error Icon -->
                            <ExclamationCircleIcon v-else-if="notification.type === 'error'"
                                class="h-6 w-6 text-red-400" aria-hidden="true" />
                            <!-- Warning Icon -->
                            <ExclamationTriangleIcon v-else-if="notification.type === 'warning'"
                                class="h-6 w-6 text-yellow-400" aria-hidden="true" />
                            <!-- Info Icon -->
                            <InformationCircleIcon v-else class="h-6 w-6 text-primary-400" aria-hidden="true" />
                        </div>
                        <div class="ml-3 w-0 flex-1 pt-0.5">
                            <p class="text-sm font-medium text-gray-900 dark:text-white">
                                {{ notification.title }}
                            </p>
                            <p v-if="notification.message" class="mt-1 text-sm text-gray-500 dark:text-gray-300">
                                {{ notification.message }}
                            </p>
                        </div>
                        <div class="ml-4 flex-shrink-0 flex">
                            <button @click="removeNotification(notification.id)"
                                class="bg-white dark:bg-gray-800 rounded-md inline-flex text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-primary-400 dark:focus:ring-offset-gray-800">
                                <span class="sr-only">Close</span>
                                <XMarkIcon class="h-5 w-5" aria-hidden="true" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </TransitionGroup>
    </div>
</template>

<script setup>
import { storeToRefs } from 'pinia';
import { useNotificationStore } from '@/stores/notification';
import {
    CheckCircleIcon,
    ExclamationCircleIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
    XMarkIcon
} from '@heroicons/vue/24/outline';

const notificationStore = useNotificationStore();
const { notifications } = storeToRefs(notificationStore);
const { removeNotification } = notificationStore;
</script>

<style scoped>
.notification-enter-active,
.notification-leave-active {
    transition: all 0.3s ease;
}

.notification-enter-from {
    opacity: 0;
    transform: translateX(100%);
}

.notification-leave-to {
    opacity: 0;
    transform: translateX(100%);
}

.notification-move {
    transition: transform 0.3s ease;
}
</style>
