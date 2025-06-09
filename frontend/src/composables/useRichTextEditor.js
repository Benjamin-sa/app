import { ref, computed } from "vue";

export function useRichTextEditor(options = {}) {
  const {
    maxLength = 5000,
    minLength = 20,
    placeholder = "Start typing...",
  } = options;

  const content = ref("");
  const editor = ref(null);
  const showEmojiPicker = ref(false);
  const emojiSearch = ref("");

  // Character count helper
  const getTextLength = (htmlContent) => {
    if (!htmlContent) return 0;
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;
    return tempDiv.textContent?.length || 0;
  };

  const characterCount = computed(() => getTextLength(content.value));

  const isValid = computed(() => {
    const count = characterCount.value;
    return count >= minLength && count <= maxLength;
  });

  const error = computed(() => {
    const count = characterCount.value;
    if (count > maxLength) {
      return `Content exceeds maximum length of ${maxLength} characters`;
    }
    if (count < minLength && count > 0) {
      return `Content should be at least ${minLength} characters long`;
    }
    return "";
  });

  const insertText = (text) => {
    if (editor.value && editor.value.quill) {
      const range = editor.value.quill.getSelection() || { index: 0 };
      editor.value.quill.insertText(range.index, text, "user");
      editor.value.quill.setSelection(range.index + text.length);
    }
  };

  const insertEmoji = (emoji) => {
    insertText(emoji);
    showEmojiPicker.value = false;
  };

  const toggleEmojiPicker = () => {
    showEmojiPicker.value = !showEmojiPicker.value;
    if (showEmojiPicker.value) {
      emojiSearch.value = "";
    }
  };

  const setContent = (newContent) => {
    content.value = newContent;
  };

  const getContent = () => {
    return content.value;
  };

  const clear = () => {
    content.value = "";
    if (editor.value && editor.value.quill) {
      editor.value.quill.setText("");
    }
  };

  const focus = () => {
    if (editor.value && editor.value.quill) {
      editor.value.quill.focus();
    }
  };

  return {
    content,
    editor,
    showEmojiPicker,
    emojiSearch,
    characterCount,
    isValid,
    error,
    getTextLength,
    insertText,
    insertEmoji,
    toggleEmojiPicker,
    setContent,
    getContent,
    clear,
    focus,
  };
}
