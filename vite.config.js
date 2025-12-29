import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // Changed from '/TinniTune/' for Netlify deployment
  assetsInclude: ['**/*.PNG'], // Support uppercase .PNG file extensions
})
