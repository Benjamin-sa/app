<template>
  <div id="app" class="min-h-screen bg-gray-50">
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
import NavBar from '@/components/common/NavBar.vue';
import NotificationContainer from '@/components/common/NotificationContainer.vue';

const authStore = useAuthStore();

onMounted(async () => {
  // Initialize authentication
  await authStore.initialize();

  // Setup auth state listener
  authStore.setupAuthListener();
});
</script>
