/* ============================================
   📤 DATA EXPORT FUNCTIONALITY
   ============================================ */

(function() {
    'use strict';
    
    function addExportButton() {
        const settings = document.querySelector('.settings-panel, .profile-settings');
        if (!settings) return;
        
        const exportBtn = document.createElement('button');
        exportBtn.id = 'export-data-btn';
        exportBtn.innerHTML = '📤 Exportar mis datos';
        exportBtn.style.cssText = 'background:#1e293b;border:1px solid #00d4aa;color:#fff;padding:12px 20px;border-radius:8px;cursor:pointer;margin:10px 0;width:100%;';
        
        exportBtn.onclick = exportUserData;
        
        if (!document.getElementById('export-data-btn')) {
            settings.appendChild(exportBtn);
        }
    }
    
    async function exportUserData() {
        const data = {
            profile: JSON.parse(localStorage.getItem('user_profile') || '{}'),
            preferences: {
                theme: localStorage.getItem('theme'),
                accentColor: localStorage.getItem('accent-color'),
                language: localStorage.getItem('language')
            },
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'latanda-data-export.json';
        a.click();
        URL.revokeObjectURL(url);
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addExportButton);
    } else {
        addExportButton();
    }
})();
