// ============================================
// HEADER & FOOTER CLEANUP + DEFI BADGES
// Oculta elementos blockchain simulados
// Marca widgets DeFi como "Próximamente"
// Crea footer estático funcional
// Autor: Claude - Diciembre 2025
// v2.0 - Added DeFi "Coming Soon" badges
// ============================================

(function() {
    "use strict";


    // Ejecutar después de que el DOM cargue
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", cleanupUI);
    } else {
        // Esperar un poco para que shared-components.js genere el footer
        setTimeout(cleanupUI, 500);
    }

    function cleanupUI() {
        hideBlockchainElements();
        updateBranding();
        addDeFiBadges();
        createStaticFooter();
    }

    // 1. OCULTAR ELEMENTOS BLOCKCHAIN SIMULADOS
    function hideBlockchainElements() {
        // Blockchain status (Block, Gas, Latency)
        const blockchainStatus = document.querySelectorAll(".blockchain-status");
        blockchainStatus.forEach(el => {
            el.style.display = "none";
        });

        // Network Switcher (Ethereum, Polygon, BSC...)
        const networkSwitcher = document.querySelectorAll(".network-switcher");
        networkSwitcher.forEach(el => {
            el.style.display = "none";
        });

        // TX Progress (contador de transacciones falsas)
        const txProgress = document.querySelectorAll(".tx-progress");
        txProgress.forEach(el => {
            el.style.display = "none";
        });
    }

    // 2. ACTUALIZAR BRANDING
    function updateBranding() {
        // Cambiar "Web3 Protocol" por "Plataforma Fintech"
        const subtitles = document.querySelectorAll(".header-subtitle, .sidebar-subtitle");
        subtitles.forEach(el => {
            if (el.textContent.includes("Web3") || el.textContent.includes("Protocol")) {
                el.textContent = "Plataforma Fintech";
            }
        });
    }

    // 3. AGREGAR BADGES "PRÓXIMAMENTE" A WIDGETS DEFI SIMULADOS
    function addDeFiBadges() {
        // Lista de widgets con datos simulados (fake DeFi metrics)
        const fakeMetrics = [
            'stakingRewards',
            'tradingVolume', 
            'liquidityPools',
            'lendingRewards',
            'activeProposals',
            'nftMemberships'
        ];

        // Agregar CSS para los badges
        const badgeStyle = document.createElement("style");
        badgeStyle.textContent = `
            .stat-card.coming-soon {
                position: relative;
                opacity: 0.85;
            }
            
            .stat-card.coming-soon::before {
                content: '';
                position: absolute;
                inset: 0;
                background: rgba(0, 0, 0, 0.3);
                border-radius: inherit;
                pointer-events: none;
                z-index: 1;
            }
            
            .proximamente-badge {
                position: absolute;
                top: 8px;
                right: 8px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 4px 10px;
                border-radius: 12px;
                font-size: 0.65rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                z-index: 10;
                box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
                animation: pulse-badge 2s ease-in-out infinite;
            }
            
            @keyframes pulse-badge {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }
            
            .stat-card.coming-soon .stat-value,
            .stat-card.coming-soon .stat-subtitle {
                opacity: 0.6;
            }
            
            .stat-card.coming-soon:hover {
                opacity: 1;
            }
            
            .stat-card.coming-soon:hover .proximamente-badge {
                background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
            }
        `;
        document.head.appendChild(badgeStyle);

        // Buscar y marcar cada widget simulado
        let badgesAdded = 0;
        fakeMetrics.forEach(metric => {
            const card = document.querySelector(`.stat-card[data-metric="${metric}"]`);
            if (card && !card.classList.contains('coming-soon')) {
                card.classList.add('coming-soon');
                
                // Crear y agregar badge
                const badge = document.createElement('span');
                badge.className = 'proximamente-badge';
                badge.textContent = 'Próximamente';
                card.appendChild(badge);
                
                badgesAdded++;
            }
        });

        if (badgesAdded > 0) {
        }
    }

    // 4. CREAR FOOTER ESTÁTICO
    function createStaticFooter() {
        const footer = document.getElementById("latanda-footer");
        if (!footer) return;

        // Reemplazar contenido dinámico con footer estático
        footer.innerHTML = `
            <div class="footer-static">
                <div class="footer-main">
                    <div class="footer-brand">
                        <span class="footer-logo">🏦</span>
                        <div class="footer-brand-text">
                            <span class="footer-title">La Tanda</span>
                            <span class="footer-tagline">Plataforma Fintech Honduras</span>
                            <span class="footer-company">A Ray-Banks LLC Company</span>
                        </div>
                    </div>
                    
                    <div class="footer-links">
                        <a href="help-center.html" class="footer-link"><i class="fas fa-question-circle"></i> Ayuda</a>
                        <a href="terms-of-service.html" class="footer-link"><i class="fas fa-file-contract"></i> Términos</a>
                        <a href="privacy-policy.html" class="footer-link"><i class="fas fa-shield-alt"></i> Privacidad</a>
                        <a href="contact.html" class="footer-link"><i class="fas fa-envelope"></i> Contacto</a>
                        <a href="roadmap.html" class="footer-link"><i class="fas fa-route"></i> Roadmap</a>
                        <a href="whitepaper.html" class="footer-link"><i class="fas fa-file-alt"></i> Whitepaper</a>
                        <a href="/docs/" target="_blank" class="footer-link"><i class="fas fa-code"></i> API Docs</a>
                        <a href="lottery-predictor.html" class="footer-link"><i class="fas fa-dice"></i> Predictor</a>
                    </div>

                    <div class="footer-social">
                        <span class="social-label">Síguenos:</span>
                        <a href="https://twitter.com/TandaWeb3" target="_blank" class="social-icon" title="Twitter"><i class="fab fa-twitter"></i></a>
                        <a href="https://t.me/latandachain" target="_blank" class="social-icon" title="Telegram"><i class="fab fa-telegram"></i></a>
                        <a href="https://github.com/INDIGOAZUL/la-tanda-web" target="_blank" class="social-icon" title="GitHub"><i class="fab fa-github"></i></a>
                        <a href="https://discord.gg/latanda" target="_blank" class="social-icon" title="Discord"><i class="fab fa-discord"></i></a>
                    </div>
                </div>

                <div class="footer-token">
                    <span class="coming-soon-badge">🚀 Token LTD - Próximamente</span>
                </div>
                
                <div class="footer-bottom">
                    <span class="copyright">© 2024-2026 La Tanda. Todos los derechos reservados.</span>
                    <a href="https://raybanks.org" target="_blank" class="footer-corporate">↗ raybanks.org</a>
                    <span class="footer-version">v3.27</span>
                </div>
            </div>
        `;

        // Agregar estilos inline para el footer
        const style = document.createElement("style");
        style.textContent = `
            .footer-static {
                background: linear-gradient(180deg, #0d1117 0%, #161b22 100%);
                border-top: 1px solid rgba(0, 212, 255, 0.1);
                padding: 24px 30px;
                color: #8b949e;
                font-size: 0.85rem;
            }
            
            .footer-main {
                display: flex;
                flex-wrap: wrap;
                justify-content: space-between;
                align-items: center;
                gap: 20px;
                margin-bottom: 20px;
            }
            
            .footer-brand {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .footer-brand-text {
                display: flex;
                flex-direction: column;
                gap: 2px;
            }
            
            .footer-logo {
                font-size: 2rem;
            }
            
            .footer-title {
                font-weight: 700;
                color: #00d4ff;
                font-size: 1.2rem;
            }
            
            .footer-tagline {
                color: #8b949e;
                font-size: 0.8rem;
            }
            
            .footer-company {
                color: #6e7681;
                font-size: 0.7rem;
                font-style: italic;
            }
            
            .footer-links {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: 16px;
            }
            
            .footer-link {
                color: #8b949e;
                text-decoration: none;
                transition: color 0.2s;
                display: flex;
                align-items: center;
                gap: 5px;
                font-size: 0.85rem;
            }
            
            .footer-link:hover {
                color: #00d4ff;
            }
            
            .footer-link i {
                font-size: 0.9rem;
            }
            
            .footer-social {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .social-label {
                color: #6e7681;
                font-size: 0.8rem;
            }
            
            .social-icon {
                color: #8b949e;
                font-size: 1.2rem;
                transition: color 0.2s, transform 0.2s;
            }
            
            .social-icon:hover {
                color: #00d4ff;
                transform: scale(1.1);
            }
            
            .footer-token {
                text-align: center;
                margin-bottom: 20px;
            }
            
            .coming-soon-badge {
                display: inline-block;
                padding: 8px 18px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-radius: 20px;
                font-size: 0.8rem;
                font-weight: 600;
            }
            
            .footer-bottom {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding-top: 16px;
                border-top: 1px solid #21262d;
                flex-wrap: wrap;
                gap: 10px;
            }
            
            .copyright {
                color: #484f58;
            }
            
            .footer-corporate {
                color: #58a6ff;
                text-decoration: none;
                font-size: 0.8rem;
            }
            
            .footer-corporate:hover {
                text-decoration: underline;
            }
            
            .footer-version {
                color: #484f58;
                font-size: 0.75rem;
            }
            
            @media (max-width: 768px) {
                .footer-main {
                    flex-direction: column;
                    text-align: center;
                }
                
                .footer-links {
                    justify-content: center;
                }
                
                .footer-social {
                    justify-content: center;
                }
                
                .footer-bottom {
                    flex-direction: column;
                    gap: 8px;
                    text-align: center;
                }
            }
        `;
        document.head.appendChild(style);

    }

    // Exponer función para re-ejecutar si es necesario
    window.cleanupHeaderFooter = cleanupUI;
    window.addDeFiBadges = addDeFiBadges;

})();
