/**
 * LA TANDA - Header Events v2.0
 * Click delegation, scroll auto-hide, search, keyboard shortcuts
 */
const HeaderEvents = {
    lastScrollY: 0,
    scrollThreshold: 5,
    headerHidden: false,

    init() {
        const header = document.getElementById("mainHeader");
        if (!header) return;

        // Click delegation
        header.addEventListener("click", (e) => this.handleClick(e));
        document.addEventListener("click", (e) => this.handleOutsideClick(e));
        document.addEventListener("keydown", (e) => this.handleKeyboard(e));

        // Scroll auto-hide
        window.addEventListener("scroll", () => this.handleScroll(), { passive: true });

        // Search bar
        this.initSearch();
        // Mobile search modal
        this.initMobileSearch();
    },

    handleClick(e) {
        if (e.target.closest("#menuToggle")) { e.stopPropagation(); this.toggleSidebar(); return; }
        if (e.target.closest("#balanceBtn")) { e.stopPropagation(); this.toggleBalance(); return; }
        if (e.target.closest("#notificationsBtn")) { e.stopPropagation(); this.openNotifications(); return; }
        if (e.target.closest("#mobileSearchBtn")) { e.stopPropagation(); this.openMobileSearch(); return; }
        if (e.target.closest("#profileBtn")) { e.stopPropagation(); this.toggleProfileDropdown(); return; }
    },

    handleOutsideClick(e) {
        if (!e.target.closest("#mainHeader") && !e.target.closest("#profileDropdown")) {
            // Close balance dropdown
            var bm = document.getElementById("balanceMini");
            var dd = document.getElementById("balanceDropdown");
            if (bm) bm.classList.remove("open");
            if (dd) dd.style.display = "none";
            // Close profile dropdown
            var pd = document.getElementById("profileDropdown");
            if (pd) pd.classList.remove("active");
        }
    },

    handleKeyboard(e) {
        if (e.key === "Escape") {
            var bm = document.getElementById("balanceMini");
            if (bm) bm.classList.remove("open");
            var pd = document.getElementById("profileDropdown");
            if (pd) pd.classList.remove("active");
            var sm = document.getElementById("searchModal");
            if (sm) sm.classList.remove("active");
        }
        if ((e.ctrlKey || e.metaKey) && e.key === "k") {
            e.preventDefault();
            if (window.innerWidth <= 768) this.openMobileSearch();
            else { var input = document.getElementById("headerSearchInput"); if (input) input.focus(); }
        }
    },

    // Scroll auto-hide: delegated to page-level handler
    handleScroll() {},

    // ---- Sidebar ----
    toggleSidebar() {
        if (window.SidebarUI) {
            SidebarUI.toggle();
            document.body.classList.toggle("sidebar-open", SidebarUI.isOpen);
        } else {
            var sidebar = document.querySelector(".sidebar");
            if (sidebar) { sidebar.classList.toggle("active"); document.body.classList.toggle("sidebar-open"); }
        }
    },

    // ---- Balance dropdown ----
    toggleBalance() {
        var bm = document.getElementById("balanceMini");
        var dd = document.getElementById("balanceDropdown");
        if (bm && dd) {
            var isOpen = bm.classList.contains("open");
            if (isOpen) {
                bm.classList.remove("open");
                dd.style.display = "none";
            } else {
                bm.classList.add("open");
                dd.style.display = "block";
                if (window.HeaderSync) window.HeaderSync.syncBalance();
            }
        }
    },

    // ---- Notifications ----
    openNotifications() {
        if (window.notificationCenter && window.notificationCenter.toggle) {
            window.notificationCenter.toggle();
        } else if (typeof window.toggleNotificationCenter === "function") {
            window.toggleNotificationCenter();
        }
    },

    // ---- Search ----
    initSearch() {
        var input = document.getElementById("headerSearchInput");
        if (!input) return;
        input.addEventListener("keydown", function(e) {
            if (e.key === "Enter" && input.value.trim()) {
                window.location.href = "explorar.html?q=" + encodeURIComponent(input.value.trim());
            }
        });
        // Restore last query
        try {
            var lastQ = sessionStorage.getItem("headerSearchQuery");
            if (lastQ) input.value = lastQ;
        } catch(e) {}
        input.addEventListener("input", function() {
            try { sessionStorage.setItem("headerSearchQuery", input.value); } catch(e) {}
        });
    },

    initMobileSearch() {
        var closeBtn = document.getElementById("searchModalClose");
        var modal = document.getElementById("searchModal");
        var input = document.getElementById("searchModalInput");
        if (!closeBtn || !modal) return;
        closeBtn.addEventListener("click", function() { modal.classList.remove("active"); });
        if (input) {
            input.addEventListener("keydown", function(e) {
                if (e.key === "Enter" && input.value.trim()) {
                    window.location.href = "explorar.html?q=" + encodeURIComponent(input.value.trim());
                }
            });
        }
    },

    openMobileSearch() {
        var modal = document.getElementById("searchModal");
        var input = document.getElementById("searchModalInput");
        if (modal) { modal.classList.add("active"); if (input) setTimeout(function() { input.focus(); }, 100); }
    },

    // ---- Profile dropdown ----
    toggleProfileDropdown() {
        var dd = document.getElementById("profileDropdown");
        if (dd) { dd.classList.toggle("active"); if (dd.classList.contains("active")) this._positionDropdown(dd); return; }
        this._createProfileDropdown();
    },

    _createProfileDropdown() {
        var userStr = localStorage.getItem("latanda_user");
        var user = userStr ? JSON.parse(userStr) : {};
        var name = user.name || "Usuario";
        var email = user.email || "";
        var avatarUrl = user.avatar_url || "";
        var esc = function(s) { if (!s) return ""; var d = document.createElement("div"); d.textContent = s; return d.innerHTML; };
        var initials = name.split(" ").map(function(n){ return n[0]||""; }).join("").toUpperCase().substring(0,2);
        var avatarHtml = avatarUrl ? '<img src="'+esc(avatarUrl)+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%">' : '<span style="color:#00FFFF;font-weight:600;font-size:0.9rem">'+esc(initials)+'</span>';

        var dd = document.createElement("div");
        dd.id = "profileDropdown";
        dd.className = "profile-dropdown active";
        dd.innerHTML = '<div class="pd-header"><div class="pd-avatar">'+avatarHtml+'</div><div><div class="pd-name">'+esc(name)+'</div>'+(email?'<div class="pd-email">'+esc(email)+'</div>':'')+'</div></div><div class="pd-divider"></div><div class="pd-item" data-href="mi-perfil.html"><i class="fas fa-user"></i>Mi Perfil</div><div class="pd-item" data-href="my-wallet.html"><i class="fas fa-wallet"></i>Wallet</div><div class="pd-item" data-href="recompensas.html"><i class="fas fa-gift"></i>Recompensas</div><div class="pd-item" data-href="configuracion.html"><i class="fas fa-cog"></i>Configuracion</div><div class="pd-divider"></div><div class="pd-item pd-logout"><i class="fas fa-sign-out-alt"></i>Cerrar Sesion</div>';

        document.body.appendChild(dd);
        this._positionDropdown(dd);

        dd.addEventListener("click", function(e) {
            var item = e.target.closest(".pd-item");
            if (!item) return;
            if (item.classList.contains("pd-logout")) {
                localStorage.removeItem("auth_token"); localStorage.removeItem("latanda_user"); sessionStorage.clear();
                window.location.href = "auth-enhanced.html";
                return;
            }
            var href = item.getAttribute("data-href");
            if (href) window.location.href = href;
        });
    },

    _positionDropdown(dd) {
        var btn = document.getElementById("profileBtn");
        if (!btn) return;
        var rect = btn.getBoundingClientRect();
        dd.style.position = "fixed";
        dd.style.top = (rect.bottom + 4) + "px";
        if (window.innerWidth <= 480) { dd.style.right = "8px"; dd.style.left = "8px"; dd.style.width = "auto"; }
        else { dd.style.right = (window.innerWidth - rect.right) + "px"; dd.style.left = ""; dd.style.width = "240px"; }
    },

    destroy() {
        var header = document.getElementById("mainHeader");
        if (header) header.removeEventListener("click", this.handleClick);
    }
};
window.HeaderEvents = HeaderEvents;
