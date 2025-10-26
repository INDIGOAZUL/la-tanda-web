/**
 * Verificación Automática - Tarjetas Tandas V2
 * Script para validar funcionalidad, interacciones y responsive design
 */

class TandasV2Tester {
    constructor() {
        this.testResults = {};
        this.debugLog = [];
        this.isMobile = window.innerWidth <= 768;
        this.isTouch = 'ontouchstart' in window;
    }

    async runAllTests() {
        console.log('🧪 Iniciando suite completa de tests para Tandas V2...');
        
        await this.testBasicFunctionality();
        await this.testInteractions();
        await this.testResponsiveDesign();
        await this.testMobileSupport();
        await this.testAccessibility();
        
        this.generateReport();
        return this.testResults;
    }

    async testBasicFunctionality() {
        console.log('📋 Testing funcionalidad básica...');
        
        // Test 1: Sistema inicializado
        this.testResults.systemInit = !!window.advancedGroupsSystem;
        this.log('Sistema inicializado', this.testResults.systemInit);
        
        // Test 2: Cargar tandas
        if (this.testResults.systemInit) {
            await window.advancedGroupsSystem.loadTandasContent();
            await this.delay(500);
            
            // Test 3: Tarjetas V2 renderizadas
            const cards = document.querySelectorAll('.tanda-card-v2');
            this.testResults.cardsRendered = cards.length > 0;
            this.log(`${cards.length} tarjetas V2 renderizadas`, this.testResults.cardsRendered);
            
            // Test 4: CSS Glassmorphism aplicado
            if (cards.length > 0) {
                const firstCard = cards[0];
                const computedStyle = window.getComputedStyle(firstCard);
                const hasBackdropFilter = computedStyle.backdropFilter.includes('blur');
                this.testResults.glassmorphismApplied = hasBackdropFilter;
                this.log('CSS Glassmorphism aplicado', this.testResults.glassmorphismApplied);
                
                // Test 5: Estructura V2 correcta
                const hasStatusIndicator = firstCard.querySelector('.tanda-status-indicator') !== null;
                const hasEnhancedProgress = firstCard.querySelector('.tanda-progress-enhanced') !== null;
                const hasCriticalInfo = firstCard.querySelector('.tanda-critical-info') !== null;
                const hasExpandableDetails = firstCard.querySelector('.tanda-expandable-details') !== null;
                
                this.testResults.structureV2 = hasStatusIndicator && hasEnhancedProgress && 
                                              hasCriticalInfo && hasExpandableDetails;
                this.log('Estructura V2 completa', this.testResults.structureV2);
            }
        }
    }

    async testInteractions() {
        console.log('🖱️ Testing interacciones...');
        
        const cards = document.querySelectorAll('.tanda-card-v2');
        if (cards.length === 0) {
            this.testResults.interactions = false;
            this.log('No hay tarjetas para testear interacciones', false);
            return;
        }
        
        const firstCard = cards[0];
        const tandaId = firstCard.getAttribute('data-tanda-id');
        
        // Test: Expansión de detalles
        const detailsTrigger = firstCard.querySelector('.details-trigger');
        if (detailsTrigger) {
            detailsTrigger.click();
            await this.delay(300);
            
            const details = firstCard.querySelector('.tanda-expandable-details');
            const isExpanded = details.getAttribute('data-expanded') === 'true';
            this.testResults.expandDetails = isExpanded;
            this.log('Expansión de detalles funciona', this.testResults.expandDetails);
            
            // Collapse back
            detailsTrigger.click();
        }
        
        // Test: Dropdown menu
        const dropdownTrigger = firstCard.querySelector('.dropdown-trigger');
        if (dropdownTrigger) {
            dropdownTrigger.click();
            await this.delay(200);
            
            const menu = firstCard.querySelector('.dropdown-menu-enhanced');
            const isVisible = menu && menu.classList.contains('show');
            this.testResults.dropdownMenu = isVisible;
            this.log('Menú dropdown funciona', this.testResults.dropdownMenu);
            
            // Close menu
            document.body.click();
        }
        
        // Test: Primary action button
        const primaryBtn = firstCard.querySelector('.btn-primary-action');
        if (primaryBtn) {
            const hasClickHandler = primaryBtn.getAttribute('onclick') !== null;
            this.testResults.primaryAction = hasClickHandler;
            this.log('Botón de acción primaria configurado', this.testResults.primaryAction);
        }
    }

    async testResponsiveDesign() {
        console.log('📱 Testing responsive design...');
        
        const grid = document.querySelector('.tandas-grid');
        const originalWidth = window.innerWidth;
        
        // Simulate mobile width
        this.simulateViewport(375, 667);
        await this.delay(100);
        
        const computedStyle = window.getComputedStyle(grid);
        const isMobileLayout = computedStyle.gridTemplateColumns === '1fr';
        this.testResults.mobileLayout = isMobileLayout;
        this.log('Layout móvil aplicado', this.testResults.mobileLayout);
        
        // Test mobile-specific styles
        const cards = document.querySelectorAll('.tanda-card-v2');
        if (cards.length > 0) {
            const firstCard = cards[0];
            const cardStyle = window.getComputedStyle(firstCard);
            const hasMobileMargin = parseInt(cardStyle.marginLeft) > 0;
            this.testResults.mobileStyles = hasMobileMargin;
            this.log('Estilos móviles aplicados', this.testResults.mobileStyles);
        }
        
        // Restore viewport
        this.simulateViewport(originalWidth, window.innerHeight);
    }

