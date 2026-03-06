/* ============================================
   ⌨️ KEYBOARD SHORTCUTS
   ============================================ */

(function() {
    'use strict';
    
    const shortcuts = {
        'g h': () => window.location.href = 'home-dashboard.html',
        'g g': () => window.location.href = 'groups-advanced-system.html',
        'g w': () => window.location.href = 'my-wallet.html',
        'g m': () => window.location.href = 'marketplace-social.html',
        'g p': () => window.location.href = 'mi-perfil.html',
        '?': () => showHelp(),
        '/': () => document.querySelector('input[type="search"]')?.focus(),
        'esc': () => document.querySelectorAll('.modal, [class*="modal"]').forEach(m => m.remove())
    };
    
    function showHelp() {
        const help = document.createElement('div');
        help.id = 'keyboard-help';
        help.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#1e293b;border:1px solid #00d4aa;border-radius:12px;padding:24px;z-index:100000;';
        help.innerHTML = `
            <h3 style="color:#fff;margin:0 0 15px;">⌨️ Atajos de Teclado</h3>
            <div style="color:#94a3b8;font-size:14px;">
                <p><strong>g h</strong> → Dashboard</p>
                <p><strong>g g</strong> → Grupos</p>
                <p><strong>g w</strong> → Wallet</p>
                <p><strong>g m</strong> → Marketplace</p>
                <p><strong>g p</strong> → Perfil</p>
                <p><strong>/</strong> → Buscar</p>
                <p><strong>esc</strong> → Cerrar modal</p>
            </div>
            <button onclick="this.closest('#keyboard-help').remove()" style="margin-top:15px;background:#00d4aa;border:none;color:#0f172a;padding:8px 16px;border-radius:6px;cursor:pointer;">Cerrar</button>
        `;
        document.body.appendChild(help);
    }
    
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        const key = (e.ctrlKey ? 'ctrl+' : '') + (e.shiftKey ? 'shift+' : '') + e.key.toLowerCase();
        
        if (e.key === 'g' && !e.target.matches('input, textarea')) {
            setTimeout(() => {
                const nextKey = prompt('Navegar: g+h=home, g+g=grupos, g+w=wallet, g+m=market, g+p=perfil');
                if (nextKey) shortcuts['g ' + nextKey]?.();
            }, 100);
            return;
        }
        
        if (key === '?' || (e.key === '/' && e.shiftKey)) {
            e.preventDefault();
            showHelp();
        }
    });
})();
