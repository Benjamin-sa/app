import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";

// Lazy load components for better performance
const HomeView = () => import("@/views/HomeView.vue");
const ForumView = () => import("@/views/forum/ForumView.vue");
const TopicView = () => import("@/views/forum/TopicView.vue");
const ProductsView = () => import("@/views/products/ProductsView.vue");
const ProductView = () => import("@/views/products/SingleProductView.vue");
const ProfileView = () => import("@/views/user/ProfileView.vue");
const LoginView = () => import("@/views/auth/LoginView.vue");
const RegisterView = () => import("@/views/auth/RegisterView.vue");
const NotFoundView = () => import("@/views/NotFoundView.vue");
const BikeGalleryView = () => import("@/views/bikes/BikeGalleryView.vue");
const BikeDetailView = () => import("@/views/bikes/BikeDetailView.vue");
const MessagesView = () => import("@/views/messaging/MessagesView.vue");
const routes = [
  {
    path: "/",
    name: "Home",
    component: HomeView,
    meta: {
      title: "Motordash - Motorcycle Community",
      guest: true, // Allows access without authentication
    },
  },
  {
    path: "/forum",
    name: "Forum",
    component: ForumView,
    meta: {
      title: "Forum - Motordash",
      guest: true,
    },
  },
  {
    path: "/forum/topic/:id",
    name: "Topic",
    component: TopicView,
    meta: {
      title: "Topic - Motordash",
    },
  },
  {
    path: "/products",
    name: "Products",
    component: ProductsView,
    meta: {
      title: "Products - Motordash",
    },
  },
  {
    path: "/products/:id",
    name: "Product",
    component: ProductView,
    meta: {
      title: "Product - Motordash",
    },
  },
  {
    path: "/profile",
    name: "MyProfile",
    component: ProfileView,
    meta: {
      requiresAuth: true,
      title: "My Profile - Motordash",
    },
  },
  {
    path: "/user/:id",
    name: "UserProfile",
    component: ProfileView,
    meta: {
      title: "User Profile - Motordash",
    },
  },
  {
    path: "/login",
    name: "Login",
    component: LoginView,
    meta: {
      guest: true,
      title: "Login - Motordash",
    },
  },
  {
    path: "/register",
    name: "Register",
    component: RegisterView,
    meta: {
      guest: true,
      title: "Register - Motordash",
    },
  },
  {
    path: "/bikes",
    name: "BikeGallery",
    component: BikeGalleryView,
    meta: {
      title: "Bike Gallery",
      guest: true,
    },
  },
  {
    path: "/bikes/:id",
    name: "BikeDetail",
    component: BikeDetailView,
    meta: {
      title: "Bike Details - Motordash",
      guest: true,
    },
  },
  {
    path: "/messages",
    name: "Messages",
    component: MessagesView,
    meta: {
      title: "Messages - Motordash",
      guest: true,
    },
  },

  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: NotFoundView,
    meta: {
      title: "Page Not Found - Motordash",
    },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else if (to.hash) {
      return { el: to.hash };
    } else {
      return { top: 0 };
    }
  },
});

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  // Initialize auth store if not already done
  if (!authStore.initialized) {
    await authStore.initialize();
  }

  // Set page title
  if (to.meta.title) {
    document.title = to.meta.title;
  }

  next();
});

// Handle navigation errors
router.onError((error) => {
  console.error("Router error:", error);
});

export default router;
