/* ============================================
   🔍 QUICK SEARCH (Ctrl+K)
   ============================================ */

(function() {
    'use strict';
    
    function init() {
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                showSearch();
            }
        });
    }
    
    function showSearch() {
        const existing = document.getElementById('quick-search');
        if (existing) { existing.remove(); return; }
        
        const search = document.createElement('div');
        search.id = 'quick-search';
        search.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);z-index:100000;display:flex;justify-content:center;padding-top:100px;';
        
        search.innerHTML = `
            <div style="background:#1e293b;border:1px solid #00d4aa;border-radius:12px;width:600px;max-width:90%;">
                <input type="text" id="quick-search-input" placeholder="🔍 Buscar..." 
                    style="width:100%;padding:20px;font-size:18px;border:none;border-bottom:1px solid #334155;background:transparent;color:#fff;">
                <div id="quick-results" style="max-height:400px;overflow-y:auto;padding:10px;"></div>
            </div>
        `;
        
        document.body.appendChild(search);
        
        const input = document.getElementById('quick-search-input');
        input.focus();
        
        input.addEventListener('input', (e) => {
            document.getElementById('quick-results').innerHTML = '<p style="color:#64748b;padding:10px;">Escribí para buscar...</p>';
        });
        
        search.onclick = (e) => { if (e.target === search) search.remove(); };
    }
    
    init();
})();
