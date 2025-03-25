<script setup>
import { ref, onMounted, computed } from 'vue'
import { productService, wishlistService } from '@/services/api'
import { useRoute } from 'vue-router'

const route = useRoute()
const products = ref([])
const loading = ref(true)
const error = ref(null)
const searchTerm = ref('')
const selectedCollection = ref('')
const availableCollections = ref([])

// Mapping between part IDs and collection names
// Update these mappings to match your actual collection names
const partToCollectionMap = {
  'wheels': '13) velgen',
  'engine': '1) Complete motorblokken',
  'frame': 'Frame & Body',
  'exhaust': ''
}

// Get all unique collections from products
const getUniqueCollections = (productsList) => {
  const collectionsSet = new Set()

  productsList.forEach(product => {
    if (product.collections && product.collections.length > 0) {
      product.collections.forEach(collection => {
        collectionsSet.add(collection.title)
      })
    }
  })

  return Array.from(collectionsSet).sort()
}

// Filter products based on search term and selected collection
const filteredProducts = computed(() => {
  return products.value.filter(product => {
    // First filter by collection if one is selected
    const collectionMatch = selectedCollection.value === '' ||
      (product.collections && product.collections.some(c => c.title === selectedCollection.value))

    // Then filter by search term
    const searchMatch = searchTerm.value === '' ||
      product.title.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.value.toLowerCase())

    return collectionMatch && searchMatch
  })
})

onMounted(async () => {
  try {
    const response = await productService.getProductsWithImages()
    products.value = response.data
    availableCollections.value = getUniqueCollections(products.value)

    // Check if a category parameter was passed in the URL
    const categoryParam = route.query.category
    if (categoryParam && partToCollectionMap[categoryParam]) {
      // Find the matching collection based on the part category
      const matchingCollection = partToCollectionMap[categoryParam]

      // Check if this collection actually exists in our products
      if (availableCollections.value.includes(matchingCollection)) {
        selectedCollection.value = matchingCollection
      } else {
        // Try to find a partial match if exact match doesn't exist
        const possibleMatch = availableCollections.value.find(
          collection => collection.toLowerCase().includes(categoryParam.toLowerCase())
        )
        if (possibleMatch) {
          selectedCollection.value = possibleMatch
        }
      }
    }

    console.log('Products data:', products.value)
  } catch (err) {
    error.value = 'Failed to load products'
    console.error(err)
  } finally {
    loading.value = false
  }
})

// Reset filters
function resetFilters() {
  searchTerm.value = ''
  selectedCollection.value = ''
}

async function addToWishlist(productId) {
  try {
    await wishlistService.addToWishlist(productId)
    alert('Product added to wishlist!')
  } catch (err) {
    alert('Failed to add product to wishlist')
    console.error(err)
  }
}

// Helper function to extract image URL from Shopify product data
function getImageUrl(product) {
  if (product.images && product.images.length > 0) {
    return product.images[0].src
  }
  return null
}

// Helper function to extract price from Shopify product data
function getPrice(product) {
  if (product.price) {
    return product.price
  }
  return 'N/A'
}

// Helper function to extract collections from Shopify product data
function getCollections(product) {
  if (product.collections && product.collections.length > 0) {
    return product.collections.map(collection => collection.title)
  }
  return []
}
</script>

<template>
  <div class="py-6">
    <h1 class="text-3xl font-bold mb-8 text-[#232323] border-l-4 border-[#00642b] pl-3">Shop Products</h1>

    <!-- Search and filter section -->
    <div class="bg-white p-6 rounded-lg mb-8 shadow-md border border-gray-100">
      <div class="flex flex-col md:flex-row gap-4 mb-4">
        <div class="flex-grow relative">
          <input v-model="searchTerm" type="text" placeholder="Search products..."
            class="w-full p-3 border border-gray-300 rounded-md pl-10 focus:outline-none focus:ring-2 focus:ring-[#00642b] focus:border-transparent text-base" />
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <div class="md:w-1/4">
          <select v-model="selectedCollection"
            class="w-full p-3 border border-gray-300 rounded-md appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-[#00642b] focus:border-transparent text-base">
            <option value="">All Collections</option>
            <option v-for="collection in availableCollections" :key="collection" :value="collection">
              {{ collection }}
            </option>
          </select>
        </div>
        <button @click="resetFilters"
          class="px-6 py-3 bg-gray-100 border border-gray-300 rounded-md font-medium hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-[#00642b] focus:ring-opacity-50">
          Reset
        </button>
      </div>
      <div v-if="searchTerm || selectedCollection" class="text-sm text-gray-600 mt-2">
        <p>
          Showing <span class="font-bold">{{ filteredProducts.length }}</span>
          {{ filteredProducts.length === 1 ? 'product' : 'products' }}
          {{ selectedCollection ? `in "${selectedCollection}"` : '' }}
          {{ searchTerm ? `matching "${searchTerm}"` : '' }}
        </p>
      </div>
    </div>

    <!-- Loading, error and empty states -->
    <div v-if="loading" class="py-16 text-center">
      <svg class="animate-spin h-10 w-10 mx-auto text-[#00642b]" xmlns="http://www.w3.org/2000/svg" fill="none"
        viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
        </path>
      </svg>
      <p class="mt-4 text-lg text-gray-600">Loading products...</p>
    </div>
    <div v-else-if="error" class="py-16 text-center text-red-600 font-bold">{{ error }}</div>
    <div v-else-if="products.length === 0" class="py-16 text-center text-gray-600 text-lg">No products found</div>
    <div v-else-if="filteredProducts.length === 0" class="py-16 text-center text-gray-600 text-lg">
      No products match your search criteria
    </div>

    <!-- Product grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      <div v-for="product in filteredProducts" :key="product.id"
        class="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100">
        <router-link :to="`/product/${product.id}`" class="block no-underline text-current">
          <!-- Image container with fixed aspect ratio -->
          <div class="relative w-full pb-[100%] overflow-hidden bg-gray-50">
            <img v-if="getImageUrl(product)" :src="getImageUrl(product)" :alt="product.title"
              class="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-500">
            <div v-else
              class="absolute inset-0 w-full h-full flex items-center justify-center bg-gray-100 text-gray-600">
              No Image Available
            </div>
          </div>
          <div class="p-4">
            <h3 class="text-lg font-medium truncate text-[#232323] mb-1">{{ product.title }}</h3>
            <p class="font-bold text-xl text-[#00642b]">{{ getPrice(product) }} €</p>

            <!-- Display collections if available -->
            <div v-if="getCollections(product).length > 0" class="flex flex-wrap gap-2 mt-3">
              <span v-for="(collection, index) in getCollections(product)" :key="index"
                class="bg-gray-100 py-1 px-2 rounded-full text-xs text-gray-700 cursor-pointer transition hover:bg-gray-200"
                :class="{ 'bg-[#00642b] text-white hover:bg-[#00642b]': collection === selectedCollection }"
                @click.prevent="selectedCollection = collection">
                {{ collection }}
              </span>
            </div>
          </div>
        </router-link>
        <div class="p-4 pt-0 mt-auto">
          <button @click="addToWishlist(product.id)"
            class="w-full py-3 bg-[#00642b] text-white rounded-md cursor-pointer
                 uppercase text-sm font-medium tracking-wide
                 transition-colors duration-300 hover:bg-[#232323] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00642b]">
            Add to Wishlist
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
