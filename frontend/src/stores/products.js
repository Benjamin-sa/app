import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { apiService } from "@/services/api.service";

export const useProductStore = defineStore("products", () => {
  // State
  const products = ref(new Map()); // Map<productId, product>
  const collections = ref(new Map()); // Map<collectionId, collection>
  const productsByCollection = ref(new Map()); // Map<collectionHandle, productIds[]>
  const searchResults = ref([]);
  const relatedProducts = ref(new Map()); // Map<productId, relatedProducts[]>

  // Loading states
  const loading = ref(false);
  const loadingStates = ref(new Map()); // Map<operation, boolean>
  const loadingProducts = ref(false);
  const loadingCollections = ref(false);
  const loadingSearch = ref(false);

  // Filters and search
  const searchQuery = ref("");
  const selectedCategory = ref("");
  const activeFilters = ref({
    priceRange: { min: null, max: null },
    collections: [],
    sortBy: "newest",
  });

  // Error handling
  const error = ref(null);

  // Getters
  const getProduct = computed(() => {
    return (productId) => products.value.get(productId) || null;
  });

  const getCollection = computed(() => {
    return (collectionId) => collections.value.get(collectionId) || null;
  });

  const getProductsByCollectionHandle = computed(() => {
    return (collectionHandle) => {
      const productIds = productsByCollection.value.get(collectionHandle) || [];
      return productIds.map((id) => products.value.get(id)).filter(Boolean);
    };
  });

  const getRelatedProducts = computed(() => {
    return (productId) => relatedProducts.value.get(productId) || [];
  });

  const getAllProducts = computed(() => {
    return Array.from(products.value.values());
  });

  const getAllCollections = computed(() => {
    return Array.from(collections.value.values());
  });

  const getFilteredProducts = computed(() => {
    let filteredProducts = getAllProducts.value;

    // Apply search filter
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase();
      filteredProducts = filteredProducts.filter(
        (product) =>
          product.title?.toLowerCase().includes(query) ||
          product.description?.toLowerCase().includes(query)
      );
    }

    // Apply collection filter
    if (selectedCategory.value) {
      filteredProducts = getProductsByCollectionHandle.value(
        selectedCategory.value
      );
    }

    // Apply price range filter
    if (
      activeFilters.value.priceRange.min !== null ||
      activeFilters.value.priceRange.max !== null
    ) {
      filteredProducts = filteredProducts.filter((product) => {
        const price = parseFloat(product.price);
        const { min, max } = activeFilters.value.priceRange;
        return (min === null || price >= min) && (max === null || price <= max);
      });
    }

    // Apply collection filters
    if (activeFilters.value.collections.length > 0) {
      filteredProducts = filteredProducts.filter((product) =>
        product.collections?.some((collection) =>
          activeFilters.value.collections.includes(collection.handle)
        )
      );
    }

    // Apply sorting
    switch (activeFilters.value.sortBy) {
      case "price-low":
        filteredProducts.sort(
          (a, b) => parseFloat(a.price) - parseFloat(b.price)
        );
        break;
      case "price-high":
        filteredProducts.sort(
          (a, b) => parseFloat(b.price) - parseFloat(a.price)
        );
        break;
      case "title":
        filteredProducts.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "newest":
      default:
        // Keep original order (assuming products come from API in newest order)
        break;
    }

    return filteredProducts;
  });

  const isLoading = computed(() => {
    return (operation) => loadingStates.value.get(operation) || false;
  });

  const hasProducts = computed(() => products.value.size > 0);

  const hasCollections = computed(() => collections.value.size > 0);

  // Actions
  const setError = (errorMessage) => {
    error.value = errorMessage;
  };

  const clearError = () => {
    error.value = null;
  };

  const setLoading = (operation, isLoading) => {
    if (isLoading) {
      loadingStates.value.set(operation, true);
    } else {
      loadingStates.value.delete(operation);
    }
  };

  const setProduct = (product) => {
    if (product && product.id) {
      products.value.set(product.id, product);
    }
  };

  const setProducts = (productsList) => {
    productsList.forEach((product) => {
      if (product && product.id) {
        products.value.set(product.id, product);
      }
    });
  };

  const setCollection = (collection) => {
    if (collection && collection.id) {
      collections.value.set(collection.id, collection);
    }
  };

  const setCollections = (collectionsList) => {
    collectionsList.forEach((collection) => {
      if (collection && collection.id) {
        collections.value.set(collection.id, collection);
      }
    });
  };

  const setProductsByCollection = (collectionHandle, productsList) => {
    const productIds = productsList.map((product) => product.id);
    productsByCollection.value.set(collectionHandle, productIds);
    setProducts(productsList);
  };

  const setRelatedProducts = (productId, relatedProductsList) => {
    relatedProducts.value.set(productId, relatedProductsList);
    setProducts(relatedProductsList);
  };

  // API Actions
  const loadAllProducts = async (limit = 50) => {
    try {
      setLoading("loadAllProducts", true);
      clearError();

      const response = await apiService.client.get("/products/with-images", {
        params: { limit },
      });

      const productsList =
        response.success && Array.isArray(response.data) ? response.data : [];
      setProducts(productsList);

      return productsList;
    } catch (err) {
      console.error("Error loading products:", err);
      setError("Failed to load products");
      return [];
    } finally {
      setLoading("loadAllProducts", false);
    }
  };

  const loadProduct = async (productId) => {
    try {
      setLoading(`loadProduct_${productId}`, true);
      clearError();

      // Check if we already have this product
      const existingProduct = getProduct.value(productId);
      if (existingProduct) {
        return existingProduct;
      }

      const response = await apiService.client.get(
        `/products/${productId}/with-images`
      );
      const product = response.data || response;

      if (product) {
        setProduct(product);
        return product;
      }

      throw new Error("Product not found");
    } catch (err) {
      console.error(`Error loading product ${productId}:`, err);
      setError(`Failed to load product`);
      return null;
    } finally {
      setLoading(`loadProduct_${productId}`, false);
    }
  };

  const loadCollections = async () => {
    try {
      setLoading("loadCollections", true);
      clearError();

      const response = await apiService.get("/products/collections");
      const collectionsList =
        response.success && Array.isArray(response.data) ? response.data : [];

      setCollections(collectionsList);
      return collectionsList;
    } catch (err) {
      console.error("Error loading collections:", err);
      setError("Failed to load collections");
      return [];
    } finally {
      setLoading("loadCollections", false);
    }
  };

  const loadProductsByCollection = async (collectionHandle) => {
    try {
      setLoading(`loadProductsByCollection_${collectionHandle}`, true);
      clearError();

      // Check if we already have products for this collection
      const existingProducts =
        getProductsByCollectionHandle.value(collectionHandle);
      if (existingProducts.length > 0) {
        return existingProducts;
      }

      const response = await apiService.client.get(
        `/products/collection/${collectionHandle}`
      );
      const productsList =
        response.success && Array.isArray(response.data) ? response.data : [];

      setProductsByCollection(collectionHandle, productsList);
      return productsList;
    } catch (err) {
      console.error(
        `Error loading products for collection ${collectionHandle}:`,
        err
      );
      setError(`Failed to load products for collection`);
      return [];
    } finally {
      setLoading(`loadProductsByCollection_${collectionHandle}`, false);
    }
  };

  const loadRelatedProducts = async (productId, collectionHandle = null) => {
    try {
      setLoading(`loadRelatedProducts_${productId}`, true);
      clearError();

      // Check if we already have related products
      const existingRelated = getRelatedProducts.value(productId);
      if (existingRelated.length > 0) {
        return existingRelated;
      }

      // If we have a collection handle, load products from that collection
      if (collectionHandle) {
        const collectionProducts = await loadProductsByCollection(
          collectionHandle
        );
        const related = collectionProducts
          .filter((p) => p.id !== productId)
          .slice(0, 4);

        setRelatedProducts(productId, related);
        return related;
      }

      return [];
    } catch (err) {
      console.error(`Error loading related products for ${productId}:`, err);
      setError("Failed to load related products");
      return [];
    } finally {
      setLoading(`loadRelatedProducts_${productId}`, false);
    }
  };

  const searchProducts = async (query, limit = 50) => {
    try {
      setLoading("searchProducts", true);
      clearError();

      if (!query || query.trim().length < 2) {
        searchResults.value = [];
        return [];
      }

      const response = await apiService.client.get("/products/search", {
        params: { q: query.trim(), limit },
      });

      const results =
        response.success && Array.isArray(response.data) ? response.data : [];
      searchResults.value = results;
      setProducts(results);

      return results;
    } catch (err) {
      console.error("Error searching products:", err);
      setError("Failed to search products");
      searchResults.value = [];
      return [];
    } finally {
      setLoading("searchProducts", false);
    }
  };

  // Wishlist actions (these will interact with user store/auth)
  const toggleWishlist = async (productId) => {
    try {
      setLoading(`toggleWishlist_${productId}`, true);
      clearError();

      const product = getProduct.value(productId);
      if (!product) {
        throw new Error("Product not found");
      }

      const isCurrentlyInWishlist = product.isInWishlist;
      const endpoint = `/users/wishlist/${productId}`;

      const response = isCurrentlyInWishlist
        ? await apiService.client.delete(endpoint)
        : await apiService.client.post(endpoint);

      if (response.success) {
        // Update the product in our store
        const updatedProduct = {
          ...product,
          isInWishlist: !isCurrentlyInWishlist,
        };
        setProduct(updatedProduct);
        return !isCurrentlyInWishlist;
      }

      throw new Error("Failed to update wishlist");
    } catch (err) {
      console.error(`Error toggling wishlist for product ${productId}:`, err);
      setError("Failed to update wishlist");
      throw err;
    } finally {
      setLoading(`toggleWishlist_${productId}`, false);
    }
  };

  // Filter actions
  const setSearchQuery = (query) => {
    searchQuery.value = query;
  };

  const setSelectedCategory = (category) => {
    selectedCategory.value = category;
  };

  const setPriceRange = (min, max) => {
    activeFilters.value.priceRange = { min, max };
  };

  const setCollectionFilters = (collectionHandles) => {
    activeFilters.value.collections = collectionHandles;
  };

  const setSortBy = (sortBy) => {
    activeFilters.value.sortBy = sortBy;
  };

  const clearFilters = () => {
    searchQuery.value = "";
    selectedCategory.value = "";
    activeFilters.value = {
      priceRange: { min: null, max: null },
      collections: [],
      sortBy: "newest",
    };
  };

  const clearSearchResults = () => {
    searchResults.value = [];
  };

  // Utility actions
  const clearCache = () => {
    products.value.clear();
    collections.value.clear();
    productsByCollection.value.clear();
    relatedProducts.value.clear();
    searchResults.value = [];
    clearError();
  };

  const refreshData = async () => {
    clearCache();
    await Promise.all([loadAllProducts(), loadCollections()]);
  };

  return {
    // State
    products,
    collections,
    productsByCollection,
    searchResults,
    relatedProducts,
    loading,
    loadingStates,
    loadingProducts,
    loadingCollections,
    loadingSearch,
    searchQuery,
    selectedCategory,
    activeFilters,
    error,

    // Getters
    getProduct,
    getCollection,
    getProductsByCollectionHandle,
    getRelatedProducts,
    getAllProducts,
    getAllCollections,
    getFilteredProducts,
    isLoading,
    hasProducts,
    hasCollections,

    // Actions
    setError,
    clearError,
    setLoading,
    setProduct,
    setProducts,
    setCollection,
    setCollections,
    setProductsByCollection,
    setRelatedProducts,
    loadAllProducts,
    loadProduct,
    loadCollections,
    loadProductsByCollection,
    loadRelatedProducts,
    searchProducts,
    toggleWishlist,
    setSearchQuery,
    setSelectedCategory,
    setPriceRange,
    setCollectionFilters,
    setSortBy,
    clearFilters,
    clearSearchResults,
    clearCache,
    refreshData,
  };
});
