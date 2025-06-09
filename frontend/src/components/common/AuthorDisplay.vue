<template>
    <div class="flex items-center space-x-2">
        <!-- Loading state -->
        <div v-if="loading" class="animate-pulse flex items-center space-x-2">
            <div class="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
            <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
        </div>

        <!-- Author display -->
        <template v-else-if="author">
            <img v-if="author.avatar" :src="author.avatar" :alt="author.displayName || author.username"
                :class="avatarClass">
            <div v-else :class="avatarFallbackClass">
                {{ (author.displayName || author.username)?.charAt(0).toUpperCase() }}
            </div>
            <span :class="nameClass">
                {{ author.displayName || author.username }}
            </span>
        </template>

        <!-- Fallback for missing author -->
        <template v-else>
            <div :class="avatarFallbackClass">
                ?
            </div>
            <span :class="nameClass">
                Unknown User
            </span>
        </template>
    </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { apiService } from '@/services/api.service';

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
    showFallback: {
        type: Boolean,
        default: true
    }
});

const authStore = useAuthStore();
const author = ref(null);
const loading = ref(false);

// Simple in-memory cache for user data to avoid repeated API calls
const userCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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

const isCurrentUser = computed(() => {
    return props.userId === authStore.user?.uid;
});

const fetchAuthor = async () => {
    if (!props.userId) {
        author.value = null;
        return;
    }

    // If this is the current user, use AuthStore data
    if (isCurrentUser.value && authStore.user) {
        author.value = authStore.user;
        return;
    }

    // Check cache first
    const cached = userCache.get(props.userId);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
        author.value = cached.data;
        return;
    }

    try {
        loading.value = true;
        const response = await apiService.get(`/forum/users/profile/${props.userId}`);
        const userData = response.data;

        // Cache the result
        userCache.set(props.userId, {
            data: userData,
            timestamp: Date.now()
        });

        author.value = userData;
    } catch (error) {
        console.error('Error fetching author:', error);
        author.value = null;
    } finally {
        loading.value = false;
    }
};

// Watch for userId changes
watch(() => props.userId, () => {
    fetchAuthor();
});

// Watch for current user changes to update display
watch(() => authStore.user, (newUser) => {
    if (isCurrentUser.value && newUser) {
        author.value = newUser;
    }
}, { deep: true });

onMounted(() => {
    fetchAuthor();
});
</script>
