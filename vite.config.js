import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      // Nécessaire pour être joignable via le tunnel HTTPS de VS Code (Ports
      // > Public) : sans ça, Vite rejette toute requête dont l'en-tête Host
      // n'est pas "localhost" avec "Blocked request. This host is not
      // allowed." Sans risque ici, ce n'est qu'un serveur de dev.
      allowedHosts: true,
      // Le backend (Render) ne renvoie pas d'en-têtes CORS pour localhost.
      // En dev, on passe par le serveur Vite (même origine côté navigateur)
      // qui relaie ensuite la requête côté serveur, hors contrainte CORS.
      proxy: {
        '/api': {
          target: env.VITE_API_PROXY_TARGET,
          changeOrigin: true,
          secure: true,
        },
      },
    },
  }
})