    async testMobileSupport() {
        console.log('📱 Testing soporte móvil...');
        
        if (!this.isTouch) {
            this.testResults.touchSupport = 'N/A - No touch device';
            this.log('Dispositivo no táctil detectado', true);
            return;
        }
        
        const cards = document.querySelectorAll('.tanda-card-v2');
        if (cards.length > 0) {
            const firstCard = cards[0];
            
            // Test touch event listeners
            const hasTouchStart = this.hasEventListener(firstCard, 'touchstart');
            const hasTouchEnd = this.hasEventListener(firstCard, 'touchend');
            
            this.testResults.touchSupport = hasTouchStart && hasTouchEnd;
            this.log('Touch events configurados', this.testResults.touchSupport);
            
            // Test swipe indicator
            const computedStyle = window.getComputedStyle(firstCard, '::after');
            const hasSwipeIndicator = computedStyle.content.includes('Desliza');
            this.testResults.swipeIndicator = hasSwipeIndicator;
            this.log('Indicador de swipe visible', this.testResults.swipeIndicator);
        }
    }

    async testAccessibility() {
        console.log('♿ Testing accesibilidad...');
        
        const cards = document.querySelectorAll('.tanda-card-v2');
        let accessibilityScore = 0;
        let totalTests = 0;
        
        cards.forEach(card => {
            // Test: Botones tienen texto descriptivo
            const buttons = card.querySelectorAll('button');
            buttons.forEach(btn => {
                totalTests++;
                const hasAriaLabel = btn.hasAttribute('aria-label');
                const hasTitle = btn.hasAttribute('title');
                const hasText = btn.textContent.trim().length > 0;
                if (hasAriaLabel || hasTitle || hasText) accessibilityScore++;
            });
            
            // Test: Enlaces tienen texto descriptivo
            const links = card.querySelectorAll('a');
            links.forEach(link => {
                totalTests++;
                const hasText = link.textContent.trim().length > 0;
                if (hasText) accessibilityScore++;
            });
            
            // Test: Imágenes tienen alt text (si las hay)
            const images = card.querySelectorAll('img');
            images.forEach(img => {
                totalTests++;
                const hasAlt = img.hasAttribute('alt');
                if (hasAlt) accessibilityScore++;
            });
        });
        
        const accessibilityPercentage = totalTests > 0 ? (accessibilityScore / totalTests) * 100 : 100;
        this.testResults.accessibility = accessibilityPercentage;
        this.log(`Accesibilidad: ${accessibilityPercentage.toFixed(1)}%`, accessibilityPercentage >= 80);
    }

    generateReport() {
        console.log('\n📊 REPORTE DE TESTING - TANDAS V2');
        console.log('================================');
        
        const passed = Object.values(this.testResults).filter(result => 
            result === true || (typeof result === 'number' && result >= 80)
        ).length;
        const total = Object.keys(this.testResults).length;
        const percentage = (passed / total) * 100;
        
        console.log(`✅ Tests pasados: ${passed}/${total} (${percentage.toFixed(1)}%)`);
        console.log('\nDetalles:');
        
        Object.entries(this.testResults).forEach(([test, result]) => {
            const status = this.getTestStatus(result);
            const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
            console.log(`${emoji} ${test}: ${result}`);
        });
        
        // Recomendaciones
        console.log('\n💡 RECOMENDACIONES:');
        if (!this.testResults.systemInit) {
            console.log('- Verificar que el sistema esté inicializado correctamente');
        }
        if (!this.testResults.cardsRendered) {
            console.log('- Verificar que las tarjetas se estén renderizando');
        }
        if (!this.testResults.glassmorphismApplied) {
            console.log('- Verificar que los estilos CSS se estén aplicando');
        }
        if (typeof this.testResults.accessibility === 'number' && this.testResults.accessibility < 80) {
            console.log('- Mejorar accesibilidad agregando más labels y aria-attributes');
        }
    }

    getTestStatus(result) {
        if (result === true) return 'PASS';
        if (result === false) return 'FAIL';
        if (typeof result === 'number') return result >= 80 ? 'PASS' : 'FAIL';
        return 'INFO';
    }

    log(message, success) {
        const status = success ? 'PASS' : 'FAIL';
        this.debugLog.push({ message, status, timestamp: new Date() });
        const emoji = success ? '✅' : '❌';
        console.log(`${emoji} ${message}`);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    simulateViewport(width, height) {
        // This is a simplified simulation
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: width
        });
        Object.defineProperty(window, 'innerHeight', {
            writable: true,
            configurable: true,
            value: height
        });
        window.dispatchEvent(new Event('resize'));
    }

    hasEventListener(element, eventType) {
        // This is a simplified check - in practice, this would be more complex
        return element.getAttribute(`on${eventType}`) !== null ||
               element.hasAttribute(`data-${eventType}-listener`);
    }
}

// Auto-run cuando se carga la página
window.addEventListener('load', async () => {
    console.log('🚀 Iniciando verificación automática...');
    
    // Wait for the system to initialize
    if (window.advancedGroupsSystem) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const tester = new TandasV2Tester();
        const results = await tester.runAllTests();
        
        // Expose results globally for manual inspection
        window.testResults = results;
        console.log('🔍 Resultados disponibles en window.testResults');
    } else {
        console.error('❌ Sistema no encontrado - no se pueden ejecutar tests');
    }
});

// Export for manual testing
window.TandasV2Tester = TandasV2Tester;