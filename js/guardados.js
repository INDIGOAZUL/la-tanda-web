/**
 * LA TANDA - GUARDADOS (Saved Items)
 * Bookmarked content management
 * Version: 1.0
 */


// XSS prevention helper (v4.0.0)
function escapeHtml(text) {
    if (text == null) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
const GuardadosModule = {
    API_BASE: "https://latanda.online",
    currentTab: "todos",
    
    items: {
        posts: [
            { id: 1, type: "post", title: "Como ahorrar con tandas en 2026", author: "Maria Lopez", authorAvatar: "ML", date: "hace 2 dias", likes: 45, icon: "fa-file-alt", color: "#ef4444" },
            { id: 2, type: "post", title: "Mi experiencia vendiendo en el marketplace", author: "Juan Martinez", authorAvatar: "JM", date: "hace 3 dias", likes: 32, icon: "fa-file-alt", color: "#ef4444" },
            { id: 3, type: "post", title: "Tips para predecir la loteria", author: "Ana Garcia", authorAvatar: "AG", date: "hace 1 semana", likes: 89, icon: "fa-file-alt", color: "#ef4444" }
        ],
        productos: [
            { id: 4, type: "producto", title: "iPhone 15 Pro Max", author: "TechStore HN", price: "L. 28,500", date: "hace 1 dia", icon: "fa-mobile-alt", color: "#8b5cf6" },
            { id: 5, type: "producto", title: "MacBook Air M3", author: "CompuShop", price: "L. 35,000", date: "hace 2 dias", icon: "fa-laptop", color: "#8b5cf6" },
            { id: 6, type: "producto", title: "AirPods Pro 2", author: "AudioMax", price: "L. 6,800", date: "hace 4 dias", icon: "fa-headphones", color: "#8b5cf6" }
        ],
        trabajos: [
            { id: 7, type: "trabajo", title: "Desarrollador Full Stack", author: "TechCorp HN", location: "Remoto", salary: "L. 45,000/mes", icon: "fa-code", color: "#22c55e" },
            { id: 8, type: "trabajo", title: "Disenador UI/UX", author: "Creative Agency", location: "Tegucigalpa", salary: "L. 30,000/mes", icon: "fa-palette", color: "#22c55e" }
        ],
        usuarios: [
            { id: 9, type: "usuario", title: "Carlos Mendez", subtitle: "Creador verificado", followers: "1.2K seguidores", icon: "fa-user-check", color: "#00FFFF" },
            { id: 10, type: "usuario", title: "Sofia Ramirez", subtitle: "Top vendedor", followers: "856 seguidores", icon: "fa-user-check", color: "#00FFFF" }
        ]
    },

    async init() {
        
        this.loadItems("todos");
        this.setupTabs();
        this.setupSearch();
        
    },

    getAllItems() {
        return [...this.items.posts, ...this.items.productos, ...this.items.trabajos, ...this.items.usuarios];
    },

    getItemsByTab(tab) {
        if (tab === "todos") return this.getAllItems();
        return this.items[tab] || [];
    },

    loadItems(tab) {
        var container = document.getElementById("guardadosContainer");
        var emptyState = document.getElementById("emptyState");
        var items = this.getItemsByTab(tab);
        
        if (items.length === 0) {
            container.innerHTML = "";
            emptyState.style.display = "block";
            return;
        }
        
        emptyState.style.display = "none";
        container.innerHTML = items.map(item => this.renderItem(item)).join("");
    },

    renderItem(item) {
        var subtitle = "";
        if (item.type === "post") {
            subtitle = escapeHtml(item.author) + " · <i class='fas fa-heart'></i> " + escapeHtml(String(item.likes));
        } else if (item.type === "producto") {
            subtitle = escapeHtml(item.author) + " · <span style='color:" + escapeHtml(item.color) + ";font-weight:600;'>" + escapeHtml(item.price) + "</span>";
        } else if (item.type === "trabajo") {
            subtitle = escapeHtml(item.author) + " · " + escapeHtml(item.location) + " · <span style='color:" + escapeHtml(item.color) + ";'>" + escapeHtml(item.salary) + "</span>";
        } else if (item.type === "usuario") {
            subtitle = item.subtitle + " · " + item.followers;
        }
        
        var typeLabel = item.type.charAt(0).toUpperCase() + item.type.slice(1);
        
        return '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.05);border-radius:12px;padding:16px;transition:all 0.2s;">' +
            '<div style="display:flex;gap:14px;">' +
            '<div style="width:50px;height:50px;background:' + item.color + '15;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">' +
            '<i class="fas ' + item.icon + '" style="color:' + item.color + ';font-size:1.2rem;"></i></div>' +
            '<div style="flex:1;min-width:0;">' +
            '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">' +
            '<span style="color:#fff;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(item.title) + '</span>' +
            '<span style="font-size:0.7rem;padding:2px 8px;background:' + item.color + '20;color:' + item.color + ';border-radius:10px;">' + typeLabel + '</span></div>' +
            '<div style="font-size:0.85rem;color:#888;">' + subtitle + '</div>' +
            '<div style="font-size:0.8rem;color:#666;margin-top:4px;">' + (item.date || "") + '</div></div>' +
            '<button onclick="GuardadosModule.removeItem(' + item.id + ')" style="width:36px;height:36px;background:transparent;border:1px solid rgba(239,68,68,0.2);border-radius:8px;color:#ef4444;cursor:pointer;flex-shrink:0;" title="Eliminar de guardados">' +
            '<i class="fas fa-bookmark" style="font-size:0.9rem;"></i></button></div></div>';
    },

    setupTabs() {
        var self = this;
        document.querySelectorAll(".guardados-tab").forEach(function(tab) {
            tab.addEventListener("click", function(e) {
                document.querySelectorAll(".guardados-tab").forEach(function(t) {
                    t.classList.remove("active");
                    t.style.background = "transparent";
                    t.style.borderColor = "rgba(255,255,255,0.1)";
                    t.style.color = "#888";
                });
                e.target.classList.add("active");
                e.target.style.background = "rgba(0,255,255,0.15)";
                e.target.style.borderColor = "rgba(0,255,255,0.3)";
                e.target.style.color = "#00FFFF";
                
                self.currentTab = e.target.dataset.tab;
                self.loadItems(self.currentTab);
            });
        });
    },

    setupSearch() {
        var self = this;
        var searchInput = document.getElementById("guardadosSearch");
        var debounceTimer;
        
        searchInput.addEventListener("input", function(e) {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(function() {
                self.filterItems(e.target.value);
            }, 300);
        });
    },

    filterItems(query) {
        var container = document.getElementById("guardadosContainer");
        var emptyState = document.getElementById("emptyState");
        var items = this.getItemsByTab(this.currentTab);
        
        if (query.trim() !== "") {
            query = query.toLowerCase();
            items = items.filter(function(item) {
                return item.title.toLowerCase().includes(query) ||
                       (item.author && item.author.toLowerCase().includes(query));
            });
        }
        
        if (items.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#888;">No se encontraron resultados para "' + escapeHtml(query) + '"</div>';
            emptyState.style.display = "none";
            return;
        }
        
        emptyState.style.display = "none";
        container.innerHTML = items.map(item => this.renderItem(item)).join("");
    },

    removeItem(id) {
        if (window.LaTandaPopup) {
            window.LaTandaPopup.showInfo("Item eliminado de guardados");
        }
        // In real implementation, would call API and refresh list
    }
};

document.addEventListener("DOMContentLoaded", function() {
    GuardadosModule.init();
});
