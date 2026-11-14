import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./", // relative paths so the built app also loads from a file in Electron
  server: { port: 5173, strictPort: true },
});
