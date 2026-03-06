/* ============================================
   📲 MOBILE PUSH NOTIFICATION UX
   ============================================ */

(function() {
    'use strict';
    
    const NOTIFICATION_KEY = 'notification_permission_asked';
    const PREFS_KEY = 'notification_preferences';
    const ACTIVATION_DELAY = 30000; // 30 seconds
    
    // Check if we should show permission prompt
    function shouldShowPrompt() {
        const asked = localStorage.getItem(NOTIFICATION_KEY);
        if (asked) return false;
        
        const permission = Notification.permission;
        return permission === 'default';
    }
    
    // Show pre-permission prompt
    function showPrePermissionPrompt() {
        if (document.getElementById('notification-prompt')) return;
        
        const prompt = document.createElement('div');
        prompt.id = 'notification-prompt';
        prompt.style.cssText = `
            position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
            background: linear-gradient(135deg, #1e293b, #0f172a);
            border: 1px solid #00d4aa; border-radius: 12px; padding: 20px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.5); z-index: 10000;
            max-width: 400px; text-align: center;
        `;
        
        prompt.innerHTML = `
            <div style="font-size: 32px; margin-bottom: 10px;">🔔</div>
            <h3 style="color: #fff; margin: 0 0 10px;">¡No te pierdas nada!</h3>
            <p style="color: #94a3b8; margin: 0 0 15px; font-size: 14px;">
                Recibe alertas de pagos, cobros y actividad de tu grupo
            </p>
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button id="notif-activate" style="
                    background: #00d4aa; border: none; color: #0f172a;
                    padding: 10px 24px; border-radius: 8px; cursor: pointer;
                    font-weight: 600; flex: 1;
                ">Activar</button>
                <button id="notif-later" style="
                    background: transparent; border: 1px solid #475569; color: #94a3b8;
                    padding: 10px 24px; border-radius: 8px; cursor: pointer;
                ">Ahora no</button>
            </div>
        `;
        
        document.body.appendChild(prompt);
        
        // Event handlers
        document.getElementById('notif-activate').onclick = requestPermission;
        document.getElementById('notif-later').onclick = () => {
            localStorage.setItem(NOTIFICATION_KEY, 'later');
            prompt.remove();
        };
    }
    
    // Request notification permission
    async function requestPermission() {
        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                // Register with FCM
                await registerFCM();
                showNotificationPreferences();
            }
            localStorage.setItem(NOTIFICATION_KEY, permission);
            document.getElementById('notification-prompt')?.remove();
        } catch (err) {
            console.error('Notification permission error:', err);
        }
    }
    
    // Register with FCM
    async function registerFCM() {
        if (!('firebase' in window)) return;
        try {
            const messaging = firebase.messaging();
            const token = await messaging.getToken();
            await fetch('/api/push/fcm-register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token })
            });
        } catch (err) {
            console.log('FCM registration skipped:', err);
        }
    }
    
    // Show notification preferences modal
    function showNotificationPreferences() {
        const modal = document.createElement('div');
        modal.id = 'notification-prefs-modal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.7); display: flex; align-items: center;
            justify-content: center; z-index: 10001;
        `;
        
        const prefs = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
        
        modal.innerHTML = `
            <div style="background: #1e293b; border-radius: 16px; padding: 24px; max-width: 420px; width: 90%;">
                <h2 style="color: #fff; margin: 0 0 20px;">Notificaciones</h2>
                <label style="display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #334155;">
                    <span style="color: #fff;">💰 Pagos y cobros</span>
                    <input type="checkbox" ${prefs.payments !== false ? 'checked' : ''} data-category="payments">
                </label>
                <label style="display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #334155;">
                    <span style="color: #fff;">👥 Grupos</span>
                    <input type="checkbox" ${prefs.groups !== false ? 'checked' : ''} data-category="groups">
                </label>
                <label style="display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #334155;">
                    <span style="color: #fff;">🏪 Marketplace</span>
                    <input type="checkbox" ${prefs.marketplace !== false ? 'checked' : ''} data-category="marketplace">
                </label>
                <label style="display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #334155;">
                    <span style="color: #fff;">❤️ Social</span>
                    <input type="checkbox" ${prefs.social !== false ? 'checked' : ''} data-category="social">
                </label>
                <label style="display: flex; align-items: center; justify-content: space-between; padding: 12px 0; margin-bottom: 20px;">
                    <span style="color: #fff;">🔇 Silenciar todo</span>
                    <input type="checkbox" data-category="mute-all">
                </label>
                <button id="save-prefs" style="
                    width: 100%; background: #00d4aa; border: none; color: #0f172a;
                    padding: 14px; border-radius: 8px; cursor: pointer; font-weight: 600;
                ">Guardar</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
        
        document.getElementById('save-prefs').onclick = async () => {
            const categories = ['payments', 'groups', 'marketplace', 'social'];
            const prefs = {};
            categories.forEach(cat => {
                prefs[cat] = modal.querySelector(`[data-category="${cat}"]`).checked;
            });
            localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
            
            // Save to API
            try {
                await fetch('/api/notifications/preferences', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(prefs)
                });
            } catch (e) {}
            
            modal.remove();
        };
    }
    
    // Initialize
    function init() {
        if (!('Notification' in window)) return;
        
        // Show prompt after delay if needed
        if (shouldShowPrompt()) {
            setTimeout(showPrePermissionPrompt, ACTIVATION_DELAY);
        }
        
        // Add button to open preferences
        const notifBtn = document.getElementById('notificationsBtn');
        if (notifBtn) {
            notifBtn.onclick = showNotificationPreferences;
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
