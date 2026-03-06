/* ============================================
   ♿ ACCESSIBILITY FIXES
   ============================================ */

(function() {
    'use strict';
    
    // 1. Add aria-labels to icon-only buttons
    function fixIconButtons() {
        const icons = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
        icons.forEach(btn => {
            const icon = btn.querySelector('i[class*="fa-"]');
            if (icon && !btn.textContent.trim()) {
                const classes = icon.className || '';
                let label = 'Button';
                if (classes.includes('bell')) label = 'Notifications';
                else if (classes.includes('search')) label = 'Search';
                else if (classes.includes('user')) label = 'Profile';
                else if (classes.includes('cog')) label = 'Settings';
                else if (classes.includes('menu')) label = 'Menu';
                else if (classes.includes('close')) label = 'Close';
                else if (classes.includes('chevron')) label = 'Toggle';
                btn.setAttribute('aria-label', label);
            }
        });
    }
    
    // 2. Add alt to images without alt
    function fixImages() {
        const images = document.querySelectorAll('img:not([alt])');
        images.forEach(img => {
            img.setAttribute('alt', '');
        });
    }
    
    // 3. Add skip-to-content link
    function addSkipLink() {
        if (document.querySelector('.skip-link')) return;
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.className = 'skip-link';
        skipLink.textContent = 'Skip to main content';
        skipLink.style.cssText = 'position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;';
        skipLink.onfocus = function() {
            this.style.cssText = '';
        };
        skipLink.onblur = function() {
            this.style.cssText = 'position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;';
        };
        document.body.insertBefore(skipLink, document.body.firstChild);
    }
    
    // 4. Fix form labels
    function fixForms() {
        const inputs = document.querySelectorAll('input:not([id]), select:not([id]), textarea:not([id])');
        inputs.forEach((input, index) => {
            const id = 'input-' + index;
            input.setAttribute('id', id);
            const label = input.closest('label') || document.querySelector(`label[for="${input.name}"]`);
            if (label && !label.htmlFor) {
                label.htmlFor = id;
            }
        });
    }
    
    // 5. Focus visible styles (inject if missing)
    function ensureFocusStyles() {
        if (document.getElementById('a11y-focus-styles')) return;
        const style = document.createElement('style');
        style.id = 'a11y-focus-styles';
        style.textContent = `
            *:focus-visible { outline: 2px solid #00d4aa !important; outline-offset: 2px !important; }
            .skip-link:focus { position: static !important; width: auto !important; height: auto !important; padding: 10px 20px !important; background: #00d4aa !important; color: #fff !important; }
        `;
        document.head.appendChild(style);
    }
    
    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            fixIconButtons();
            fixImages();
            addSkipLink();
            fixForms();
            ensureFocusStyles();
        });
    } else {
        fixIconButtons();
        fixImages();
        addSkipLink();
        fixForms();
        ensureFocusStyles();
    }
})();
