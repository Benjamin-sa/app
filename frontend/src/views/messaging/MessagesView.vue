<template>
    <div class="max-w-7xl mx-auto px-4 py-8" :style="{ paddingTop: `${navbarStore.effectiveNavbarHeight + 32}px` }">
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden h-[calc(100vh-200px)] flex">
            <!-- Conversations Sidebar - Hidden on mobile when thread is selected -->
            <div :class="[
                'border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300',
                'w-full md:w-80',
                selectedThread && isMobile ? 'hidden' : 'flex'
            ]">
                <!-- Add loading and error states for threads -->
                <div v-if="messagingStore.loading.threads" class="flex-1 flex items-center justify-center">
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

                <!-- Debug info - temporary -->
                <div v-else-if="threads.length === 0"
                    class="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg m-4">
                    <div class="text-sm text-yellow-800 dark:text-yellow-200">
                        <p><strong>Debug Info:</strong></p>
                        <p>Threads count: {{ threads.length }}</p>
                        <p>Loading: {{ messagingStore.loading.threads }}</p>
                        <p>Auth user: {{ authStore.user?.uid || 'Not authenticated' }}</p>
                        <p>Total unread: {{ messagingStore.totalUnreadCount }}</p>
                    </div>
                </div>

                <ConversationList v-else :conversations="threads" :selected-conversation-id="selectedThread?.id"
                    @select-conversation="selectThread" />
            </div>

            <!-- Message Thread - Full width on mobile when thread is selected -->
            <div :class="[
                'flex flex-col transition-all duration-300',
                selectedThread && isMobile ? 'w-full' : 'flex-1',
                !selectedThread && isMobile ? 'hidden' : 'flex'
            ]">
                <MessageThread v-if="selectedThread" :conversation-id="selectedThread.id" :conversation="selectedThread"
                    @message-sent="handleMessageSent" @back="handleBackToThreads" />

                <div v-else class="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
                    <div class="text-center space-y-4">
                        <div
                            class="bg-gray-100 dark:bg-gray-700 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                            <ChatBubbleLeftIcon class="w-8 h-8 text-gray-400" />
                        </div>
                        <div>
                            <h3 class="text-lg font-medium mb-2">Welcome to Messages</h3>
                            <p class="text-sm text-gray-600 dark:text-gray-400 max-w-sm">
                                Select a thread from the sidebar to start messaging, or visit someone's profile to
                                start a new thread.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useNavbarStore } from '@/stores/ui/navbar';
import { useMessagingStore } from '@/stores/messaging';
import { useAuthStore } from '@/stores/auth';
import ConversationList from '@/components/messaging/ConversationList.vue';
import MessageThread from '@/components/messaging/MessageThread.vue';
import { ChatBubbleLeftIcon } from '@heroicons/vue/24/outline';

const route = useRoute();
const router = useRouter();
const navbarStore = useNavbarStore();
const messagingStore = useMessagingStore();
const authStore = useAuthStore();

const selectedThread = ref(null);
const screenWidth = ref(window.innerWidth);

// Mobile breakpoint detection
const isMobile = computed(() => screenWidth.value < 768);

// Get threads from the store
const threads = computed(() => messagingStore.threadsList);

// Handle window resize
const handleResize = () => {
    screenWidth.value = window.innerWidth;
};

const loadThreads = async () => {
    // Check if threads are already loaded or currently loading
    if (messagingStore.threadsList.length > 0 || messagingStore.loading.threads) {
        handleExistingThreads();
        return;
    }

    // Load threads if not already loaded
    try {
        await messagingStore.loadThreads();
        handleExistingThreads();
    } catch (error) {
        console.error('Failed to load threads:', error);
    }
};

const handleExistingThreads = () => {
    if (messagingStore.threadsList.length > 0) {
        // Auto-select thread if coming from a profile or specific thread
        const threadId = route.query.conversation;
        const startConversation = route.query.startConversation;

        if (threadId) {
            const thread = messagingStore.getThread(threadId);
            if (thread) {
                selectedThread.value = thread;
            }
        } else if (startConversation) {
            // Check if thread already exists with this user
            const existingThread = messagingStore.threadsList.find(t =>
                t.participants.includes(startConversation)
            );

            if (existingThread) {
                selectedThread.value = existingThread;
            } else {
                // Create new thread
                createNewThread(startConversation);
            }
        }
    }
};

const createNewThread = async (receiverId) => {
    try {
        // Use the store's getOrCreateThread method
        const threadId = await messagingStore.getOrCreateThread(receiverId);

        if (threadId) {
            // Reload threads and select the new one
            await messagingStore.loadThreads();
            const newThread = messagingStore.getThread(threadId);
            if (newThread) {
                selectedThread.value = newThread;
            }

            // Clear the query parameter to avoid recreating the thread
            router.replace({
                path: route.path,
                query: { conversation: threadId }
            });
        }
    } catch (error) {
        console.error('Failed to create new thread:', error);
    }
};

const selectThread = (thread) => {
    selectedThread.value = thread;

    // Update URL to reflect selected thread
    router.replace({
        path: route.path,
        query: { conversation: thread.id }
    });
};

const handleBackToThreads = () => {
    // On mobile, go back to threads list
    if (isMobile.value) {
        selectedThread.value = null;
        router.replace({
            path: route.path,
            query: {}
        });
    }
};

const handleMessageSent = (message) => {
    // The messaging store handles updating thread state
    // No need to manually update here since it's reactive
};

// Watch for route changes to handle deep linking
watch(() => route.query, () => {
    if (threads.value.length > 0) {
        const threadId = route.query.conversation;
        if (threadId) {
            const thread = messagingStore.getThread(threadId);
            if (thread) {
                selectedThread.value = thread;
            }
        }
    }
}, { deep: true });

// Watch for threads to be loaded (in case auto-loading happens after component mount)
watch(() => messagingStore.threadsList.length, (newLength) => {
    if (newLength > 0 && !selectedThread.value) {
        handleExistingThreads();
    }
});

onMounted(() => {
    loadThreads();
    window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
});
</script>