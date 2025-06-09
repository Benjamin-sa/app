<template>
    <div class="rich-text-editor">
        <label v-if="label" :for="id" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {{ label }}
        </label>

        <!-- Toolbar -->
        <div ref="toolbar"
            class="border border-gray-300 dark:border-gray-600 rounded-t-md bg-gray-50 dark:bg-gray-700 p-2">
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

            <!-- Alignment -->
            <span class="ql-formats">
                <select class="ql-align">
                    <option selected></option>
                    <option value="center"></option>
                    <option value="right"></option>
                    <option value="justify"></option>
                </select>
            </span>

            <!-- Links and Media -->
            <span class="ql-formats">
                <button class="ql-link" title="Insert Link"></button>
                <button class="ql-blockquote" title="Quote"></button>
                <button class="ql-code-block" title="Code Block"></button>
            </span>

            <!-- Colors -->
            <span class="ql-formats">
                <select class="ql-color" title="Text Color"></select>
                <select class="ql-background" title="Background Color"></select>
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
        <div ref="editor" :class="[
            'min-h-[200px] border-l border-r border-b border-gray-300 dark:border-gray-600 rounded-b-md bg-white dark:bg-gray-800',
            { 'border-red-300 dark:border-red-600': error }
        ]"></div>

        <!-- Emoji Picker -->
        <div v-if="showEmojiPicker" class="relative">
            <div
                class="absolute top-2 left-0 z-50 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4 max-w-sm">
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

// Common emojis with names for search
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
    { char: '🙃', name: 'upside down face' },
    { char: '😉', name: 'winking face' },
    { char: '😌', name: 'relieved face' },
    { char: '😍', name: 'smiling face with heart eyes' },
    { char: '🥰', name: 'smiling face with hearts' },
    { char: '😘', name: 'face blowing a kiss' },
    { char: '😗', name: 'kissing face' },
    { char: '😙', name: 'kissing face with smiling eyes' },
    { char: '😚', name: 'kissing face with closed eyes' },
    { char: '😋', name: 'face savoring food' },
    { char: '😛', name: 'face with tongue' },
    { char: '😝', name: 'squinting face with tongue' },
    { char: '😜', name: 'winking face with tongue' },
    { char: '🤪', name: 'zany face' },
    { char: '🤨', name: 'face with raised eyebrow' },
    { char: '🧐', name: 'face with monocle' },
    { char: '🤓', name: 'nerd face' },
    { char: '😎', name: 'smiling face with sunglasses' },
    { char: '🥸', name: 'disguised face' },
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
    { char: '🦾', name: 'mechanical arm' },
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
    if (!quill.value) return 0;
    try {
        return quill.value.getLength() - 1; // Subtract 1 for the trailing newline
    } catch (error) {
        console.warn('Error getting character count:', error);
        return 0;
    }
});

const error = computed(() => {
    const count = characterCount.value;
    if (count > props.maxLength) {
        return `Content exceeds maximum length of ${props.maxLength} characters`;
    }
    return '';
});

// Create a separate text change handler
const handleTextChange = () => {
    try {
        const html = quill.value.root.innerHTML;
        const cleanHtml = html === '<p><br></p>' ? '' : html;
        console.log('Text changed, emitting:', cleanHtml?.substring(0, 50) + '...');
        emit('update:modelValue', cleanHtml);
    } catch (error) {
        console.warn('Error in text-change handler:', error);
    }
};

const initializeEditor = async () => {
    // Wait for DOM to be ready
    await nextTick();

    // Make sure the editor element exists
    if (!editor.value || !toolbar.value) {
        console.warn('Editor elements not ready');
        return;
    }

    try {
        quill.value = new Quill(editor.value, {
            theme: 'snow',
            modules: {
                toolbar: toolbar.value
            },
            placeholder: props.placeholder,
            readOnly: props.disabled
        });

        // Wait for Quill to be fully initialized
        await new Promise(resolve => setTimeout(resolve, 100));

        // Set initial content safely
        if (props.modelValue && quill.value) {
            console.log('Setting initial content:', props.modelValue?.substring(0, 50) + '...');
            try {
                quill.value.clipboard.dangerouslyPasteHTML(props.modelValue);
            } catch (error) {
                console.warn('Error setting initial content:', error);
                quill.value.setText(props.modelValue);
            }
        }

        // Listen for text changes with the separated handler
        quill.value.on('text-change', handleTextChange);

        // Handle character limit
        quill.value.on('text-change', () => {
            try {
                const length = quill.value.getLength();
                if (length > props.maxLength) {
                    quill.value.deleteText(props.maxLength, length);
                }
            } catch (error) {
                console.warn('Error in character limit handler:', error);
            }
        });

    } catch (error) {
        console.error('Error initializing Quill:', error);
    }
};

