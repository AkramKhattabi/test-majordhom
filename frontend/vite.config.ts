// Configuration du serveur de développement Vite.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // Plugin React (JSX/Fast Refresh) + plugin Tailwind CSS v4.
  plugins: [react(), tailwindcss()],
  server: {
    // En développement, le frontend (Vite) tourne sur un port et l'API
    // FastAPI sur un autre (8001). Sans ce proxy, le navigateur bloquerait
    // les requêtes vers l'API à cause du CORS. Ici, toute requête vers
    // "/api/..." faite par le frontend est transparentement redirigée
    // vers "http://localhost:8001/api/...".
    proxy: {
      "/api": "http://localhost:8001",
    },
  },
});