/**
 * LA TANDA - COMPONENTS LOADER v2.5
 * Added: Footer module support
 */

// M1: Auth guard — redirect to login if no auth token
// Pages using components-loader are protected; public pages don't use it.
// Exempt pages that might use components for layout but don't require auth.
(function() {
    var exempt = ['help-center.html', 'contact.html', 'explorar.html', 'ltd-token-economics.html'];
    var page = location.pathname.split('/').pop() || 'index.html';
    if (exempt.indexOf(page) === -1) {
        var token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
        if (!token) {
            localStorage.setItem('redirect_after_auth', location.href);
            location.replace('auth-enhanced.html');
        }
    }
})();

const LaTandaComponentLoader = {
    cache: new Map(),
    loaded: new Set(),
    headerModulesLoaded: false,
    sidebarModulesLoaded: false,
    footerLoaded: false,
    mobileCSSLoaded: false,

    async load(componentPath, targetId) {
        const target = document.getElementById(targetId);
        if (!target) {
            return false;
        }
        try {
            let html;
            if (this.cache.has(componentPath)) {
                html = this.cache.get(componentPath);
            } else {
                const response = await fetch(componentPath);
                if (!response.ok) throw new Error("HTTP " + response.status);
                html = await response.text();
                this.cache.set(componentPath, html);
            }
            target.innerHTML = html;
            this.loaded.add(componentPath);
return true;
        } catch (err) {
            return false;
        }
    },

    async loadScript(src) {
        return new Promise((resolve, reject) => {
            const existingScripts = document.querySelectorAll("script");
            for (let i = 0; i < existingScripts.length; i++) {
                const scriptSrc = existingScripts[i].src || "";
                if (scriptSrc.includes(src.replace("js/", "/js/"))) {
resolve();
                    return;
                }
            }
            
            const script = document.createElement("script");
            script.src = src + "?v=30.5";
            script.onload = () => setTimeout(resolve, 50);
            script.onerror = reject;
            document.head.appendChild(script);
        });
    },

    async loadCSS(href) {
        return new Promise((resolve) => {
            const existingLinks = document.querySelectorAll("link[rel='stylesheet']");
            for (let i = 0; i < existingLinks.length; i++) {
                if (existingLinks[i].href.includes(href)) {
resolve();
                    return;
                }
            }
            
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = href + "?v=30.4";
            link.onload = resolve;
            link.onerror = resolve;
            document.head.appendChild(link);
});
    },

    // Load mobile-specific CSS fixes
    async loadMobileCSS() {
        if (this.mobileCSSLoaded) return;
        
        const mobileCSS = [
            "css/mobile-notification-fix.css"
        ];
        
        for (const css of mobileCSS) {
            await this.loadCSS(css);
        }
        
        this.mobileCSSLoaded = true;
},

    // Header modules
    async loadHeaderModules() {
        if (this.headerModulesLoaded) return;

        const modules = [
            "js/core/api-client.js",
            "js/core/event-bus.js",
            "js/core/cache.js",
            "js/header/sync.js",
            "js/header/ui.js",
            "js/header/events.js",
            "js/header/dropdown.js",
            "js/header/index.js"
        ];

for (const module of modules) {
            try {
                await this.loadScript(module);
            } catch (err) {
            }
        }

        await new Promise(r => setTimeout(r, 100));
        this.headerModulesLoaded = true;
},

    // Sidebar modules
    async loadSidebarModules() {
        if (this.sidebarModulesLoaded) return;

        await this.loadCSS("css/sidebar.css");

        const modules = [
            "js/sidebar/ui.js",
            "js/sidebar/navigation.js",
            "js/sidebar/events.js",
            "js/sidebar/index.js"
        ];

for (const module of modules) {
            try {
                await this.loadScript(module);
            } catch (err) {
            }
        }

        await new Promise(r => setTimeout(r, 100));
        this.sidebarModulesLoaded = true;
},

    // Load header with modules
    async loadHeader(targetId) {
        targetId = targetId || "global-header";
await this.loadMobileCSS();
        
        const success = await this.load("components/header.html?v=30.5", targetId);
        if (!success) {
            return false;
        }

        await this.loadHeaderModules();

        let attempts = 0;
        while (!window.HeaderDropdown && attempts < 20) {
            await new Promise(r => setTimeout(r, 50));
            attempts++;
        }

        if (window.LaTandaHeader && !window.LaTandaHeader.initialized) {
            window.LaTandaHeader.init();
        }

        document.dispatchEvent(new CustomEvent("headerLoaded"));
// Aplicar traducciones al header
        if (window.LaTandaI18n && window.LaTandaI18n.translatePage) {
            window.LaTandaI18n.translatePage();
}
        return true;
    },

    // Load sidebar with modules
    async loadSidebar(targetId) {
        targetId = targetId || "global-sidebar";
const target = document.getElementById(targetId);
        
        if (target) {
            const success = await this.load("components/sidebar.html?v=30.4", targetId);
            if (!success) {
                return false;
            }
        } else {
            try {
                const response = await fetch("components/sidebar.html?v=30.4");
                if (!response.ok) throw new Error("HTTP " + response.status);
                const html = await response.text();
                document.body.insertAdjacentHTML("afterbegin", html);
} catch (err) {
                return false;
            }
        }

        await this.loadSidebarModules();

        let attempts = 0;
        while (!window.SidebarUI && attempts < 20) {
            await new Promise(r => setTimeout(r, 50));
            attempts++;
        }

        if (window.LaTandaSidebar && !window.LaTandaSidebar.initialized) {
            window.LaTandaSidebar.init();
        }

        document.dispatchEvent(new CustomEvent("sidebarLoaded"));
// Aplicar traducciones a componentes recién cargados
        if (window.LaTandaI18n && window.LaTandaI18n.translatePage) {
            window.LaTandaI18n.translatePage();
}
        return true;
    },

    // Load footer
    async loadFooter(targetId) {
        if (this.footerLoaded) return true;
        
        targetId = targetId || "latanda-footer";
// Load footer CSS first
        await this.loadCSS("css/footer.css");
        
        const target = document.getElementById(targetId);
        
        if (target) {
            const success = await this.load("components/footer.html?v=30.4", targetId);
            if (!success) {
                return false;
            }
        } else {
            // Append to body end if no target
            try {
                const response = await fetch("components/footer.html?v=30.4");
                if (!response.ok) throw new Error("HTTP " + response.status);
                const html = await response.text();
                document.body.insertAdjacentHTML("beforeend", html);
} catch (err) {
                return false;
            }
        }

        this.footerLoaded = true;
        document.dispatchEvent(new CustomEvent("footerLoaded"));
// Aplicar traducciones al footer
        if (window.LaTandaI18n && window.LaTandaI18n.translatePage) {
            window.LaTandaI18n.translatePage();
}
        return true;
    },

    // Load all components
    async loadAll(headerTarget, sidebarTarget, footerTarget) {
        await Promise.all([
            this.loadHeader(headerTarget),
            this.loadSidebar(sidebarTarget),
            this.loadFooter(footerTarget)
        ]);
},

    isLoaded(path) {
        return this.loaded.has(path);
    },

    clearCache() {
        this.cache.clear();
    }
};

