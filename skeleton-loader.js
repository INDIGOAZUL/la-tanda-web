/* ============================================
   💀 SKELETON LOADING
   ============================================ */

(function() {
    const style = document.createElement('style');
    style.textContent = `
        .skeleton { background: linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%); background-size: 200% 100%; animation: skeleton-loading 1.5s infinite; }
        @keyframes skeleton-loading { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        .skeleton-text { height: 16px; margin: 8px 0; border-radius: 4px; }
        .skeleton-avatar { width: 40px; height: 40px; border-radius: 50%; }
        .skeleton-card { height: 100px; border-radius: 8px; }
    `;
    document.head.appendChild(style);
    
    window.addSkeleton = function(selector) {
        const el = document.querySelector(selector);
        if (!el) return;
        el.classList.add('skeleton', 'skeleton-card');
    };
})();
