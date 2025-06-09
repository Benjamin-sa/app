import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    host: "0.0.0.0", // Luistert naar alle netwerkinterfaces
    port: 5173, // Optioneel: specificeer een poort
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});
