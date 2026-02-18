/**
 * La Tanda - Service Worker Registration
 * Registers and manages the PWA service worker
 */

(function() {
  'use strict';

  // Check if service workers are supported
  if (!('serviceWorker' in navigator)) {
    console.warn('⚠️ Service Workers not supported in this browser');
    return;
  }

  // Register service worker on page load
  window.addEventListener('load', () => {
    registerServiceWorker();
  });

  /**
   * Register the service worker
   */
  async function registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      });

      console.log('✅ [PWA] Service Worker registered:', registration.scope);

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('🔄 [PWA] Service Worker update found...');

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker available
            showUpdateNotification(newWorker);
          }
        });
      });

      // Check for updates every hour
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000);

    } catch (error) {
      console.error('❌ [PWA] Service Worker registration failed:', error);
    }
  }

  /**
   * Show update notification to user
   */
  function showUpdateNotification(worker) {
    // Only show once per SW version
    const SW_NOTIFY_KEY = "sw_update_version_shown";
    const currentVersion = "7.1.0"; // Update with SW version
    const lastShownVersion = localStorage.getItem(SW_NOTIFY_KEY);
    if (lastShownVersion === currentVersion) {
      console.log('[PWA] Update notification already shown for version ' + currentVersion);
      return;
    }
    localStorage.setItem(SW_NOTIFY_KEY, currentVersion);
    
    const updateUI = document.createElement('div');
    updateUI.id = 'sw-update-notification';
    updateUI.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      z-index: 10000;
      display: flex;
      align-items: center;
      gap: 16px;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      max-width: 90%;
      animation: slideUp 0.3s ease-out;
    `;

    updateUI.innerHTML = `
      <div style="flex: 1;">
        <div style="font-weight: 600; margin-bottom: 4px;">
          🎉 Nueva versión disponible
        </div>
        <div style="font-size: 14px; opacity: 0.9;">
          Actualiza para obtener las últimas mejoras
        </div>
      </div>
      <button id="sw-update-btn" style="
        background: white;
        color: #667eea;
        border: none;
        padding: 8px 16px;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.2s;
      ">
        Actualizar
      </button>
      <button id="sw-dismiss-btn" style="
        background: transparent;
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.3);
        padding: 8px 16px;
        border-radius: 8px;
        cursor: pointer;
        transition: opacity 0.2s;
      ">
        Después
      </button>
    `;

    // Add animation keyframes
    if (!document.getElementById('sw-animations')) {
      const style = document.createElement('style');
      style.id = 'sw-animations';
      style.textContent = `
        @keyframes slideUp {
          from {
            transform: translateX(-50%) translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
          }
        }
        #sw-update-btn:hover {
          transform: scale(1.05);
        }
        #sw-dismiss-btn:hover {
          opacity: 0.8;
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(updateUI);

    // Update button click
    document.getElementById('sw-update-btn').addEventListener('click', () => {
      worker.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    });

    // Dismiss button click
    document.getElementById('sw-dismiss-btn').addEventListener('click', () => {
      updateUI.remove();
    });
  }

  /**
   * Install prompt handling
   */
  let deferredPrompt;

  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing
    e.preventDefault();
    deferredPrompt = e;

    console.log('📱 [PWA] Install prompt available');

    // Show custom install button if it exists
    const installBtn = document.getElementById('pwa-install-btn');
    if (installBtn) {
      installBtn.style.display = 'block';
      installBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          console.log(`📱 [PWA] User response: ${outcome}`);
          deferredPrompt = null;
          installBtn.style.display = 'none';
        }
      });
    }
  });

  window.addEventListener('appinstalled', () => {
    console.log('✅ [PWA] App installed successfully');
    deferredPrompt = null;

    // Hide install button
    const installBtn = document.getElementById('pwa-install-btn');
    if (installBtn) {
      installBtn.style.display = 'none';
    }

    // Show success message
    if (typeof showNotification === 'function') {
      showNotification('¡App instalada! Ahora puedes usarla offline.', 'success');
    }
  });

  /**
   * Connection status monitoring
   */
  window.addEventListener('online', () => {
    console.log('🌐 [PWA] Back online');
    if (typeof showNotification === 'function') {
      showNotification('Conexión restaurada', 'info', 3000);
    }
  });

  window.addEventListener('offline', () => {
    console.log('📡 [PWA] Offline mode');
    if (typeof showNotification === 'function') {
      showNotification('Modo offline activado', 'warning', 3000);
    }
  });

  /**
   * Expose service worker utilities globally
   */
  window.LaTandaPWA = {
    /**
     * Check if app is running as installed PWA
     */
    isInstalled: () => {
      return window.matchMedia('(display-mode: standalone)').matches ||
             window.navigator.standalone === true;
    },

    /**
     * Get service worker registration
     */
    getRegistration: async () => {
      return await navigator.serviceWorker.getRegistration();
    },

    /**
     * Clear all caches
     */
    clearCache: async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && registration.active) {
        const messageChannel = new MessageChannel();
        return new Promise((resolve) => {
          messageChannel.port1.onmessage = (event) => {
            resolve(event.data.cleared);
          };
          registration.active.postMessage(
            { type: 'CLEAR_CACHE' },
            [messageChannel.port2]
          );
        });
      }
    },

    /**
     * Get service worker version
     */
    getVersion: async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && registration.active) {
        const messageChannel = new MessageChannel();
        return new Promise((resolve) => {
          messageChannel.port1.onmessage = (event) => {
            resolve(event.data.version);
          };
          registration.active.postMessage(
            { type: 'GET_VERSION' },
            [messageChannel.port2]
          );
        });
      }
    }
  };

  console.log('✅ [PWA] Service Worker registration script loaded');
  console.log('🌐 [PWA] Online status:', navigator.onLine);
  console.log('📱 [PWA] Is installed:', window.LaTandaPWA.isInstalled());

})();
