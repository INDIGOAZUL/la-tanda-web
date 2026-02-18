function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

/**
 * LA TANDA - CREATOR HUB
 * Content creator tools and analytics
 * Version: 1.0
 */

const CreatorHubModule = {
    currentTab: "todos",
    
    content: {
        publicados: [
            { id: 1, title: "Mi experiencia con tandas", type: "post", status: "published", views: 342, likes: 45, date: "hace 2 dias", thumbnail: null },
            { id: 2, title: "Tips de ahorro para principiantes", type: "post", status: "published", views: 521, likes: 78, date: "hace 5 dias", thumbnail: null },
            { id: 3, title: "Review: Marketplace La Tanda", type: "post", status: "published", views: 189, likes: 23, date: "hace 1 semana", thumbnail: null }
        ],
        borradores: [
            { id: 4, title: "Como elegir la mejor tanda", type: "draft", status: "draft", views: 0, likes: 0, date: "hace 1 dia", thumbnail: null },
            { id: 5, title: "Guia de inversion 2026", type: "draft", status: "draft", views: 0, likes: 0, date: "hace 3 dias", thumbnail: null }
        ],
        programados: [
            { id: 6, title: "Predicciones loteria febrero", type: "scheduled", status: "scheduled", scheduledDate: "Feb 1, 2026 - 9:00 AM", views: 0, likes: 0, thumbnail: null }
        ]
    },

    achievements: [
        { id: 1, name: "Primer Post", icon: "fa-feather", color: "#00FFFF", unlocked: true },
        { id: 2, name: "10 Likes", icon: "fa-heart", color: "#ef4444", unlocked: true },
        { id: 3, name: "100 Vistas", icon: "fa-eye", color: "#8b5cf6", unlocked: true },
        { id: 4, name: "Viral", icon: "fa-fire", color: "#fbbf24", unlocked: false },
        { id: 5, name: "Influencer", icon: "fa-crown", color: "#22c55e", unlocked: false }
    ],

    async init() {
        
        this.loadContent("todos");
        this.loadAchievements();
        this.setupTabs();
        this.setupActions();
        
    },

    getAllContent() {
        return [...this.content.publicados, ...this.content.borradores, ...this.content.programados];
    },

    getContentByTab(tab) {
        if (tab === "todos") return this.getAllContent();
        return this.content[tab] || [];
    },

    loadContent(tab) {
        var container = document.getElementById("contentContainer");
        var items = this.getContentByTab(tab);
        
        if (items.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#888;">No hay contenido en esta categoria</div>';
            return;
        }
        
        container.innerHTML = items.map(item => this.renderContentCard(item)).join("");
    },

    renderContentCard(item) {
        var statusBadge = "";
        var statusColor = "";
        
        switch(item.status) {
            case "published":
                statusBadge = "Publicado";
                statusColor = "#22c55e";
                break;
            case "draft":
                statusBadge = "Borrador";
                statusColor = "#888";
                break;
            case "scheduled":
                statusBadge = "Programado";
                statusColor = "#8b5cf6";
                break;
        }
        
        var statsHtml = item.status === "published" 
            ? '<span><i class="fas fa-eye"></i> ' + item.views + '</span><span><i class="fas fa-heart"></i> ' + item.likes + '</span>'
            : item.status === "scheduled" 
                ? '<span><i class="fas fa-calendar"></i> ' + escapeHtml(item.scheduledDate) + '</span>'
                : '<span style="color:#888;">Sin publicar</span>';
        
        return '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.05);border-radius:12px;padding:16px;">' +
            '<div style="display:flex;gap:16px;">' +
            '<div style="width:60px;height:60px;background:rgba(0,255,255,0.1);border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">' +
            '<i class="fas fa-file-alt" style="color:#00FFFF;font-size:1.5rem;"></i></div>' +
            '<div style="flex:1;min-width:0;">' +
            '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">' +
            '<span style="color:#fff;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(item.title) + '</span>' +
            '<span style="font-size:0.7rem;padding:2px 8px;background:' + statusColor + '20;color:' + statusColor + ';border-radius:10px;white-space:nowrap;">' + statusBadge + '</span></div>' +
            '<div style="display:flex;align-items:center;gap:16px;font-size:0.85rem;color:#888;">' + statsHtml + '</div>' +
            '<div style="font-size:0.8rem;color:#666;margin-top:4px;">' + escapeHtml(item.date || "") + '</div></div></div>' +
            '<div style="display:flex;gap:8px;margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.05);">' +
            '<button onclick="CreatorHubModule.editContent(' + item.id + ')" style="flex:1;padding:8px;background:transparent;border:1px solid rgba(0,255,255,0.3);color:#00FFFF;border-radius:8px;cursor:pointer;font-size:0.85rem;"><i class="fas fa-edit"></i> Editar</button>' +
            '<button onclick="CreatorHubModule.viewStats(' + item.id + ')" style="flex:1;padding:8px;background:transparent;border:1px solid rgba(139,92,246,0.3);color:#8b5cf6;border-radius:8px;cursor:pointer;font-size:0.85rem;"><i class="fas fa-chart-line"></i> Stats</button>' +
            '<button onclick="CreatorHubModule.deleteContent(' + item.id + ')" style="padding:8px 12px;background:transparent;border:1px solid rgba(239,68,68,0.3);color:#ef4444;border-radius:8px;cursor:pointer;font-size:0.85rem;"><i class="fas fa-trash"></i></button></div></div>';
    },

    loadAchievements() {
        var container = document.getElementById("achievementsContainer");
        
        container.innerHTML = this.achievements.map(function(ach) {
            var opacity = ach.unlocked ? "1" : "0.4";
            var lockIcon = ach.unlocked ? "" : '<i class="fas fa-lock" style="position:absolute;bottom:5px;right:5px;font-size:0.7rem;color:#888;"></i>';
            
            return '<div style="flex-shrink:0;width:80px;text-align:center;opacity:' + opacity + ';position:relative;">' +
                '<div style="width:60px;height:60px;margin:0 auto 8px;background:' + ach.color + '15;border:2px solid ' + ach.color + '40;border-radius:50%;display:flex;align-items:center;justify-content:center;position:relative;">' +
                '<i class="fas ' + ach.icon + '" style="color:' + ach.color + ';font-size:1.3rem;"></i>' + lockIcon + '</div>' +
                '<div style="font-size:0.75rem;color:#ccc;">' + ach.name + '</div></div>';
        }).join("");
    },

    setupTabs() {
        var self = this;
        document.querySelectorAll(".creator-tab").forEach(function(tab) {
            tab.addEventListener("click", function(e) {
                document.querySelectorAll(".creator-tab").forEach(function(t) {
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
                self.loadContent(self.currentTab);
            });
        });
    },

    setupActions() {
        var self = this;
        
        document.getElementById("btnCreateContent").addEventListener("click", function() {
            self.showMessage("Crear contenido - Proximamente");
        });
        
        document.querySelectorAll(".creator-action-btn").forEach(function(btn) {
            btn.addEventListener("click", function(e) {
                var action = e.currentTarget.dataset.action;
                switch(action) {
                    case "post": self.showMessage("Crear publicacion - Proximamente"); break;
                    case "schedule": self.showMessage("Programar contenido - Proximamente"); break;
                    case "analytics": self.showMessage("Analytics detallado - Proximamente"); break;
                    case "promote": self.showMessage("Promocionar contenido - Proximamente"); break;
                }
            });
        });
    },

    editContent(id) {
        this.showMessage("Editar contenido #" + id + " - Proximamente");
    },

    viewStats(id) {
        this.showMessage("Estadisticas detalladas #" + id + " - Proximamente");
    },

    deleteContent(id) {
        this.showMessage("Eliminar contenido requiere confirmacion - Proximamente");
    },

    showMessage(msg) {
        if (window.LaTandaPopup) {
            window.LaTandaPopup.showInfo(msg);
        } else {
            alert(msg);
        }
    }
};

document.addEventListener("DOMContentLoaded", function() {
    CreatorHubModule.init();
});
