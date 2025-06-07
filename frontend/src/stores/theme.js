import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";

export const useThemeStore = defineStore("theme", () => {
  // State - default to system preference
  const isDark = ref(false);
  const systemPrefersDark = ref(false);
  const preference = ref("system"); // 'light', 'dark', 'system'

  // Getters
  const currentTheme = computed(() => {
    if (preference.value === "system") {
      return systemPrefersDark.value ? "dark" : "light";
    }
    return preference.value;
  });

  const isCurrentlyDark = computed(() => {
    return currentTheme.value === "dark";
  });

  // Initialize theme from localStorage and system preference
  const initialize = () => {
    // Check system preference
    if (typeof window !== "undefined") {
      systemPrefersDark.value = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;

      // Listen for system theme changes
      window
        .matchMedia("(prefers-color-scheme: dark)")
        .addEventListener("change", (e) => {
          systemPrefersDark.value = e.matches;
        });

      // Load saved preference
      const saved = localStorage.getItem("theme-preference");
      if (saved && ["light", "dark", "system"].includes(saved)) {
        preference.value = saved;
      }

      // Apply initial theme
      applyTheme();
    }
  };

  // Apply theme to DOM
  const applyTheme = () => {
    if (typeof window !== "undefined") {
      const root = document.documentElement;

      if (isCurrentlyDark.value) {
        root.classList.add("dark");
        isDark.value = true;
      } else {
        root.classList.remove("dark");
        isDark.value = false;
      }
    }
  };

  // Actions
  const setTheme = (newTheme) => {
    if (["light", "dark", "system"].includes(newTheme)) {
      preference.value = newTheme;
      localStorage.setItem("theme-preference", newTheme);
      applyTheme();
    }
  };

  const toggleTheme = () => {
    if (preference.value === "system") {
      // If currently system, switch to opposite of current system preference
      setTheme(systemPrefersDark.value ? "light" : "dark");
    } else if (preference.value === "light") {
      setTheme("dark");
    } else {
      setTheme("light");
    }
  };

  const setSystemTheme = () => {
    setTheme("system");
  };

  // Watch for theme changes and apply them
  watch([preference, systemPrefersDark], () => {
    applyTheme();
  });

  return {
    // State
    isDark,
    preference,
    systemPrefersDark,

    // Getters
    currentTheme,
    isCurrentlyDark,

    // Actions
    initialize,
    setTheme,
    toggleTheme,
    setSystemTheme,
    applyTheme,
  };
});
