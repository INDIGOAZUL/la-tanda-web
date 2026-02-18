/**
 * Loading States Component
 * Handles all loading UI states across the dashboard
 * Version: 1.0.0
 * Date: November 1, 2025
 */

class LoadingStates {
    constructor() {
        this.activeLoaders = new Map();
        this.init();
    }

    init() {
        this.injectStyles();
    }

    /**
     * Show skeleton loader for a card
     * @param {string} cardId - ID of the card element
     * @param {number} rows - Number of skeleton rows (default: 3)
     */
    showCardSkeleton(cardId, rows = 3) {
        const card = document.getElementById(cardId);
        if (!card) {
            return;
        }

        // Store original content
        this.activeLoaders.set(cardId, card.innerHTML);

        // Generate skeleton HTML
        const skeletonHTML = `
            <div class="skeleton-loader">
                <div class="skeleton-header">
                    <div class="skeleton-circle"></div>
                    <div class="skeleton-line short"></div>
                </div>
                ${Array(rows).fill(0).map(() => `
                    <div class="skeleton-line"></div>
                `).join('')}
            </div>
        `;

        card.innerHTML = skeletonHTML;
        card.classList.add('loading-skeleton');

    }

    /**
     * Hide skeleton loader and restore content
     * @param {string} cardId - ID of the card element
     */
    hideCardSkeleton(cardId) {
        const card = document.getElementById(cardId);
        if (!card) return;

        const originalContent = this.activeLoaders.get(cardId);
        if (originalContent) {
            card.innerHTML = originalContent;
            card.classList.remove('loading-skeleton');
            this.activeLoaders.delete(cardId);
        }
    }

    /**
     * Show spinner on a button
     * @param {HTMLElement|string} button - Button element or ID
     * @param {string} text - Optional loading text
     */
    showButtonSpinner(button, text = 'Loading...') {
        const btn = typeof button === 'string' ? document.getElementById(button) : button;
        if (!btn) return;

        // Store original content
        const btnId = btn.id || `btn-${Date.now()}`;
        if (!btn.id) btn.id = btnId;

        this.activeLoaders.set(btnId, {
            html: btn.innerHTML,
            disabled: btn.disabled
        });

        // Add spinner
        btn.innerHTML = `
            <span class="btn-spinner">
                <i class="fas fa-spinner fa-spin"></i>
            </span>
            <span>${text}</span>
        `;
        btn.disabled = true;
        btn.classList.add('loading');

    }

    /**
     * Hide button spinner and restore content
     * @param {HTMLElement|string} button - Button element or ID
     */
    hideButtonSpinner(button) {
        const btn = typeof button === 'string' ? document.getElementById(button) : button;
        if (!btn) return;

        const btnId = btn.id;
        const original = this.activeLoaders.get(btnId);

        if (original) {
            btn.innerHTML = original.html;
            btn.disabled = original.disabled;
            btn.classList.remove('loading');
            this.activeLoaders.delete(btnId);
        }
    }

    /**
     * Show full page loader overlay
     * @param {string} message - Loading message
     */
    showPageLoader(message = 'Loading...') {
        // Remove existing overlay if any
        this.hidePageLoader();

        const overlay = document.createElement('div');
        overlay.id = 'pageLoaderOverlay';
        overlay.className = 'page-loader-overlay';
        overlay.innerHTML = `
            <div class="page-loader-content">
                <div class="loader-spinner">
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                </div>
                <p class="loader-message">${message}</p>
            </div>
        `;

        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';

        // Fade in
        setTimeout(() => overlay.classList.add('active'), 10);

    }

    /**
     * Hide full page loader overlay
     */
    hidePageLoader() {
        const overlay = document.getElementById('pageLoaderOverlay');
        if (overlay) {
            overlay.classList.remove('active');
            setTimeout(() => {
                overlay.remove();
                document.body.style.overflow = '';
            }, 300);
        }
    }

