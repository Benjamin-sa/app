import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {},
    {
      path: '/products',
      name: 'products',
      component: () => import('../views/ProductsView.vue'),
    },
    {
      path: '/wishlist',
      name: 'wishlist',
      component: () => import('../views/WishlistView.vue'),
    },
    {
      path: '/product/:id',
      name: 'product-detail',
      component: () => import('../views/ProductDetailView.vue'),
    },
    {
      path: '/auth-success',
      name: 'auth-success',
      component: () => import('../views/AuthSuccess.vue'),
    },
    {
      path: '/parts-viewer',
      name: 'parts-viewer',
      component: () => import('../views/PartsViewerView.vue'),
    },
  ],
})

export default router
