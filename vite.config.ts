import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env variables for the current mode
  const env = loadEnv(mode, process.cwd(), '');
  const isProd = mode === 'production';
  
  return {
    plugins: [
      react(),
      VitePWA({
        strategies: 'injectManifest',
        registerType: 'autoUpdate',
        injectRegister: false, // We handle registration in main.tsx
        includeAssets: [
          'favicon.ico', 
          'apple-touch-icon.png', 
          'mask-icon.svg',
          'robots.txt',
          'pwa-192x192.png',
          'pwa-512x512.png'
        ],
        srcDir: 'public',
        filename: 'service-worker.js',
        manifest: {
          name: 'ADAPT Health',
          short_name: 'ADAPT',
          description: 'Your personal health coach',
          theme_color: '#007FFF',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          categories: ['health', 'fitness', 'lifestyle'],
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          // These options are passed to workbox-build
          globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,json,woff,woff2}'],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                }
              }
            },
            {
              urlPattern: /^https:\/\/tukucvihlyqdxehzeodv\.supabase\.co\/rest\/v1\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'supabase-api-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 7 // 1 week
                },
                networkTimeoutSeconds: 10
              }
            }
          ]
        }
      })
    ],
    server: {
      host: true, // Listen on all addresses
      port: 5173,
      strictPort: true, // Don't try other ports if 5173 is taken
      https: false as any,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, '/api'),
        },
      },
    },
    build: {
      target: 'esnext',
      minify: isProd ? 'terser' : false,
      sourcemap: isProd ? 'hidden' : true, // Generate sourcemaps but hide them in production
      terserOptions: isProd ? {
        compress: {
          drop_console: false, // Keep console.error for debugging
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.debug']
        }
      } : undefined,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-vendor': ['@iconify/react', 'lucide-react'],
            'date-vendor': ['date-fns'],
            'supabase-vendor': ['@supabase/supabase-js']
          }
        }
      }
    },
    optimizeDeps: {
      exclude: ['lucide-react']
    },
    define: {
      // Make environment variables available to the client
      // Only include safe variables that can be exposed to the client
      __APP_VERSION__: JSON.stringify(env.VITE_APP_VERSION || '0.1.0'),
      __BUILD_TIME__: JSON.stringify(env.VITE_BUILD_TIME || new Date().toISOString())
    }
  };
});
