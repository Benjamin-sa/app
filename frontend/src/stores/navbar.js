import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useNavbarStore = defineStore("navbar", () => {
  // State
  const isVisible = ref(true);
  const lastScrollY = ref(0);
  const scrollDirection = ref("up");
  const isAtTop = ref(true);
  const isMobileMenuOpen = ref(false);

  // Constants
  const SCROLL_THRESHOLD = 10;
  const HIDE_THRESHOLD = 80;

  // Computed
  const navbarHeight = computed(() => 64); // 16 * 4 = 64px (h-16)
  const effectiveNavbarHeight = computed(() => {
    // Account for mobile menu height when open
    // Mobile menu typically adds around 300-350px on mobile devices
    return isMobileMenuOpen.value ? 64 + 320 : 64;
  });
  const shouldHide = computed(
    () =>
      !isAtTop.value &&
      scrollDirection.value === "down" &&
      lastScrollY.value > HIDE_THRESHOLD
  );

  // Actions
  const updateScroll = (currentScrollY) => {
    const scrollDiff = currentScrollY - lastScrollY.value;

    // Determine scroll direction with threshold to prevent jitter
    if (Math.abs(scrollDiff) > SCROLL_THRESHOLD) {
      scrollDirection.value = scrollDiff > 0 ? "down" : "up";
    }

    // Update visibility based on scroll position and direction
    if (currentScrollY <= 20) {
      isAtTop.value = true;
      isVisible.value = true;
    } else {
      isAtTop.value = false;
      isVisible.value = !shouldHide.value;
    }

    lastScrollY.value = currentScrollY;
  };

  const forceShow = () => {
    isVisible.value = true;
  };

  const forceHide = () => {
    isVisible.value = false;
  };

  const setMobileMenuOpen = (isOpen) => {
    isMobileMenuOpen.value = isOpen;
  };

  const reset = () => {
    isVisible.value = true;
    lastScrollY.value = 0;
    scrollDirection.value = "up";
    isAtTop.value = true;
    isMobileMenuOpen.value = false;
  };

  return {
    // State
    isVisible,
    lastScrollY,
    scrollDirection,
    isAtTop,
    isMobileMenuOpen,

    // Getters
    navbarHeight,
    effectiveNavbarHeight,
    shouldHide,

    // Actions
    updateScroll,
    forceShow,
    forceHide,
    setMobileMenuOpen,
    reset,
  };
});
