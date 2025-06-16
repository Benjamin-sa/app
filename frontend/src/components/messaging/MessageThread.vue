<template>
    <div class="flex flex-col h-full">
        <!-- Messages -->
        <div ref="messagesContainer" class="flex-1 overflow-y-auto p-4 space-y-4">
            <div v-for="message in messages" :key="message.id"
                :class="['flex', message.senderId === authStore.user?.uid ? 'justify-end' : 'justify-start']">

                <div :class="[
                    'max-w-xs lg:max-w-md px-4 py-2 rounded-lg',
                    message.senderId === authStore.user?.uid
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                ]">
                    <p class="text-sm" v-html="formatContent(message.content)"></p>
                    <p class="text-xs opacity-75 mt-1">
                        {{ formatDate(message.createdAt) }}
                    </p>
                </div>
            </div>
        </div>

        <!-- Message Input -->
        <div class="border-t border-gray-200 dark:border-gray-700 p-4">
            <form @submit.prevent="sendMessage" class="flex space-x-3">
                <input v-model="newMessage" type="text" placeholder="Type your message..."
                    class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
                    :disabled="loading" />

                <ActionButton type="submit" :loading="loading" :disabled="!newMessage.trim()">
                    Send
                </ActionButton>
            </form>
        </div>
    </div>
</template>

<script setup>
import { ref, nextTick, watch, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useApi } from '@/composables/useApi';
import { apiService } from '@/services/api.service';
import { formatDate, formatContent } from '@/utils/helpers';
import ActionButton from '@/components/common/buttons/ActionButton.vue';

const props = defineProps({
    conversationId: {
        type: String,
        required: true
    },
    conversation: {
        type: Object,
        required: true
    }
});

const emit = defineEmits(['message-sent']);

const authStore = useAuthStore();
const { loading, execute } = useApi();

const messages = ref([]);
const newMessage = ref('');
const messagesContainer = ref(null);

const loadMessages = async () => {
    const result = await execute(() =>
        apiService.get(`/messages/conversations/${props.conversationId}`)
    );

    if (result) {
        messages.value = result.messages.reverse(); // Reverse to show oldest first
        await nextTick();
        scrollToBottom();
    }
};

const sendMessage = async () => {
    if (!newMessage.value.trim()) return;

    const messageContent = newMessage.value.trim();
    newMessage.value = '';

    const result = await execute(() =>
        apiService.post('/messages', {
            receiverId: getOtherParticipant(),
            content: messageContent
        })
    );

    if (result) {
        messages.value.push(result);
        emit('message-sent', result);
        await nextTick();
        scrollToBottom();
    }
};

const getOtherParticipant = () => {
    if (!props.conversation?.participants) return null;

    return props.conversation.participants.find(
        participantId => participantId !== authStore.user?.uid
    );
};

const scrollToBottom = () => {
    if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
};

// Watch for conversation changes
watch(() => props.conversationId, loadMessages, { immediate: true });
</script>