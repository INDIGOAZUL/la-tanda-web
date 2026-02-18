/**
 * 🔔 LA TANDA TOAST NOTIFICATION SYSTEM
 * Modern, user-friendly notifications
 * Version: 1.0.0
 * Date: October 27, 2025
 */

class ToastNotificationSystem {
    constructor() {
        this.container = null;
        this.queue = [];
        // 🔧 FIX: Detect mobile and reduce max visible toasts to prevent invasive bubbles
        this.maxVisible = window.innerWidth <= 768 ? 1 : 3;
        this.defaultDuration = 5000;
        this.init();

        // 🔧 FIX: Update maxVisible on window resize
        window.addEventListener('resize', () => {
            const newMaxVisible = window.innerWidth <= 768 ? 1 : 3;
            if (newMaxVisible !== this.maxVisible) {
                this.maxVisible = newMaxVisible;
                this.processQueue();  // Re-process queue with new limit
            }
        });
    }

    init() {
        // Create container if it doesn't exist
        if (!document.getElementById('toast-container')) {
            const container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            document.body.appendChild(container);
            this.container = container;
        } else {
            this.container = document.getElementById('toast-container');
        }
        
        console.log('✅ Toast Notification System initialized');
    }

    /**
     * Show a toast notification
     * @param {string} message - The message to display
     * @param {string} type - Type: 'success', 'error', 'warning', 'info'
     * @param {number} duration - Duration in milliseconds (0 = manual close only)
     * @param {object} options - Additional options
     */
    show(message, type = 'info', duration = this.defaultDuration, options = {}) {
        const toast = {
            id: 'toast_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            message,
            type,
            duration,
            options
        };

        this.queue.push(toast);
        this.processQueue();

        return toast.id;
    }

    processQueue() {
        const visibleToasts = this.container.querySelectorAll('.toast:not(.toast-hiding)');
        
        if (visibleToasts.length < this.maxVisible && this.queue.length > 0) {
            const toast = this.queue.shift();
            this.renderToast(toast);
        }
    }

    renderToast(toast) {
        const toastElement = document.createElement('div');
        toastElement.className = `toast toast-${toast.type}`;
        toastElement.id = toast.id;
        toastElement.setAttribute('role', 'alert');
        toastElement.setAttribute('aria-live', 'polite');

        // Icon based on type
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };

        const icon = icons[toast.type] || icons.info;

        toastElement.innerHTML = `
            <div class="toast-content">
                <i class="fas ${icon} toast-icon"></i>
                <div class="toast-message">${this.escapeHtml(toast.message)}</div>
                <button class="toast-close" aria-label="Close notification">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            ${toast.options.action ? `
                <div class="toast-action">
                    <button class="toast-action-btn">${toast.options.action.text}</button>
                </div>
            ` : ''}
            ${toast.duration > 0 ? `
                <div class="toast-progress">
                    <div class="toast-progress-bar" style="animation-duration: ${toast.duration}ms;"></div>
                </div>
            ` : ''}
        `;

        // Add to container
        this.container.appendChild(toastElement);

        // Trigger animation
        setTimeout(() => {
            toastElement.classList.add('toast-visible');
        }, 10);

        // Close button handler
        const closeBtn = toastElement.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            this.hideToast(toast.id);
        });

        // Action button handler
        if (toast.options.action) {
            const actionBtn = toastElement.querySelector('.toast-action-btn');
            actionBtn.addEventListener('click', () => {
                toast.options.action.onClick();
                this.hideToast(toast.id);
            });
        }

        // Auto-dismiss
        if (toast.duration > 0) {
            setTimeout(() => {
                this.hideToast(toast.id);
            }, toast.duration);
        }

        // Process next in queue after animation
        setTimeout(() => {
            this.processQueue();
        }, 200);
    }

    hideToast(toastId) {
        const toastElement = document.getElementById(toastId);
        if (!toastElement) return;

        toastElement.classList.add('toast-hiding');
        toastElement.classList.remove('toast-visible');

        setTimeout(() => {
            if (toastElement.parentNode) {
                toastElement.parentNode.removeChild(toastElement);
            }
            this.processQueue();
        }, 300);
    }

    // Convenience methods
    success(message, duration, options) {
        return this.show(message, 'success', duration, options);
    }

    error(message, duration, options) {
        return this.show(message, 'error', duration, options);
    }

    warning(message, duration, options) {
        return this.show(message, 'warning', duration, options);
    }

    info(message, duration, options) {
        return this.show(message, 'info', duration, options);
    }

    // Clear all toasts
    clearAll() {
        const toasts = this.container.querySelectorAll('.toast');
        toasts.forEach(toast => {
            this.hideToast(toast.id);
        });
        this.queue = [];
    }

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
}

// Initialize global instance
if (typeof window !== 'undefined') {
    window.toastSystem = new ToastNotificationSystem();

    // Convenience global functions
    window.showToast = (message, type = 'info', duration, options) => {
        return window.toastSystem.show(message, type, duration, options);
    };

    window.showSuccess = (message, duration, options) => {
        return window.toastSystem.success(message, duration, options);
    };

    window.showError = (message, duration, options) => {
        return window.toastSystem.error(message, duration, options);
    };

    window.showWarning = (message, duration, options) => {
        return window.toastSystem.warning(message, duration, options);
    };

    window.showInfo = (message, duration, options) => {
        return window.toastSystem.info(message, duration, options);
    };

    console.log('✅ Toast Notification System ready! Use showToast(), showSuccess(), showError(), showWarning(), showInfo()');
}
