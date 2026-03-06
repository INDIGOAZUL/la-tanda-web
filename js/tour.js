/**
 * LA TANDA - Onboarding Tour
 * Guided first-time user experience
 * Version: 1.0
 */

const LaTandaTour = {
    // Tour configuration
    steps: [
        {
            target: '.lt-brand',
            title: '¡Bienvenido a La Tanda! 👋',
            content: 'Te mostraremos las funciones principales de la plataforma.',
            position: 'bottom'
        },
        {
            target: '.lt-wallet-wrapper',
            title: 'Tu Billetera 💰',
            content: 'Aquí puedes ver tu balance, enviar y recibir fondos.',
            position: 'bottom'
        },
        {
            target: '.lt-sidebar',
            title: 'Navegación',
            content: 'Accede a todas las secciones: Grupos, Marketplace, Analytics y más.',
            position: 'right'
        },
        {
            target: '.dashboard-stats, .stats-grid',
            title: 'Estadísticas 📊',
            content: 'Resumen de tus actividades, grupos y ganancias.',
            position: 'bottom'
        },
        {
            target: '.sf-container, .social-feed',
            title: 'Feed Social 📱',
            content: 'Publicaciones, likes y bookmarks de la comunidad.',
            position: 'top'
        },
        {
            target: '.marketplace-link, [href*="marketplace"]',
            title: 'Marketplace 🛒',
            content: 'Compra y vende productos con otros miembros.',
            position: 'top'
        },
        {
            target: '.lt-profile-btn, #profileBtn',
            title: 'Tu Perfil 👤',
            content: 'Configura tu cuenta, preferencias y seguridad.',
            position: 'bottom'
        }
    ],
    
    currentStep: 0,
    isRunning: false,
    isCompleted: false,
    
    /**
     * Initialize tour
     */
    init() {
        // Check if tour should run
        if (this.shouldRunTour()) {
            setTimeout(() => this.start(), 1500);
        }
        
        // Setup re-trigger button
        this.setupReTrigger();
    },
    
    /**
     * Check if tour should run
     */
    shouldRunTour() {
        const isFirstLogin = localStorage.getItem('tourCompleted') !== 'true';
        return isFirstLogin;
    },
    
    /**
     * Start the tour
     */
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.currentStep = 0;
        
        // Create overlay
        this.createOverlay();
        
        // Show first step
        this.showStep(0);
        
        // Add keyboard navigation
        document.addEventListener('keydown', this.handleKeydown.bind(this));
    },
    
    /**
     * Create tour overlay
     */
    createOverlay() {
        // Remove existing tour if any
        this.destroy();
        
        // Create overlay container
        const overlay = document.createElement('div');
        overlay.id = 'lt-tour-overlay';
        overlay.innerHTML = `
            <div class="lt-tour-spotlight" id="lt-tour-spotlight"></div>
            <div class="lt-tour-tooltip" id="lt-tour-tooltip">
                <div class="lt-tour-progress">
                    <span class="lt-tour-step-num"></span>
                    <div class="lt-tour-dots"></div>
                </div>
                <div class="lt-tour-content">
                    <h3 class="lt-tour-title"></h3>
                    <p class="lt-tour-text"></p>
                </div>
                <div class="lt-tour-actions">
                    <button class="lt-tour-skip">Saltar</button>
                    <div class="lt-tour-nav">
                        <button class="lt-tour-prev" disabled>←</button>
                        <button class="lt-tour-next">Siguiente →</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Add styles
        this.addStyles();
        
        // Setup event listeners
        this.setupEvents();
    },
    
    /**
     * Add CSS styles
     */
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #lt-tour-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 9999;
                pointer-events: none;
            }
            
            .lt-tour-spotlight {
                position: absolute;
                border-radius: 8px;
                box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7);
                transition: all 0.4s ease;
                pointer-events: none;
            }
            
            .lt-tour-tooltip {
                position: absolute;
                background: var(--lt-bg-card, #161b22);
                border: 1px solid var(--lt-border, #30363d);
                border-radius: 12px;
                padding: 16px;
                width: 300px;
                max-width: calc(100vw - 32px);
                pointer-events: auto;
                transition: all 0.3s ease;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
            }
            
            .lt-tour-tooltip::before {
                content: '';
                position: absolute;
                width: 16px;
                height: 16px;
                background: var(--lt-bg-card, #161b22);
                border-left: 1px solid var(--lt-border, #30363d);
                border-top: 1px solid var(--lt-border, #30363d);
                transform: rotate(45deg);
            }
            
            .lt-tour-tooltip[data-position="bottom"]::before {
                top: -9px;
                left: 24px;
            }
            
            .lt-tour-tooltip[data-position="top"]::before {
                bottom: -9px;
                left: 24px;
                transform: rotate(-135deg);
            }
            
            .lt-tour-tooltip[data-position="right"]::before {
                left: -9px;
                top: 24px;
                transform: rotate(135deg);
            }
            
            .lt-tour-tooltip[data-position="left"]::before {
                right: -9px;
                top: 24px;
                transform: rotate(-45deg);
            }
            
            .lt-tour-progress {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 12px;
            }
            
            .lt-tour-step-num {
                font-size: 12px;
                color: var(--lt-text-muted, #6e7681);
            }
            
            .lt-tour-dots {
                display: flex;
                gap: 6px;
                flex: 1;
            }
            
            .lt-tour-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: var(--lt-border, #30363d);
                transition: all 0.3s ease;
            }
            
            .lt-tour-dot.active {
                background: var(--lt-primary, #00d4ff);
                transform: scale(1.2);
            }
            
            .lt-tour-dot.completed {
                background: var(--lt-primary, #00d4ff);
                opacity: 0.5;
            }
            
            .lt-tour-title {
                margin: 0 0 8px;
                font-size: 16px;
                font-weight: 600;
                color: var(--lt-text-primary, #e6edf3);
            }
            
            .lt-tour-text {
                margin: 0 0 16px;
                font-size: 14px;
                color: var(--lt-text-secondary, #8b949e);
                line-height: 1.5;
            }
            
            .lt-tour-actions {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .lt-tour-skip {
                background: none;
                border: none;
                color: var(--lt-text-muted, #6e7681);
                cursor: pointer;
                font-size: 13px;
                padding: 4px 8px;
            }
            
            .lt-tour-skip:hover {
                color: var(--lt-text-primary, #e6edf3);
            }
            
            .lt-tour-nav {
                display: flex;
                gap: 8px;
            }
            
            .lt-tour-prev, .lt-tour-next {
                background: var(--lt-primary, #00d4ff);
                border: none;
                color: #000;
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 13px;
                font-weight: 500;
                transition: all 0.2s ease;
            }
            
            .lt-tour-prev:hover:not(:disabled), .lt-tour-next:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(0, 212, 255, 0.3);
            }
            
            .lt-tour-prev:disabled {
                opacity: 0.5;
                cursor: not-allowed;
                transform: none;
                box-shadow: none;
            }
            
            /* Don't show again checkbox */
            .lt-tour-dont-show {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-top: 12px;
                padding-top: 12px;
                border-top: 1px solid var(--lt-border, #30363d);
            }
            
            .lt-tour-dont-show input {
                width: 16px;
                height: 16px;
                accent-color: var(--lt-primary, #00d4ff);
            }
            
            .lt-tour-dont-show label {
                font-size: 12px;
                color: var(--lt-text-muted, #6e7681);
                cursor: pointer;
            }
            
            /* Final step styles */
            .lt-tour-tooltip.final-step .lt-tour-content {
                text-align: center;
            }
            
            .lt-tour-tooltip.final-step .lt-tour-actions {
                justify-content: center;
            }
            
            .lt-tour-done-btn {
                background: linear-gradient(135deg, var(--lt-primary, #00d4ff), #00ff88);
                border: none;
                color: #000;
                padding: 12px 24px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 600;
            }
            
            /* Mobile responsive */
            @media (max-width: 480px) {
                .lt-tour-tooltip {
                    width: calc(100vw - 32px);
                    left: 16px !important;
                    right: 16px !important;
                    max-width: none;
                }
            }
        `;
        
        document.head.appendChild(style);
    },
    
    /**
     * Setup event listeners
     */
    setupEvents() {
        const tooltip = document.getElementById('lt-tour-tooltip');
        
        tooltip.querySelector('.lt-tour-skip').addEventListener('click', () => this.end());
        tooltip.querySelector('.lt-tour-prev').addEventListener('click', () => this.prev());
        tooltip.querySelector('.lt-tour-next').addEventListener('click', () => this.next());
    },
    
    /**
     * Handle keyboard navigation
     */
    handleKeydown(e) {
        if (e.key === 'Escape') {
            this.end();
        } else if (e.key === 'ArrowRight') {
            this.next();
        } else if (e.key === 'ArrowLeft') {
            this.prev();
        }
    },
    
    /**
     * Show specific step
     */
    showStep(index) {
        if (index < 0 || index >= this.steps.length) return;
        
        this.currentStep = index;
        const step = this.steps[index];
        const tooltip = document.getElementById('lt-tour-tooltip');
        const spotlight = document.getElementById('lt-tour-spotlight');
        
        // Update content
        tooltip.querySelector('.lt-tour-title').textContent = step.title;
        tooltip.querySelector('.lt-tour-text').textContent = step.content;
        tooltip.querySelector('.lt-tour-step-num').textContent = `${index + 1} / ${this.steps.length}`;
        
        // Update progress dots
        const dotsContainer = tooltip.querySelector('.lt-tour-dots');
        dotsContainer.innerHTML = '';
        for (let i = 0; i < this.steps.length; i++) {
            const dot = document.createElement('span');
            dot.className = 'lt-tour-dot';
            if (i === index) dot.classList.add('active');
            if (i < index) dot.classList.add('completed');
            dotsContainer.appendChild(dot);
        }
        
        // Update navigation buttons
        const prevBtn = tooltip.querySelector('.lt-tour-prev');
        const nextBtn = tooltip.querySelector('.lt-tour-next');
        
        prevBtn.disabled = index === 0;
        
        if (index === this.steps.length - 1) {
            // Final step
            tooltip.classList.add('final-step');
            nextBtn.outerHTML = '<button class="lt-tour-done-btn">¡Comenzar! →</button>';
            tooltip.querySelector('.lt-tour-done-btn').addEventListener('click', () => this.complete());
            
            // Add "don't show again" checkbox
            const actions = tooltip.querySelector('.lt-tour-actions');
            actions.innerHTML = `
                <label class="lt-tour-dont-show">
                    <input type="checkbox" id="lt-tour-dont-show">
                    <span>No mostrar de nuevo</span>
                </label>
                <button class="lt-tour-done-btn">¡Comenzar! →</button>
            `;
            tooltip.querySelector('.lt-tour-done-btn').addEventListener('click', () => this.complete());
        } else {
            tooltip.classList.remove('final-step');
            nextBtn.textContent = 'Siguiente →';
        }
        
        // Position spotlight and tooltip
        this.positionElements(step.target, step.position);
    },
    
    /**
     * Position spotlight and tooltip
     */
    positionElements(selector, position) {
        const target = document.querySelector(selector);
        const spotlight = document.getElementById('lt-tour-spotlight');
        const tooltip = document.getElementById('lt-tour-tooltip');
        
        if (!target) {
            // Fallback: center screen
            spotlight.style.display = 'none';
            tooltip.style.top = '50%';
            tooltip.style.left = '50%';
            tooltip.style.transform = 'translate(-50%, -50%)';
            return;
        }
        
        // Get target position
        const rect = target.getBoundingClientRect();
        const scrollTop = window.scrollY;
        const scrollLeft = window.scrollX;
        
        // Position spotlight
        spotlight.style.display = 'block';
        spotlight.style.top = `${rect.top + scrollTop - 8}px`;
        spotlight.style.left = `${rect.left + scrollLeft - 8}px`;
        spotlight.style.width = `${rect.width + 16}px`;
        spotlight.style.height = `${rect.height + 16}px`;
        
        // Ensure target is visible
        if (rect.top < 100) {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        // Position tooltip
        let tooltipTop, tooltipLeft;
        
        switch (position) {
            case 'bottom':
                tooltipTop = rect.bottom + scrollTop + 16;
                tooltipLeft = rect.left + scrollLeft + (rect.width / 2) - 150;
                break;
            case 'top':
                tooltipTop = rect.top + scrollTop - 200;
                tooltipLeft = rect.left + scrollLeft + (rect.width / 2) - 150;
                break;
            case 'right':
                tooltipTop = rect.top + scrollTop + (rect.height / 2) - 100;
                tooltipLeft = rect.right + scrollLeft + 16;
                break;
            case 'left':
                tooltipTop = rect.top + scrollTop + (rect.height / 2) - 100;
                tooltipLeft = rect.left + scrollLeft - 316;
                break;
            default:
                tooltipTop = rect.bottom + scrollTop + 16;
                tooltipLeft = rect.left + scrollLeft + (rect.width / 2) - 150;
        }
        
        // Boundary checks
        const maxLeft = window.innerWidth - 320;
        tooltipLeft = Math.max(16, Math.min(tooltipLeft, maxLeft));
        
        tooltip.style.top = `${tooltipTop}px`;
        tooltip.style.left = `${tooltipLeft}px`;
        tooltip.dataset.position = position;
    },
    
    /**
     * Go to next step
     */
    next() {
        if (this.currentStep < this.steps.length - 1) {
            this.showStep(this.currentStep + 1);
        }
    },
    
    /**
     * Go to previous step
     */
    prev() {
        if (this.currentStep > 0) {
            this.showStep(this.currentStep - 1);
        }
    },
    
    /**
     * Complete the tour
     */
    complete() {
        const dontShow = document.getElementById('lt-tour-dont-show');
        if (dontShow && dontShow.checked) {
            localStorage.setItem('tourCompleted', 'true');
        }
        
        this.isCompleted = true;
        this.end();
    },
    
    /**
     * End the tour
     */
    end() {
        this.isRunning = false;
        this.destroy();
        document.removeEventListener('keydown', this.handleKeydown.bind(this));
    },
    
    /**
     * Destroy tour elements
     */
    destroy() {
        const overlay = document.getElementById('lt-tour-overlay');
        if (overlay) {
            overlay.remove();
        }
    },
    
    /**
     * Setup re-trigger button
     */
    setupReTrigger() {
        // Add tour button to help menu or settings
        document.addEventListener('DOMContentLoaded', () => {
            // Try to find help menu
            const helpMenu = document.querySelector('[id*="help"], [class*="help"], [href*="help"]');
            if (helpMenu) {
                // Could add a tour button here
            }
        });
    },
    
    /**
     * Manual trigger (can be called from console)
     */
    restart() {
        localStorage.removeItem('tourCompleted');
        this.start();
    }
};

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => LaTandaTour.init());
} else {
    LaTandaTour.init();
}

// Expose globally
window.LaTandaTour = LaTandaTour;
