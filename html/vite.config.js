import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';
import { visualizer } from 'rollup-plugin-visualizer';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  base: '/',
  
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    
    // Multi-page app configuration
    rollupOptions: {
      // Advanced tree-shaking
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false
      },

      input: {
        main: resolve(__dirname, 'index.html'),
        analytics: resolve(__dirname, 'analytics.html'),
        auth: resolve(__dirname, 'auth.html'),
        authEnhanced: resolve(__dirname, 'auth-enhanced.html'),
        bridge: resolve(__dirname, 'bridge.html'),
        commissionSystem: resolve(__dirname, 'commission-system.html'),
        configuracion: resolve(__dirname, 'configuracion.html'),
        contact: resolve(__dirname, 'contact.html'),
        documentation: resolve(__dirname, 'documentation.html'),
        governance: resolve(__dirname, 'governance.html'),
        helpCenter: resolve(__dirname, 'help-center.html'),
        homeDashboard: resolve(__dirname, 'home-dashboard.html'),
        invitaciones: resolve(__dirname, 'invitaciones.html'),
        kycRegistration: resolve(__dirname, 'kyc-registration.html'),
        lending: resolve(__dirname, 'lending.html'),
        ltdTokenEconomics: resolve(__dirname, 'ltd-token-economics.html'),
        marketplaceSocial: resolve(__dirname, 'marketplace-social.html'),
        miPerfil: resolve(__dirname, 'mi-perfil.html'),
        myTandas: resolve(__dirname, 'my-tandas.html'),
        nftMemberships: resolve(__dirname, 'nft-memberships.html'),
        roadmapTracker: resolve(__dirname, 'ROADMAP-TRACKER.html'),
        seguridad: resolve(__dirname, 'seguridad.html'),
        staking: resolve(__dirname, 'staking.html'),
        trading: resolve(__dirname, 'trading.html'),
        transacciones: resolve(__dirname, 'transacciones.html'),
        web3Dashboard: resolve(__dirname, 'web3-dashboard.html'),
        whitepaper: resolve(__dirname, 'whitepaper.html'),
        monitoringDashboard: resolve(__dirname, 'monitoring-dashboard.html')
      },

      output: {
        // Code splitting configuration - OPTIMIZED for smaller chunks
        manualChunks(id) {
          // Split node_modules into separate vendor chunks by library
          if (id.includes('node_modules')) {
            // Web3 libraries (large)
            if (id.includes('web3') || id.includes('ethers')) {
              return 'vendor-web3';
            }
            // Chart/visualization libraries
            if (id.includes('chart') || id.includes('d3')) {
              return 'vendor-charts';
            }
            // UI frameworks
            if (id.includes('react') || id.includes('vue')) {
              return 'vendor-ui';
            }
            // Utility libraries
            if (id.includes('lodash') || id.includes('moment') || id.includes('dayjs')) {
              return 'vendor-utils';
            }
            // Everything else
            return 'vendor-common';
          }

          // Separate large application JS files into individual chunks
          if (id.includes('groups-advanced-system.js')) {
            return 'groups-system-chunk';
          }
          if (id.includes('web3-dashboard.js')) {
            return 'web3-dashboard-chunk';
          }
          if (id.includes('api-server-database.js')) {
            return 'api-database-chunk';
          }
          if (id.includes('api-proxy-enhanced.js')) {
            return 'api-proxy-chunk';
          }
          if (id.includes('tandas-manager.js')) {
            return 'tandas-manager-chunk';
          }
          if (id.includes('shared-components.js')) {
            return 'shared-components-chunk';
          }
          if (id.includes('commission-system.js')) {
            return 'commission-chunk';
          }
          if (id.includes('contract-abis.js')) {
            return 'contract-abis-chunk';
          }
          if (id.includes('marketplace-social.js')) {
            return 'marketplace-chunk';
          }
          if (id.includes('value-propositions-engine.js')) {
            return 'value-props-chunk';
          }
        },
        
        // Asset file naming with better organization
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/woff|woff2|eot|ttf|otf/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[ext]/[name]-[hash][extname]`;
        }
      }
    },
    
    // Enhanced minification settings
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
        passes: 2,
        unsafe_arrows: true,
        unsafe_methods: true,
        unsafe_proto: true,
        keep_fargs: false,
        toplevel: true
      },
      mangle: {
        toplevel: true,
        safari10: true
      },
      format: {
        comments: false,
        ecma: 2020
      }
    },
    
    // Build optimization - ENHANCED
    cssCodeSplit: true,
    cssMinify: true,
    sourcemap: false,

    // Reduce chunk size warnings threshold
    chunkSizeWarningLimit: 400,

    // Target modern browsers for smaller bundles
    target: 'es2015',

    // Optimize deps
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    }
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: [],
    exclude: []
  },
  
  // Development server configuration
  server: {
    port: 5173,
    strictPort: false,
    host: true,
    open: false
  },
  
  // Preview server configuration
  preview: {
    port: 4173,
    strictPort: false,
    host: true
  },
  
  // Plugin configuration
  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11'],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
      renderLegacyChunks: true,
      modernPolyfills: true
    }),
    visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
      template: 'treemap'
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'assets/**/*'],
      manifest: {
        name: 'La Tanda - Ecosistema Financiero',
        short_name: 'La Tanda',
        description: 'Plataforma cooperativa de ahorro inteligente para Honduras',
        theme_color: '#2E86AB',
        background_color: '#1a365d',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait-primary',
        lang: 'es',
        categories: ['finance', 'productivity', 'business'],
        icons: [
          {
            src: '/assets/images/pwa-64x64.svg',
            sizes: '64x64',
            type: 'image/svg+xml'
          },
          {
            src: '/assets/images/pwa-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: '/assets/images/pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: '/assets/images/maskable-icon-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
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
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/cdnjs\.cloudflare\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cdn-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 5 // 5 minutes
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          }
        ],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true
      },
      devOptions: {
        enabled: false
      }
    })
  ],
  
  // Resolve configuration
  resolve: {
    extensions: ['.js', '.json', '.html']
  }
});
