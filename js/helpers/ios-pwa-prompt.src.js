/**
 * LA TANDA — iOS PWA Install Prompt v1.0
 * M6: Shows install instructions on iOS Safari (non-standalone)
 * Required for iOS 16.4+ Web Push to work
 */
(function() {
    'use strict';

    // Only run on iOS Safari, NOT in standalone PWA mode
    var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    var isStandalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;

    if (!isIOS || isStandalone) return;

    // Check if already dismissed recently
    var dismissed = null;
    try { dismissed = localStorage.getItem('ios_pwa_dismissed'); } catch(e) {}
    if (dismissed) {
        var elapsed = Date.now() - parseInt(dismissed, 10);
        if (elapsed < 604800000) return; // Don't show for 7 days after dismiss
    }

    // Check if user has been on the app for at least 2 visits
    var visits = 0;
    try {
        visits = parseInt(localStorage.getItem('ios_pwa_visits') || '0', 10);
        localStorage.setItem('ios_pwa_visits', String(visits + 1));
    } catch(e) {}
    if (visits < 2) return; // Show on 3rd+ visit

    // Show banner after 20 seconds
    setTimeout(function() {
        // Don't show if push is already available (shouldn't happen on iOS Safari, but safety)
        if ('PushManager' in window) return;

        var banner = document.createElement('div');
        banner.id = 'iosPwaBanner';
        banner.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);z-index:9997;' +
            'background:rgba(15,23,42,0.97);border:1px solid rgba(0,255,255,0.3);border-radius:14px;' +
            'padding:14px 16px;max-width:380px;width:calc(100% - 32px);box-shadow:0 8px 32px rgba(0,0,0,0.4);' +
            'animation:iosPwaSlide 0.3s ease;font-family:inherit;';

        banner.innerHTML =
            '<style>@keyframes iosPwaSlide{from{transform:translateX(-50%) translateY(20px);opacity:0}to{transform:translateX(-50%) translateY(0);opacity:1}}</style>' +
            '<div style="display:flex;align-items:flex-start;gap:12px;">' +
                '<div style="font-size:28px;flex-shrink:0;">📲</div>' +
                '<div style="flex:1;color:#e0e0e0;font-size:13px;line-height:1.5;">' +
                    '<div style="font-weight:700;color:#fff;font-size:14px;margin-bottom:4px;">Instala La Tanda</div>' +
                    'Toca <span style="display:inline-flex;align-items:center;background:rgba(0,255,255,0.15);padding:1px 6px;border-radius:4px;color:#00ffff;font-size:12px;">' +
                        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00ffff" stroke-width="2" style="margin-right:3px;"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>' +
                        'Compartir</span> y luego <strong style="color:#00ffff;">Agregar a inicio</strong> para recibir notificaciones push.' +
                '</div>' +
                '<button id="iosPwaDismiss" style="background:none;border:none;color:#666;cursor:pointer;padding:2px;flex-shrink:0;font-size:18px;line-height:1;">&times;</button>' +
            '</div>';

        document.body.appendChild(banner);

        document.getElementById('iosPwaDismiss').addEventListener('click', function() {
            banner.style.transform = 'translateX(-50%) translateY(20px)';
            banner.style.opacity = '0';
            banner.style.transition = 'all 0.2s ease';
            setTimeout(function() { banner.remove(); }, 200);
            try { localStorage.setItem('ios_pwa_dismissed', String(Date.now())); } catch(e) {}
        });

        // Auto-dismiss after 15 seconds
        setTimeout(function() {
            if (document.getElementById('iosPwaBanner')) {
                banner.style.transform = 'translateX(-50%) translateY(20px)';
                banner.style.opacity = '0';
                banner.style.transition = 'all 0.3s ease';
                setTimeout(function() { banner.remove(); }, 300);
            }
        }, 15000);
    }, 20000);
})();
