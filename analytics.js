/* ============================================
   📊 SIMPLE ANALYTICS
   ============================================ */

(function() {
    const track = (event, data = {}) => {
        const payload = {
            event,
            data,
            url: window.location.href,
            timestamp: Date.now(),
            user: localStorage.getItem('user_id') || 'anonymous'
        };
        console.log('[Analytics]', payload);
        // Send to analytics endpoint
        navigator.sendBeacon?.('/api/analytics', JSON.stringify(payload));
    };
    
    // Track page views
    track('page_view', { page: document.title });
    
    // Track clicks on important elements
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('button, a');
        if (btn) {
            track('click', { 
                text: btn.textContent?.trim().substring(0, 30),
                href: btn.href,
                id: btn.id
            });
        }
    });
    
    window.trackEvent = track;
})();
