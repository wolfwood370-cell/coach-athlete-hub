import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// Path alias `@/...` → `src/...`
// Usato da pages e componenti per import puliti.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
