import { ref } from "vue";

const notifications = ref([]);
let notificationId = 0;

export function useNotification() {
  const addNotification = (message, type = "info", duration = 5000) => {
    const id = ++notificationId;
    const notification = {
      id,
      message,
      type, // 'success', 'error', 'warning', 'info'
      timestamp: Date.now(),
    };

    notifications.value.push(notification);

    // Auto remove notification after duration
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }

    return id;
  };

  const removeNotification = (id) => {
    const index = notifications.value.findIndex((n) => n.id === id);
    if (index > -1) {
      notifications.value.splice(index, 1);
    }
  };

  const clearAllNotifications = () => {
    notifications.value.length = 0;
  };

  // Convenience methods
  const success = (message, duration) =>
    addNotification(message, "success", duration);
  const error = (message, duration) =>
    addNotification(message, "error", duration);
  const warning = (message, duration) =>
    addNotification(message, "warning", duration);
  const info = (message, duration) =>
    addNotification(message, "info", duration);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    success,
    error,
    warning,
    info,
  };
}
