/* ============================================
   🖼️ LAZY IMAGE LOADING
   ============================================ */

(function() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                const src = img.dataset.src;
                if (src) {
                    img.src = src;
                    img.removeAttribute('data-src');
                    observer.unobserve(img);
                }
            }
        });
    });
    
    document.querySelectorAll('img[data-src]').forEach(img => observer.observe(img));
    
    window.lazyLoad = function(selector) {
        document.querySelectorAll(selector).forEach(img => observer.observe(img));
    };
})();
