import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves from /TinniTune/ subdirectory
  base: '/TinniTune/',
  assetsInclude: ['**/*.PNG'], // Support uppercase .PNG file extensions
})
