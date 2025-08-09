import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import "./style.css";
import { createI18n } from "vue-i18n";
import en from "./locales/en.json";
import nl from "./locales/nl.json";

// Load preferred locale from localStorage or default to 'en'
const storedLocale =
  typeof window !== "undefined" ? localStorage.getItem("locale") : null;
const defaultLocale = storedLocale === "nl" ? "nl" : "en";

const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: defaultLocale,
  fallbackLocale: "en",
  messages: {
    en,
    nl,
  },
});

// Create Vue app
const app = createApp(App);

// Expose a small helper to change language globally
app.config.globalProperties.$setLocale = (locale) => {
  if (!["en", "nl"].includes(locale)) return;
  i18n.global.locale.value = locale;
  try {
    localStorage.setItem("locale", locale);
  } catch {}
};

// Create Pinia store
const pinia = createPinia();

// Use plugins
app.use(pinia);
app.use(router);
app.use(i18n);

// Mount app
app.mount("#app");
