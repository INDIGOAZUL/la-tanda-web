/* ============================================
   🎓 ONBOARDING TOUR
   ============================================ */

(function() {
    'use strict';
    
    const TOUR_KEY = 'onboarding_completed';
    const STORAGE_KEY = 'onboarding_dismissed';
    
    const tourSteps = [
        {
            title: 'Bienvenido a La Tanda! 👋',
            content: 'Te mostraremos las funciones principales de la plataforma.',
            target: 'body',
            position: 'center'
        },
        {
            title: '📊 Tu Dashboard',
            content: 'Aquí ves tus estadísticas: grupos activos, balance, y actividad reciente.',
            target: '.dashboard-stats, .stats-grid',
            position: 'bottom'
        },
        {
            title: '👥 Tus Grupos',
            content: 'Aquí manejas tus tandas. Crea uno nuevo o únete a grupos existentes.',
            target: '#sidebar-groups, .groups-nav, [href*="groups"]',
            position: 'right'
        },
        {
            title: '💰 Tu Billetera',
            content: 'Gestiona tus LTD tokens. Envía, recibe y guarda tus fondos.',
            target: '.lt-wallet, #walletDisplay, [href*="wallet"]',
            position: 'bottom'
        },
        {
            title: '❤️ Feed Social',
            content: 'Comparte posts, dale like a otros, y conecta con la comunidad.',
            target: '.social-feed, .feed, [href*="feed"], [href*="explorar"]',
            position: 'right'
        },
        {
            title: '🏪 Marketplace',
            content: 'Compra y vende productos usando LTD tokens.',
            target: '.marketplace, [href*="marketplace"]',
            position: 'right'
        },
        {
            title: '¡Listo! 🚀',
            content: 'Crea tu primer grupo o únete a uno existente para comenzar.',
            target: 'body',
            position: 'center',
            showCTA: true
        }
    ];
    
    let currentStep = 0;
    let tourOverlay = null;
    
    function shouldShowTour() {
        if (localStorage.getItem(STORAGE_KEY) === 'true') return false;
        if (localStorage.getItem(TOUR_KEY)) return false;
        return true;
    }
    
    function findTarget(selector) {
        if (typeof selector === 'string') {
            const targets = document.querySelectorAll(selector);
            for (let el of targets) {
                if (el.offsetParent !== null) return el;
            }
            // Try finding by href
            return document.querySelector(`a[href*="${selector.split(/[\s,]/)[0]}"]`);
        }
        return null;
    }
    
    function createOverlay() {
        if (tourOverlay) return;
        
        tourOverlay = document.createElement('div');
        tourOverlay.id = 'onboarding-tour';
        tourOverlay.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            z-index: 99999; pointer-events: none;
        `;
        document.body.appendChild(tourOverlay);
    }
    
    function showStep(step) {
        if (!tourOverlay) createOverlay();
        
        const stepData = tourSteps[step];
        const target = findTarget(stepData.target);
        
        // Clear previous
        tourOverlay.innerHTML = '';
        
        // Create spotlight
        const spotlight = document.createElement('div');
        spotlight.style.cssText = `
            position: absolute; border-radius: 8px;
            box-shadow: 0 0 0 9999px rgba(0,0,0,0.7);
            transition: all 0.4s ease;
        `;
        
        if (target && target !== document.body) {
            const rect = target.getBoundingClientRect();
            spotlight.style.top = (rect.top - 8) + 'px';
            spotlight.style.left = (rect.left - 8) + 'px';
            spotlight.style.width = (rect.width + 16) + 'px';
            spotlight.style.height = (rect.height + 16) + 'px';
            // Scroll into view
            if (rect.top < 0 || rect.bottom > window.innerHeight) {
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        } else {
            // Center spotlight for welcome/end steps
            spotlight.style.top = '50%';
            spotlight.style.left = '50%';
            spotlight.style.transform = 'translate(-50%, -50%)';
            spotlight.style.width = '400px';
            spotlight.style.height = '200px';
        }
        
        tourOverlay.appendChild(spotlight);
        
        // Create tooltip
        const tooltip = document.createElement('div');
        tooltip.style.cssText = `
            position: absolute; background: #1e293b; border: 1px solid #00d4aa;
            border-radius: 12px; padding: 20px; max-width: 320px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.5); pointer-events: auto;
            transition: all 0.4s ease;
        `;
        
        // Position tooltip
        let top = target ? target.getBoundingClientRect().bottom + 16 : window.innerHeight/2 - 100;
        let left = target ? target.getBoundingClientRect().left : window.innerWidth/2 - 160;
        
        if (stepData.position === 'center') {
            top = window.innerHeight/2 - 120;
            left = window.innerWidth/2 - 160;
        } else if (stepData.position === 'right') {
            top = target ? target.getBoundingClientRect().top : 100;
            left = target ? target.getBoundingClientRect().right + 16 : 100;
        }
        
        tooltip.style.top = top + 'px';
        tooltip.style.left = left + 'px';
        
        // Content
        let ctaButton = stepData.showCTA ? 
            '<button id="tour-cta" style="background:#00d4aa;color:#0f172a;padding:10px 20px;border:none;border-radius:6px;cursor:pointer;font-weight:600;width:100%;margin-top:10px;">Crear Grupo</button>' : '';
        
        tooltip.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                <h3 style="color:#fff;margin:0;font-size:16px;">${stepData.title}</h3>
                <span style="color:#64748b;font-size:12px;">${step + 1}/${tourSteps.length}</span>
            </div>
            <p style="color:#94a3b8;margin:0 0 15px;font-size:14px;line-height:1.5;">${stepData.content}</p>
            <div style="display:flex;gap:10px;align-items:center;">
                <button id="tour-prev" style="background:transparent;border:1px solid #475569;color:#94a3b8;padding:8px 16px;border-radius:6px;cursor:pointer;">← Anterior</button>
                <button id="tour-next" style="background:#00d4aa;border:none;color:#0f172a;padding:8px 16px;border-radius:6px;cursor:pointer;font-weight:600;flex:1;">${stepData.showCTA ? 'Finalizar' : 'Siguiente'}</button>
                <button id="tour-skip" style="background:transparent;border:none;color:#64748b;padding:8px;cursor:pointer;">Saltar</button>
            </div>
            ${step === tourSteps.length - 2 ? '<label style="display:block;margin-top:10px;color:#64748b;font-size:12px;"><input type="checkbox" id="tour-no-show"> No mostrar de nuevo</label>' : ''}
        `;
        
        tourOverlay.appendChild(tooltip);
        
        // Events
        document.getElementById('tour-prev').onclick = () => {
            if (currentStep > 0) showStep(currentStep - 1);
        };
        document.getElementById('tour-next').onclick = () => {
            if (document.getElementById('tour-no-show')?.checked) {
                localStorage.setItem(STORAGE_KEY, 'true');
            }
            if (currentStep < tourSteps.length - 1) {
                showStep(currentStep + 1);
            } else {
                endTour();
            }
        };
        document.getElementById('tour-skip').onclick = endTour;
        document.getElementById('tour-cta')?.addEventListener('click', () => {
            window.location.href = 'groups-advanced-system.html';
        });
    }
    
    function endTour() {
        localStorage.setItem(TOUR_KEY, 'true');
        if (tourOverlay) {
            tourOverlay.remove();
            tourOverlay = null;
        }
    }
    
    function startTour() {
        if (!shouldShowTour()) return;
        createOverlay();
        showStep(0);
    }
    
    // Add trigger button to header
    function addTourTrigger() {
        const helpBtn = document.createElement('button');
        helpBtn.id = 'tour-trigger';
        helpBtn.setAttribute('aria-label', 'Iniciar tour');
        helpBtn.innerHTML = '🎓';
        helpBtn.style.cssText = `
            background: transparent; border: none; cursor: pointer;
            font-size: 18px; padding: 8px; border-radius: 8px;
        `;
        helpBtn.onclick = () => {
            localStorage.removeItem(TOUR_KEY);
            startTour();
        };
        
        const headerRight = document.querySelector('.lt-header-right');
        if (headerRight) {
            headerRight.appendChild(helpBtn);
        }
    }
    
    function init() {
        // Start tour after page load
        setTimeout(startTour, 2000);
        addTourTrigger();
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    window.startTour = startTour;
})();
