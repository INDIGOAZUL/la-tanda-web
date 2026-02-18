/**
 * LoadingManager - Manages loading states for containers and buttons
 * Part of User Readiness Week 1, Day 3 Implementation
 */
class LoadingManager {
  constructor() {
    this.activeLoadings = new Map();
    this.init();
  }

  init() {
    console.log('✅ LoadingManager initialized');
  }

  /**
   * Show loading overlay on a container
   * @param {HTMLElement|string} target - Container element or selector
   * @param {string} message - Loading message to display
   */
  show(target, message = 'Cargando...') {
    const container = typeof target === 'string' ? document.querySelector(target) : target;

    if (!container) {
      console.warn('⚠️ LoadingManager: Container not found', target);
      return;
    }

    // Prevent duplicate overlays
    if (this.activeLoadings.has(container)) {
      return;
    }

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
      <div class="loading-content">
        <div class="spinner"></div>
        <p class="loading-message">${this.escapeHtml(message)}</p>
      </div>
    `;

    // Add to container
    container.style.position = 'relative';
    container.appendChild(overlay);

    // Track active loading
    this.activeLoadings.set(container, overlay);

    // Accessibility
    container.setAttribute('aria-busy', 'true');
  }

  /**
   * Hide loading overlay from a container
   * @param {HTMLElement|string} target - Container element or selector
   */
  hide(target) {
    const container = typeof target === 'string' ? document.querySelector(target) : target;

    if (!container) {
      return;
    }

    const overlay = this.activeLoadings.get(container);
    if (overlay && overlay.parentElement) {
      overlay.remove();
    }

    this.activeLoadings.delete(container);
    container.setAttribute('aria-busy', 'false');
  }

  /**
   * Show loading state on a button
   * @param {HTMLElement|string} button - Button element or selector
   * @param {string} message - Optional loading text
   */
  showButton(button, message = null) {
    const btn = typeof button === 'string' ? document.querySelector(button) : button;

    if (!btn) {
      console.warn('⚠️ LoadingManager: Button not found', button);
      return;
    }

    // Store original content
    if (!btn.dataset.originalContent) {
      btn.dataset.originalContent = btn.innerHTML;
    }

    // Apply loading state
    btn.classList.add('btn-loading');
    btn.disabled = true;

    if (message) {
      btn.innerHTML = `<span class="spinner spinner-sm"></span> ${this.escapeHtml(message)}`;
    }
  }

  /**
   * Hide loading state from a button
   * @param {HTMLElement|string} button - Button element or selector
   */
  hideButton(button) {
    const btn = typeof button === 'string' ? document.querySelector(button) : button;

    if (!btn) {
      return;
    }

    // Restore original content
    if (btn.dataset.originalContent) {
      btn.innerHTML = btn.dataset.originalContent;
      delete btn.dataset.originalContent;
    }

    // Remove loading state
    btn.classList.remove('btn-loading');
    btn.disabled = false;
  }

  /**
   * Hide all active loadings (cleanup)
   */
  hideAll() {
    this.activeLoadings.forEach((overlay, container) => {
      this.hide(container);
    });
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize global instance
window.loadingManager = new LoadingManager();

console.log('✅ LoadingManager loaded and available globally');
