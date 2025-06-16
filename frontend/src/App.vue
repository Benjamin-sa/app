<template>
  <div id="app" class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
    <!-- Navigation -->
    <NavBar />

    <!-- Main Content -->
    <main class="flex-1">
      <RouterView />
    </main>

    <!-- Notifications -->
    <NotificationContainer />
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { RouterView } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useThemeStore } from '@/stores/theme';
import NavBar from '@/components/common/nav/NavBar.vue';
import NotificationContainer from '@/components/common/NotificationContainer.vue';

const authStore = useAuthStore();
const themeStore = useThemeStore();

onMounted(async () => {
  // Initialize theme first
  themeStore.initialize();

  // Initialize authentication
  await authStore.initialize();

  // Setup auth state listener
  authStore.setupAuthListener();
});
</script>
