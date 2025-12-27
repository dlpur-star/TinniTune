# TinniTune PWA Deployment Guide

## Overview

TinniTune is now configured as a Progressive Web App (PWA)! This means users can:
- Install the app on their device (mobile or desktop)
- Use it offline
- Get a native app-like experience
- Receive faster load times through caching

## Building the PWA

Before deploying, build your production-ready PWA:

```bash
npm run build
```

This creates an optimized production build in the `dist` folder.

## Hosting Options

### 1. Vercel (Recommended - Free & Easy)

**Pros**: Zero configuration, automatic HTTPS, global CDN, free tier
**Steps**:
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel` in your project directory
3. Follow the prompts
4. Done! Your PWA is live

**Or via GitHub**:
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Vercel auto-detects Vite and deploys

**Note**: Update `vite.config.js` base to `/` for Vercel:
```js
export default defineConfig({
  plugins: [react()],
  base: '/', // Change from '/TinniTune/'
})
```

### 2. Netlify (Also Free & Easy)

**Pros**: Similar to Vercel, great free tier, form handling, serverless functions
**Steps**:
1. Drag and drop your `dist` folder to [app.netlify.com/drop](https://app.netlify.com/drop)
2. Or use Netlify CLI:
   ```bash
   npm i -g netlify-cli
   netlify deploy --prod
   ```

**Via GitHub**:
1. Connect your GitHub repo at [netlify.com](https://netlify.com)
2. Build command: `npm run build`
3. Publish directory: `dist`

### 3. GitHub Pages (Free, Current Setup)

Your `vite.config.js` is already configured for GitHub Pages with `base: '/TinniTune/'`

**Steps**:
1. Build: `npm run build`
2. Install gh-pages: `npm install -D gh-pages`
3. Add to `package.json`:
   ```json
   "scripts": {
     "deploy": "npm run build && gh-pages -d dist"
   }
   ```
4. Run: `npm run deploy`
5. Enable GitHub Pages in repo settings (source: gh-pages branch)

**URL**: `https://yourusername.github.io/TinniTune/`

### 4. Firebase Hosting (Google's Free Tier)

**Pros**: Google infrastructure, great for PWAs, includes analytics
**Steps**:
1. Install Firebase CLI: `npm i -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init hosting`
   - Public directory: `dist`
   - Single-page app: Yes
4. Deploy: `firebase deploy`

### 5. Cloudflare Pages (Free)

**Pros**: Fastest global CDN, unlimited bandwidth, free tier
**Steps**:
1. Go to [pages.cloudflare.com](https://pages.cloudflare.com)
2. Connect your GitHub repo
3. Build command: `npm run build`
4. Build output: `dist`
5. Deploy!

### 6. Self-Hosting (VPS/Server)

If you have your own server:

**Using Nginx**:
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**Using Apache**:
```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    DocumentRoot /path/to/dist

    <Directory /path/to/dist>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted

        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
</VirtualHost>
```

## Important Notes

### HTTPS Requirement
PWAs **require HTTPS** to work properly (service workers won't register on HTTP). All the hosting options above provide automatic HTTPS except self-hosting (you'll need to set up SSL certificates, e.g., with Let's Encrypt).

### Testing Your PWA

After deployment:
1. Open your site in Chrome/Edge
2. Open DevTools (F12) → Application tab
3. Check "Service Workers" - should show registered
4. Check "Manifest" - should show your app info
5. Look for "Install" button in browser address bar

### Custom Icons

The PWA currently uses placeholder icons (`icon-192.png` and `icon-512.png`).

To replace with your own:
1. Create 192x192 and 512x512 PNG icons
2. Replace files in `/public/` directory
3. Rebuild: `npm run build`

### Offline Functionality

The service worker caches:
- App shell (HTML, CSS, JS)
- Static assets
- Previous page visits

Users can use the app even without internet after first visit!

## Recommended: Vercel or Netlify

For the easiest deployment with zero configuration:
- **Vercel**: Best for Vite/React apps
- **Netlify**: Great all-rounder

Both offer:
- Automatic deployments on git push
- Free SSL certificates
- Global CDN
- Preview deployments for PRs
- Custom domains (free)

## Questions?

Need help deploying? Let me know which hosting platform you'd like to use and I can provide more detailed instructions!