// Auto-load on DOMContentLoaded
document.addEventListener("DOMContentLoaded", function() {
    const headerTarget = document.getElementById("global-header");
    const sidebarTarget = document.getElementById("global-sidebar");
    const footerTarget = document.getElementById("latanda-footer");
    const hasSidebar = sidebarTarget || document.body.hasAttribute("data-sidebar");
    const hasFooter = footerTarget || document.body.hasAttribute("data-footer");
    
    if (headerTarget) {
LaTandaComponentLoader.loadHeader();
    }
    
    if (hasSidebar) {
LaTandaComponentLoader.loadSidebar();
    }
    
    if (hasFooter) {
LaTandaComponentLoader.loadFooter();
    }
});

// Backward compatibility aliases
window.LaTandaHeaderLoader = LaTandaComponentLoader;
window.LaTandaComponentLoader = LaTandaComponentLoader;


// ============================================================
// ONBOARDING SYSTEM LOADER
// ============================================================
LaTandaComponentLoader.loadOnboarding = async function() {
    if (this.onboardingLoaded) return;
    
    try {
        // Load CSS
        await this.loadCSS("css/onboarding.css");
        
        // Load JS
        await this.loadScript("js/onboarding/onboarding-system.js");
        
        this.onboardingLoaded = true;
} catch (err) {
    }
};

