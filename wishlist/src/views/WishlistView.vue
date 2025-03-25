<script setup>
import { ref, onMounted } from 'vue'
import { wishlistService } from '@/services/api'

const wishlistItems = ref([])
const loading = ref(true)
const error = ref(null)

onMounted(async () => {
  await loadWishlist()
})

async function loadWishlist() {
  try {
    const response = await wishlistService.getWishlist()
    wishlistItems.value = response.data.items || []
  } catch (err) {
    error.value = 'Failed to load wishlist'
    console.error(err)
  } finally {
    loading.value = false
  }
}

async function removeFromWishlist(itemId) {
  try {
    await wishlistService.removeFromWishlist(itemId)
    await loadWishlist()
  } catch (err) {
    alert('Failed to remove product from wishlist')
    console.error(err)
  }
}
</script>

<template>
  <main>
    <h1>My Wishlist</h1>
    
    <div v-if="loading">Loading wishlist...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="wishlistItems.length === 0" class="empty-wishlist">
      Your wishlist is empty. Browse our <router-link to="/products">products</router-link> to add items!
    </div>
    <div v-else class="wishlist-container">
      <div v-for="item in wishlistItems" :key="item._id" class="wishlist-item">
        <div class="item-image">
          <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.title">
          <div v-else class="no-image">No image</div>
        </div>
        <div class="item-details">
          <h3>{{ item.title }}</h3>
          <p class="price">{{ item.price }} €</p>
          <p class="added-date">Added on {{ new Date(item.addedAt).toLocaleDateString() }}</p>
        </div>
        <div class="item-actions">
          <button @click="removeFromWishlist(item._id)" class="remove-btn">
            Remove
          </button>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.wishlist-container {
  margin-top: 2rem;
}

.wishlist-item {
  display: flex;
  border-bottom: 1px solid var(--color-border);
  padding: 1rem 0;
}

.item-image {
  width: 100px;
  height: 100px;
  margin-right: 1rem;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
}

.no-image {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f0f0;
  border-radius: 4px;
}

.item-details {
  flex-grow: 1;
}

.price {
  font-weight: bold;
  margin: 0.5rem 0;
}

.added-date {
  font-size: 0.8rem;
  color: #666;
}

.item-actions {
  display: flex;
  align-items: center;
}

.remove-btn {
  background-color: #ff4747;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.remove-btn:hover {
  background-color: #d63030;
}

.empty-wishlist {
  text-align: center;
  margin-top: 3rem;
  color: #666;
}

.error {
  color: red;
  font-weight: bold;
}
</style>
