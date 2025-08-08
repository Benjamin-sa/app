import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";

export const useThemeStore = defineStore("theme", () => {
  // State - simple light/dark toggle
  const preference = ref("light"); // 'light' or 'dark'

  // Getters
  const currentTheme = computed(() => preference.value);

  // Initialize theme from localStorage
  const initialize = () => {
    if (typeof window !== "undefined") {
      // Load saved preference
      const saved = localStorage.getItem("theme-preference");
      if (saved && ["light", "dark"].includes(saved)) {
        preference.value = saved;
      }

      // Apply initial theme
      applyTheme();
    }
  };

  // Apply theme to document
  const applyTheme = () => {
    if (typeof window !== "undefined") {
      const root = window.document.documentElement;

      if (preference.value === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  };

  // Actions
  const setTheme = (newTheme) => {
    if (["light", "dark"].includes(newTheme)) {
      preference.value = newTheme;
      localStorage.setItem("theme-preference", newTheme);
      applyTheme();
    }
  };

  const toggleTheme = () => {
    // Simple toggle between light and dark
    if (preference.value === "light") {
      setTheme("dark");
    } else {
      setTheme("light");
    }
  };

  // Watch for theme changes and apply them
  watch(
    preference,
    () => {
      applyTheme();
    },
    { immediate: true }
  );

  return {
    // State
    preference,

    // Getters
    currentTheme,

    // Actions
    initialize,
    setTheme,
    toggleTheme,
  };
});