// Auto-load onboarding on pages with auth (not landing page)
(function() {
    const isLandingPage = window.location.pathname === "/" || 
                          window.location.pathname === "/index.html" ||
                          window.location.pathname.endsWith("/index.html");
    const isAuthPage = window.location.pathname.includes("auth");
    
    if (!isLandingPage && !isAuthPage) {
        document.addEventListener("DOMContentLoaded", function() {
            // Small delay to let other components load first
            setTimeout(function() {
                LaTandaComponentLoader.loadOnboarding();
            }, 500);
        });
    }
})();


// ============================================================
// POPUP MANAGER LOADER
// ============================================================
LaTandaComponentLoader.loadPopupManager = async function() {
    if (this.popupManagerLoaded) return;
    
    try {
        // Load CSS
        await this.loadCSS("css/popup-manager.css");
        
        // Load JS
        await this.loadScript("js/popup-manager.js");
        
        this.popupManagerLoaded = true;
} catch (err) {
    }
};

// Auto-load popup manager on all pages
(function() {
    document.addEventListener("DOMContentLoaded", function() {
        // Load popup manager early
        setTimeout(function() {
            LaTandaComponentLoader.loadPopupManager();
        }, 100);
    });
})();


// ============================================================
// GLOBAL ERROR HANDLER LOADER
// ============================================================
LaTandaComponentLoader.loadErrorHandler = async function() {
    if (this.errorHandlerLoaded) return;
    
    try {
        // Load global error handler
        await this.loadScript("js/global-error-handler.js");
        
        this.errorHandlerLoaded = true;
} catch (err) {
    }
};

// Auto-load error handler on all pages (load early)
(function() {
    document.addEventListener("DOMContentLoaded", function() {
        // Load error handler first (before other components)
        LaTandaComponentLoader.loadErrorHandler();
    });
})();


// ============================================================
// NOTIFICATION BRIDGE LOADER
// ============================================================
LaTandaComponentLoader.loadNotificationBridge = async function() {
    if (this.notificationBridgeLoaded) return;
    
    try {
        await this.loadScript("js/notification-bridge.js");
        this.notificationBridgeLoaded = true;
} catch (err) {
    }
};

// Update popup manager loader to also load notification bridge
(function() {
    var originalLoadPopup = LaTandaComponentLoader.loadPopupManager;
    LaTandaComponentLoader.loadPopupManager = async function() {
        await originalLoadPopup.call(this);
        // Load notification bridge after popup manager
        await this.loadNotificationBridge();
    };
})();


// ============================================================
// LOADING STATES CSS LOADER
// ============================================================
LaTandaComponentLoader.loadLoadingStates = async function() {
    if (this.loadingStatesLoaded) return;
    
    try {
        await this.loadCSS("css/loading-states.css");
        this.loadingStatesLoaded = true;
} catch (err) {
    }
};

// Auto-load loading states on all pages
(function() {
    document.addEventListener("DOMContentLoaded", function() {
        LaTandaComponentLoader.loadLoadingStates();
    });
})();


// ============================================================
// LOADING HELPERS LOADER
// ============================================================
LaTandaComponentLoader.loadLoadingHelpers = async function() {
    if (this.loadingHelpersLoaded) return;
    
    try {
        await this.loadScript("js/loading-helpers.js");
        this.loadingHelpersLoaded = true;
} catch (err) {
    }
};

// Load after loading states CSS
(function() {
    var originalLoadStates = LaTandaComponentLoader.loadLoadingStates;
    LaTandaComponentLoader.loadLoadingStates = async function() {
        await originalLoadStates.call(this);
        await this.loadLoadingHelpers();
    };
})();


