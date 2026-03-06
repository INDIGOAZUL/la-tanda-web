/* ============================================
   🎨 CUSTOM THEME COLOR PICKER
   ============================================ */

(function() {
    'use strict';
    
    function addColorPicker() {
        const settings = document.querySelector('.settings, .preferences, [class*="settings"]');
        if (!settings) return;
        
        const picker = document.createElement('div');
        picker.className = 'theme-color-picker';
        picker.innerHTML = `
            <label style="display:block;margin:15px 0;color:#fff;">
                🎨 Color de acento
                <input type="color" id="accent-color" value="#00d4aa" 
                    style="width:100%;height:40px;border:none;border-radius:8px;cursor:pointer;margin-top:8px;">
            </label>
        `;
        
        const existing = settings.querySelector('.theme-color-picker');
        if (!existing) {
            settings.appendChild(picker);
        }
        
        document.getElementById('accent-color').addEventListener('input', (e) => {
            document.documentElement.style.setProperty('--tanda-cyan', e.target.value);
            localStorage.setItem('accent-color', e.target.value);
        });
        
        // Load saved color
        const saved = localStorage.getItem('accent-color');
        if (saved) {
            document.documentElement.style.setProperty('--tanda-cyan', saved);
            document.getElementById('accent-color').value = saved;
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addColorPicker);
    } else {
        addColorPicker();
    }
})();
