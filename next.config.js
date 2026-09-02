// next.config.js
const withPWA = require("@ducanh2912/next-pwa")({
  dest: 'public',               // where the service worker & manifest will be generated
  register: true,               // automatically register the SW
  skipWaiting: true,            // activates new SW immediately
  disable: process.env.NODE_ENV === 'development', // disable PWA in dev for easier debugging
  runtimeCaching: [
    // cache the moon image (high-res PNG) – cache first
    {
      urlPattern: /\.(png|webp|svg)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'moon-images',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
    // cache API responses (your /api/route) – network first with fallback to cache
    {
      urlPattern: /^\/api\/.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60, // 1 day
        },
      },
    },
    // cache other static assets (JS, CSS, fonts)
    {
      urlPattern: /^\/_next\/static/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-assets',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        },
      },
    },
  ],
})

module.exports = withPWA({
  // your existing Next.js config (if any) goes here
  reactStrictMode: true,
  // ... any other config
})