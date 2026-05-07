import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://buestro.com",
  vite: {
    plugins: [tailwindcss()],
  },
});
