<template>
  <div class="flex flex-col items-center justify-center p-8">
    <div v-if="loading" class="text-center">
      <div class="text-xl mb-4">Processing authentication...</div>
      <div class="w-16 h-16 border-4 border-t-[#00642b] border-r-[#00642b] border-b-[#00642b] border-l-transparent rounded-full animate-spin"></div>
    </div>
    <div v-else-if="error" class="text-center">
      <div class="text-xl text-red-600 mb-2">Authentication failed</div>
      <div class="mb-4">{{ error }}</div>
      <button @click="retry" class="px-4 py-2 bg-[#00642b] text-white rounded-md hover:bg-opacity-80">
        Try Again
      </button>
    </div>
    <div v-else class="text-center">
      <div class="text-xl mb-4">Successfully authenticated!</div>
      <div class="mb-6">You'll be redirected shortly...</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import authService from '@/services/authService'

const router = useRouter()
const route = useRoute()
const loading = ref(true)
const error = ref(null)

onMounted(() => {
  const token = route.query.token
  
  if (!token) {
    error.value = 'No authentication token received'
    loading.value = false
    return
  }
  
  try {
    const success = authService.handleAuthSuccess(token)
    if (success) {
      // Redirect to products page after successful authentication
      setTimeout(() => {
        router.push('/products')
      }, 1500)
    } else {
      error.value = 'Failed to process authentication'
    }
  } catch (err) {
    error.value = err.message || 'An unexpected error occurred'
  } finally {
    loading.value = false
  }
})

function retry() {
  authService.initiateShopifyAuth()
}
</script>
