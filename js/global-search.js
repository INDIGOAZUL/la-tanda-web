// ============================================
// LA TANDA - GLOBAL SEARCH MODAL
// Cmd/Ctrl+K or search button to open
// Searches users, groups, marketplace
// Version: 1.0.0
// ============================================
(function() {
    "use strict";

    var isOpen = false;
    var overlay = null;
    var debounceTimer = null;
    var selectedIndex = 0;
    var results = [];

    function getToken() {
        return localStorage.getItem("auth_token") || localStorage.getItem("authToken") || "";
    }

    function esc(s) {
        if (!s) return "";
        var d = document.createElement("div");
        d.textContent = s;
        return d.innerHTML;
    }

    function open() {
        if (isOpen) return;
        isOpen = true;

        overlay = document.createElement("div");
        overlay.id = "globalSearchOverlay";
        overlay.innerHTML =
            '<div id="globalSearchModal">' +
                '<div class="gs-input-row">' +
                    '<i class="fas fa-search gs-icon"></i>' +
                    '<input type="text" id="gsInput" placeholder="Buscar usuarios, grupos, productos..." autocomplete="off" autofocus>' +
                    '<kbd class="gs-kbd">ESC</kbd>' +
                '</div>' +
                '<div id="gsResults" class="gs-results">' +
                    '<div class="gs-empty"><i class="fas fa-search" style="font-size:2rem;opacity:0.3;margin-bottom:8px;display:block;"></i>Escribe para buscar</div>' +
                '</div>' +
            '</div>';

        document.body.appendChild(overlay);

        // Focus input
        var input = document.getElementById("gsInput");
        if (input) {
            input.focus();
            input.addEventListener("input", onInput);
            input.addEventListener("keydown", onKeydown);
        }

        // Close on overlay click
        overlay.addEventListener("click", function(e) {
            if (e.target === overlay) close();
        });

        // Prevent body scroll
        document.body.style.overflow = "hidden";
    }

    function close() {
        if (!isOpen) return;
        isOpen = false;
        if (overlay) overlay.remove();
        overlay = null;
        results = [];
        selectedIndex = 0;
        document.body.style.overflow = "";
    }

    function onInput(e) {
        var q = e.target.value.trim();
        if (q.length < 2) {
            showEmpty();
            return;
        }
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function() { doSearch(q); }, 250);
    }

    function onKeydown(e) {
        var items = document.querySelectorAll(".gs-item");
        if (e.key === "Escape") { close(); return; }
        if (e.key === "ArrowDown") {
            e.preventDefault();
            selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
            updateSelection(items);
        }
        if (e.key === "ArrowUp") {
            e.preventDefault();
            selectedIndex = Math.max(selectedIndex - 1, 0);
            updateSelection(items);
        }
        if (e.key === "Enter" && items.length > 0) {
            e.preventDefault();
            var item = items[selectedIndex];
            if (item) navigateTo(item);
        }
    }

    function updateSelection(items) {
        items.forEach(function(el, i) {
            el.classList.toggle("gs-selected", i === selectedIndex);
            if (i === selectedIndex) el.scrollIntoView({ block: "nearest" });
        });
    }

    function showEmpty() {
        var container = document.getElementById("gsResults");
        if (container) container.innerHTML = '<div class="gs-empty"><i class="fas fa-search" style="font-size:2rem;opacity:0.3;margin-bottom:8px;display:block;"></i>Escribe para buscar</div>';
        results = [];
        selectedIndex = 0;
    }

    function showLoading() {
        var container = document.getElementById("gsResults");
        if (container) container.innerHTML = '<div class="gs-empty"><i class="fas fa-spinner fa-spin" style="font-size:1.5rem;opacity:0.5;"></i></div>';
    }

    async function doSearch(q) {
        showLoading();
        try {
            var token = getToken();
            var res = await fetch("/api/search?q=" + encodeURIComponent(q) + "&limit=8", {
                headers: token ? { "Authorization": "Bearer " + token } : {}
            });
            var data = await res.json();

            if (!data.success) {
                showNoResults();
                return;
            }

            results = [];
            var r = data.data.results;

            // Users
            if (r.users && r.users.length > 0) {
                r.users.forEach(function(u) {
                    results.push({
                        type: "user",
                        icon: "fa-user",
                        color: "#00FFFF",
                        title: u.title,
                        subtitle: u.subtitle || "",
                        url: "mi-perfil.html?user=" + u.id,
                        id: u.id
                    });
                });
            }

            // Groups
            if (r.groups && r.groups.length > 0) {
                r.groups.forEach(function(g) {
                    results.push({
                        type: "group",
                        icon: "fa-users",
                        color: "#22c55e",
                        title: g.title,
                        subtitle: (g.members || 0) + " miembros" + (g.contribution ? " · L. " + parseFloat(g.contribution).toLocaleString("es-HN") : ""),
                        url: "groups-advanced-system.html?group=" + g.id,
                        id: g.id
                    });
                });
            }

            // Tandas
            if (r.tandas && r.tandas.length > 0) {
                r.tandas.forEach(function(t) {
                    results.push({
                        type: "tanda",
                        icon: "fa-sync-alt",
                        color: "#8b5cf6",
                        title: t.title,
                        subtitle: t.subtitle || "",
                        url: "groups-advanced-system.html",
                        id: t.id
                    });
                });
            }

            selectedIndex = 0;
            renderResults();
        } catch (err) {
            showNoResults();
        }
    }

    function showNoResults() {
        var container = document.getElementById("gsResults");
        if (container) container.innerHTML = '<div class="gs-empty"><i class="fas fa-search" style="font-size:2rem;opacity:0.3;margin-bottom:8px;display:block;"></i>Sin resultados</div>';
    }

    function renderResults() {
        var container = document.getElementById("gsResults");
        if (!container) return;

        if (results.length === 0) {
            showNoResults();
            return;
        }

        var currentType = "";
        var html = "";

        results.forEach(function(r, i) {
            // Section header
            var typeLabel = r.type === "user" ? "Usuarios" : r.type === "group" ? "Grupos" : r.type === "tanda" ? "Tandas" : "Resultados";
            if (r.type !== currentType) {
                currentType = r.type;
                html += '<div class="gs-section-label">' + typeLabel + '</div>';
            }

            html += '<div class="gs-item' + (i === 0 ? ' gs-selected' : '') + '" data-url="' + esc(r.url) + '" data-type="' + esc(r.type) + '" data-id="' + esc(r.id) + '">' +
                '<div class="gs-item-icon" style="color:' + r.color + ';background:' + r.color + '15;"><i class="fas ' + r.icon + '"></i></div>' +
                '<div class="gs-item-info">' +
                    '<div class="gs-item-title">' + esc(r.title) + '</div>' +
                    (r.subtitle ? '<div class="gs-item-subtitle">' + esc(r.subtitle) + '</div>' : '') +
                '</div>' +
                '<i class="fas fa-chevron-right gs-item-arrow"></i>' +
            '</div>';
        });

        container.innerHTML = html;

        // Click handler
        container.addEventListener("click", function(e) {
            var item = e.target.closest(".gs-item");
            if (item) navigateTo(item);
        });
    }

    function navigateTo(item) {
        var url = item.getAttribute("data-url");
        if (url) {
            close();
            window.location.href = url;
        }
    }

    // ============================================
    // INJECT STYLES
    // ============================================
    var style = document.createElement("style");
    style.textContent = [
        "#globalSearchOverlay{position:fixed;inset:0;z-index:10002;background:rgba(0,0,0,0.6);display:flex;align-items:flex-start;justify-content:center;padding-top:min(20vh,120px);backdrop-filter:blur(4px)}",
        "#globalSearchModal{background:#1e293b;border:1px solid rgba(0,255,255,0.15);border-radius:16px;width:90%;max-width:560px;box-shadow:0 16px 48px rgba(0,0,0,0.5);overflow:hidden;animation:gsSlideIn 0.15s ease-out}",
        "@keyframes gsSlideIn{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:translateY(0)}}",
        ".gs-input-row{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid #334155}",
        ".gs-icon{color:#64748b;font-size:1rem}",
        "#gsInput{flex:1;background:none;border:none;color:#f1f5f9;font-size:1rem;outline:none;font-family:inherit}",
        "#gsInput::placeholder{color:#64748b}",
        ".gs-kbd{background:#0f172a;color:#64748b;padding:2px 8px;border-radius:4px;font-size:0.7rem;border:1px solid #334155;font-family:monospace}",
        ".gs-results{max-height:400px;overflow-y:auto;padding:8px 0}",
        ".gs-empty{text-align:center;padding:32px 16px;color:#64748b;font-size:0.9rem}",
        ".gs-section-label{padding:8px 16px 4px;font-size:0.7rem;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.5px}",
        ".gs-item{display:flex;align-items:center;gap:12px;padding:10px 16px;cursor:pointer;transition:background 0.1s}",
        ".gs-item:hover,.gs-item.gs-selected{background:rgba(0,255,255,0.06)}",
        ".gs-item-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:0.9rem;flex-shrink:0}",
        ".gs-item-info{flex:1;min-width:0}",
        ".gs-item-title{color:#f1f5f9;font-size:0.9rem;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
        ".gs-item-subtitle{color:#64748b;font-size:0.75rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
        ".gs-item-arrow{color:#334155;font-size:0.7rem}"
    ].join("\n");
    document.head.appendChild(style);

    // ============================================
    // PUBLIC API
    // ============================================
    window.openSearchModal = function() { open(); };
    window.closeSearchModal = function() { close(); };

    // Ctrl/Cmd+K shortcut (backup — header/events.js also handles this)
    document.addEventListener("keydown", function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === "k") {
            e.preventDefault();
            if (isOpen) close(); else open();
        }
    });
})();