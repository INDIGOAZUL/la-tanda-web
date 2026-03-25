function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

/**
 * LA TANDA - MENSAJES (Messages)
 * Direct messaging interface
 * Version: 1.0
 */

const MensajesModule = {
    currentTab: "todos",
    
    conversations: [
        { id: 1, name: "Maria Lopez", avatar: "ML", lastMessage: "Gracias por la info sobre la tanda!", time: "hace 5 min", unread: 2, online: true },
        { id: 2, name: "Juan Martinez", avatar: "JM", lastMessage: "El producto ya esta disponible", time: "hace 1 hora", unread: 1, online: false },
        { id: 3, name: "Grupo: Ahorro Navidad", avatar: "AN", lastMessage: "Carlos: Listo mi aporte de hoy", time: "hace 2 horas", unread: 0, online: false, isGroup: true },
        { id: 4, name: "Ana Garcia", avatar: "AG", lastMessage: "Perfecto, nos vemos manana", time: "hace 3 horas", unread: 0, online: true },
        { id: 5, name: "Soporte La Tanda", avatar: "LT", lastMessage: "Tu verificacion fue aprobada", time: "ayer", unread: 0, online: true, verified: true },
        { id: 6, name: "Grupo: Tanda Semanal", avatar: "TS", lastMessage: "Tu: Confirmo mi participacion", time: "ayer", unread: 0, online: false, isGroup: true },
        { id: 7, name: "Carlos Mendez", avatar: "CM", lastMessage: "Que tal el servicio?", time: "hace 2 dias", unread: 0, online: false },
        { id: 8, name: "Sofia Ramirez", avatar: "SR", lastMessage: "Foto enviada", time: "hace 3 dias", unread: 0, online: false }
    ],

    async init() {
        
        this.loadConversations("todos");
        this.setupTabs();
        this.setupSearch();
        this.setupNewMessage();
        
    },

    getConversationsByTab(tab) {
        switch(tab) {
            case "no-leidos":
                return this.conversations.filter(c => c.unread > 0);
            case "grupos":
                return this.conversations.filter(c => c.isGroup);
            default:
                return this.conversations;
        }
    },

    loadConversations(tab) {
        var container = document.getElementById("conversationsContainer");
        var emptyState = document.getElementById("emptyState");
        var convs = this.getConversationsByTab(tab);
        
        if (convs.length === 0) {
            container.innerHTML = "";
            emptyState.style.display = "block";
            return;
        }
        
        emptyState.style.display = "none";
        container.innerHTML = convs.map(conv => this.renderConversation(conv)).join("");
    },

    renderConversation(conv) {
        var onlineIndicator = conv.online 
            ? '<div style="position:absolute;bottom:2px;right:2px;width:12px;height:12px;background:#22c55e;border:2px solid #0a0a0f;border-radius:50%;"></div>' 
            : '';
        
        var unreadBadge = conv.unread > 0 
            ? '<div style="min-width:20px;height:20px;background:#00FFFF;color:#000;border-radius:10px;font-size:0.75rem;font-weight:600;display:flex;align-items:center;justify-content:center;padding:0 6px;">' + conv.unread + '</div>'
            : '';
        
        var verifiedBadge = conv.verified 
            ? '<i class="fas fa-check-circle" style="color:#00FFFF;font-size:0.8rem;margin-left:4px;"></i>' 
            : '';
        
        var groupIcon = conv.isGroup 
            ? '<i class="fas fa-users" style="color:#8b5cf6;font-size:0.7rem;margin-left:4px;"></i>' 
            : '';
        
        var avatarBg = conv.isGroup ? '#8b5cf6' : '#00FFFF';
        
        return '<div onclick="MensajesModule.openConversation(' + conv.id + ')" style="display:flex;align-items:center;gap:14px;padding:14px;background:rgba(255,255,255,0.02);border-radius:12px;margin-bottom:8px;cursor:pointer;transition:background 0.2s;" onmouseover="this.style.background=\'rgba(255,255,255,0.05)\'" onmouseout="this.style.background=\'rgba(255,255,255,0.02)\'">' +
            '<div style="position:relative;flex-shrink:0;">' +
            '<div style="width:50px;height:50px;background:' + avatarBg + '20;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:600;color:' + avatarBg + ';">' + escapeHtml(conv.avatar) + '</div>' +
            onlineIndicator + '</div>' +
            '<div style="flex:1;min-width:0;">' +
            '<div style="display:flex;align-items:center;margin-bottom:4px;">' +
            '<span style="font-weight:600;color:#fff;">' + escapeHtml(conv.name) + '</span>' + verifiedBadge + groupIcon + '</div>' +
            '<div style="font-size:0.85rem;color:#888;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(conv.lastMessage) + '</div></div>' +
            '<div style="text-align:right;flex-shrink:0;">' +
            '<div style="font-size:0.75rem;color:#666;margin-bottom:6px;">' + escapeHtml(conv.time) + '</div>' +
            unreadBadge + '</div></div>';
    },

    setupTabs() {
        var self = this;
        document.querySelectorAll(".mensajes-tab").forEach(function(tab) {
            tab.addEventListener("click", function(e) {
                document.querySelectorAll(".mensajes-tab").forEach(function(t) {
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
                self.loadConversations(self.currentTab);
            });
        });
    },

    setupSearch() {
        var self = this;
        var searchInput = document.getElementById("mensajesSearch");
        var debounceTimer;
        
        searchInput.addEventListener("input", function(e) {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(function() {
                self.filterConversations(e.target.value);
            }, 300);
        });
    },

    filterConversations(query) {
        var container = document.getElementById("conversationsContainer");
        var emptyState = document.getElementById("emptyState");
        var convs = this.getConversationsByTab(this.currentTab);
        
        if (query.trim() !== "") {
            query = query.toLowerCase();
            convs = convs.filter(function(c) {
                return c.name.toLowerCase().includes(query) ||
                       c.lastMessage.toLowerCase().includes(query);
            });
        }
        
        if (convs.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#888;">No se encontraron conversaciones</div>';
            emptyState.style.display = "none";
            return;
        }
        
        emptyState.style.display = "none";
        container.innerHTML = convs.map(conv => this.renderConversation(conv)).join("");
    },

    setupNewMessage() {
        document.getElementById("btnNewMessage").addEventListener("click", function() {
            if (window.LaTandaPopup) {
                window.LaTandaPopup.showInfo("Nueva conversacion - Proximamente");
            }
        });
    },

    openConversation(id) {
        var conv = this.conversations.find(function(c) { return c.id === id; });
        if (conv && window.LaTandaPopup) {
            window.LaTandaPopup.showInfo("Chat con " + conv.name + " - Proximamente");
        }
    }
};

document.addEventListener("DOMContentLoaded", function() {
    MensajesModule.init();
});