// ============================================================
// MOBILE RESPONSIVE FIXES LOADER
// ============================================================
LaTandaComponentLoader.loadMobileResponsiveFixes = async function() {
    if (this.mobileResponsiveLoaded) return;
    
    try {
        await this.loadCSS("css/mobile-responsive-fixes.css");
        this.mobileResponsiveLoaded = true;
} catch (err) {
    }
};

// Auto-load mobile fixes on all pages
(function() {
    document.addEventListener("DOMContentLoaded", function() {
        LaTandaComponentLoader.loadMobileResponsiveFixes();
    });
})();


// ============================================================
// ACCESSIBILITY ENHANCEMENTS LOADER
// ============================================================
LaTandaComponentLoader.loadAccessibility = async function() {
    if (this.accessibilityLoaded) return;
    
    try {
        await this.loadScript("js/accessibility-enhancements.js");
        this.accessibilityLoaded = true;
} catch (err) {
    }
};

// Auto-load accessibility on all pages
(function() {
    document.addEventListener("DOMContentLoaded", function() {
        // Load after a short delay to ensure DOM is ready
        setTimeout(function() {
            LaTandaComponentLoader.loadAccessibility();
        }, 500);
    });
})();

// Invitation Card Generator (for promotional sharing)
LaTandaComponentLoader.loadInvitationCards = async function() {
    try {
        await this.loadCSS("css/invitation-cards.css");
        await this.loadScript("js/invitation-card-generator.js");
} catch (err) {
    }
};


// Expanded Turns System (for multi-position members)
LaTandaComponentLoader.loadExpandedTurns = async function() {
    try {
        await this.loadScript("js/expanded-turns.js");
} catch (err) {
    }
};


