import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// En local, l'app est servie à la racine (/). Sur GitHub Pages, elle est servie
// sous /radon_laveur/ : le workflow de déploiement fournit ce chemin via BASE_PATH.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
})
