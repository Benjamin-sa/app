<template>
    <div class="rich-text-editor">
        <label v-if="label" :for="id" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {{ label }}
        </label>

        <!-- Editor Container -->
        <div :class="[
            'border border-primary-300 dark:border-primary-600 rounded-md bg-white dark:bg-primary-800 overflow-hidden',
            { 'border-red-300 dark:border-red-600': error }
        ]">
            <!-- Toolbar -->
            <div ref="toolbar"
                class="border-b border-primary-200 dark:border-primary-600 bg-primary-50 dark:bg-primary-700 p-2">
                <!-- Text Formatting -->
                <span class="ql-formats">
                    <button class="ql-bold" title="Bold"></button>
                    <button class="ql-italic" title="Italic"></button>
                    <button class="ql-underline" title="Underline"></button>
                    <button class="ql-strike" title="Strikethrough"></button>
                </span>

                <!-- Headers -->
                <span class="ql-formats">
                    <select class="ql-header">
                        <option selected></option>
                        <option value="1"></option>
                        <option value="2"></option>
                        <option value="3"></option>
                    </select>
                </span>

                <!-- Lists -->
                <span class="ql-formats">
                    <button class="ql-list" value="ordered" title="Numbered List"></button>
                    <button class="ql-list" value="bullet" title="Bullet List"></button>
                </span>

                <!-- Links and Code -->
                <span class="ql-formats">
                    <button class="ql-link" title="Insert Link"></button>
                    <button class="ql-blockquote" title="Quote"></button>
                    <button class="ql-code-block" title="Code Block"></button>
                </span>

                <!-- Custom Emoji Button -->
                <span class="ql-formats">
                    <button type="button" @click="toggleEmojiPicker" class="ql-emoji-button" title="Insert Emoji">
                        😊
                    </button>
                </span>

                <!-- Clean formatting -->
                <span class="ql-formats">
                    <button class="ql-clean" title="Remove Formatting"></button>
                </span>
            </div>

            <!-- Editor -->
            <div ref="editor" class="min-h-[200px] bg-white dark:bg-primary-800"></div>
        </div>

        <!-- Emoji Picker -->
        <div v-if="showEmojiPicker" class="relative">
            <div
                class="absolute top-2 left-0 z-50 bg-white dark:bg-primary-800 border border-primary-300 dark:border-primary-600 rounded-lg shadow-lg p-4 max-w-sm">
                <div class="mb-3">
                    <input v-model="emojiSearch" type="text" placeholder="Search emojis..."
                        class="w-full px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                </div>
                <div class="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
                    <button v-for="emoji in filteredEmojis" :key="emoji.char" type="button"
                        @click="insertEmoji(emoji.char)"
                        class="text-xl hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded transition-colors"
                        :title="emoji.name">
                        {{ emoji.char }}
                    </button>
                </div>
                <div class="mt-3 flex justify-between items-center">
                    <span class="text-xs text-gray-500 dark:text-gray-400">
                        {{ filteredEmojis.length }} emojis
                    </span>
                    <button type="button" @click="showEmojiPicker = false"
                        class="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>

        <!-- Character count and validation -->
        <div class="flex justify-between items-center mt-1 px-1">
            <p v-if="error" class="text-sm text-red-600 dark:text-red-400">
                {{ error }}
            </p>
            <p v-else-if="characterCount < minLength && characterCount > 0"
                class="text-sm text-orange-600 dark:text-orange-400">
                {{ minLength - characterCount }} more characters needed
            </p>
            <div class="flex-1"></div>
            <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ characterCount }}/{{ maxLength }} characters
            </p>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

