// Siguiendo Tab Implementation for marketplace-social.js
// Add this code to the existing marketplace-social.js file

(function() {
    'use strict';
    
    // Store reference to original switchTab if needed
    const originalSwitchTab = window.ms ? window.ms.switchTab : null;
    
    // Add Siguiendo tab functionality to ms object
    if (window.ms) {
        
        // Override switchTab to handle siguiendo
        const originalSwitch = window.ms.switchTab.bind(window.ms);
        window.ms.switchTab = function(tabName) {
            // Call original first
            originalSwitch(tabName);
            
            // Handle siguiendo tab
            if (tabName === 'siguiendo') {
                this.loadFollowingFeed();
            }
            
            // Persist preference
            if (['social', 'siguiendo', 'tendencias'].includes(tabName)) {
                sessionStorage.setItem('activeSocialTab', tabName);
            }
        };
        
        // Add loadFollowingFeed method
        window.ms.loadFollowingFeed = async function() {
            const container = document.getElementById('socialFeed') || document.getElementById('feed-container');
            if (!container) {
                console.error('Feed container not found');
                return;
            }
            
            container.innerHTML = '<div style="text-align:center;padding:40px;">Cargando publicaciones de usuarios que sigues...</div>';
            
            try {
                const token = localStorage.getItem('auth_token');
                if (!token) {
                    container.innerHTML = `
                        <div style="text-align:center;padding:60px 20px;">
                            <div style="font-size:48px;margin-bottom:20px;">🔒</div>
                            <p>Inicia sesión para ver publicaciones de usuarios que sigues</p>
                        </div>
                    `;
                    return;
                }
                
                const response = await fetch('/api/feed/social/following?limit=20&offset=0', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                
                const data = await response.json();
                
                if (!data.success || !data.data || data.data.length === 0) {
                    container.innerHTML = `
                        <div style="text-align:center;padding:60px 20px;color:#666;">
                            <div style="font-size:48px;margin-bottom:20px;">👥</div>
                            <p style="font-size:16px;margin-bottom:20px;">Sigue a otros usuarios para ver sus publicaciones aquí</p>
                            <button onclick="window.location.href='/explorar.html'" 
                                style="padding:12px 24px;background:#00FFFF;color:#000;border:none;border-radius:8px;cursor:pointer;font-weight:600;">
                                Descubrir usuarios
                            </button>
                        </div>
                    `;
                    return;
                }
                
                // Render posts using existing render method if available
                if (this.renderSocialPost) {
                    container.innerHTML = data.data.map(post => this.renderSocialPost(post)).join('');
                } else {
                    // Fallback render
                    container.innerHTML = data.data.map(post => `
                        <div class="social-post" style="background:rgba(255,255,255,0.05);border:1px solid rgba(0,255,255,0.1);border-radius:12px;padding:20px;margin-bottom:20px;">
                            <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                                <img src="${post.author_avatar || '/default-avatar.png'}" style="width:40px;height:40px;border-radius:50%;">
                                <div>
                                    <div style="font-weight:600;">${post.author_name || 'Usuario'}</div>
                                    <div style="font-size:12px;color:#666;">${new Date(post.created_at).toLocaleDateString()}</div>
                                </div>
                            </div>
                            <p>${post.content || ''}</p>
                        </div>
                    `).join('');
                }
                
            } catch (error) {
                console.error('Error loading following feed:', error);
                container.innerHTML = `
                    <div style="text-align:center;padding:60px 20px;color:#ff6b6b;">
                        <div style="font-size:48px;margin-bottom:20px;">⚠️</div>
                        <p>Error al cargar publicaciones</p>
                        <button onclick="window.ms.loadFollowingFeed()" 
                            style="padding:10px 20px;background:transparent;border:1px solid #ff6b6b;color:#ff6b6b;border-radius:6px;cursor:pointer;">
                            Reintentar
                        </button>
                    </div>
                `;
            }
        };
        
        console.log('✅ Siguiendo tab support added to marketplace-social.js');
    }
    
    // Add tab button to DOM when ready
    function addSiguiendoTab() {
        const navTabs = document.querySelector('.nav-tabs');
        if (!navTabs) return;
        
        // Check if already exists
        if (navTabs.querySelector('[data-tab="siguiendo"]')) return;
        
        const siguiendoBtn = document.createElement('button');
        siguiendoBtn.className = 'nav-tab';
        siguiendoBtn.dataset.tab = 'siguiendo';
        siguiendoBtn.textContent = 'Siguiendo';
        siguiendoBtn.style.cssText = `
            padding: 12px 24px;
            background: transparent;
            border: 1px solid transparent;
            border-radius: 10px;
            color: rgba(248, 250, 252, 0.7);
            cursor: pointer;
            transition: all 0.3s;
            font-weight: 500;
        `;
        
        // Add active state styles
        siguiendoBtn.addEventListener('click', function() {
            document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            if (window.ms) window.ms.switchTab('siguiendo');
        });
        
        navTabs.appendChild(siguiendoBtn);
        
        // Add CSS for active state
        const style = document.createElement('style');
        style.textContent = `
            .nav-tab[data-tab="siguiendo"].active {
                background: linear-gradient(135deg, rgba(0, 255, 255, 0.2), rgba(0, 255, 255, 0.1)) !important;
                color: #f8fafc !important;
                border-color: #00FFFF !important;
                box-shadow: 0 8px 16px rgba(0, 255, 255, 0.2) !important;
            }
            .nav-tab[data-tab="siguiendo"]:hover {
                background: rgba(0, 255, 255, 0.1);
                color: #f8fafc;
            }
        `;
        document.head.appendChild(style);
        
        console.log('✅ Siguiendo tab button added to DOM');
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addSiguiendoTab);
    } else {
        addSiguiendoTab();
    }
    
    // Also try after a delay in case of dynamic loading
    setTimeout(addSiguiendoTab, 1000);
    setTimeout(addSiguiendoTab, 3000);
    
})();
