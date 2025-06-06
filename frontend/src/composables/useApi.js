import { ref, readonly } from "vue";

export function useApi() {
  const loading = ref(false);
  const error = ref(null);
  const data = ref(null);

  const execute = async (apiCall, options = {}) => {
    loading.value = true;
    error.value = null;
    data.value = null;

    try {
      const result = await apiCall();

      if (result && result.success) {
        data.value = result.data;
        return result.data;
      } else {
        error.value = result?.message || "An error occurred";
        if (options.throwOnError) {
          throw new Error(error.value);
        }
        return null;
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || err.message || "An error occurred";
      error.value = errorMessage;

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
    data.value = null;
  };

  return {
    loading: readonly(loading),
    error: readonly(error),
    data: readonly(data),
    execute,
    reset,
  };
}
