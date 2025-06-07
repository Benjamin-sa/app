import { ref, readonly } from "vue";

export function useApi() {
  const loading = ref(false);
  const error = ref(null);

  const execute = async (apiCall, options = {}) => {
    loading.value = true;
    error.value = null;

    try {
      const result = await apiCall();

      // Handle your current service response pattern
      if (result && result.success) {
        // Show success notification if requested
        if (options.successMessage && options.notificationStore) {
          options.notificationStore.success(
            options.successTitle || "Success",
            options.successMessage
          );
        }
        return result.data || result;
      } else {
        const errorMessage =
          result?.message || result?.error || "An error occurred";
        error.value = errorMessage;

        // Show error notification if requested
        if (options.showErrorNotification && options.notificationStore) {
          options.notificationStore.error(
            options.errorTitle || "Error",
            errorMessage
          );
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

      // Show error notification if requested
      if (options.showErrorNotification && options.notificationStore) {
        options.notificationStore.error(
          options.errorTitle || "Error",
          errorMessage
        );
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
