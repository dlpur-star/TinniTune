import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/TinniTune/', // GitHub Pages requires repo name as base path
  assetsInclude: ['**/*.PNG'], // Support uppercase .PNG file extensions
})