const props = defineProps({
    modelValue: {
        type: String,
        default: ''
    },
    label: {
        type: String,
        default: ''
    },
    id: {
        type: String,
        default: 'rich-editor'
    },
    placeholder: {
        type: String,
        default: 'Start typing...'
    },
    maxLength: {
        type: Number,
        default: 5000
    },
    minLength: {
        type: Number,
        default: 20
    },
    disabled: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['update:modelValue']);

const editor = ref(null);
const toolbar = ref(null);
const quill = ref(null);
const showEmojiPicker = ref(false);
const emojiSearch = ref('');
const isInitialized = ref(false);
const isUpdatingExternally = ref(false);

// Common emojis for quick access
const commonEmojis = [
    { char: '😀', name: 'grinning face' },
    { char: '😃', name: 'grinning face with big eyes' },
    { char: '😄', name: 'grinning face with smiling eyes' },
    { char: '😁', name: 'beaming face with smiling eyes' },
    { char: '😅', name: 'grinning face with sweat' },
    { char: '😂', name: 'face with tears of joy' },
    { char: '🤣', name: 'rolling on the floor laughing' },
    { char: '😊', name: 'smiling face with smiling eyes' },
    { char: '😇', name: 'smiling face with halo' },
    { char: '🙂', name: 'slightly smiling face' },
    { char: '😉', name: 'winking face' },
    { char: '😌', name: 'relieved face' },
    { char: '😍', name: 'smiling face with heart eyes' },
    { char: '🥰', name: 'smiling face with hearts' },
    { char: '😘', name: 'face blowing a kiss' },
    { char: '😋', name: 'face savoring food' },
    { char: '😛', name: 'face with tongue' },
    { char: '😜', name: 'winking face with tongue' },
    { char: '🤪', name: 'zany face' },
    { char: '🤨', name: 'face with raised eyebrow' },
    { char: '🧐', name: 'face with monocle' },
    { char: '🤓', name: 'nerd face' },
    { char: '😎', name: 'smiling face with sunglasses' },
    { char: '🤩', name: 'star struck' },
    { char: '🥳', name: 'partying face' },
    { char: '😏', name: 'smirking face' },
    { char: '😒', name: 'unamused face' },
    { char: '😞', name: 'disappointed face' },
    { char: '😔', name: 'pensive face' },
    { char: '😟', name: 'worried face' },
    { char: '😕', name: 'confused face' },
    { char: '🙁', name: 'slightly frowning face' },
    { char: '☹️', name: 'frowning face' },
    { char: '😣', name: 'persevering face' },
    { char: '😖', name: 'confounded face' },
    { char: '😫', name: 'tired face' },
    { char: '😩', name: 'weary face' },
    { char: '🥺', name: 'pleading face' },
    { char: '😢', name: 'crying face' },
    { char: '😭', name: 'loudly crying face' },
    { char: '😤', name: 'face with steam from nose' },
    { char: '😠', name: 'angry face' },
    { char: '😡', name: 'pouting face' },
    { char: '🤬', name: 'face with symbols on mouth' },
    { char: '🤯', name: 'exploding head' },
    { char: '😳', name: 'flushed face' },
    { char: '🥵', name: 'hot face' },
    { char: '🥶', name: 'cold face' },
    { char: '😱', name: 'face screaming in fear' },
    { char: '😨', name: 'fearful face' },
    { char: '👍', name: 'thumbs up' },
    { char: '👎', name: 'thumbs down' },
    { char: '👌', name: 'ok hand' },
    { char: '✌️', name: 'victory hand' },
    { char: '🤞', name: 'crossed fingers' },
    { char: '🤟', name: 'love you gesture' },
    { char: '🤘', name: 'sign of the horns' },
    { char: '🤙', name: 'call me hand' },
    { char: '💪', name: 'flexed biceps' },
    { char: '✅', name: 'check mark' },
    { char: '❌', name: 'cross mark' },
    { char: '⭐', name: 'star' },
    { char: '💯', name: 'hundred points' },
    { char: '🔥', name: 'fire' },
    { char: '💡', name: 'light bulb' },
    { char: '❤️', name: 'red heart' },
    { char: '💙', name: 'blue heart' },
    { char: '💚', name: 'green heart' },
    { char: '💛', name: 'yellow heart' },
    { char: '🧡', name: 'orange heart' },
    { char: '💜', name: 'purple heart' },
    { char: '🖤', name: 'black heart' },
    { char: '🤍', name: 'white heart' },
    { char: '🚗', name: 'automobile' },
    { char: '🏍️', name: 'motorcycle' },
    { char: '🛵', name: 'motor scooter' },
    { char: '🚲', name: 'bicycle' },
    { char: '🛠️', name: 'hammer and wrench' },
    { char: '🔧', name: 'wrench' },
    { char: '⚙️', name: 'gear' },
    { char: '🛞', name: 'wheel' },
    { char: '⛽', name: 'fuel pump' }
];

const filteredEmojis = computed(() => {
    if (!emojiSearch.value) return commonEmojis;
    const search = emojiSearch.value.toLowerCase();
    return commonEmojis.filter(emoji =>
        emoji.name.toLowerCase().includes(search) ||
        emoji.char.includes(search)
    );
});

const characterCount = computed(() => {
    if (!quill.value || !isInitialized.value) return 0;
    const length = quill.value.getLength();
    return Math.max(0, length - 1); // Subtract 1 for the trailing newline
});

const error = computed(() => {
    const count = characterCount.value;
    if (count > props.maxLength) {
        return `Content exceeds maximum length of ${props.maxLength} characters`;
    }
    return '';
});

const handleTextChange = () => {
    if (!quill.value || isUpdatingExternally.value) return;

    const html = quill.value.root.innerHTML;
    const cleanHtml = html === '<p><br></p>' ? '' : html;
    emit('update:modelValue', cleanHtml);
};

const initializeEditor = async () => {
    await nextTick();

    if (!editor.value || !toolbar.value) {
        console.warn('Editor elements not ready');
        return false;
    }

    try {
        // Create Quill instance
        quill.value = new Quill(editor.value, {
            theme: 'snow',
            modules: {
                toolbar: toolbar.value
            },
            placeholder: props.placeholder,
            readOnly: props.disabled
        });

        // Set initial content
        if (props.modelValue) {
            isUpdatingExternally.value = true;
            quill.value.root.innerHTML = props.modelValue;
            isUpdatingExternally.value = false;
        }

        // Add event listeners
        quill.value.on('text-change', handleTextChange);

        // Handle character limit
        quill.value.on('text-change', () => {
            const length = quill.value.getLength();
            if (length > props.maxLength + 1) { // +1 for trailing newline
                const excess = length - props.maxLength - 1;
                quill.value.deleteText(props.maxLength, excess);
            }
        });

        isInitialized.value = true;
        return true;
    } catch (error) {
        console.error('Error initializing Quill:', error);
        return false;
    }
};

const toggleEmojiPicker = () => {
    showEmojiPicker.value = !showEmojiPicker.value;
    if (showEmojiPicker.value) {
        emojiSearch.value = '';
    }
};

const insertEmoji = (emoji) => {
    if (!quill.value) return;

    const range = quill.value.getSelection();
    const index = range ? range.index : quill.value.getLength();
    quill.value.insertText(index, emoji, 'user');
    quill.value.setSelection(index + emoji.length);
    showEmojiPicker.value = false;
};

// Click outside to close emoji picker
const handleClickOutside = (event) => {
    if (showEmojiPicker.value && !event.target.closest('.rich-text-editor')) {
        showEmojiPicker.value = false;
    }
};

// Watch for external content changes
watch(() => props.modelValue, (newValue) => {
    if (!quill.value || !isInitialized.value || isUpdatingExternally.value) return;

    const currentHtml = quill.value.root.innerHTML;
    const currentClean = currentHtml === '<p><br></p>' ? '' : currentHtml;

    if (newValue !== currentClean) {
        isUpdatingExternally.value = true;
        if (newValue) {
            quill.value.root.innerHTML = newValue;
        } else {
            quill.value.setText('');
        }
        isUpdatingExternally.value = false;
    }
});

// Watch for disabled state changes
watch(() => props.disabled, (disabled) => {
    if (quill.value && isInitialized.value) {
        quill.value.enable(!disabled);
    }
});

onMounted(async () => {
    // Initialize editor with a small delay to ensure DOM is ready
    setTimeout(initializeEditor, 50);
    document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
    if (quill.value) {
        quill.value.off('text-change');
        quill.value = null;
    }
    isInitialized.value = false;
    document.removeEventListener('click', handleClickOutside);
});
</script>

<style>
/* Custom Quill styles */
.ql-toolbar {
    border: none !important;
    padding: 8px 12px !important;
    font-family: inherit;
}

.ql-container {
    border: none !important;
    font-size: 14px;
    font-family: inherit;
}

.ql-editor {
    min-height: 200px;
    padding: 16px;
    line-height: 1.6;
}

.ql-editor.ql-blank::before {
    font-style: normal;
    color: #6b7280;
    left: 16px;
}

/* Custom emoji button styling */
.ql-emoji-button {
    width: 28px !important;
    height: 28px !important;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: white;
    color: #444;
    cursor: pointer;
    display: inline-flex !important;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    margin: 0 2px;
}

.ql-emoji-button:hover {
    background-color: #f3f4f6;
}

/* Dark mode styles */
.dark .ql-toolbar {
    background-color: #374151 !important;
    color: #f3f4f6 !important;
    border-color: #4b5563 !important;
}

.dark .ql-container {
    background-color: #1f2937 !important;
    color: #f3f4f6 !important;
}

.dark .ql-editor {
    color: #f3f4f6 !important;
}

.dark .ql-editor.ql-blank::before {
    color: #9ca3af;
}

.dark .ql-stroke {
    stroke: #f3f4f6 !important;
}

.dark .ql-fill {
    fill: #f3f4f6 !important;
}

.dark .ql-picker-label {
    color: #f3f4f6 !important;
}

.dark .ql-picker-options {
    background-color: #374151 !important;
    border-color: #4b5563 !important;
}

.dark .ql-picker-item {
    color: #f3f4f6 !important;
}

.dark .ql-picker-item:hover {
    background-color: #4b5563 !important;
}

.dark .ql-emoji-button {
    background-color: #374151 !important;
    border-color: #4b5563 !important;
    color: #f3f4f6 !important;
}

.dark .ql-emoji-button:hover {
    background-color: #4b5563 !important;
}
</style>
