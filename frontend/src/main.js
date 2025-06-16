import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import "./style.css";

// Import stores
import { useAuthStore } from "./stores/auth";
import { useNavbarStore } from "./stores/navbar";

// Create Vue app
const app = createApp(App);

// Create Pinia store
const pinia = createPinia();

// Use plugins
app.use(pinia);
app.use(router);

// Initialize stores
const authStore = useAuthStore();
const navbarStore = useNavbarStore();

// Mount app
app.mount("#app");
