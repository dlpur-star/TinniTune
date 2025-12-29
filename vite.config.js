import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Use environment variable for base path to support both Netlify (/) and GitHub Pages (/TinniTune/)
  base: process.env.VITE_BASE_PATH || '/',
  assetsInclude: ['**/*.PNG'], // Support uppercase .PNG file extensions
})
