<template>
    <div class="max-w-7xl mx-auto px-4 py-8" :style="{ paddingTop: `${navbarStore.effectiveNavbarHeight + 32}px` }">
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden h-[calc(100vh-200px)] flex">
            <!-- Conversations Sidebar -->
            <div class="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                <!-- Add loading and error states for conversations -->
                <div v-if="messagingStore.loadingConversations" class="flex-1 flex items-center justify-center">
                    <div class="animate-pulse space-y-3 w-full p-4">
                        <div v-for="i in 5" :key="i" class="flex space-x-3">
                            <div class="rounded-full bg-gray-200 dark:bg-gray-700 h-10 w-10"></div>
                            <div class="flex-1 space-y-2">
                                <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                                <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <ConversationList v-else :conversations="conversations"
                    :selected-conversation-id="selectedConversation?.id" @select-conversation="selectConversation" />
            </div>

            <!-- Message Thread -->
            <div class="flex-1 flex flex-col">
                <MessageThread v-if="selectedConversation" :conversation-id="selectedConversation.id"
                    :conversation="selectedConversation" @message-sent="handleMessageSent" />

                <div v-else class="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
                    <div class="text-center space-y-4">
                        <div
                            class="bg-gray-100 dark:bg-gray-700 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                            <ChatBubbleLeftIcon class="w-8 h-8 text-gray-400" />
                        </div>
                        <div>
                            <h3 class="text-lg font-medium mb-2">Welcome to Messages</h3>
                            <p class="text-sm text-gray-600 dark:text-gray-400 max-w-sm">
                                Select a conversation from the sidebar to start messaging, or visit someone's profile to
                                start a new conversation.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useNavbarStore } from '@/stores/navbar';
import { useMessagingStore } from '@/stores/messaging';
import ConversationList from '@/components/messaging/ConversationList.vue';
import MessageThread from '@/components/messaging/MessageThread.vue';
import { ChatBubbleLeftIcon } from '@heroicons/vue/24/outline';

const route = useRoute();
const router = useRouter();
const navbarStore = useNavbarStore();
const messagingStore = useMessagingStore();

const selectedConversation = ref(null);

// Get conversations from the store
const conversations = computed(() => messagingStore.getConversationsList);

const loadConversations = async () => {
    const result = await messagingStore.loadConversations();

    if (result && result.length > 0) {
        // Auto-select conversation if coming from a profile or specific conversation
        const conversationId = route.query.conversation;
        const startConversation = route.query.startConversation;

        if (conversationId) {
            const conversation = result.find(c => c.id === conversationId);
            if (conversation) {
                selectedConversation.value = conversation;
            }
        } else if (startConversation) {
            // Check if conversation already exists with this user
            const existingConversation = result.find(c =>
                c.participants.includes(startConversation)
            );

            if (existingConversation) {
                selectedConversation.value = existingConversation;
            } else {
                // Create new conversation
                await createNewConversation(startConversation);
            }
        }
    }
};

const createNewConversation = async (receiverId) => {
    try {
        // Send a welcome message to create the conversation
        const result = await messagingStore.sendMessage(receiverId, "Hi! 👋");

        if (result) {
            // Reload conversations and select the new one
            await messagingStore.loadConversations();
            const newConversation = messagingStore.getConversation(result.conversationId);
            if (newConversation) {
                selectedConversation.value = newConversation;
            }

            // Clear the query parameter to avoid recreating the conversation
            router.replace({
                path: route.path,
                query: { conversation: result.conversationId }
            });
        }
    } catch (error) {
        console.error('Failed to create new conversation:', error);
    }
};

const selectConversation = (conversation) => {
    selectedConversation.value = conversation;

    // Update URL to reflect selected conversation
    router.replace({
        path: route.path,
        query: { conversation: conversation.id }
    });
};

const handleMessageSent = (message) => {
    // The messaging store handles updating conversation state
    // No need to manually update here since it's reactive
};

// Watch for route changes to handle deep linking
watch(() => route.query, () => {
    if (conversations.value.length > 0) {
        const conversationId = route.query.conversation;
        if (conversationId) {
            const conversation = conversations.value.find(c => c.id === conversationId);
            if (conversation) {
                selectedConversation.value = conversation;
            }
        }
    }
}, { deep: true });

onMounted(() => {
    loadConversations();
});
</script>