/**
 * LA TANDA - Admin Guard
 * Protects admin pages from unauthorized access
 * @version 2.0 - Fixed to use admin_token
 */

(function() {
    'use strict';
    
    // Check if this is an admin page
    const isAdminPage = window.location.pathname.includes('admin');
    
    if (!isAdminPage) return;
    
    
    // Check for admin token (set by admin login modal)
    const adminToken = localStorage.getItem('admin_token');
    
    if (adminToken && adminToken.length === 64 && /^[a-f0-9]+$/.test(adminToken)) {
        
        // Add admin indicator to page
        document.addEventListener('DOMContentLoaded', function() {
            const indicator = document.createElement('div');
            indicator.innerHTML = '👑 Admin Mode';
            indicator.style.cssText = 'position:fixed;top:10px;right:10px;background:#1a1a2e;color:#00d4ff;padding:8px 16px;border-radius:20px;font-size:12px;z-index:9999;border:1px solid #00d4ff;';
            document.body.appendChild(indicator);
        });
    } else {
        // No admin token - let the page load, login modal will handle authentication
    }
})();
