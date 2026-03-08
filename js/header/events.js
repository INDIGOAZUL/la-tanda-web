/**
 * LA TANDA - Header Events Manager
 * Event delegation and keyboard shortcuts
 * @version 1.2 - Profile dropdown fix (body-mounted, programmatic nav)
 */

const HeaderEvents = {
    boundHandler: null,

    init() {
        const mainHeader = document.getElementById("mainHeader");
        if (!mainHeader) return;

        this.boundHandler = (e) => this.handleClick(e);
        mainHeader.addEventListener("click", this.boundHandler);

        document.addEventListener("keydown", (e) => this.handleKeyboard(e));

        // Close dropdowns when clicking outside
        document.addEventListener("click", (e) => {
            if (!e.target.closest("#mainHeader") && !e.target.closest("#profileDropdown")) {
                window.HeaderDropdown && window.HeaderDropdown.closeAll();
                var pd = document.getElementById('profileDropdown');
                if (pd) pd.classList.remove('active');
            }
        });
    },

    handleClick(e) {
        if (e.target.closest("#walletArea")) {
            e.stopPropagation();
            window.HeaderDropdown && window.HeaderDropdown.toggle();
            return;
        }
        if (e.target.closest("#walletDropdownClose")) {
            e.stopPropagation();
            window.HeaderDropdown && window.HeaderDropdown.close();
            return;
        }
        if (e.target.closest("#menuToggle")) {
            e.stopPropagation();
            this.toggleSidebar();
            return;
        }
        if (e.target.closest("#balanceToggle")) {
            e.stopPropagation();
            this.toggleBalance();
            return;
        }
        if (e.target.closest("#notificationsBtn")) {
            e.stopPropagation();
            this.openNotifications();
            return;
        }
        if (e.target.closest("#searchBtn")) {
            e.stopPropagation();
            this.openSearch();
            return;
        }
        if (e.target.closest("#themeToggle")) {
            e.stopPropagation();
            this.toggleTheme();
            return;
        }
        if (e.target.closest("#profileBtn")) {
            e.stopPropagation();
            this.toggleProfileDropdown();
            return;
        }
    },

    handleKeyboard(e) {
        if (e.key === "Escape") {
            window.HeaderDropdown && window.HeaderDropdown.close();
            var pd = document.getElementById('profileDropdown');
            if (pd) pd.classList.remove('active');
        }
        if ((e.ctrlKey || e.metaKey) && e.key === "k") {
            e.preventDefault();
            this.openSearch();
        }
    },

    toggleSidebar() {
        if (window.SidebarUI) {
            SidebarUI.toggle();
            document.body.classList.toggle("sidebar-open", SidebarUI.isOpen);
        } else {
            const sidebar = document.querySelector(".sidebar");
            if (sidebar) {
                sidebar.classList.toggle("active");
                document.body.classList.toggle("sidebar-open");
            }
        }
    },

    toggleBalance() {
        const hidden = localStorage.getItem("balanceHidden") === "true";
        const newState = !hidden;
        localStorage.setItem("balanceHidden", newState);
        window.HeaderUI && window.HeaderUI.toggleBalanceVisibility(newState);
    },

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute("data-theme") || "dark";
        const newTheme = currentTheme === "dark" ? "light" : "dark";
        
        // Update theme
        document.documentElement.setAttribute("data-theme", newTheme);
        localStorage.setItem("theme", newTheme);
        
        // Update theme icon
        const themeIcon = document.getElementById("themeIcon");
        if (themeIcon) {
            themeIcon.className = newTheme === "dark" ? "fas fa-moon" : "fas fa-sun";
        }
        
        // Update theme-color meta tag
        const themeColor = newTheme === "dark" ? "#0f172a" : "#ffffff";
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) metaThemeColor.setAttribute("content", themeColor);
        
        // Dispatch theme change event for other components
        document.dispatchEvent(new CustomEvent("themeChanged", { detail: { theme: newTheme } }));
    },

    openNotifications() {
        if (window.notificationCenter && window.notificationCenter.toggle) {
            window.notificationCenter.toggle();
        } else if (typeof window.toggleNotificationCenter === "function") {
            window.toggleNotificationCenter();
        } else {
            window.location.href = "notificaciones.html";
        }
    },

    openSearch() {
        if (typeof window.laTandaComponents !== "undefined" && typeof window.laTandaComponents.toggleSearch === "function") {
            window.laTandaComponents.toggleSearch();
        } else if (typeof window.openSearchModal === "function") {
            window.openSearchModal();
        } else {
            var query = prompt("Buscar en La Tanda:");
        }
    },

    toggleProfileDropdown() {
        var dd = document.getElementById('profileDropdown');
        if (dd) {
            dd.classList.toggle('active');
            if (dd.classList.contains('active')) this._positionDropdown(dd);
            return;
        }
        this._createProfileDropdown();
    },

    _createProfileDropdown() {
        var userStr = localStorage.getItem('latanda_user');
        var user = userStr ? JSON.parse(userStr) : {};
        var name = user.name || 'Usuario';
        var email = user.email || '';
        var avatarUrl = user.avatar_url || '';

        var esc = function(s) {
            if (!s) return '';
            var d = document.createElement('div');
            d.textContent = s;
            return d.innerHTML;
        };

        var initials = name.split(' ').map(function(n){ return n[0] || ''; }).join('').toUpperCase().substring(0,2);
        var avatarHtml = avatarUrl
            ? '<img src="' + esc(avatarUrl) + '" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">'
            : '<span style="color:#00FFFF;font-weight:600;font-size:1rem;">' + esc(initials) + '</span>';

        var dd = document.createElement('div');
        dd.id = 'profileDropdown';
        dd.className = 'profile-dropdown active';

        // Build menu items as divs with data-href (not <a> inside <button>)
        dd.innerHTML =
            '<div class="pd-header">' +
                '<div class="pd-avatar">' + avatarHtml + '</div>' +
                '<div class="pd-info">' +
                    '<div class="pd-name">' + esc(name) + '</div>' +
                    (email ? '<div class="pd-email">' + esc(email) + '</div>' : '') +
                '</div>' +
            '</div>' +
            '<div class="pd-divider"></div>' +
            '<div class="pd-item" data-href="mi-perfil.html"><i class="fas fa-user"></i>Mi Perfil</div>' +
            '<div class="pd-item" data-href="my-wallet.html"><i class="fas fa-wallet"></i>Wallet</div>' +
            '<div class="pd-item" data-href="groups-advanced-system.html"><i class="fas fa-users"></i>Mis Grupos</div>' +
            '<div class="pd-item" data-href="mi-perfil.html?tab=settings"><i class="fas fa-cog"></i>Configuracion</div>' +
            '<div class="pd-divider"></div>' +
            '<div class="pd-item pd-logout"><i class="fas fa-sign-out-alt"></i>Cerrar Sesion</div>';

        document.body.appendChild(dd);
        this._positionDropdown(dd);

        // Single click handler for all items
        dd.addEventListener('click', function(e) {
            var item = e.target.closest('.pd-item');
            if (!item) return;
            e.stopPropagation();

            if (item.classList.contains('pd-logout')) {
                var doLogout = function() {
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('latanda_auth_token');
                    localStorage.removeItem('latanda_user');
                    localStorage.removeItem('latanda_ltd');
                    sessionStorage.clear();
                    window.location.href = 'auth-enhanced.html';
                };
                if (typeof window.showConfirm === 'function') {
                    dd.classList.remove('active');
                    window.showConfirm('Estas seguro que deseas cerrar sesion?', doLogout);
                } else {
                    doLogout();
                }
                return;
            }

            var href = item.getAttribute('data-href');
            if (href) window.location.href = href;
        });
    },

    _positionDropdown(dd) {
        var btn = document.getElementById('profileBtn');
        if (!btn) return;
        var rect = btn.getBoundingClientRect();
        dd.style.position = 'fixed';
        dd.style.top = (rect.bottom + 4) + 'px';
        if (window.innerWidth <= 480) {
            dd.style.right = '8px';
            dd.style.left = '8px';
            dd.style.width = 'auto';
        } else {
            dd.style.right = (window.innerWidth - rect.right) + 'px';
            dd.style.left = '';
            dd.style.width = '260px';
        }
    },

    destroy() {
        const mainHeader = document.getElementById("mainHeader");
        if (mainHeader && this.boundHandler) {
            mainHeader.removeEventListener("click", this.boundHandler);
        }
    }
};

window.HeaderEvents = HeaderEvents;
