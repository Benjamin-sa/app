<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { ref, onMounted } from 'vue'
import authService from '@/services/authService'

// Authentication state
const isAuthenticated = ref(false)

// Check authentication status on component mount
onMounted(() => {
  isAuthenticated.value = authService.isAuthenticated()
})

// Handle login
function handleLogin() {
  authService.initiateShopifyAuth()
}

// Handle logout
function handleLogout() {
  authService.logout()
  isAuthenticated.value = false
}
</script>

<template>
  <header class="bg-[#232323] text-white py-4 shadow-md">
    <div class="container mx-auto px-4 md:flex md:items-center md:justify-between">
      <div class="flex items-center justify-center md:justify-start">
        <h1 class="text-xl font-bold">MotorDash</h1>
      </div>

      <div class="flex flex-col md:flex-row items-center">
        <nav class="mt-4 md:mt-0 text-center md:text-right">
          <RouterLink to="/products" class="inline-block px-6 py-2 mx-2 rounded-md transition-colors duration-300
                hover:bg-[#00642b] font-medium
                router-link-active:bg-[#00642b] router-link-active:text-white">
            Products
          </RouterLink>
          <RouterLink to="/wishlist" class="inline-block px-6 py-2 mx-2 rounded-md transition-colors duration-300
                hover:bg-[#00642b] font-medium
                router-link-active:bg-[#00642b] router-link-active:text-white">
            My Wishlist
          </RouterLink>
          <RouterLink to="/parts-viewer" class="inline-block px-6 py-2 mx-2 rounded-md transition-colors duration-300
                hover:bg-[#00642b] font-medium
                router-link-active:bg-[#00642b] router-link-active:text-white">
            Parts Viewer
          </RouterLink>
        </nav>

        <!-- Authentication Button -->
        <div class="mt-4 md:mt-0 md:ml-4">
          <button v-if="!isAuthenticated" @click="handleLogin"
            class="px-4 py-2 bg-[#00642b] text-white rounded-md hover:bg-opacity-80 transition-colors duration-300 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd"
                d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z"
                clip-rule="evenodd" />
            </svg>
            Login
          </button>
          <button v-else @click="handleLogout"
            class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors duration-300 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd"
                d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
                clip-rule="evenodd" />
            </svg>
            Logout
          </button>
        </div>
      </div>
    </div>
  </header>

  <main class="container mx-auto px-4 py-6">
    <RouterView />
  </main>
</template>

<style scoped></style>
