import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Use different base paths for different platforms:
  // - GitHub Pages: /TinniTune/ (serves from username.github.io/TinniTune/)
  // - Netlify: / (serves from root domain)
  base: process.env.GITHUB_PAGES === 'true' ? '/TinniTune/' : '/',
  assetsInclude: ['**/*.PNG'], // Support uppercase .PNG file extensions
})
