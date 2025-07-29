<template>
  <div id="app" class="app-layout">
    <!-- Fixed Navbar -->
    <NavBar />

    <!-- Main Content Area with consistent spacing -->
    <main class="main-content" :style="{
      paddingTop: `${navbarStore.navbarHeight}px`,
      minHeight: `calc(100vh - ${navbarStore.navbarHeight}px)`
    }">
      <!-- Route Transitions -->
      <router-view v-slot="{ Component, route }">
        <transition :name="transitionName" mode="out-in" @before-enter="beforeTransition"
          @after-enter="afterTransition">
          <component :is="Component" :key="route.path" class="page-component" />
        </transition>
      </router-view>
    </main>

    <!-- Global Notifications -->
    <NotificationContainer />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { useNavbarStore } from '@/stores/navbar'
import NavBar from '@/components/common/nav/NavBar.vue'
import NotificationContainer from '@/components/common/NotificationContainer.vue'

const route = useRoute()
const authStore = useAuthStore()
const themeStore = useThemeStore()
const navbarStore = useNavbarStore()

// Transition management
const transitionName = ref('page-fade')

// Define transition patterns for different route types
const getTransitionName = (to, from) => {
  if (!from) return 'page-fade'

  // Horizontal slide for main sections
  const mainSections = ['Home', 'Forum', 'BikeGallery', 'Products']
  const toIndex = mainSections.indexOf(to.name)
  const fromIndex = mainSections.indexOf(from.name)

  if (toIndex !== -1 && fromIndex !== -1) {
    return toIndex > fromIndex ? 'page-slide-left' : 'page-slide-right'
  }

  // Vertical slide for detail pages
  if (to.name?.includes('Detail') || to.name?.includes('View') || to.name === 'Topic') {
    return 'page-fade-scale-in'
  }

  if (from.name?.includes('Detail') || from.name?.includes('View') || from.name === 'Topic') {
    return 'page-fade-scale-out'
  }

  return 'page-fade'
}

// Watch route changes for transition effects
watch(route, (to, from) => {
  transitionName.value = getTransitionName(to, from)
})

const beforeTransition = () => {
  // Optional: Add loading state
}

const afterTransition = () => {
  // Only scroll to top for new pages, not detail pages
  if (!route.name?.includes('Detail') && !route.name?.includes('View') && route.name !== 'Topic') {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

onMounted(async () => {
  // Initialize stores
  themeStore.initialize()

  await authStore.initialize()
  authStore.setupAuthListener()
})
</script>

<style scoped>
.app-layout {
  @apply min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200;
}

.main-content {
  @apply relative w-full;
}

.page-component {
  @apply w-full;
}

/* Instant transition for reduced motion */
.page-instant-enter-active,
.page-instant-leave-active {
  transition: none;
}

/* Page Fade Transition */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Horizontal Slide Transitions */
.page-slide-left-enter-active,
.page-slide-left-leave-active,
.page-slide-right-enter-active,
.page-slide-right-leave-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-slide-left-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.page-slide-left-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.page-slide-right-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.page-slide-right-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

/* Fade Scale Transitions for Detail Pages */
.page-fade-scale-in-enter-active,
.page-fade-scale-in-leave-active,
.page-fade-scale-out-enter-active,
.page-fade-scale-out-leave-active {
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.page-fade-scale-in-enter-from {
  opacity: 0;
  transform: scale(0.95) translateY(8px);
  filter: blur(1px);
}

.page-fade-scale-in-leave-to {
  opacity: 0;
  transform: scale(1.02) translateY(-4px);
  filter: blur(0.5px);
}

.page-fade-scale-out-enter-from {
  opacity: 0;
  transform: scale(1.02) translateY(-8px);
  filter: blur(1px);
}

.page-fade-scale-out-leave-to {
  opacity: 0;
  transform: scale(0.98) translateY(4px);
  filter: blur(0.5px);
}
</style>
