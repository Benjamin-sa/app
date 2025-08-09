<template>
    <div
        :class="['relative', depth > 0 ? 'ml-4 sm:ml-6 pl-3 sm:pl-4 border-l border-gray-200 dark:border-gray-700' : '']">
        <div
            class="mt-4 relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
            <div class="p-4 sm:p-6">
                <div class="flex flex-col gap-4">
                    <!-- Content -->
                    <div class="flex-1 min-w-0">
                        <div class="prose dark:prose-invert max-w-none mb-4" v-html="formatContent(node.content)"></div>

                        <!-- Images -->
                        <div v-if="node.images && node.images.length"
                            class="mb-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <img v-for="image in node.images" :key="image.id || image.url" :src="image.url"
                                :alt="image.name || 'Answer image'"
                                class="w-full h-32 object-cover rounded-lg border border-gray-200/50 dark:border-gray-600/50 cursor-pointer hover:opacity-90 hover:scale-[1.02] transition-all duration-200"
                                @click="$emit('view-image', image)" />
                        </div>

                        <!-- Meta -->
                        <div
                            class="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                            <div class="flex items-center space-x-4">
                                <AuthorDisplay :user-id="node.userId" size="sm" />
                                <span class="flex items-center">{{ formatDate(node.createdAt) }}</span>
                                <span v-if="node.editedAt" class="text-xs text-gray-500 dark:text-gray-500 italic">
                                    (edited {{ formatDate(node.editedAt) }})
                                </span>
                            </div>
                            <div class="flex items-center space-x-2">
                                <button v-if="isAuthenticated" @click="$emit('reply-to', node)"
                                    class="p-2 text-gray-400 hover:text-primary-600 dark:text-gray-500 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
                                    title="Reply">
                                    <ChatBubbleLeftIcon class="w-4 h-4" />
                                </button>
                                <button v-if="canEdit(node)" @click="$emit('edit', node)"
                                    class="p-2 text-gray-400 hover:text-primary-600 dark:text-gray-500 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
                                    title="Edit">
                                    <PencilIcon class="w-4 h-4" />
                                </button>
                                <button v-if="canEdit(node)" @click="$emit('delete', node)"
                                    class="p-2 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                                    title="Delete">
                                    <TrashIcon class="w-4 h-4" />
                                </button>
                                <button v-if="canMarkAsBest(node) && !hasBestAnswer" @click="$emit('mark-best', node)"
                                    class="px-2 py-1 text-xs font-medium text-green-600 hover:text-green-700 dark:text-green-500 dark:hover:text-green-400">
                                    Mark as best
                                </button>
                            </div>
                        </div>

                        <!-- Best badge -->
                        <div v-if="node.isBestAnswer"
                            class="mt-2 inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                            <CheckCircleIcon class="w-3 h-3 mr-1" />
                            Best Answer
                        </div>
                    </div>

                    <!-- Vote -->
                    <div class="flex justify-start pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
                        <VoteButton :target-id="node.id" target-type="answer" variant="compact" size="sm" />
                    </div>

                    <!-- Children toggle -->
                    <div v-if="node.children && node.children.length" class="-mt-2">
                        <button
                            class="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            @click="expanded = !expanded">
                            {{ expanded ? 'Hide' : 'Show' }} {{ node.children.length }} repl{{ node.children.length ===
                                1 ? 'y' : 'ies' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="node.children && node.children.length && expanded" class="mt-1 space-y-2">
            <AnswerThreadItem v-for="child in sortedChildren" :key="child.id" :node="child" :depth="depth + 1"
                :is-authenticated="isAuthenticated" :current-user-id="currentUserId"
                :current-user-role="currentUserRole" :topic-author-id="topicAuthorId" :has-best-answer="hasBestAnswer"
                @reply-to="$emit('reply-to', $event)" @edit="$emit('edit', $event)" @delete="$emit('delete', $event)"
                @view-image="$emit('view-image', $event)" @mark-best="$emit('mark-best', $event)" />
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { formatDate, formatContent } from '@/utils/helpers';
import AuthorDisplay from '@/components/common/AuthorDisplay.vue';
import VoteButton from '@/components/forum/VoteButton.vue';
import { ChatBubbleLeftIcon, PencilIcon, TrashIcon, CheckCircleIcon } from '@heroicons/vue/24/outline';

const props = defineProps({
    node: { type: Object, required: true },
    depth: { type: Number, default: 0 },
    isAuthenticated: { type: Boolean, default: false },
    currentUserId: { type: String, default: null },
    currentUserRole: { type: String, default: null },
    topicAuthorId: { type: String, default: null },
    hasBestAnswer: { type: Boolean, default: false }
});

const expanded = ref(true);

const canEdit = (n) => {
    if (!props.currentUserId) return false;
    return props.currentUserId === n.userId || props.currentUserRole === 'admin';
};

const canMarkAsBest = (n) => {
    if (!props.currentUserId || !props.topicAuthorId) return false;
    return props.currentUserId === props.topicAuthorId && !n.isBestAnswer;
};

const toMillis = (ts) => {
    if (!ts) return 0;
    if (typeof ts === 'object' && '_seconds' in ts) {
        return ts._seconds * 1000 + Math.floor((ts._nanoseconds || 0) / 1e6);
    }
    return new Date(ts).getTime();
};

const sortedChildren = computed(() => {
    const children = props.node.children || [];
    return [...children].sort((a, b) => toMillis(a.createdAt) - toMillis(b.createdAt));
});
</script>
