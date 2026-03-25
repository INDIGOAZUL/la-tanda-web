// Dashboard Data Loader - Connects to PostgreSQL via API
// Fixed: v2.0 - Removed code outside IIFE that caused reference errors
(function() {
    "use strict";
    
    
    const API_BASE = window.API_BASE_URL || "https://latanda.online";
    
    
// XSS prevention helper (v4.0.0)
function escapeHtml(text) {
    if (text == null) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function getAuthToken() {
        return localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token") || null;
    }

    function getAuthHeaders() {
        const token = getAuthToken();
        return token ? { "Authorization": "Bearer " + token } : {};
    }

    function normalizeApiData(rawData) {
        if (rawData.balance && typeof rawData.balance === "object" && rawData.balance.amount !== undefined) {
            return rawData;
        }
        return {
            user: rawData.user || { name: "Usuario" },
            balance: {
                amount: typeof rawData.balance === "number" ? rawData.balance : (rawData.balance?.amount || 0),
                available: typeof rawData.balance === "number" ? rawData.balance : (rawData.balance?.amount || 0),
                currency: "HNL"
            },
            tandas: {
                active: rawData.active_tandas || 0,
                as_admin: 0,
                as_member: rawData.active_tandas || 0
            },
            savings: {
                completed_contributions: rawData.completed_contributions || 0,
                total: rawData.total_savings || rawData.stats?.total_saved || (typeof rawData.balance === "number" ? rawData.balance : 0)
            },
            recent_activity: rawData.recent_activity || [],
            next_payment: rawData.next_payment,
            total_savings: rawData.total_savings || 0
        };
    }
    
    function getCurrentUserId() {
        var storedUser = localStorage.getItem("latanda_user") || sessionStorage.getItem("latanda_user");
        if (storedUser) {
            try {
                var parsed = JSON.parse(storedUser);
                if (parsed.id && (parsed.id.startsWith("demo_user_") || parsed.name === "Demo User")) {
                    return null;
                }
                if (parsed.id) return String(parsed.id);
                if (parsed.user_id) return String(parsed.user_id);
            } catch(e) {}
        }
        // v4.2.0: URL param fallback removed (IDOR risk)
        return localStorage.getItem("user_id") || localStorage.getItem("userId") || null;
    }
    
    function formatCurrency(amount) {
        var num = parseFloat(amount) || 0;
        return "L. " + num.toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    
    async function loadDashboardData() {
        var userId = getCurrentUserId();
        if (!userId) {
            updateUINoUser();
            return;
        }
        
        
        try {
            var response = await fetch(API_BASE + "/api/dashboard/summary?user_id=" + encodeURIComponent(userId), { headers: getAuthHeaders() });
            var result = await response.json();
            
            if (result.success && (result.dashboard || (result.data && result.data.data))) {
                var rawData = result.dashboard || result.data.data || result.data;
                var data = normalizeApiData(rawData);
                updateDashboardUI(data);
                window.latandaDashboardData = data;
            } else {
                updateUIError();
            }
        } catch (error) {
            updateUIError();
        }
    }
    
    function updateDashboardUI(data) {
        updateCarouselStats(data);
        window.latandaRealBalance = data.balance ? parseFloat(data.balance.amount) || 0 : 0;
        
        var welcomeTitle = document.getElementById("welcomeTitle");
        if (welcomeTitle && data.user) {
            var hour = new Date().getHours(); var greeting = hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches"; welcomeTitle.textContent = greeting + ", " + (data.user.name || "Usuario").split(" ")[0] + "!";
        }
        
        // Update avatar with photo or initials
        var userAvatar = document.getElementById("userAvatar");
        if (userAvatar && data.user) {
            var userName = data.user.name || "Usuario";
            var avatarUrl = data.user.avatar_url || data.user.profile_image_url;
            var initials = userName.trim().split(" ").map(function(n){return n[0]}).slice(0,2).join("").toUpperCase() || "?";
            if (avatarUrl) {
                var img = document.createElement("img");
                img.src = avatarUrl;
                img.alt = userName;
                img.style.cssText = "width:100%;height:100%;object-fit:cover;border-radius:50%;";
                img.onerror = function() { userAvatar.innerHTML = "<span style='color:#00FFFF;font-weight:600;font-size:1rem;'>" + initials + "</span>"; };
                userAvatar.innerHTML = "";
                userAvatar.appendChild(img);
            } else {
                userAvatar.innerHTML = "<span style='color:#00FFFF;font-weight:600;font-size:1rem;'>" + initials + "</span>";
            }
        }
        
        // Update compose box avatar (if exists)
        var composeAvatar = document.querySelector(".compose-avatar");
        if (composeAvatar && data.user) {
            var cAvatarUrl = data.user.avatar_url || data.user.profile_image_url;
            var cUserName = data.user.name || "Usuario";
            var cInitials = cUserName.trim().split(" ").map(function(n){return n[0]}).slice(0,2).join("").toUpperCase() || "?";
            if (cAvatarUrl) {
                composeAvatar.classList.add("has-image");
                composeAvatar.innerHTML = '<img src="' + escapeHtml(cAvatarUrl) + '" alt="' + escapeHtml(cUserName) + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"><span class="compose-avatar-initials" style="display:none">' + escapeHtml(cInitials) + '</span>';
            } else {
                composeAvatar.innerHTML = "<span class='compose-avatar-initials'>" + escapeHtml(cInitials) + "</span>";
            }
            // Also save to localStorage for future use
            if (cAvatarUrl) {
                try {
                    var storedUser = JSON.parse(localStorage.getItem("latanda_user") || "{}");
                    storedUser.avatar_url = cAvatarUrl;
                    localStorage.setItem("latanda_user", JSON.stringify(storedUser));
                } catch(e) {}
            }
        }
        
        var lastActivityText = document.getElementById("lastActivityText");
        if (lastActivityText) {
            if (data.recent_activity && data.recent_activity.length > 0) {
                var last = data.recent_activity[0];
                lastActivityText.textContent = last.status + " - " + last.formatted + " en " + last.group_name;
            } else {
                lastActivityText.textContent = "Sin actividad reciente";
            }
        }
        
        var tandasSummary = document.getElementById("tandasSummary");
        if (tandasSummary && data.tandas) {
            tandasSummary.textContent = data.tandas.active + " tandas activas";
        }
        
        var tandasGrid = document.getElementById("tandasGrid");
        if (tandasGrid) {
            if (data.tandas && data.tandas.active > 0) {
                tandasGrid.innerHTML = "<div class=\"tanda-card\" style=\"cursor: pointer;\" onclick=\"window.location.href=&apos;groups-advanced-system.html&apos;\">" +
                    "<div class=\"tanda-header\">" +
                    "<span class=\"tanda-name\"><i class=\"fas fa-users\"></i> Mis Tandas</span>" +
                    "<span class=\"tanda-role\" style=\"background: linear-gradient(135deg, #22d55e, #16a34a); color: white; padding: 4px 8px; border-radius: 8px; font-size: 11px;\">Activo</span>" +
                    "</div>" +
                    "<div class=\"tanda-info\" style=\"padding: 12px 0;\">" +
                    "<span style=\"color: #00FFFF; font-weight: 600; font-size: 18px;\">" + data.tandas.active + " tandas activas</span><br>" +
                    "<span style=\"color: rgba(248,250,252,0.7);\">" + data.tandas.as_admin + " como admin, " + data.tandas.as_member + " como miembro</span>" +
                    "</div>" +
                    "<div class=\"tanda-actions\" style=\"margin-top: 12px;\">" +
                    "<button class=\"section-btn\" style=\"background: rgba(0,255,255,0.1); border: 1px solid rgba(0,255,255,0.2); color: #00FFFF; padding: 8px 16px; border-radius: 8px; cursor: pointer;\" onclick=\"event.stopPropagation(); window.location.href=&apos;groups-advanced-system.html&apos;\"><i class=\"fas fa-eye\"></i> Ver Tandas</button>" +
                    "</div>" +
                    "</div>";
            } else {
                tandasGrid.innerHTML = "<div class=\"no-tandas\" style=\"text-align: center; padding: 32px;\">" +
                    "<i class=\"fas fa-users-slash\" style=\"font-size: 48px; color: rgba(248,250,252,0.5); margin-bottom: 16px;\"></i>" +
                    "<p style=\"color: rgba(248,250,252,0.7); margin-bottom: 16px;\">No tienes tandas activas</p>" +
                    "<button class=\"section-btn primary\" style=\"background: linear-gradient(135deg, #00FFFF, #7FFFD8); color: #000; border: none; padding: 10px 20px; border-radius: 10px; cursor: pointer; font-weight: 600;\" onclick=\"window.location.href=&apos;groups-advanced-system.html&apos;\">" +
                    "<i class=\"fas fa-plus\"></i> Crear tu primera tanda</button>" +
                    "</div>";
            }
        }
        
        var activityList = document.getElementById("activityList");
        if (activityList) {
            if (data.recent_activity && data.recent_activity.length > 0) {
                var html = "";
                data.recent_activity.forEach(function(activity) {
                    var iconClass = activity.status === "completed" ? "completed" : (activity.status === "pending" ? "pending" : "received");
                    var icon = activity.status === "completed" ? "fa-check" : (activity.status === "pending" ? "fa-clock" : "fa-arrow-down");
                    var timeAgo = getTimeAgo(new Date(activity.date));
                    
                    html += "<div class=\"activity-item-new\" style=\"display: flex; align-items: center; padding: 12px; border-bottom: 1px solid rgba(0,255,255,0.1);\">" +
                        "<div class=\"activity-icon-wrapper " + iconClass + "\" style=\"width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; background: rgba(0,255,255,0.1);\"><i class=\"fas " + icon + "\" style=\"color: #00FFFF;\"></i></div>" +
                        "<div class=\"activity-details\" style=\"flex: 1;\">" +
                        "<div class=\"activity-title-text\" style=\"font-weight: 500;\">" + (activity.status === "completed" ? "Contribucion completada" : "Contribucion " + activity.status) + "</div>" +
                        "<div class=\"activity-subtitle\" style=\"color: rgba(248,250,252,0.7); font-size: 12px;\">" + activity.group_name + "</div>" +
                        "</div>" +
                        "<div class=\"activity-meta\" style=\"text-align: right;\">" +
                        "<div class=\"activity-amount-text\" style=\"color: #00FFFF; font-weight: 600;\">" + activity.formatted + "</div>" +
                        "<div class=\"activity-time-text\" style=\"color: rgba(248,250,252,0.5); font-size: 11px;\">" + timeAgo + "</div>" +
                        "</div>" +
                        "</div>";
                });
                activityList.innerHTML = html;
            } else {
                activityList.innerHTML = "<div class=\"no-tandas\" style=\"text-align: center; padding: 32px;\">" +
                    "<i class=\"fas fa-inbox\" style=\"font-size: 48px; color: rgba(248,250,252,0.5); margin-bottom: 16px;\"></i>" +
                    "<p style=\"color: rgba(248,250,252,0.7);\">Sin actividad reciente</p>" +
                    "<p style=\"color: rgba(248,250,252,0.5); font-size: 12px; margin-top: 8px;\">Tus transacciones apareceran aqui</p>" +
                    "</div>";
            }
        }
        
        var statTotalSaved = document.getElementById("statTotalSaved");
        if (statTotalSaved && data.savings) {
            statTotalSaved.textContent = formatCurrency(data.savings.total || 0);
        }
        
        var statTandasCompleted = document.getElementById("statTandasCompleted");
        if (statTandasCompleted && data.savings) {
            statTandasCompleted.textContent = data.savings.completed_contributions || 0;
        }
        
        var statMemberSince = document.getElementById("statMemberSince");
        if (statMemberSince && data.user && data.user.member_since) {
            var memberDate = new Date(data.user.member_since);
            statMemberSince.textContent = memberDate.toLocaleDateString("es", { month: "short", year: "numeric" });
        }
        
        var tandasCountBadge = document.getElementById("tandasCount");
        if (tandasCountBadge && data.tandas) {
            tandasCountBadge.textContent = data.tandas.active || 0;
            tandasCountBadge.style.display = data.tandas.active > 0 ? "inline-block" : "none";
        }
        
        var profileBalance = document.getElementById("profileBalance");
        if (profileBalance && data.balance) {
            profileBalance.textContent = formatCurrency(data.balance.available || data.balance.amount || 0);
        }
        
        var profileTandas = document.getElementById("profileTandas");
        if (profileTandas && data.tandas) {
            profileTandas.textContent = data.tandas.active || 0;
        }
        
        var statPunctuality = document.getElementById("statPunctuality");
        if (statPunctuality && data.savings && data.savings.completed_contributions > 0) {
            statPunctuality.textContent = "100%";
        }
    }
    
    function updateCarouselStats(data) {
        var carouselBalance = document.getElementById("carouselBalance");
        if (carouselBalance && data.balance) {
            carouselBalance.textContent = formatCurrency(data.balance.available);
        }
        
        var carouselSavings = document.getElementById("carouselSavings");
        if (carouselSavings && data.savings) {
            carouselSavings.textContent = formatCurrency(data.savings.total);
        }
        
        var carouselTandas = document.getElementById("carouselTandas");
        if (carouselTandas && data.tandas) {
            carouselTandas.textContent = data.tandas.active;
        }
        
        var carouselTandasSub = document.getElementById("carouselTandasSub");
        if (carouselTandasSub && data.tandas) {
            if (data.tandas.active === 0) {
                carouselTandasSub.textContent = "sin tandas activas";
            } else if (data.tandas.active === 1) {
                carouselTandasSub.textContent = data.tandas.as_admin > 0 ? "como coordinador" : "como miembro";
            } else {
                carouselTandasSub.textContent = data.tandas.as_admin + " coord, " + data.tandas.as_member + " miembro";
            }
        }
        
        var carouselNextPayment = document.getElementById("carouselNextPayment");
        var carouselNextPaymentSub = document.getElementById("carouselNextPaymentSub");
        if (data.next_payment && data.next_payment.has_payment) {
            if (carouselNextPayment) {
                carouselNextPayment.textContent = formatCurrency(data.next_payment.amount);
            }
            if (carouselNextPaymentSub) {
                var daysText = data.next_payment.days_until === 0 ? "Hoy" : 
                               data.next_payment.days_until === 1 ? "Manana" : 
                               "en " + data.next_payment.days_until + " dias";
                carouselNextPaymentSub.textContent = daysText + " - " + data.next_payment.group_name;
            }
        } else {
            if (carouselNextPayment) carouselNextPayment.textContent = "--";
            if (carouselNextPaymentSub) carouselNextPaymentSub.textContent = "sin pagos pendientes";
        }
    }
    
    function updateUINoUser() {
        var welcomeTitle = document.getElementById("welcomeTitle");
        if (welcomeTitle) welcomeTitle.textContent = "Bienvenido a La Tanda";
        
        var lastActivityText = document.getElementById("lastActivityText");
        if (lastActivityText) lastActivityText.textContent = "Inicia sesion para ver tu actividad";
        
        var tandasSummary = document.getElementById("tandasSummary");
        if (tandasSummary) tandasSummary.textContent = "Inicia sesion para ver tus tandas";
        
        var tandasGrid = document.getElementById("tandasGrid");
        if (tandasGrid) tandasGrid.innerHTML = "<div class=\"no-tandas\"><i class=\"fas fa-sign-in-alt\"></i><p>Inicia sesion para comenzar</p></div>";
        
        var activityList = document.getElementById("activityList");
        if (activityList) activityList.innerHTML = "<div class=\"no-tandas\"><i class=\"fas fa-sign-in-alt\"></i><p>Inicia sesion para ver actividad</p></div>";
        
        var carouselBalance = document.getElementById("carouselBalance");
        if (carouselBalance) carouselBalance.textContent = "L. 0.00";
        
        var carouselSavings = document.getElementById("carouselSavings");
        if (carouselSavings) carouselSavings.textContent = "L. 0.00";
        
        var carouselTandas = document.getElementById("carouselTandas");
        if (carouselTandas) carouselTandas.textContent = "0";
        
        var carouselTandasSub = document.getElementById("carouselTandasSub");
        if (carouselTandasSub) carouselTandasSub.textContent = "inicia sesion";
    }
    
    function updateUIError() {
        var tandasGrid = document.getElementById("tandasGrid");
        if (tandasGrid) tandasGrid.innerHTML = "<div class=\"no-tandas\"><i class=\"fas fa-exclamation-triangle\"></i><p>Error al cargar datos</p></div>";
        
        var activityList = document.getElementById("activityList");
        if (activityList) activityList.innerHTML = "<div class=\"no-tandas\"><i class=\"fas fa-exclamation-triangle\"></i><p>Error al cargar actividad</p></div>";
    }
    
    function getTimeAgo(date) {
        var now = new Date();
        var diff = now - date;
        var minutes = Math.floor(diff / 60000);
        var hours = Math.floor(diff / 3600000);
        var days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return "Ahora";
        if (minutes < 60) return "Hace " + minutes + " min";
        if (hours < 24) return "Hace " + hours + "h";
        if (days === 1) return "Ayer";
        if (days < 7) return "Hace " + days + " dias";
        return date.toLocaleDateString("es");
    }
    
    window.refreshDashboardSections = loadDashboardData;
    window.latandaDashboardData = null;
    
    window.updateProfileModalWithRealData = function() {
        var userId = getCurrentUserId();
        if (!userId) return;
        
        fetch(API_BASE + "/api/dashboard/summary?user_id=" + encodeURIComponent(userId), { headers: getAuthHeaders() })
            .then(function(r) { return r.json(); })
            .then(function(result) {
                if (result.success && (result.dashboard || (result.data && result.data.data))) {
                    var rawData = result.dashboard || result.data.data || result.data;
                    var data = normalizeApiData(rawData);
                    var profileBalance = document.getElementById("profileBalance");
                    if (profileBalance && data.balance) {
                        profileBalance.textContent = formatCurrency(data.balance.amount);
                    }
                    var profileTandas = document.getElementById("profileTandas");
                    if (profileTandas && data.tandas) {
                        profileTandas.textContent = data.tandas.active;
                    }
                }
            })
            .catch(function(e) { console.error("[Profile] Update error:", e); });
    };
    
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", loadDashboardData);
    } else {
        setTimeout(loadDashboardData, 100);
    }
    
    
})();
