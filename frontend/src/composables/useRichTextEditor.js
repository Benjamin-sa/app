import { ref, computed } from "vue";

export function useRichTextEditor(options = {}) {
  const {
    maxLength = 2000,
    minLength = 10,
    placeholder = "Start typing...",
  } = options;

  const content = ref("");
  const editor = ref(null);

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

  const setContent = (newContent) => {
    content.value = newContent || "";
  };

  const getContent = () => {
    return content.value;
  };

  const clear = () => {
    content.value = "";
  };

  const focus = () => {
    if (editor.value && editor.value.focus) {
      editor.value.focus();
    }
  };

  return {
    content,
    editor,
    characterCount,
    isValid,
    error,
    getTextLength,
    setContent,
    getContent,
    clear,
    focus,
    maxLength,
    minLength,
    placeholder,
  };
}
