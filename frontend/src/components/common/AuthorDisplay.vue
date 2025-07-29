<template>
    <div class="flex items-center space-x-2">
        <!-- Loading state -->
        <LoadingSection v-if="loading" message="Loading Author..." />

        <!-- Author display -->
        <template v-else-if="displayData">
            <div class="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity duration-200"
                @click="navigateToProfile">
                <img v-if="displayData.avatar" :src="displayData.avatar" :alt="displayData.displayName"
                    :class="avatarClass">
                <div v-else :class="avatarFallbackClass">
                    {{ displayData.displayName?.charAt(0).toUpperCase() }}
                </div>
                <span v-if="showName" :class="nameClass">
                    {{ displayData.displayName }}
                </span>
            </div>
        </template>

        <!-- Fallback for missing author -->
        <template v-else-if="showFallback">
            <div class="flex items-center space-x-2">
                <div :class="avatarFallbackClass">
                    ?
                </div>
                <span v-if="showName" :class="nameClass">
                    Unknown User
                </span>
            </div>
        </template>
    </div>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useUsersStore } from '@/stores/users';
import LoadingSection from './sections/LoadingSection.vue';

const props = defineProps({
    userId: {
        type: String,
        required: true
    },
    size: {
        type: String,
        default: 'sm', // sm, md, lg
        validator: (value) => ['sm', 'md', 'lg'].includes(value)
    },
    showName: {
        type: Boolean,
        default: true
    },
    showFallback: {
        type: Boolean,
        default: true
    }
});

const router = useRouter();
const authStore = useAuthStore();
const usersStore = useUsersStore();

// Computed properties for display data
const isCurrentUser = computed(() => {
    return props.userId === authStore.user?.uid;
});

const loading = computed(() => {
    return !isCurrentUser.value && usersStore.isUserLoading(props.userId);
});

const displayData = computed(() => {
    if (!props.userId) return null;

    // If this is the current user, use auth store data
    if (isCurrentUser.value && authStore.user) {
        return {
            displayName: authStore.userDisplayName,
            avatar: authStore.userAvatar
        };
    }

    // For other users, get from users store
    const userData = usersStore.getUserFromCache(props.userId);
    if (userData) {
        return {
            displayName: usersStore.getUserDisplayName(props.userId),
            avatar: usersStore.getUserAvatar(props.userId)
        };
    }

    return null;
});

// Computed classes based on size prop
const avatarClass = computed(() => {
    const baseClasses = 'rounded-full object-cover';
    const sizeClasses = {
        sm: 'w-6 h-6',
        md: 'w-8 h-8',
        lg: 'w-12 h-12'
    };
    return `${baseClasses} ${sizeClasses[props.size]}`;
});

const avatarFallbackClass = computed(() => {
    const baseClasses = 'rounded-full bg-primary-500 dark:bg-primary-600 flex items-center justify-center text-white font-medium';
    const sizeClasses = {
        sm: 'w-6 h-6 text-xs',
        md: 'w-8 h-8 text-sm',
        lg: 'w-12 h-12 text-lg'
    };
    return `${baseClasses} ${sizeClasses[props.size]}`;
});

const nameClass = computed(() => {
    const baseClasses = 'font-medium text-gray-900 dark:text-gray-100';
    const sizeClasses = {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg'
    };
    return `${baseClasses} ${sizeClasses[props.size]}`;
});

const navigateToProfile = () => {
    if (!props.userId) return;

    // Navigate to user profile
    if (isCurrentUser.value) {
        // Navigate to own profile
        router.push('/profile');
    } else {
        // Navigate to other user's profile
        router.push(`/user/${props.userId}`);
    }
};

const fetchUserData = async () => {
    if (!props.userId) return;

    // Skip if this is the current user (handled by auth store)
    if (isCurrentUser.value) return;

    // Fetch user data through the users store
    await usersStore.getUser(props.userId);
};

// Watch for userId changes
watch(() => props.userId, () => {
    fetchUserData();
}, { immediate: true });

// Watch for current user changes to update display
watch(() => authStore.user, () => {
    if (isCurrentUser.value) {
        // Current user data updated, no need to fetch
        return;
    }
}, { deep: true });

onMounted(() => {
    fetchUserData();
});
</script>
