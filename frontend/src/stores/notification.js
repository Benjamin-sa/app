import { defineStore } from "pinia";
import { ref } from "vue";

export const useNotificationStore = defineStore("notification", () => {
  const notifications = ref([]);
  let nextId = 1;

  const addNotification = (notification) => {
    const id = nextId++;
    const newNotification = {
      id,
      type: "info",
      duration: 3000,
      ...notification,
    };

    notifications.value.push(newNotification);

    // Auto remove after duration (check final duration after all options are merged)
    if (newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  };

  const removeNotification = (id) => {
    const index = notifications.value.findIndex((n) => n.id === id);
    if (index > -1) {
      notifications.value.splice(index, 1);
    }
  };

  const clearAll = () => {
    notifications.value = [];
  };

  // Convenience methods for different types
  const success = (title, message, options = {}) => {
    return addNotification({
      type: "success",
      title,
      message,
      ...options,
    });
  };

  const error = (title, message, options = {}) => {
    return addNotification({
      type: "error",
      title,
      message,
      duration: 4000, // Don't auto-dismiss errors
      ...options,
    });
  };

  const warning = (title, message, options = {}) => {
    return addNotification({
      type: "warning",
      title,
      message,
      ...options,
    });
  };

  const info = (title, message, options = {}) => {
    return addNotification({
      type: "info",
      title,
      message,
      ...options,
    });
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    success,
    error,
    warning,
    info,
  };
});
