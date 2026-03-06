/* ============================================
   🌙/☀️ THEME TOGGLE - COMPLETE IMPLEMENTATION
   Add to all pages that use components-loader.js
   ============================================ */

// CSS Variables for Light Theme
const themeCSS = `
<style>
/* Theme Toggle Button Styles */
.theme-toggle {
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 8px 12px;
    border-radius: 8px;
    color: var(--text-primary);
    font-size: 18px;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
}
.theme-toggle:hover {
    background: var(--bg-secondary);
    transform: scale(1.1);
}
.theme-toggle[data-theme="dark"] .icon-moon { display: block; }
.theme-toggle[data-theme="dark"] .icon-sun { display: none; }
.theme-toggle[data-theme="light"] .icon-moon { display: none; }
.theme-toggle[data-theme="light"] .icon-sun { display: block; }

/* Light Theme Variables */
[data-theme="light"] {
    --text-primary: #1e293b;
    --text-secondary: rgba(30, 41, 59, 0.7);
    --text-accent: #0891b2;
    --bg-primary: #f8fafc;
    --bg-secondary: #e2e8f0;
    --bg-card: rgba(255, 255, 255, 0.9);
    --border-card: rgba(0, 0, 0, 0.1);
    --border-accent: rgba(8, 145, 178, 0.2);
    --tanda-cyan: #0891b2;
    --tanda-cyan-light: #22d3ee;
    --tanda-cyan-dark: #0e7490;
}

/* Light Theme Overrides */
[data-theme="light"] body { background: var(--bg-primary); }
[data-theme="light"] .lt-header { 
    background: rgba(255, 255, 255, 0.95); 
    border-bottom: 1px solid var(--border-card); 
}
[data-theme="light"] .lt-wallet { 
    background: var(--bg-secondary); 
    border: 1px solid var(--border-card); 
}
[data-theme="light"] .card,
[data-theme="light"] .lt-card,
[data-theme="light"] .glass-card {
    background: white !important;
    border: 1px solid var(--border-card) !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
}

/* Smooth transitions */
[data-theme="light"], [data-theme="light"] * {
    transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
}
</style>
`;

// Inject CSS
document.head.insertAdjacentHTML('beforeend', themeCSS);

// Initialize Theme Toggle
function initThemeToggle() {
    const toggleBtn = document.getElementById('themeToggle');
    if (!toggleBtn) return;
    
    // Load saved theme or system preference
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const currentTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    
    applyTheme(currentTheme);
    
    // Toggle click handler
    toggleBtn.addEventListener('click', function() {
        const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
    });
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    const toggleBtn = document.getElementById('themeToggle');
    if (toggleBtn) {
        toggleBtn.setAttribute('data-theme', theme);
    }
}

// Apply theme early (before render) to prevent flash
(function() {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const currentTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', currentTheme);
})();

// Run on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThemeToggle);
} else {
    initThemeToggle();
}