// ============================================================
// EMAIL VERIFICATION INTERCEPTOR + MODAL
// Tier 1: Global 403 EMAIL_NOT_VERIFIED handler
// ============================================================
(function() {
    var EVS = window._emailVerifySystem = {
        modalOpen: false,
        bannerShown: false,
        pendingRetry: null
    };

    // --- CSS injection ---
    var style = document.createElement('style');
    style.textContent = [
        '.ev-banner{position:fixed;top:0;left:0;right:0;z-index:10000;background:linear-gradient(135deg,#b45309,#d97706);color:#fff;padding:10px 20px;display:flex;align-items:center;justify-content:center;gap:12px;font-size:0.9rem;box-shadow:0 2px 12px rgba(0,0,0,0.3)}',
        '.ev-banner button{background:#fff;color:#b45309;border:none;padding:6px 16px;border-radius:6px;font-weight:600;cursor:pointer;font-size:0.85rem}',
        '.ev-banner button:hover{background:#fef3c7}',
        '.ev-banner .ev-close{background:none;color:#fff;font-size:1.2rem;padding:4px 8px;opacity:0.7}',
        '.ev-banner .ev-close:hover{opacity:1}',
        '.ev-overlay{position:fixed;inset:0;z-index:10001;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)}',
        '.ev-modal{background:#1e293b;border:1px solid rgba(0,255,255,0.2);border-radius:16px;padding:32px;max-width:420px;width:90%;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,0.5)}',
        '.ev-modal h2{color:#f8fafc;font-size:1.3rem;margin:0 0 8px}',
        '.ev-modal p{color:#94a3b8;font-size:0.9rem;margin:0 0 6px}',
        '.ev-modal .ev-email{color:#00FFFF;font-size:0.95rem;margin-bottom:20px}',
        '.ev-code-row{display:flex;gap:8px;justify-content:center;margin:20px 0}',
        '.ev-code-input{width:46px;height:54px;text-align:center;font-size:1.4rem;font-weight:700;border:2px solid #334155;border-radius:10px;background:#0f172a;color:#f8fafc;outline:none;transition:border-color 0.2s}',
        '.ev-code-input:focus{border-color:#00FFFF}',
        '.ev-btn{width:100%;padding:12px;border:none;border-radius:10px;font-size:1rem;font-weight:600;cursor:pointer;margin-top:12px;transition:opacity 0.2s}',
        '.ev-btn:disabled{opacity:0.5;cursor:not-allowed}',
        '.ev-btn-primary{background:linear-gradient(135deg,#00FFFF,#00b4d8);color:#0f172a}',
        '.ev-btn-primary:hover:not(:disabled){opacity:0.9}',
        '.ev-resend{color:#94a3b8;font-size:0.85rem;margin-top:16px}',
        '.ev-resend button{background:none;border:none;color:#00FFFF;cursor:pointer;font-size:0.85rem}',
        '.ev-resend button:hover{text-decoration:underline}',
        '.ev-msg{padding:8px 12px;border-radius:8px;font-size:0.85rem;margin-top:12px;display:none}',
        '.ev-msg.error{display:block;background:rgba(239,68,68,0.15);color:#f87171;border:1px solid rgba(239,68,68,0.3)}',
        '.ev-msg.success{display:block;background:rgba(34,197,94,0.15);color:#4ade80;border:1px solid rgba(34,197,94,0.3)}',
        '.ev-timer{color:#64748b;font-size:0.8rem;margin-top:8px}'
    ].join('\n');
    document.head.appendChild(style);

    // --- Get user email from localStorage ---
    function getUserEmail() {
        try {
            var u = JSON.parse(localStorage.getItem('latanda_user') || '{}');
            return u.email || '';
        } catch(e) { return ''; }
    }

    function isUserUnverified() {
        try {
            var u = JSON.parse(localStorage.getItem('latanda_user') || '{}');
            return u.email_verified === false;
        } catch(e) { return false; }
    }

    function maskEmail(email) {
        if (!email) return '';
        var parts = email.split('@');
        if (parts[0].length <= 2) return email;
        return parts[0].substring(0, 2) + '***@' + parts[1];
    }

    // --- Send verification code ---
    function sendCode(email, cb) {
        fetch('/api/auth/send-verification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email })
        })
        .then(function(r) { return r.json(); })
        .then(function(d) { cb(null, d); })
        .catch(function(e) { cb(e); });
    }

    // --- Verify code ---
    function verifyCode(email, code, cb) {
        fetch('/api/auth/verify-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, code: code })
        })
        .then(function(r) { return r.json(); })
        .then(function(d) { cb(null, d); })
        .catch(function(e) { cb(e); });
    }

    // --- Show verification modal ---
    function showModal() {
        if (EVS.modalOpen) return;
        EVS.modalOpen = true;

        var email = getUserEmail();
        var overlay = document.createElement('div');
        overlay.className = 'ev-overlay';
        overlay.id = 'evOverlay';
        overlay.innerHTML =
            '<div class="ev-modal">' +
                '<h2>Verifica tu correo</h2>' +
                '<p>Ingresa el codigo de 6 digitos enviado a:</p>' +
                '<div class="ev-email">' + (email ? maskEmail(email) : '') + '</div>' +
                '<div class="ev-code-row">' +
                    '<input class="ev-code-input" type="text" maxlength="1" inputmode="numeric" data-idx="0">' +
                    '<input class="ev-code-input" type="text" maxlength="1" inputmode="numeric" data-idx="1">' +
                    '<input class="ev-code-input" type="text" maxlength="1" inputmode="numeric" data-idx="2">' +
                    '<input class="ev-code-input" type="text" maxlength="1" inputmode="numeric" data-idx="3">' +
                    '<input class="ev-code-input" type="text" maxlength="1" inputmode="numeric" data-idx="4">' +
                    '<input class="ev-code-input" type="text" maxlength="1" inputmode="numeric" data-idx="5">' +
                '</div>' +
                '<button class="ev-btn ev-btn-primary" id="evVerifyBtn">Verificar Codigo</button>' +
                '<div class="ev-timer" id="evTimer"></div>' +
                '<div class="ev-msg" id="evMsg"></div>' +
                '<div class="ev-resend">' +
                    '<span>No recibiste el codigo? </span>' +
                    '<button id="evResendBtn">Reenviar</button>' +
                '</div>' +
            '</div>';

        document.body.appendChild(overlay);

        // Send code immediately
        if (email) {
            sendCode(email, function(err) {
                if (err) showMsg('error', 'Error al enviar codigo');
            });
        }

        // Timer
        var remaining = 300;
        var timerEl = document.getElementById('evTimer');
        var timerInterval = setInterval(function() {
            remaining--;
            var m = Math.floor(remaining / 60);
            var s = remaining % 60;
            timerEl.textContent = 'Codigo expira en ' + m + ':' + (s < 10 ? '0' : '') + s;
            if (remaining <= 0) {
                clearInterval(timerInterval);
                timerEl.textContent = 'Codigo expirado';
            }
        }, 1000);

        // Wire inputs
        var inputs = overlay.querySelectorAll('.ev-code-input');
        inputs.forEach(function(inp, i) {
            inp.addEventListener('input', function(e) {
                if (!/^\d*$/.test(e.target.value)) { e.target.value = ''; return; }
                if (e.target.value.length === 1 && i < 5) inputs[i + 1].focus();
                if (i === 5 && e.target.value.length === 1) {
                    var allFilled = true;
                    inputs.forEach(function(x) { if (!x.value) allFilled = false; });
                    if (allFilled) doVerify();
                }
            });
            inp.addEventListener('keydown', function(e) {
                if (e.key === 'Backspace' && !e.target.value && i > 0) inputs[i - 1].focus();
            });
            inp.addEventListener('paste', function(e) {
                e.preventDefault();
                var digits = (e.clipboardData.getData('text') || '').replace(/\D/g, '').split('').slice(0, 6);
                digits.forEach(function(d, idx) { if (inputs[idx]) inputs[idx].value = d; });
                if (digits.length > 0) inputs[Math.min(digits.length, 6) - 1].focus();
            });
        });

        if (window.innerWidth > 768) inputs[0].focus();

        // Verify button
        document.getElementById('evVerifyBtn').addEventListener('click', doVerify);

        // Resend button
        document.getElementById('evResendBtn').addEventListener('click', function() {
            if (!email) return;
            sendCode(email, function(err) {
                if (err) showMsg('error', 'Error al reenviar');
                else showMsg('success', 'Codigo reenviado');
            });
            remaining = 300;
        });

        function getCode() {
            var c = '';
            inputs.forEach(function(x) { c += x.value; });
            return c;
        }

        function showMsg(type, text) {
            var msg = document.getElementById('evMsg');
            msg.className = 'ev-msg ' + type;
            msg.textContent = text;
        }

        function doVerify() {
            var code = getCode();
            if (code.length !== 6) { showMsg('error', 'Ingresa los 6 digitos'); return; }

            var btn = document.getElementById('evVerifyBtn');
            btn.disabled = true;
            btn.textContent = 'Verificando...';

            verifyCode(email, code, function(err, result) {
                if (err || !result || !result.success) {
                    btn.disabled = false;
                    btn.textContent = 'Verificar Codigo';
                    showMsg('error', (result && result.data && result.data.error && result.data.error.message) || 'Codigo invalido o expirado');
                    return;
                }

                showMsg('success', 'Correo verificado correctamente');

                // Update auth token and user data
                if (result.data && result.data.auth_token) {
                    localStorage.setItem('auth_token', result.data.auth_token);
                }
                if (result.data && result.data.user) {
                    localStorage.setItem('latanda_user', JSON.stringify(result.data.user));
                }

                // Remove banner if present
                var banner = document.getElementById('evBanner');
                if (banner) banner.remove();

                clearInterval(timerInterval);

                setTimeout(function() {
                    closeModal();
                    location.reload();
                }, 1200);
            });
        }
    }

    function closeModal() {
        var overlay = document.getElementById('evOverlay');
        if (overlay) overlay.remove();
        EVS.modalOpen = false;
    }

    // --- Show persistent banner ---
    function showBanner() {
        if (EVS.bannerShown) return;
        if (document.getElementById('evBanner')) return;
        EVS.bannerShown = true;

        var banner = document.createElement('div');
        banner.className = 'ev-banner';
        banner.id = 'evBanner';
        banner.innerHTML =
            '<i class="fas fa-exclamation-triangle"></i>' +
            '<span>Verifica tu correo para acceder a todas las funciones</span>' +
            '<button onclick="window._emailVerifySystem.openModal()">Verificar ahora</button>' +
            '<button class="ev-close" onclick="this.parentElement.remove()">&times;</button>';
        document.body.prepend(banner);

        // Shift body content down so banner doesn't overlap
        document.body.style.paddingTop = (banner.offsetHeight) + 'px';
        banner.style.position = 'fixed';
    }

    // Public API
    EVS.openModal = showModal;

    // --- Global fetch interceptor ---
    var originalFetch = window.fetch;
    window.fetch = function() {
        return originalFetch.apply(this, arguments).then(function(response) {
            if (response.status === 403) {
                var cloned = response.clone();
                cloned.json().then(function(body) {
                    var code = body && body.data && body.data.error && body.data.error.details && body.data.error.details.code;
                    if (code === 'EMAIL_NOT_VERIFIED') {
                        showModal();
                    }
                }).catch(function() {});
            }
            return response;
        });
    };

    // --- On page load: check if user is unverified and show banner ---
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(function() {
            if (isUserUnverified()) {
                showBanner();
            }
        }, 1000);
    });
})();