    /**
     * Show inline loader in an element
     * @param {string} elementId - ID of container element
     * @param {string} size - 'small', 'medium', 'large'
     */
    showInlineLoader(elementId, size = 'medium') {
        const element = document.getElementById(elementId);
        if (!element) return;

        this.activeLoaders.set(elementId, element.innerHTML);

        element.innerHTML = `
            <div class="inline-loader ${size}">
                <div class="loader-dots">
                    <span class="dot"></span>
                    <span class="dot"></span>
                    <span class="dot"></span>
                </div>
            </div>
        `;

    }

    /**
     * Hide inline loader and restore content
     * @param {string} elementId - ID of container element
     */
    hideInlineLoader(elementId) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const original = this.activeLoaders.get(elementId);
        if (original) {
            element.innerHTML = original;
            this.activeLoaders.delete(elementId);
        }
    }

    /**
     * Show progress bar
     * @param {string} containerId - ID of container element
     * @param {number} progress - Progress percentage (0-100)
     * @param {string} label - Optional label text
     */
    showProgressBar(containerId, progress = 0, label = '') {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!this.activeLoaders.has(containerId)) {
            this.activeLoaders.set(containerId, container.innerHTML);
        }

        container.innerHTML = `
            <div class="progress-container">
                ${label ? `<div class="progress-label">${label}</div>` : ''}
                <div class="progress-bar-wrapper">
                    <div class="progress-bar-fill" style="width: ${progress}%">
                        <span class="progress-percentage">${Math.round(progress)}%</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Update progress bar
     * @param {string} containerId - ID of container element
     * @param {number} progress - Progress percentage (0-100)
     */
    updateProgress(containerId, progress) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const fill = container.querySelector('.progress-bar-fill');
        const percentage = container.querySelector('.progress-percentage');

        if (fill && percentage) {
            fill.style.width = `${progress}%`;
            percentage.textContent = `${Math.round(progress)}%`;
        }
    }

    /**
     * Hide progress bar and restore content
     * @param {string} containerId - ID of container element
     */
    hideProgressBar(containerId) {
        this.hideInlineLoader(containerId);
    }

    /**
     * Add pulse animation to element
     * @param {string} elementId - ID of element
     */
    addPulseAnimation(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.add('pulse-animation');
        }
    }

    /**
     * Remove pulse animation from element
     * @param {string} elementId - ID of element
     */
    removePulseAnimation(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.remove('pulse-animation');
        }
    }

    /**
     * Show shimmer effect on element
     * @param {string} elementId - ID of element
     */
    addShimmerEffect(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.add('shimmer-effect');
        }
    }

    /**
     * Remove shimmer effect from element
     * @param {string} elementId - ID of element
     */
    removeShimmerEffect(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.remove('shimmer-effect');
        }
    }

    /**
     * Simulate loading for demo purposes
     * @param {Function} callback - Callback to execute
     * @param {number} duration - Duration in ms
     */
    simulateLoading(callback, duration = 2000) {
        setTimeout(callback, duration);
    }

    /**
     * Clear all active loaders
     */
    clearAll() {
        // Hide page loader
        this.hidePageLoader();

        // Restore all stored content
        this.activeLoaders.forEach((value, key) => {
            const element = document.getElementById(key);
            if (element) {
                if (typeof value === 'object' && value.html) {
                    // Button
                    element.innerHTML = value.html;
                    element.disabled = value.disabled;
                    element.classList.remove('loading');
                } else {
                    // Regular element
                    element.innerHTML = value;
                    element.classList.remove('loading-skeleton');
                }
            }
        });

        this.activeLoaders.clear();
    }

    /**
     * Inject CSS styles for loading states
     */
    injectStyles() {
        if (document.getElementById('loadingStateStyles')) return;

        const style = document.createElement('style');
        style.id = 'loadingStateStyles';
        style.textContent = `
            /* Loading States - Injected by LoadingStates class */
            .loading-skeleton {
                pointer-events: none;
            }

            .skeleton-loader {
                padding: 20px;
            }

            .skeleton-header {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 16px;
            }

            .skeleton-circle {
                width: 48px;
                height: 48px;
                border-radius: 50%;
                background: linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%);
                background-size: 200% 100%;
                animation: shimmer 1.5s infinite;
            }

            .skeleton-line {
                height: 16px;
                border-radius: 8px;
                background: linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%);
                background-size: 200% 100%;
                animation: shimmer 1.5s infinite;
                margin-bottom: 12px;
            }

            .skeleton-line.short {
                width: 60%;
            }

            @keyframes shimmer {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
            }

            .btn-spinner {
                display: inline-block;
                margin-right: 8px;
            }

            .page-loader-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.85);
                backdrop-filter: blur(10px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 99999;
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            .page-loader-overlay.active {
                opacity: 1;
            }

            .page-loader-content {
                text-align: center;
            }

            .loader-spinner {
                position: relative;
                width: 100px;
                height: 100px;
                margin: 0 auto 24px;
            }

            .spinner-ring {
                position: absolute;
                width: 100%;
                height: 100%;
                border: 3px solid transparent;
                border-top-color: var(--tanda-cyan);
                border-radius: 50%;
                animation: spin 1.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
            }

            .spinner-ring:nth-child(2) {
                width: 70%;
                height: 70%;
                top: 15%;
                left: 15%;
                border-top-color: #7FFFD8;
                animation-delay: 0.2s;
            }

            .spinner-ring:nth-child(3) {
                width: 40%;
                height: 40%;
                top: 30%;
                left: 30%;
                border-top-color: var(--crypto-gold);
                animation-delay: 0.4s;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            .loader-message {
                color: var(--text-primary);
                font-size: 1.1rem;
                font-weight: 600;
            }

            .inline-loader {
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }

            .loader-dots {
                display: flex;
                gap: 8px;
            }

            .loader-dots .dot {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: var(--tanda-cyan);
                animation: dotPulse 1.4s infinite ease-in-out both;
            }

            .loader-dots .dot:nth-child(1) {
                animation-delay: -0.32s;
            }

            .loader-dots .dot:nth-child(2) {
                animation-delay: -0.16s;
            }

            @keyframes dotPulse {
                0%, 80%, 100% {
                    transform: scale(0.5);
                    opacity: 0.5;
                }
                40% {
                    transform: scale(1);
                    opacity: 1;
                }
            }

            .inline-loader.small .dot {
                width: 8px;
                height: 8px;
            }

            .inline-loader.large .dot {
                width: 16px;
                height: 16px;
            }

            .progress-container {
                padding: 16px;
            }

            .progress-label {
                color: var(--text-secondary);
                font-size: 0.9rem;
                margin-bottom: 8px;
            }

            .progress-bar-wrapper {
                width: 100%;
                height: 32px;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 16px;
                overflow: hidden;
                position: relative;
            }

            .progress-bar-fill {
                height: 100%;
                background: linear-gradient(90deg, var(--tanda-cyan), #7FFFD8);
                border-radius: 16px;
                transition: width 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: flex-end;
                padding-right: 12px;
                position: relative;
            }

            .progress-bar-fill::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                animation: progressShine 2s infinite;
            }

            @keyframes progressShine {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }

            .progress-percentage {
                color: #0f172a;
                font-weight: 700;
                font-size: 0.85rem;
                z-index: 1;
            }

            .pulse-animation {
                animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }

            @keyframes pulse {
                0%, 100% {
                    opacity: 1;
                }
                50% {
                    opacity: 0.7;
                }
            }

            .shimmer-effect {
                position: relative;
                overflow: hidden;
            }

            .shimmer-effect::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.2), transparent);
                animation: shimmer 2s infinite;
            }
        `;

        document.head.appendChild(style);
    }
}

// Initialize on DOM ready
let loadingStates;
document.addEventListener('DOMContentLoaded', () => {
    loadingStates = new LoadingStates();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoadingStates;
}
