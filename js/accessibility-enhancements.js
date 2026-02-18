// ============================================
// LA TANDA - ACCESSIBILITY ENHANCEMENTS
// Auto-adds ARIA attributes to common elements
// Version: 1.0.0
// ============================================

(function() {
    "use strict";

    var LaTandaA11y = {
        init: function() {
            this.enhanceButtons();
            this.enhanceTabs();
            this.enhanceModals();
            this.enhanceForms();
            this.enhanceNavigation();
            this.enhanceCards();
            this.setupKeyboardNav();
            this.observeDOM();
        },

        // Enhance buttons with icons only
        enhanceButtons: function() {
            // Find buttons with only icons (no text)
            document.querySelectorAll("button, .btn, [role='button']").forEach(function(btn) {
                // Skip if already has aria-label
                if (btn.getAttribute("aria-label")) return;

                var text = btn.textContent.trim();
                var icon = btn.querySelector("i, .icon, svg");

                // If button has icon but no meaningful text
                if (icon && (!text || text.length < 2)) {
                    var iconClass = (typeof icon.className === "string" ? icon.className : (icon.className.baseVal || "")) || "";
                    var label = "";

                    // Determine label from icon class
                    if (iconClass.includes("close") || iconClass.includes("times")) label = "Cerrar";
                    else if (iconClass.includes("menu") || iconClass.includes("bars")) label = "Menu";
                    else if (iconClass.includes("search")) label = "Buscar";
                    else if (iconClass.includes("bell")) label = "Notificaciones";
                    else if (iconClass.includes("user")) label = "Perfil";
                    else if (iconClass.includes("cog") || iconClass.includes("gear")) label = "Configuracion";
                    else if (iconClass.includes("plus") || iconClass.includes("add")) label = "Agregar";
                    else if (iconClass.includes("edit") || iconClass.includes("pencil")) label = "Editar";
                    else if (iconClass.includes("trash") || iconClass.includes("delete")) label = "Eliminar";
                    else if (iconClass.includes("refresh") || iconClass.includes("sync")) label = "Actualizar";
                    else if (iconClass.includes("copy")) label = "Copiar";
                    else if (iconClass.includes("download")) label = "Descargar";
                    else if (iconClass.includes("upload")) label = "Subir";
                    else if (iconClass.includes("share")) label = "Compartir";
                    else if (iconClass.includes("arrow-left") || iconClass.includes("chevron-left")) label = "Volver";
                    else if (iconClass.includes("arrow-right") || iconClass.includes("chevron-right")) label = "Siguiente";
                    else if (iconClass.includes("check")) label = "Confirmar";
                    else if (iconClass.includes("eye")) label = "Ver";
                    else if (iconClass.includes("info")) label = "Informacion";

                    if (label) {
                        btn.setAttribute("aria-label", label);
                    }
                }

                // Add role if missing
                if (btn.tagName !== "BUTTON" && !btn.getAttribute("role")) {
                    btn.setAttribute("role", "button");
                }

                // Add tabindex if missing
                if (!btn.getAttribute("tabindex") && btn.tagName !== "BUTTON") {
                    btn.setAttribute("tabindex", "0");
                }
            });
        },

        // Enhance tab navigation
        enhanceTabs: function() {
            document.querySelectorAll(".tabs-nav, .nav-tabs, .tab-buttons, [data-tabs]").forEach(function(tablist) {
                if (!tablist.getAttribute("role")) {
                    tablist.setAttribute("role", "tablist");
                }

                var tabs = tablist.querySelectorAll(".tab-btn, .nav-tab, [data-tab]");
                tabs.forEach(function(tab, index) {
                    if (!tab.getAttribute("role")) {
                        tab.setAttribute("role", "tab");
                    }

                    var isSelected = tab.classList.contains("active");
                    tab.setAttribute("aria-selected", isSelected ? "true" : "false");

                    // Link to tab panel if exists
                    var tabId = tab.dataset.tab || tab.dataset.target;
                    if (tabId) {
                        tab.setAttribute("aria-controls", tabId);
                        var panel = document.getElementById(tabId);
                        if (panel) {
                            panel.setAttribute("role", "tabpanel");
                            panel.setAttribute("aria-labelledby", tab.id || "tab-" + index);
                            if (!tab.id) tab.id = "tab-" + index;
                        }
                    }
                });
            });
        },

        // Enhance modals
        enhanceModals: function() {
            document.querySelectorAll(".modal, .popup, .latanda-popup-overlay, [data-modal]").forEach(function(modal) {
                if (!modal.getAttribute("role")) {
                    modal.setAttribute("role", "dialog");
                }
                modal.setAttribute("aria-modal", "true");

                // Find modal title
                var title = modal.querySelector(".modal-title, .popup-title, .latanda-popup-title, h2, h3");
                if (title) {
                    if (!title.id) title.id = "modal-title-" + Math.random().toString(36).substr(2, 9);
                    modal.setAttribute("aria-labelledby", title.id);
                }

                // Find close button
                var closeBtn = modal.querySelector(".close, .modal-close, .popup-close, .latanda-popup-close");
                if (closeBtn && !closeBtn.getAttribute("aria-label")) {
                    closeBtn.setAttribute("aria-label", "Cerrar");
                }
            });
        },

        // Enhance forms
        enhanceForms: function() {
            // Add aria-required to required fields
            document.querySelectorAll("input[required], select[required], textarea[required]").forEach(function(field) {
                field.setAttribute("aria-required", "true");
            });

            // Link labels to inputs
            document.querySelectorAll("label[for]").forEach(function(label) {
                var input = document.getElementById(label.getAttribute("for"));
                if (input && !input.getAttribute("aria-labelledby")) {
                    if (!label.id) label.id = "label-" + label.getAttribute("for");
                    input.setAttribute("aria-labelledby", label.id);
                }
            });

            // Add aria-describedby for error messages
            document.querySelectorAll(".error-message, .field-error, .input-error").forEach(function(error) {
                var field = error.previousElementSibling;
                if (field && (field.tagName === "INPUT" || field.tagName === "SELECT" || field.tagName === "TEXTAREA")) {
                    if (!error.id) error.id = "error-" + Math.random().toString(36).substr(2, 9);
                    field.setAttribute("aria-describedby", error.id);
                    field.setAttribute("aria-invalid", "true");
                }
            });
        },

        // Enhance navigation
        enhanceNavigation: function() {
            // Main navigation
            document.querySelectorAll("nav, .navigation, .main-nav, .sidebar-nav").forEach(function(nav) {
                if (!nav.getAttribute("role") && !nav.getAttribute("aria-label")) {
                    nav.setAttribute("role", "navigation");
                }
            });

            // Sidebar
            document.querySelectorAll(".sidebar, #global-sidebar").forEach(function(sidebar) {
                sidebar.setAttribute("role", "complementary");
                sidebar.setAttribute("aria-label", "Menu lateral");
            });

            // Header
            document.querySelectorAll("header, .header, #global-header").forEach(function(header) {
                if (!header.getAttribute("role")) {
                    header.setAttribute("role", "banner");
                }
            });

            // Main content
            document.querySelectorAll("main, .main-content, .page-content").forEach(function(main) {
                if (!main.getAttribute("role")) {
                    main.setAttribute("role", "main");
                }
            });
        },

        // Enhance cards with interactive elements
        enhanceCards: function() {
            document.querySelectorAll(".card, .dashboard-card, .stat-card, .group-card").forEach(function(card) {
                // If card is clickable
                if (card.onclick || card.dataset.href) {
                    card.setAttribute("role", "button");
                    card.setAttribute("tabindex", "0");

                    // Add keyboard support
                    card.addEventListener("keydown", function(e) {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            card.click();
                        }
                    });
                }
            });
        },

        // Setup keyboard navigation
        setupKeyboardNav: function() {
            // Escape key closes modals
            document.addEventListener("keydown", function(e) {
                if (e.key === "Escape") {
                    var openModal = document.querySelector(".modal.show, .modal.active, .popup.show, .latanda-popup-overlay.visible");
                    if (openModal) {
                        var closeBtn = openModal.querySelector(".close, .modal-close, .popup-close, .latanda-popup-close");
                        if (closeBtn) closeBtn.click();
                    }
                }
            });

            // Tab navigation for tabs
            document.querySelectorAll("[role='tablist']").forEach(function(tablist) {
                tablist.addEventListener("keydown", function(e) {
                    var tabs = tablist.querySelectorAll("[role='tab']");
                    var currentIndex = Array.from(tabs).findIndex(function(t) { return t === document.activeElement; });

                    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                        e.preventDefault();
                        var nextIndex = (currentIndex + 1) % tabs.length;
                        tabs[nextIndex].focus();
                        tabs[nextIndex].click();
                    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                        e.preventDefault();
                        var prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
                        tabs[prevIndex].focus();
                        tabs[prevIndex].click();
                    }
                });
            });
        },

        // Observe DOM for dynamic content
        observeDOM: function() {
            var self = this;
            var observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.addedNodes.length) {
                        // Re-run enhancements for new content
                        self.enhanceButtons();
                        self.enhanceTabs();
                        self.enhanceModals();
                        self.enhanceForms();
                    }
                });
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    };

    // Initialize when DOM is ready
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function() {
            LaTandaA11y.init();
        });
    } else {
        LaTandaA11y.init();
    }

    // Expose globally
    window.LaTandaA11y = LaTandaA11y;
})();