// ============================================================
// HUB INTELIGENTE MODULE LOADER
// ============================================================
LaTandaComponentLoader.loadHubModules = async function() {
    if (this.hubModulesLoaded) return;
    
    try {
        // Load CSS
        await this.loadCSS('css/hub/hub-sections.css');
        await this.loadCSS('css/hub/mia-assistant.css');
        await this.loadCSS('css/hub/social-feed.css?v=12.8');
        
        // Load JS modules
        const modules = [
            'js/hub/hub-api-connector.js',
            'js/hub/contextual-alerts.js',
            'js/hub/insights-engine.js',
            'js/hub/module-cards.js',
            'js/hub/mia-assistant.js',
            'js/hub/social-feed.js?v=12.4'
        ];
        
        for (const module of modules) {
            await this.loadScript(module);
        }
        
        this.hubModulesLoaded = true;
} catch (err) {
    }
};



// ============================================================
// MORE MENU DROPDOWN (Sidebar "Mas" button)
// Single unified handler — works on desktop + mobile drawer
// ============================================================
(function() {
    function openMenu() {
        var dropdown = document.getElementById("moreMenuDropdown");
        var btn = document.getElementById("navMoreBtn");
        if (!dropdown) return;
        dropdown.classList.add("show");
        if (btn) btn.setAttribute("aria-expanded", "true");
    }
    function closeMenu() {
        var dropdown = document.getElementById("moreMenuDropdown");
        var btn = document.getElementById("navMoreBtn");
        if (dropdown) dropdown.classList.remove("show");
        if (btn) btn.setAttribute("aria-expanded", "false");
    }
    function isOpen() {
        var dropdown = document.getElementById("moreMenuDropdown");
        return dropdown && dropdown.classList.contains("show");
    }

    // Direct click on the toggle button (works on desktop + inside mobile drawer)
    // Using a single document handler that checks the exact target
    document.addEventListener("click", function(e) {
        var toggleBtn = e.target.closest("#navMoreBtn");
        if (toggleBtn) {
            e.preventDefault();
            e.stopPropagation();
            if (isOpen()) { closeMenu(); } else { openMenu(); }
            return;
        }
        // Click inside the dropdown items — let it navigate but close menu
        var dropdownItem = e.target.closest("#moreMenuDropdown .more-menu-item");
        if (dropdownItem) {
            closeMenu();
            return;
        }
        // Click anywhere else — close if open
        if (isOpen()) {
            closeMenu();
        }
    });

    // Escape key closes
    document.addEventListener("keydown", function(e) {
        if (e.key === "Escape") closeMenu();
    });

    // Logout handler (was in the old delegated handler)
    document.addEventListener("click", function(e) {
        var btn = e.target.closest("[data-action='logout']");
        if (btn) { e.preventDefault(); if (typeof handleLogout === "function") handleLogout(); }
    });

    // Expose for external use
    window.toggleMoreMenu = function() { if (isOpen()) closeMenu(); else openMenu(); };
    window.closeMoreMenu = closeMenu;
})();
