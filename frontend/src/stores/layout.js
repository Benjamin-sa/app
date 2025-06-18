import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useLayoutStore = defineStore("layout", () => {
  // State
  const isTransitioning = ref(false);
  const currentPageType = ref("default");
  const layoutPreferences = ref({
    reducedMotion: false,
    transitionSpeed: "normal", // slow, normal, fast
  });

  // Computed
  const transitionDuration = computed(() => {
    if (layoutPreferences.value.reducedMotion) return 0;

    switch (layoutPreferences.value.transitionSpeed) {
      case "slow":
        return 500;
      case "fast":
        return 200;
      default:
        return 300;
    }
  });

  // Actions
  const setTransitioning = (value) => {
    isTransitioning.value = value;
  };

  const setPageType = (type) => {
    currentPageType.value = type;
  };

  const updateLayoutPreferences = (prefs) => {
    layoutPreferences.value = { ...layoutPreferences.value, ...prefs };
  };

  const detectReducedMotion = () => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    layoutPreferences.value.reducedMotion = mediaQuery.matches;

    mediaQuery.addEventListener("change", (e) => {
      layoutPreferences.value.reducedMotion = e.matches;
    });
  };

  return {
    // State
    isTransitioning,
    currentPageType,
    layoutPreferences,

    // Computed
    transitionDuration,

    // Actions
    setTransitioning,
    setPageType,
    updateLayoutPreferences,
    detectReducedMotion,
  };
});
