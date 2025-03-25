<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { productService, wishlistService } from '@/services/api'

const route = useRoute()
const product = ref(null)
const loading = ref(true)
const error = ref(null)

onMounted(async () => {
  const productId = route.params.id
  try {
    const response = await productService.getProduct(productId)
    product.value = response.data
  } catch (err) {
    error.value = 'Failed to load product details'
    console.error(err)
  } finally {
    loading.value = false
  }
})

async function addToWishlist(productId) {
  try {
    await wishlistService.addToWishlist(productId)
    alert('Product added to wishlist!')
  } catch (err) {
    alert('Failed to add product to wishlist')
    console.error(err)
  }
}
</script>

<template>
  <main>
    <div v-if="loading" class="loading">Loading product details...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="product" class="product-detail">
      <div class="product-images">
        <img v-if="product.images && product.images.length" 
             :src="product.images[0].src" 
             :alt="product.title" 
             class="main-image">
      </div>
      
      <div class="product-info">
        <h1>{{ product.title }}</h1>
        <p class="price">{{ product.variants[0].price }} €</p>
        
        <div class="description" v-html="product.body_html"></div>
        
        <div class="actions">
          <button @click="addToWishlist(product.id)" class="wishlist-btn">
            Add to Wishlist
          </button>
        </div>
      </div>
    </div>
    <div v-else class="not-found">Product not found</div>
  </main>
</template>

<style scoped>
.product-detail {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  margin-top: 2rem;
}

.main-image {
  width: 100%;
  max-height: 400px;
  object-fit: contain;
  border-radius: 8px;
}

.price {
  font-size: 1.5rem;
  font-weight: bold;
  margin: 1rem 0;
}

.description {
  margin: 1.5rem 0;
  line-height: 1.6;
}

.actions {
  margin-top: 2rem;
}

.wishlist-btn {
  background-color: hsla(160, 100%, 37%, 1);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.wishlist-btn:hover {
  background-color: hsla(160, 100%, 30%, 1);
}

.loading, .error, .not-found {
  text-align: center;
  margin-top: 3rem;
}

.error {
  color: red;
}

@media (min-width: 768px) {
  .product-detail {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
