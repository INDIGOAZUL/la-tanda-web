/**
 * LA TANDA - HYBRID ONBOARDING SYSTEM
 * Version: 1.3.0 (2026-01-09)
 * Features: Checklist + Tooltips + Smart Notifications + Email Verification Modal
 * Fixes: Corrected localStorage key (latanda_user), API endpoints, excluded lottery pages, inline email verification
 */

(function() {
    "use strict";

    var ONBOARDING_CONFIG = {
        storageKey: "latanda_onboarding",
        autoShow: true
    };

    var ONBOARDING_TASKS = [
        { id: "account_created", title: "Crear cuenta", description: "Bienvenido a La Tanda", reward: 10, icon: "fa-user-plus", auto: true },
        { id: "email_verified", title: "Verificar email", description: "Confirma tu correo", reward: 5, icon: "fa-envelope", auto: true, action: "verify-email" },
        { id: "profile_completed", title: "Completar perfil", description: "Añade tu foto y datos", reward: 15, icon: "fa-user-edit", action: "mi-perfil.html" },
        { id: "first_deposit", title: "Primer depósito", description: "Deposita L100 o más", reward: 20, icon: "fa-wallet", action: "my-wallet.html" },
        { id: "first_tanda", title: "Unirse a una tanda", description: "Únete a tu primera tanda", reward: 25, icon: "fa-users", action: "groups-advanced-system.html" },
        { id: "kyc_completed", title: "Verificar identidad", description: "Completa el proceso KYC", reward: 50, icon: "fa-id-card", action: "kyc-registration.html" }
    ];

    var CONTEXTUAL_TIPS = {
        "my-wallet.html": [{ id: "wallet_tip", target: ".deposit-btn, .action-btn", title: "Gana 20 LTD", message: "Haz tu primer depósito", position: "bottom" }],
        "groups-advanced-system.html": [{ id: "tanda_tip", target: ".join-btn, .create-group-btn", title: "Gana 25 LTD", message: "Únete a tu primera tanda", position: "bottom" }],
        "mi-perfil.html": [{ id: "profile_tip", target: ".avatar-section, .profile-avatar", title: "Gana 15 LTD", message: "Completa tu perfil", position: "right" }]
    };

    function LaTandaOnboarding() {
        this.tasks = ONBOARDING_TASKS.slice();
        this.tips = CONTEXTUAL_TIPS;
        this.data = this.loadProgress();
        this.currentPage = window.location.pathname.split("/").pop() || "index.html";
        this.init();
    }

    LaTandaOnboarding.prototype.init = function() {

        // Don't show onboarding on lottery pages
        var excludedPages = ["lottery-predictor.html", "lottery-stats.html"];
        if (excludedPages.some(function(p) { return window.location.pathname.indexOf(p) !== -1; })) {
            return;
        }

        var token = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
        if (!token || this.data.completed) {
            return;
        }

        // Check if dismissed and still within 24-hour window
        if (this.data.dismissedUntil) {
            var dismissedTime = new Date(this.data.dismissedUntil);
            if (new Date() < dismissedTime) {
                return;
            }
            // Clear expired dismissal
            delete this.data.dismissedUntil;
            this.saveProgress();
        }

        this.syncTaskStates();
        this.renderChecklist();
        this.setupTooltips();
        this.checkNotifications();
    };

    LaTandaOnboarding.prototype.loadProgress = function() {
        try {
            var stored = localStorage.getItem(ONBOARDING_CONFIG.storageKey);
            return stored ? JSON.parse(stored) : this.getDefaultData();
        } catch (e) {
            return this.getDefaultData();
        }
    };

    LaTandaOnboarding.prototype.getDefaultData = function() {
        return {
            tasks: {},
            tooltipsShown: {},
            notifsShown: {},
            loginCount: 1,
            firstLogin: new Date().toISOString(),
            completed: false,
            minimized: false
        };
    };

    LaTandaOnboarding.prototype.saveProgress = function() {
        localStorage.setItem(ONBOARDING_CONFIG.storageKey, JSON.stringify(this.data));
    };

    LaTandaOnboarding.prototype.getCompletedCount = function() {
        var count = 0;
        for (var key in this.data.tasks) {
            if (this.data.tasks[key]) count++;
        }
        return count;
    };

    LaTandaOnboarding.prototype.getTotalRewards = function() {
        var self = this;
        var sum = 0;
        this.tasks.forEach(function(t) {
            if (self.data.tasks[t.id]) sum += t.reward;
        });
        return sum;
    };

    LaTandaOnboarding.prototype.getPendingRewards = function() {
        var self = this;
        var sum = 0;
        this.tasks.forEach(function(t) {
            if (!self.data.tasks[t.id]) sum += t.reward;
        });
        return sum;
    };

    LaTandaOnboarding.prototype.syncTaskStates = function() {
        var self = this;
        var previousTasks = JSON.parse(JSON.stringify(this.data.tasks)); // Copy previous state
        this.data.tasks.account_created = true;

        try {
            var userDataStr = localStorage.getItem("latanda_user");
            if (userDataStr) {
                var userData = JSON.parse(userDataStr);
                this.data.tasks.email_verified = userData.email_verified || false;
                this.data.tasks.profile_completed = !!(userData.avatar_url && userData.avatar_url !== "default.jpg" && userData.phone);
                this.data.tasks.kyc_completed = userData.verification_level === "full";
            }
            
            // Sync email_verified from backend API (in case localStorage is stale)
            var token = localStorage.getItem("auth_token");
            if (token && !this.data.tasks.email_verified) {
                fetch("/api/user/profile", {
                    headers: { "Authorization": "Bearer " + token }
                }).then(function(res) {
                    if (res.ok) return res.json();
                }).then(function(data) {
                    // Handle both response formats: {user:{}} or {data:{user:{}}}
                    var user = data && data.user ? data.user : (data && data.data && data.data.user ? data.data.user : null);
                    if (user && user.email_verified) {
                        // Update localStorage with correct value
                        var ud = JSON.parse(localStorage.getItem("latanda_user") || "{}");
                        ud.email_verified = true;
                        localStorage.setItem("latanda_user", JSON.stringify(ud));
                        // Update task state
                        self.data.tasks.email_verified = true;
                        self.saveProgress();
                        self.renderChecklist();
                        self.claimReward("email_verified");
                    }
                }).catch(function(err) { console.error("[Onboarding] API sync error:", err); });
            }

            // Auto-claim rewards for newly detected completed tasks
            var tasksToCheck = ["account_created", "email_verified", "profile_completed", "kyc_completed"];
            tasksToCheck.forEach(function(taskId) {
                if (self.data.tasks[taskId] && !previousTasks[taskId]) {
                    self.claimReward(taskId);
                }
            });

            var token = localStorage.getItem("auth_token");
            var userDataStr = localStorage.getItem("latanda_user");
            var userId = userDataStr ? JSON.parse(userDataStr).id : null;

            if (token && userId) {
                // Check first_deposit via wallet balance API
                if (!this.data.tasks.first_deposit) {
                    fetch("/api/wallet/balance?user_id=" + encodeURIComponent(userId), {
                        headers: { "Authorization": "Bearer " + token }
                    }).then(function(res) {
                        if (res.ok) return res.json();
                    }).then(function(data) {
                        var balance = data && data.data ? (data.data.balance || 0) : 0;
                        if (balance > 0) {
                            self.data.tasks.first_deposit = true;
                            self.saveProgress();
                            self.renderChecklist();
                            self.claimReward("first_deposit");
                        }
                    }).catch(function(err) { console.error("[Onboarding] API sync error:", err); });
                }

                // Check first_tanda via my-groups-pg API
                if (!this.data.tasks.first_tanda) {
                    fetch("/api/groups/my-groups-pg?user_id=" + encodeURIComponent(userId), {
                        headers: { "Authorization": "Bearer " + token }
                    }).then(function(res) {
                        if (res.ok) return res.json();
                    }).then(function(data) {
                        var groups = data && data.data && data.data.groups ? data.data.groups : [];
                        if (groups.length > 0) {
                            self.data.tasks.first_tanda = true;
                            self.saveProgress();
                            self.renderChecklist();
                            self.claimReward("first_tanda");
                        }
                    }).catch(function(err) { console.error("[Onboarding] API sync error:", err); });
                }
            }

            if (this.getCompletedCount() === this.tasks.length && !this.data.completed) {
                this.data.completed = true;
                this.showCelebration();
            }
            this.saveProgress();
        } catch (e) {
            console.error("Sync error:", e);
        }
    };

    LaTandaOnboarding.prototype.renderChecklist = function() {
        var self = this;
        var existing = document.getElementById("onboarding-checklist");
        if (existing) existing.remove();

        var completedCount = this.getCompletedCount();
        var progress = Math.round((completedCount / this.tasks.length) * 100);
        var totalRewards = this.getTotalRewards();
        var pendingRewards = this.getPendingRewards();

        var tasksHtml = "";
        var foundCurrent = false;
        this.tasks.forEach(function(task) {
            var isComplete = self.data.tasks[task.id];
            var isCurrent = !isComplete && !foundCurrent;
            if (isCurrent) foundCurrent = true;

            var taskClass = "checklist-task" + (isComplete ? " completed" : "") + (isCurrent ? " current" : "");
            var onclick = task.action ? " onclick=\"window.laTandaOnboarding.goToTask('" + task.action + "')\"" : "";
            var iconHtml = isComplete ? "<i class=\"fas fa-check-circle\"></i>" : "<i class=\"fas " + task.icon + "\"></i>";
            var rewardClass = "task-reward" + (isComplete ? " earned" : "");

            tasksHtml += "<div class=\"" + taskClass + "\"" + onclick + ">" +
                "<div class=\"task-icon\">" + iconHtml + "</div>" +
                "<div class=\"task-info\"><div class=\"task-title\">" + task.title + "</div>" +
                "<div class=\"task-desc\">" + task.description + "</div></div>" +
                "<div class=\"" + rewardClass + "\"><span>+" + task.reward + "</span><i class=\"fas fa-coins\"></i></div></div>";
        });

        var checklistClass = "onboarding-checklist" + (this.data.minimized ? " minimized" : "");
        var chevron = this.data.minimized ? "up" : "down";

        var html = "<div id=\"onboarding-checklist\" class=\"" + checklistClass + "\">" +
            "<div class=\"checklist-header\" onclick=\"window.laTandaOnboarding.toggleMinimize()\">" +
            "<div class=\"checklist-title\"><i class=\"fas fa-tasks\"></i><span>Tu Progreso</span></div>" +
            "<div class=\"checklist-progress-mini\">" + progress + "%</div>" +
            "<button class=\"checklist-toggle\"><i class=\"fas fa-chevron-" + chevron + "\"></i></button></div>" +
            "<div class=\"checklist-content\">" +
            "<div class=\"checklist-progress-bar\"><div class=\"checklist-progress-fill\" style=\"width: " + progress + "%\"></div></div>" +
            "<div class=\"checklist-stats\"><span><i class=\"fas fa-check-circle\"></i> " + completedCount + "/" + this.tasks.length + "</span>" +
            "<span><i class=\"fas fa-coins\"></i> " + totalRewards + " LTD</span></div>" +
            "<div class=\"checklist-tasks\">" + tasksHtml + "</div>" +
            "<div class=\"checklist-footer\"><span class=\"pending-rewards\"><i class=\"fas fa-gift\"></i> " + pendingRewards + " LTD pendientes</span>" +
            "<button class=\"checklist-dismiss\" onclick=\"window.laTandaOnboarding.dismiss()\">Ocultar</button></div></div></div>";

        document.body.insertAdjacentHTML("beforeend", html);
        setTimeout(function() {
            var el = document.getElementById("onboarding-checklist");
            if (el) el.classList.add("visible");
        }, 500);
    };

    LaTandaOnboarding.prototype.toggleMinimize = function() {
        this.data.minimized = !this.data.minimized;
        this.saveProgress();
        var el = document.getElementById("onboarding-checklist");
        if (el) {
            el.classList.toggle("minimized", this.data.minimized);
            var icon = el.querySelector(".checklist-toggle i");
            if (icon) icon.className = "fas fa-chevron-" + (this.data.minimized ? "up" : "down");
        }
    };

    LaTandaOnboarding.prototype.goToTask = function(action) {
        // Handle email verification specially
        if (action === "verify-email" || action.includes("verify=email")) {
            this.showEmailVerificationModal();
            return;
        }
        window.location.href = action;
    };

    // Email Verification Modal
    LaTandaOnboarding.prototype.showEmailVerificationModal = function() {
        var self = this;
        var existing = document.getElementById("email-verify-modal");
        if (existing) existing.remove();

        var userData = localStorage.getItem("latanda_user");
        var userEmail = userData ? JSON.parse(userData).email || "" : "";
        var maskedEmail = userEmail.replace(/(.{2})(.*)(@.*)/, "$1***$3");

        var html = '<div id="email-verify-modal" class="onboarding-modal-overlay">' +
            '<div class="onboarding-modal">' +
            '<div class="modal-header"><h3>📧 Verificar Email</h3><button class="modal-close" onclick="window.laTandaOnboarding.closeEmailModal()">&times;</button></div>' +
            '<div class="modal-body">' +
            '<p>Enviaremos un código de 6 dígitos a: <strong>' + maskedEmail + '</strong></p>' +
            '<div id="email-verify-step1">' +
            '<button class="btn-primary" onclick="window.laTandaOnboarding.sendVerificationCode()">Enviar Código</button>' +
            '</div>' +
            '<div id="email-verify-step2" style="display:none;">' +
            '<p>Ingresa el código enviado a tu email:</p>' +
            '<input type="text" id="verify-code-input" maxlength="6" placeholder="000000" style="font-size:24px;text-align:center;letter-spacing:8px;padding:10px;width:200px;">' +
            '<br><br><button class="btn-primary" onclick="window.laTandaOnboarding.verifyCode()">Verificar</button>' +
            '<p style="margin-top:10px;font-size:12px;color:#666;">¿No recibiste el código? <a href="#" onclick="window.laTandaOnboarding.sendVerificationCode();return false;">Reenviar</a></p>' +
            '</div>' +
            '<div id="email-verify-result" style="display:none;"></div>' +
            '</div></div></div>';

        document.body.insertAdjacentHTML("beforeend", html);

        // Add styles if not present
        if (!document.getElementById("email-modal-styles")) {
            var styles = '<style id="email-modal-styles">' +
                '.onboarding-modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:10000;display:flex;align-items:center;justify-content:center;}' +
                '.onboarding-modal{background:#fff;border-radius:16px;padding:24px;max-width:400px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.3);}' +
                '.modal-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;}' +
                '.modal-header h3{margin:0;color:#333;}' +
                '.modal-close{background:none;border:none;font-size:24px;cursor:pointer;color:#666;}' +
                '.modal-body{text-align:center;}' +
                '.btn-primary{background:linear-gradient(135deg,#0066ff,#0052cc);color:#fff;border:none;padding:12px 24px;border-radius:8px;cursor:pointer;font-weight:600;}' +
                '.btn-primary:hover{background:linear-gradient(135deg,#0052cc,#003d99);}' +
                '</style>';
            document.head.insertAdjacentHTML("beforeend", styles);
        }
    };

    LaTandaOnboarding.prototype.closeEmailModal = function() {
        var modal = document.getElementById("email-verify-modal");
        if (modal) modal.remove();
    };

    LaTandaOnboarding.prototype.sendVerificationCode = function() {
        var self = this;
        var userData = localStorage.getItem("latanda_user");
        var userId = userData ? JSON.parse(userData).id : null;
        var token = localStorage.getItem("auth_token");

        if (!userId || !token) {
            alert("Por favor inicia sesión primero");
            return;
        }

        var step1 = document.getElementById("email-verify-step1");
        var step2 = document.getElementById("email-verify-step2");
        if (step1) step1.innerHTML = '<p>Enviando código...</p>';

        fetch("/api/auth/send-verification", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
            body: JSON.stringify({ user_id: userId })
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
            if (data.success) {
                if (step1) step1.style.display = "none";
                if (step2) step2.style.display = "block";
            } else {
                if (step1) step1.innerHTML = '<p style="color:red;">Error al enviar codigo de verificacion</p><button class="btn-primary" onclick="window.laTandaOnboarding.sendVerificationCode()">Reintentar</button>';
            }
        })
        .catch(function(err) {
            if (step1) step1.innerHTML = '<p style="color:red;">Error de conexión</p><button class="btn-primary" onclick="window.laTandaOnboarding.sendVerificationCode()">Reintentar</button>';
        });
    };

    LaTandaOnboarding.prototype.verifyCode = function() {
        var self = this;
        var code = document.getElementById("verify-code-input")?.value?.trim();
        var userData = localStorage.getItem("latanda_user");
        var userId = userData ? JSON.parse(userData).id : null;
        var token = localStorage.getItem("auth_token");

        if (!code || code.length !== 6) {
            alert("Ingresa el código de 6 dígitos");
            return;
        }

        var resultDiv = document.getElementById("email-verify-result");
        var step2 = document.getElementById("email-verify-step2");

        fetch("/api/auth/verify-email", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
            body: JSON.stringify({ user_id: userId, code: code })
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
            if (data.success) {
                // Update local storage
                var ud = JSON.parse(localStorage.getItem("latanda_user") || "{}");
                ud.email_verified = true;
                localStorage.setItem("latanda_user", JSON.stringify(ud));

                if (step2) step2.style.display = "none";
                if (resultDiv) {
                    resultDiv.style.display = "block";
                    resultDiv.innerHTML = '<p style="color:green;font-size:18px;">✅ ¡Email verificado!</p><p>Has ganado <strong>5 LTD</strong></p><button class="btn-primary" onclick="window.laTandaOnboarding.closeEmailModal();window.laTandaOnboarding.completeTask(\'email_verified\');">¡Genial!</button>';
                }
            } else {
                alert("Código inválido o expirado. Intenta de nuevo.");
            }
        })
        .catch(function(err) {
            alert("Error de conexión");
        });
    };

    LaTandaOnboarding.prototype.dismiss = function() {
        var el = document.getElementById("onboarding-checklist");
        if (el) {
            el.classList.remove("visible");
            setTimeout(function() { el.remove(); }, 300);
        }
        this.data.dismissedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        this.saveProgress();
    };

    LaTandaOnboarding.prototype.setupTooltips = function() {
        var self = this;
        var pageTips = this.tips[this.currentPage];
        if (!pageTips) return;

        pageTips.forEach(function(tip) {
            if (self.data.tooltipsShown[tip.id]) return;
            self.waitForElement(tip.target, function(targetEl) {
                self.showTooltip(tip, targetEl);
            });
        });
    };

    LaTandaOnboarding.prototype.waitForElement = function(selector, callback) {
        var start = Date.now();
        var check = function() {
            var el = document.querySelector(selector);
            if (el) {
                callback(el);
            } else if (Date.now() - start < 5000) {
                setTimeout(check, 200);
            }
        };
        check();
    };

    LaTandaOnboarding.prototype.showTooltip = function(tip, targetEl) {
        var self = this;
        var existing = document.querySelector(".onboarding-tooltip");
        if (existing) existing.remove();

        var rect = targetEl.getBoundingClientRect();
        var html = "<div class=\"onboarding-tooltip\" data-position=\"" + tip.position + "\">" +
            "<div class=\"tooltip-arrow\"></div>" +
            "<div class=\"tooltip-content\"><div class=\"tooltip-title\">💡 " + tip.title + "</div>" +
            "<div class=\"tooltip-message\">" + tip.message + "</div>" +
            "<button class=\"tooltip-dismiss\" onclick=\"window.laTandaOnboarding.dismissTooltip('" + tip.id + "')\">Entendido</button></div></div>";

        document.body.insertAdjacentHTML("beforeend", html);
        var tooltip = document.querySelector(".onboarding-tooltip");

        var top, left;
        if (tip.position === "bottom") {
            top = rect.bottom + 10;
            left = rect.left + (rect.width / 2) - 110;
        } else if (tip.position === "top") {
            top = rect.top - 100;
            left = rect.left + (rect.width / 2) - 110;
        } else if (tip.position === "right") {
            top = rect.top + (rect.height / 2) - 50;
            left = rect.right + 10;
        } else {
            top = rect.top + (rect.height / 2) - 50;
            left = rect.left - 230;
        }

        top = Math.max(10, Math.min(top, window.innerHeight - 120));
        left = Math.max(10, Math.min(left, window.innerWidth - 240));

        tooltip.style.top = top + "px";
        tooltip.style.left = left + "px";

        setTimeout(function() { tooltip.classList.add("visible"); }, 100);
    };

    LaTandaOnboarding.prototype.dismissTooltip = function(tipId) {
        var tooltip = document.querySelector(".onboarding-tooltip");
        if (tooltip) {
            tooltip.classList.remove("visible");
            setTimeout(function() { tooltip.remove(); }, 300);
        }
        this.data.tooltipsShown[tipId] = true;
        this.saveProgress();
    };

    LaTandaOnboarding.prototype.checkNotifications = function() {
        var self = this;
        var loginCount = this.data.loginCount || 1;
        var daysSince = Math.floor((new Date() - new Date(this.data.firstLogin)) / (1000 * 60 * 60 * 24));

        if (loginCount >= 3 && !this.data.tasks.first_deposit && !this.data.notifsShown.deposit) {
            setTimeout(function() {
                self.showNotification("deposit", "¿Listo para tu primer depósito?", "20 LTD de bonus te esperan", "fa-piggy-bank", "my-wallet.html");
            }, 3000);
        } else if (this.data.tasks.first_deposit && !this.data.tasks.first_tanda && !this.data.notifsShown.tanda) {
            setTimeout(function() {
                self.showNotification("tanda", "¡Ya puedes unirte a una tanda!", "Explora tandas y gana 25 LTD", "fa-users", "groups-advanced-system.html");
            }, 3000);
        } else if (daysSince >= 3 && !this.data.tasks.kyc_completed && !this.data.notifsShown.kyc) {
            setTimeout(function() {
                self.showNotification("kyc", "Desbloquea límites mayores", "Verifica tu identidad y gana 50 LTD", "fa-shield-alt", "kyc-registration.html");
            }, 5000);
        }

        this.data.loginCount = loginCount + 1;
        this.saveProgress();
    };

    LaTandaOnboarding.prototype.showNotification = function(id, title, message, icon, action) {
        var self = this;
        var checklist = document.getElementById("onboarding-checklist");
        if (checklist && !checklist.classList.contains("minimized")) return;

        var actionBtn = action ? "<button class=\"notif-action\" onclick=\"window.laTandaOnboarding.handleNotifAction('" + id + "', '" + action + "')\">Ver</button>" : "";
        var html = "<div class=\"onboarding-notification\">" +
            "<div class=\"notif-icon\"><i class=\"fas " + icon + "\"></i></div>" +
            "<div class=\"notif-content\"><div class=\"notif-title\">" + title + "</div>" +
            "<div class=\"notif-message\">" + message + "</div></div>" +
            "<div class=\"notif-actions\">" + actionBtn +
            "<button class=\"notif-dismiss\" onclick=\"window.laTandaOnboarding.dismissNotif('" + id + "')\"><i class=\"fas fa-times\"></i></button></div></div>";

        document.body.insertAdjacentHTML("beforeend", html);
        var el = document.querySelector(".onboarding-notification");
        setTimeout(function() { el.classList.add("visible"); }, 100);
        setTimeout(function() { self.dismissNotif(id); }, 10000);
    };

    LaTandaOnboarding.prototype.handleNotifAction = function(id, action) {
        this.dismissNotif(id);
        if (action) window.location.href = action;
    };

    LaTandaOnboarding.prototype.dismissNotif = function(id) {
        var el = document.querySelector(".onboarding-notification");
        if (el) {
            el.classList.remove("visible");
            setTimeout(function() { el.remove(); }, 300);
        }
        this.data.notifsShown[id] = true;
        this.saveProgress();
    };

    LaTandaOnboarding.prototype.showCelebration = function() {
        var html = "<div class=\"onboarding-celebration\">" +
            "<div class=\"celebration-content\"><div class=\"celebration-emoji\">🎉</div>" +
            "<h2>¡Felicitaciones!</h2><p>Has completado el onboarding de La Tanda</p>" +
            "<div class=\"celebration-reward\"><i class=\"fas fa-coins\"></i><span>125 LTD ganados</span></div>" +
            "<button onclick=\"window.laTandaOnboarding.closeCelebration()\">¡Genial!</button></div></div>";
        document.body.insertAdjacentHTML("beforeend", html);
        setTimeout(function() {
            var el = document.querySelector(".onboarding-celebration");
            if (el) el.classList.add("visible");
        }, 100);
    };

    LaTandaOnboarding.prototype.closeCelebration = function() {
        var el = document.querySelector(".onboarding-celebration");
        if (el) {
            el.classList.remove("visible");
            setTimeout(function() { el.remove(); }, 300);
        }
        var checklist = document.getElementById("onboarding-checklist");
        if (checklist) checklist.remove();
    };

    LaTandaOnboarding.prototype.completeTask = function(taskId) {
        var self = this;
        if (this.data.tasks[taskId]) return;
        this.data.tasks[taskId] = true;
        this.saveProgress();

        var task = null;
        for (var i = 0; i < this.tasks.length; i++) {
            if (this.tasks[i].id === taskId) {
                task = this.tasks[i];
                break;
            }
        }
        if (task) {
            this.showRewardToast(task);
            // Claim reward from API
            this.claimReward(taskId);
        }
        this.renderChecklist();

        if (this.getCompletedCount() === this.tasks.length) {
            this.data.completed = true;
            this.saveProgress();
            setTimeout(function() { self.showCelebration(); }, 1000);
        }
    };

    // Claim reward from API
    LaTandaOnboarding.prototype.claimReward = function(taskId) {
        var token = localStorage.getItem("auth_token");
        if (!token) return;

        fetch("/api/rewards/onboarding/claim", {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ task_id: taskId })
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
            if (data.success) {
            } else {
            }
        })
        .catch(function(err) {
            console.error("❌ Reward claim error:", err);
        });
    };

    LaTandaOnboarding.prototype.showRewardToast = function(task) {
        var html = "<div class=\"reward-toast\"><div class=\"reward-icon\"><i class=\"fas fa-star\"></i></div>" +
            "<div class=\"reward-content\"><div class=\"reward-title\">¡Tarea completada!</div>" +
            "<div class=\"reward-detail\">" + task.title + ": +" + task.reward + " LTD</div></div></div>";
        document.body.insertAdjacentHTML("beforeend", html);
        var toast = document.querySelector(".reward-toast");
        setTimeout(function() { toast.classList.add("visible"); }, 100);
        setTimeout(function() {
            toast.classList.remove("visible");
            setTimeout(function() { toast.remove(); }, 300);
        }, 3000);
    };

    // Initialize
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function() {
            window.laTandaOnboarding = new LaTandaOnboarding();
        });
    } else {
        window.laTandaOnboarding = new LaTandaOnboarding();
    }
    window.LaTandaOnboarding = LaTandaOnboarding;
})();
