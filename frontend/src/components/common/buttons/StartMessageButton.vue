<template>
    <ActionButton @click="startConversation" :loading="loading" :disabled="disabled || authStore.user?.uid === userId"
        variant="primary" size="sm" class="flex items-center space-x-2">
        <ChatBubbleLeftIcon class="w-4 h-4" />
        <span>Message</span>
    </ActionButton>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useApi } from '@/composables/useApi';
import { useNotificationStore } from '@/stores/notification';
import { apiService } from '@/services/api.service';
import ActionButton from '@/components/common/buttons/ActionButton.vue';
import { ChatBubbleLeftIcon } from '@heroicons/vue/24/outline';

const props = defineProps({
    userId: {
        type: String,
        required: true
    },
    userName: {
        type: String,
        default: 'User'
    },
    disabled: {
        type: Boolean,
        default: false
    }
});

const router = useRouter();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();
const { loading, execute } = useApi();

const isOwnProfile = computed(() => authStore.user?.uid === props.userId);

const startConversation = async () => {
    if (!authStore.user) {
        router.push('/login');
        return;
    }

    if (isOwnProfile.value) {
        notificationStore.warning('Invalid Action', 'You cannot message yourself');
        return;
    }

    const result = await execute(() =>
        apiService.post('/messages/start', {
            receiverId: props.userId
        })
    );

    if (result) {
        // Navigate to messages with the conversation selected
        router.push({
            path: '/messages',
            query: { conversation: result.id }
        });
    }
};
</script>