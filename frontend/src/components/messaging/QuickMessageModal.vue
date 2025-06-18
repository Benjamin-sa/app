<template>
    <Modal :show="show" @close="$emit('close')" title="Send Message">
        <form @submit.prevent="sendMessage" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    To: {{ userName }}
                </label>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Message
                </label>
                <textarea v-model="message" rows="4"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
                    placeholder="Type your message here..." required></textarea>
            </div>

            <div class="flex justify-end space-x-3">
                <ActionButton type="button" @click="$emit('close')" variant="ghost">
                    Cancel
                </ActionButton>
                <ActionButton type="submit" :loading="loading" :disabled="!message.trim()">
                    Send Message
                </ActionButton>
            </div>
        </form>
    </Modal>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useApi } from '@/composables/useApi';
import { useNotificationStore } from '@/stores/notification';
import { apiService } from '@/services/api.service';
import Modal from '@/components/common/Modal.vue';
import ActionButton from '@/components/common/buttons/ActionButton.vue';

const props = defineProps({
    show: Boolean,
    userId: String,
    userName: String
});

const emit = defineEmits(['close', 'sent']);

const router = useRouter();
const notificationStore = useNotificationStore();
const { loading, execute } = useApi();

const message = ref('');

const sendMessage = async () => {
    const result = await execute(() =>
        apiService.post('/messages/start', {
            receiverId: props.userId,
            initialMessage: message.value.trim()
        })
    );

    if (result) {
        notificationStore.success('Message Sent', 'Your message has been sent successfully');
        message.value = '';
        emit('sent', result);
        emit('close');

        // Optionally navigate to the conversation
        router.push({
            path: '/messages',
            query: { conversation: result.id }
        });
    }
};
</script>