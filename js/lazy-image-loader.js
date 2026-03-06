/**
 * LA TANDA - Lazy Image Loader
 * Performance optimization using IntersectionObserver
 * Version: 1.0.0
 */

class LazyImageLoader {
    constructor() {
        this.observer = null;
        this.options = {
            root: null,
            rootMargin: '50px',
            threshold: 0.1
        };
    }

    /**
     * Initialize lazy loading for all images with data-src
     */
    init() {
        if (!('IntersectionObserver' in window)) {
            console.warn('⚠️ [LazyLoad] IntersectionObserver not supported, loading all images');
            this.loadAllImages();
            return;
        }

        this.observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, this.options);

        // Observe all lazy images
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => {
            img.classList.add('lazy-loading');
            this.observer.observe(img);
        });

        console.log(`✅ [LazyLoad] Initialized with ${lazyImages.length} images`);
    }

    /**
     * Load a single image
     */
    loadImage(img) {
        const src = img.dataset.src;
        if (!src) return;

        // Add loading class
        img.classList.add('lazy-loading');

        // Create a new image to preload
        const tempImg = new Image();
        tempImg.onload = () => {
            img.src = src;
            img.classList.remove('lazy-loading');
            img.classList.add('lazy-loaded');
            
            // Remove data-src to prevent re-loading
            img.removeAttribute('data-src');
            
            // Dispatch event
            img.dispatchEvent(new CustomEvent('lazyloaded', { detail: { src } }));
        };
        
        tempImg.onerror = () => {
            img.classList.remove('lazy-loading');
            img.classList.add('lazy-error');
            console.error(`❌ [LazyLoad] Failed to load: ${src}`);
        };
        
        tempImg.src = src;
    }

    /**
     * Load all images without lazy loading (fallback)
     */
    loadAllImages() {
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => {
            this.loadImage(img);
        });
    }

    /**
     * Observe new images added dynamically
     */
    observeNewImages(container = document) {
        const newImages = container.querySelectorAll('img[data-src]:not(.lazy-loaded):not(.lazy-loading)');
        newImages.forEach(img => {
            if (this.observer) {
                this.observer.observe(img);
            } else {
                this.loadImage(img);
            }
        });
    }

    /**
     * Add lazy loading to existing images
     */
    addLazyLoading(selector = 'img') {
        const images = document.querySelectorAll(selector);
        images.forEach(img => {
            if (!img.dataset.src && img.src) {
                // Store original src in data-src
                img.dataset.src = img.src;
                img.src = '';
            }
            if (this.observer) {
                this.observer.observe(img);
            }
        });
    }

    /**
     * Destroy observer
     */
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
    }
}

// Create global instance
window.lazyImageLoader = new LazyImageLoader();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.lazyImageLoader.init());
} else {
    // DOM already loaded, init after a short delay to ensure components are rendered
    setTimeout(() => window.lazyImageLoader.init(), 100);
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LazyImageLoader;
}