const toggleEmojiPicker = () => {
    showEmojiPicker.value = !showEmojiPicker.value;
    if (showEmojiPicker.value) {
        emojiSearch.value = '';
    }
};

const insertEmoji = (emoji) => {
    if (quill.value) {
        try {
            const range = quill.value.getSelection();
            const index = range ? range.index : quill.value.getLength();
            quill.value.insertText(index, emoji, 'user');
            // Set selection after the inserted emoji
            quill.value.setSelection(index + emoji.length);
        } catch (error) {
            console.warn('Error inserting emoji:', error);
            // Fallback: append to end
            try {
                const length = quill.value.getLength();
                quill.value.insertText(length, emoji);
            } catch (fallbackError) {
                console.error('Fallback emoji insertion failed:', fallbackError);
            }
        }
    }
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
    if (quill.value && newValue !== quill.value.root.innerHTML) {
        console.log('External content change detected:', newValue?.substring(0, 50) + '...');
        try {
            const currentSelection = quill.value.getSelection();

            // Disable text-change listener temporarily to prevent loops
            quill.value.off('text-change');

            // Set the new content
            if (newValue) {
                quill.value.clipboard.dangerouslyPasteHTML(newValue);
            } else {
                quill.value.setText('');
            }

            // Re-enable text-change listener
            quill.value.on('text-change', handleTextChange);

            if (currentSelection) {
                try {
                    quill.value.setSelection(currentSelection);
                } catch (selectionError) {
                    quill.value.setSelection(quill.value.getLength());
                }
            }
        } catch (error) {
            console.warn('Error updating content:', error);
            // Fallback to setting text content
            try {
                quill.value.off('text-change');
                quill.value.setText(newValue || '');
                quill.value.on('text-change', handleTextChange);
            } catch (fallbackError) {
                console.error('Fallback content update failed:', fallbackError);
            }
        }
    }
}, { immediate: false });

// Watch for disabled state changes
watch(() => props.disabled, (disabled) => {
    if (quill.value) {
        try {
            quill.value.enable(!disabled);
        } catch (error) {
            console.warn('Error changing disabled state:', error);
        }
    }
});

onMounted(async () => {
    // Use setTimeout to ensure DOM is fully ready
    setTimeout(() => {
        initializeEditor();
    }, 50);
    document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
    if (quill.value) {
        try {
            quill.value.off('text-change');
            quill.value = null;
        } catch (error) {
            console.warn('Error cleaning up Quill:', error);
        }
    }
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

.ql-editor h1 {
    font-size: 2em;
    font-weight: bold;
    margin: 0.67em 0;
}

.ql-editor h2 {
    font-size: 1.5em;
    font-weight: bold;
    margin: 0.75em 0;
}

.ql-editor h3 {
    font-size: 1.17em;
    font-weight: bold;
    margin: 0.83em 0;
}

.ql-editor blockquote {
    border-left: 4px solid #ccc;
    margin-bottom: 5px;
    margin-top: 5px;
    padding-left: 16px;
}

.ql-editor code {
    background-color: #f3f4f6;
    border-radius: 3px;
    padding: 2px 4px;
}

.ql-editor pre {
    background-color: #f3f4f6;
    border-radius: 3px;
    padding: 12px;
    overflow-x: auto;
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

.dark .ql-editor code {
    background-color: #374151;
    color: #f3f4f6;
}

.dark .ql-editor pre {
    background-color: #374151;
    color: #f3f4f6;
}

.dark .ql-editor blockquote {
    border-left-color: #6b7280;
}
</style>
