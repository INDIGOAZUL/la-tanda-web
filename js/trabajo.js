/**
 * LA TANDA - TRABAJO PAGE
 * Jobs, Services, and Freelance listings
 * Version: 1.0
 */


// XSS prevention helper (v4.0.0)
function escapeHtml(text) {
    if (text == null) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
const TrabajoModule = {
    API_BASE: "https://latanda.online",
    currentTab: "todos",
    
    // Sample data (will be replaced with API calls)
    data: {
        empleos: [
            { id: 1, type: "empleo", title: "Contador Senior", company: "Empresa ABC", location: "Tegucigalpa", salary: "L. 25,000/mes", rating: 4.5, reviews: 12, icon: "fa-calculator", color: "#00FFFF", featured: true },
            { id: 2, type: "empleo", title: "Vendedor Retail", company: "Tienda XYZ", location: "San Pedro Sula", salary: "L. 12,000/mes", rating: 4.2, reviews: 8, icon: "fa-store", color: "#00FFFF", featured: false },
            { id: 3, type: "empleo", title: "Asistente Administrativo", company: "Oficina Legal", location: "Tegucigalpa", salary: "L. 15,000/mes", rating: 4.0, reviews: 5, icon: "fa-file-alt", color: "#00FFFF", featured: false }
        ],
        servicios: [
            { id: 4, type: "servicio", title: "Electricista Profesional", provider: "Juan Martinez", location: "Tegucigalpa", price: "L. 400/hora", rating: 4.8, reviews: 24, icon: "fa-bolt", color: "#8b5cf6", featured: true },
            { id: 5, type: "servicio", title: "Plomero Certificado", provider: "Carlos Reyes", location: "Comayaguela", price: "L. 350/hora", rating: 4.6, reviews: 18, icon: "fa-wrench", color: "#8b5cf6", featured: true },
            { id: 6, type: "servicio", title: "Pintor de Casas", provider: "Mario Lopez", location: "Tegucigalpa", price: "L. 300/hora", rating: 4.4, reviews: 15, icon: "fa-paint-roller", color: "#8b5cf6", featured: false },
            { id: 7, type: "servicio", title: "Jardinero", provider: "Pedro Sanchez", location: "San Pedro Sula", price: "L. 250/hora", rating: 4.3, reviews: 10, icon: "fa-leaf", color: "#8b5cf6", featured: false }
        ],
        freelance: [
            { id: 8, type: "freelance", title: "Desarrollador Web", provider: "Ana Garcia", location: "Remoto", price: "L. 15,000/proyecto", rating: 4.9, reviews: 32, icon: "fa-code", color: "#22c55e", featured: true },
            { id: 9, type: "freelance", title: "Disenador Grafico", provider: "Maria Flores", location: "Remoto", price: "L. 8,000/proyecto", rating: 4.7, reviews: 28, icon: "fa-palette", color: "#22c55e", featured: true },
            { id: 10, type: "freelance", title: "Community Manager", provider: "Laura Mendez", location: "Remoto", price: "L. 6,000/mes", rating: 4.5, reviews: 14, icon: "fa-hashtag", color: "#22c55e", featured: false },
            { id: 11, type: "freelance", title: "Editor de Video", provider: "Roberto Cruz", location: "Remoto", price: "L. 3,000/video", rating: 4.6, reviews: 20, icon: "fa-video", color: "#22c55e", featured: false }
        ]
    },

    async init() {
        
        this.loadFeatured();
        this.loadListings("todos");
        this.setupTabs();
        this.setupSearch();
        this.setupPublishButton();
        
    },

    getAllItems() {
        return [...this.data.empleos, ...this.data.servicios, ...this.data.freelance];
    },

    getItemsByType(type) {
        if (type === "todos") return this.getAllItems();
        return this.data[type] || [];
    },

    loadFeatured() {
        const container = document.getElementById("featuredContainer");
        const featured = this.getAllItems().filter(item => item.featured);
        
        container.innerHTML = featured.map(item => this.renderFeaturedCard(item)).join("");
    },

    renderFeaturedCard(item) {
        const providerOrCompany = item.provider || item.company;
        return '<div style="background:linear-gradient(135deg,' + item.color + '10,' + item.color + '05);border:1px solid ' + item.color + '30;border-radius:12px;padding:16px;cursor:pointer;" onclick="TrabajoModule.showDetail(' + item.id + ')">' +
            '<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">' +
            '<div style="width:45px;height:45px;background:' + item.color + '20;border-radius:10px;display:flex;align-items:center;justify-content:center;">' +
            '<i class="fas ' + item.icon + '" style="color:' + item.color + ';font-size:1.2rem;"></i></div>' +
            '<div style="flex:1;min-width:0;">' +
            '<div style="color:#fff;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(item.title) + '</div>' +
            '<div style="font-size:0.8rem;color:#888;">' + providerOrCompany + '</div></div></div>' +
            '<div style="display:flex;align-items:center;justify-content:space-between;">' +
            '<div style="font-size:0.85rem;color:' + item.color + ';font-weight:600;">' + item.price + '</div>' +
            '<div style="font-size:0.8rem;color:#fbbf24;"><i class="fas fa-star"></i> ' + item.rating + '</div></div></div>';
    },

    loadListings(type) {
        const container = document.getElementById("listingsContainer");
        const items = this.getItemsByType(type);
        
        if (items.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#888;">No hay listados disponibles</div>';
            return;
        }
        
        container.innerHTML = items.map(item => this.renderListingCard(item)).join("");
    },

    renderListingCard(item) {
        const providerOrCompany = item.provider || item.company;
        const typeLabel = item.type === "empleo" ? "Empleo" : item.type === "servicio" ? "Servicio" : "Freelance";
        const typeBadgeColor = item.type === "empleo" ? "#00FFFF" : item.type === "servicio" ? "#8b5cf6" : "#22c55e";
        
        return '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.05);border-radius:12px;padding:16px;cursor:pointer;transition:all 0.2s;" onclick="TrabajoModule.showDetail(' + item.id + ')">' +
            '<div style="display:flex;gap:16px;">' +
            '<div style="width:50px;height:50px;background:' + item.color + '15;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">' +
            '<i class="fas ' + item.icon + '" style="color:' + item.color + ';font-size:1.3rem;"></i></div>' +
            '<div style="flex:1;min-width:0;">' +
            '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">' +
            '<span style="color:#fff;font-weight:600;">' + escapeHtml(item.title) + '</span>' +
            '<span style="font-size:0.7rem;padding:2px 8px;background:' + typeBadgeColor + '20;color:' + typeBadgeColor + ';border-radius:10px;">' + typeLabel + '</span></div>' +
            '<div style="font-size:0.85rem;color:#888;margin-bottom:6px;">' + escapeHtml(providerOrCompany) + ' <i class="fas fa-map-marker-alt" style="margin-left:8px;"></i> ' + escapeHtml(item.location) + '</div>' +
            '<div style="display:flex;align-items:center;gap:16px;">' +
            '<span style="font-size:0.9rem;color:' + item.color + ';font-weight:600;">' + item.price + '</span>' +
            '<span style="font-size:0.8rem;color:#fbbf24;"><i class="fas fa-star"></i> ' + item.rating + ' (' + item.reviews + ')</span></div></div></div>' +
            '<div style="display:flex;gap:8px;margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.05);">' +
            '<button style="flex:1;padding:8px;background:transparent;border:1px solid ' + item.color + ';color:' + item.color + ';border-radius:8px;cursor:pointer;font-size:0.85rem;">Ver Perfil</button>' +
            '<button style="flex:1;padding:8px;background:' + item.color + ';border:none;color:#000;border-radius:8px;cursor:pointer;font-size:0.85rem;font-weight:600;">Contactar</button></div></div>';
    },

    setupTabs() {
        var self = this;
        document.querySelectorAll(".trabajo-tab").forEach(function(tab) {
            tab.addEventListener("click", function(e) {
                document.querySelectorAll(".trabajo-tab").forEach(function(t) {
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
                self.loadListings(self.currentTab);
            });
        });
    },

    setupSearch() {
        var self = this;
        var searchInput = document.getElementById("trabajoSearch");
        var debounceTimer;
        
        searchInput.addEventListener("input", function(e) {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(function() {
                self.filterListings(e.target.value);
            }, 300);
        });
    },

    filterListings(query) {
        var container = document.getElementById("listingsContainer");
        var items = this.getItemsByType(this.currentTab);
        
        if (query.trim() !== "") {
            query = query.toLowerCase();
            items = items.filter(function(item) {
                return item.title.toLowerCase().includes(query) ||
                       (item.provider && item.provider.toLowerCase().includes(query)) ||
                       (item.company && item.company.toLowerCase().includes(query)) ||
                       item.location.toLowerCase().includes(query);
            });
        }
        
        if (items.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#888;">No se encontraron resultados para "' + escapeHtml(query) + '"</div>';
            return;
        }
        
        container.innerHTML = items.map(item => this.renderListingCard(item)).join("");
    },

    setupPublishButton() {
        document.getElementById("btnPublicarServicio").addEventListener("click", function() {
            if (window.LaTandaPopup) {
                window.LaTandaPopup.showInfo("Publicar servicio proximamente. Contactanos para agregar tu servicio.");
            } else {
                alert("Publicar servicio proximamente");
            }
        });
    },

    showDetail(id) {
        var item = this.getAllItems().find(function(i) { return i.id === id; });
        if (item && window.LaTandaPopup) {
            window.LaTandaPopup.showInfo(item.title + " - Contactar al proveedor proximamente");
        }
    }
};

document.addEventListener("DOMContentLoaded", function() {
    TrabajoModule.init();
});
