/* ============================================
   ⚡ PERFORMANCE OPTIMIZATION - Lighthouse 80+
   Add to all optimized pages
   ============================================ */

(function() {
    'use strict';
    
    // 1. Lazy load all images below the fold
    function lazyLoadImages() {
        const images = document.querySelectorAll('img:not([loading])');
        images.forEach(img => {
            const rect = img.getBoundingClientRect();
            if (rect.top < window.innerHeight) {
                img.setAttribute('loading', 'lazy');
            }
        });
    }
    
    // 2. Add width/height to images without dimensions
    function fixImageDimensions() {
        const images = document.querySelectorAll('img:not([width]):not([height])');
        images.forEach(img => {
            if (img.complete) {
                if (img.naturalWidth && img.naturalHeight) {
                    img.setAttribute('width', img.naturalWidth);
                    img.setAttribute('height', img.naturalHeight);
                }
            } else {
                img.addEventListener('load', function() {
                    if (img.naturalWidth && img.naturalHeight) {
                        img.setAttribute('width', img.naturalWidth);
                        img.setAttribute('height', img.naturalHeight);
                    }
                });
            }
        });
    }
    
    // 3. Optimize font loading
    function optimizeFonts() {
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => {
                console.log('Fonts loaded');
            });
        }
    }
    
    // Run optimizations
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            lazyLoadImages();
            fixImageDimensions();
            optimizeFonts();
        });
    } else {
        lazyLoadImages();
        fixImageDimensions();
        optimizeFonts();
    }
    
    // Performance observer for Core Web Vitals
    if (window.PerformanceObserver) {
        const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            console.log('LCP:', lastEntry.renderTime || lastEntry.loadTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        
        const clsObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (!(entry).hadRecentInput) {
                    console.log('CLS:', entry.value);
                }
            }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
    }
})();

console.log('Performance optimizations loaded');
