<template>
    <ActionButton @click="startConversation" :loading="loading" :disabled="disabled || authStore.user?.uid === userId"
        variant="primary" size="sm" class="flex items-center space-x-2">
        <ChatBubbleLeftIcon class="w-4 h-4" />
        <span>Message</span>
    </ActionButton>

    <!-- Message Composer Modal -->
    <Modal v-model="showMessageModal" :title="`Send message to ${userName}`" size="lg">
        <div class="space-y-4">
            <div>
                <label for="message-content" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Your message
                </label>
                <textarea id="message-content" v-model="messageContent" rows="4"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white resize-none"
                    placeholder="Type your message here..." @keydown.ctrl.enter="sendMessage"
                    @keydown.meta.enter="sendMessage"></textarea>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Press Ctrl+Enter (Cmd+Enter on Mac) to send
                </p>
            </div>
        </div>

        <template #footer>
            <div class="flex justify-end space-x-3">
                <ActionButton @click="showMessageModal = false" variant="outline">
                    Cancel
                </ActionButton>
                <ActionButton @click="sendMessage" :loading="sendingMessage" :disabled="!messageContent.trim()"
                    variant="primary">
                    Send Message
                </ActionButton>
            </div>
        </template>
    </Modal>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useMessagingStore } from '@/stores/messaging';
import { useApi } from '@/composables/useApi';
import { useNotificationStore } from '@/stores/ui/notification';
import ActionButton from '@/components/common/buttons/ActionButton.vue';
import Modal from '@/components/common/Modal.vue';
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
const messagingStore = useMessagingStore();
const notificationStore = useNotificationStore();
const { loading, execute } = useApi();

// Modal state
const showMessageModal = ref(false);
const messageContent = ref('');
const sendingMessage = ref(false);

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

    // Check if thread already exists
    const existingThread = messagingStore.threadsList.find(thread =>
        thread.participants.includes(props.userId)
    );

    if (existingThread) {
        // Navigate to existing thread
        router.push({
            path: '/messages',
            query: { conversation: existingThread.id }
        });
    } else {
        // Show modal to compose first message
        messageContent.value = '';
        showMessageModal.value = true;
    }
};

const sendMessage = async () => {
    if (!messageContent.value.trim()) return;

    sendingMessage.value = true;
    try {
        // Send the custom message to create the thread
        const message = await messagingStore.sendMessage(props.userId, messageContent.value.trim());

        if (message && message.threadId) {
            // Close modal and navigate to the new thread
            showMessageModal.value = false;
            router.push({
                path: '/messages',
                query: { conversation: message.threadId }
            });
        }
    } catch (error) {
        console.error('Failed to send message:', error);
        notificationStore.error('Failed to send message', 'Please try again later');
    } finally {
        sendingMessage.value = false;
    }
};
</script>