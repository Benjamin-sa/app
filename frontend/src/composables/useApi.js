import { ref, readonly } from "vue";
import { useNotification } from "./useNotification";

export function useApi() {
  const loading = ref(false);
  const error = ref(null);
  const { success: showSuccess, error: showError } = useNotification();

  const execute = async (apiCall, options = {}) => {
    loading.value = true;
    error.value = null;

    try {
      const result = await apiCall();

      // Handle your current service response pattern
      if (result && result.success) {
        // Show success notification automatically if message provided
        if (options.successMessage) {
          showSuccess(options.successMessage);
        }
        return result.data || result;
      } else {
        const errorMessage =
          result?.message || result?.error || "An error occurred";
        error.value = errorMessage;

        // Handle validation errors specifically
        if (result?.errors) {
          const validationErrors = Object.values(result.errors).join(", ");
          showError(validationErrors);
        } else if (options.showErrorNotification !== false) {
          // Show error notification by default unless explicitly disabled
          showError(options.errorMessage || errorMessage);
        }

        if (options.throwOnError) {
          throw new Error(errorMessage);
        }
        return null;
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || err.message || "An error occurred";
      error.value = errorMessage;

      // Show error notification by default unless explicitly disabled
      if (options.showErrorNotification !== false) {
        showError(options.errorMessage || errorMessage);
      }

      if (options.throwOnError) {
        throw err;
      }
      return null;
    } finally {
      loading.value = false;
    }
  };

  const reset = () => {
    loading.value = false;
    error.value = null;
  };

  return {
    loading: readonly(loading),
    error: readonly(error),
    execute,
    reset,
  };
}
