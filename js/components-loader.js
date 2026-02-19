/**
 * LA TANDA - COMPONENTS LOADER v2.5
 * Added: Footer module support
 */

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
            script.src = src + "?v=30.1";
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
            link.href = href + "?v=30.1";
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
        
        const success = await this.load("components/header.html?v=30.1", targetId);
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
            const success = await this.load("components/sidebar.html?v=30.1", targetId);
            if (!success) {
                return false;
            }
        } else {
            try {
                const response = await fetch("components/sidebar.html?v=30.1");
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
            const success = await this.load("components/footer.html?v=30.1", targetId);
            if (!success) {
                return false;
            }
        } else {
            // Append to body end if no target
            try {
                const response = await fetch("components/footer.html?v=30.1");
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
// HUB INTELIGENTE MODULE LOADER
// ============================================================
LaTandaComponentLoader.loadHubModules = async function() {
    if (this.hubModulesLoaded) return;
    
    try {
        // Load CSS
        await this.loadCSS('css/hub/hub-sections.css');
        await this.loadCSS('css/hub/mia-assistant.css');
        await this.loadCSS('css/hub/social-feed.css?v=11.7');
        
        // Load JS modules
        const modules = [
            'js/hub/hub-api-connector.js',
            'js/hub/contextual-alerts.js',
            'js/hub/insights-engine.js',
            'js/hub/module-cards.js',
            'js/hub/mia-assistant.js',
            'js/hub/social-feed.js?v=11.9'
        ];
        
        for (const module of modules) {
            await this.loadScript(module);
        }
        
        this.hubModulesLoaded = true;
} catch (err) {
    }
};

