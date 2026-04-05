// Mi Perfil - Profile Management System
// Extracted from mi-perfil.html

// Auth helper
window.getAuthHeaders = function() {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') || '';
    return token ? { 'Authorization': 'Bearer ' + token } : {};
};

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// Shared API helper — reduces 16 duplicated fetch patterns
async function apiCall(endpoint, method, body) {
    const opts = { headers: { ...window.getAuthHeaders() } };
    if (method) opts.method = method;
    if (body) {
        opts.headers['Content-Type'] = 'application/json';
        opts.body = JSON.stringify(body);
    }
    const res = await fetch(endpoint, opts);
    return res.json();
}

class ProfileManager {
    constructor() {
        this.userProfile = {};
        this.currency = "HNL";
        this.userId = null;
        this.portfolio = [];
        this.activities = [];
        this.achievements = [];
        this.currentTab = 'settings';
        // Hero actions run immediately (not in async chain)
        this.setupHeroActions();
        this.loadHeroExtras();
        this.init();
    }

    async init() {
        await this.loadUserProfile();
        await this.updateProfileStats();
        await this.loadPortfolio();
        this.loadActivities();
        this.setupEventListeners();
        if (typeof load2FAStatus === 'function') load2FAStatus();
        loadPrivacySettings();
        loadProfileCompleteness();
    }

    setupEventListeners() {
        const settingsForm = document.getElementById('settingsForm');
        if (settingsForm) {
            settingsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveSettings();
            });
        }
    }

    async loadUserProfile() {
        const storedUser = JSON.parse(localStorage.getItem('latanda_user') || sessionStorage.getItem('latanda_user') || '{}');
        this.userId = storedUser.id || storedUser.user_id;

        if (!this.userId) {
            this.setDefaultProfile();
            return;
        }

        try {
            const result = await apiCall('/api/user/profile');

            if (result.success && result.user) {
                this.userProfile = {
                    name: result.user.name || 'Usuario La Tanda',
                    birth_date: result.user.birth_date || null,
                    verification_level: result.user.verification_level || 'basic',
                    gender: result.user.gender || '',
                    email: result.user.email || '',
                    phone: result.user.phone || '',
                    location: result.user.location || '',
                    bio: result.user.bio || '',
                    avatar_url: result.user.avatar_url || '',
                    created_at: result.user.created_at,
                    totalValue: 0,
                    totalTransactions: 0,
                    memberSince: this.daysSince(result.user.created_at),
                    avatar: result.user.name ? result.user.name.substring(0, 2).toUpperCase() : 'LT'
                };

                if (result.user.preferences && result.user.preferences.currency) {
                    this.currency = result.user.preferences.currency;
                } else {
                    try {
                        const settingsData = await apiCall("/api/user/settings");
                        if (settingsData.success && settingsData.data && settingsData.data.currency) {
                            this.currency = settingsData.data.currency;
                        }
                    } catch (e) { console.log("Could not fetch currency preference"); }
                }

                const stored = JSON.parse(localStorage.getItem("latanda_user") || "{}");
                stored.avatar_url = result.user.avatar_url || "";
                stored.name = result.user.name || stored.name;
                localStorage.setItem("latanda_user", JSON.stringify(stored));
                this.updateProfileUI();
            } else {
                this.setDefaultProfile();
            }
        } catch (error) {
            this.setDefaultProfile();
        }
    }

    setDefaultProfile() {
        this.userProfile = {
            name: 'Usuario La Tanda',
            email: '', phone: '', location: '', bio: '',
            totalValue: 0, totalTransactions: 0, memberSince: 0,
            avatar: 'LT'
        };
        this.updateProfileUI();
    }

    daysSince(dateString) {
        if (!dateString) return 0;
        return Math.floor((new Date() - new Date(dateString)) / (1000 * 60 * 60 * 24));
    }

    updateProfileUI() {
        const profileNameEl = document.getElementById('profileName');
        if (profileNameEl) profileNameEl.textContent = this.userProfile.name;

        const pubLink = document.getElementById("viewPublicProfile");
        if (pubLink) {
            const h = this.userProfile.handle || this.userId;
            pubLink.href = "/perfil/" + h + (this.userProfile.handle ? "" : "?id=" + this.userId);
        }

        const avatarEl = document.querySelector(".profile-avatar");
        if (avatarEl) {
            if (this.userProfile.avatar_url) {
                avatarEl.innerHTML = "";
                avatarEl.style.backgroundImage = "url(" + this.userProfile.avatar_url + ")";
                avatarEl.style.backgroundSize = "cover";
                avatarEl.style.backgroundPosition = "center";
            } else {
                avatarEl.style.backgroundImage = "";
                avatarEl.innerHTML = this.userProfile.avatar + "<div class='avatar-badge'><i class='fas fa-check'></i></div>";
            }
        }

        // Form fields
        const fields = {
            settingsName: this.userProfile.name || '',
            settingsEmail: this.userProfile.email || '',
            settingsBio: this.userProfile.bio || '',
            settingsPhone: this.userProfile.phone || '',
            settingsLocation: this.userProfile.location || '',
            settingsGender: this.userProfile.gender || ''
        };
        for (const [id, val] of Object.entries(fields)) {
            const el = document.getElementById(id);
            if (el) el.value = val;
        }
        const birthDateInput = document.getElementById('settingsBirthDate');
        if (birthDateInput && this.userProfile.birth_date) {
            birthDateInput.value = this.userProfile.birth_date.split('T')[0];
        }

        // Verification badge
        const verificationBadge = document.getElementById('verificationBadge');
        if (verificationBadge) {
            const level = this.userProfile.verification_level || 'basic';
            const badges = {
                'basic': { icon: 'fa-user', color: '#6c757d', text: 'Basico', bg: 'rgba(108, 117, 125, 0.3)' },
                'phone': { icon: 'fa-phone', color: '#17a2b8', text: 'Telefono', bg: 'rgba(23, 162, 184, 0.3)' },
                'intermediate': { icon: 'fa-user-check', color: '#28a745', text: 'Intermedio', bg: 'rgba(40, 167, 69, 0.3)' },
                'advanced': { icon: 'fa-shield-alt', color: '#00ffff', text: 'Avanzado', bg: 'var(--ds-cyan-border, rgba(0,255,255,0.3))' },
                'full': { icon: 'fa-certificate', color: '#ffd700', text: 'Verificado', bg: 'rgba(255, 215, 0, 0.3)' }
            };
            const badge = badges[level] || badges['basic'];
            verificationBadge.style.background = badge.bg;
            verificationBadge.innerHTML = '<i class="fas ' + badge.icon + '" style="color: ' + badge.color + ';"></i><span>' + badge.text + '</span>';

            const levelBadge = document.getElementById("profileLevelBadge");
            if (levelBadge) {
                const levelConfig = {
                    "basic": { name: "Miembro", icon: "fas fa-user" },
                    "phone": { name: "Telefono Verificado", icon: "fas fa-phone" },
                    "intermediate": { name: "Nivel Intermedio", icon: "fas fa-user-check" },
                    "advanced": { name: "Nivel Avanzado", icon: "fas fa-shield-alt" },
                    "full": { name: "Completamente Verificado", icon: "fas fa-certificate" }
                };
                const config = levelConfig[level] || levelConfig["basic"];
                levelBadge.innerHTML = '<i class="' + config.icon + '"></i> ' + config.name;
            }
        }
    }

    async updateProfileStats() {
        try {
            const [balanceData, statsData] = await Promise.all([
                apiCall("/api/wallet/balance"),
                apiCall("/api/user/me/stats")
            ]);

            if (balanceData.success) {
                const total = balanceData.data.balances ? balanceData.data.balances.total_usd || 0 : 0;
                const totalEl = document.getElementById("totalValue");
                if (totalEl) {
                    totalEl.textContent = "L " + total.toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                }
            }

            if (statsData.success) {
                const payments = statsData.data.payments ? statsData.data.payments.total || 0 : 0;
                const txEl = document.getElementById("totalTransactions");
                if (txEl) txEl.textContent = payments.toLocaleString("es-HN");
            }

            if (this.userProfile.created_at) {
                const daysEl = document.getElementById("memberSince");
                if (daysEl) daysEl.textContent = this.daysSince(this.userProfile.created_at);
            }
        } catch (error) {
            console.error('updateProfileStats:', error);
        }
    }

    async saveSettings() {
        if (!this.userId) { showError('No se pudo identificar el usuario'); return; }

        const name = document.getElementById('settingsName')?.value.trim() || '';
        const bio = document.getElementById('settingsBio')?.value.trim() || '';
        const phone = document.getElementById('settingsPhone')?.value.trim() || '';
        const location = document.getElementById('settingsLocation')?.value.trim() || '';
        const birth_date = document.getElementById('settingsBirthDate')?.value || null;
        const gender = document.getElementById('settingsGender')?.value || '';

        if (!name) { showWarning('El nombre es requerido'); return; }

        const saveBtn = document.querySelector('#settingsForm button[type="submit"]');
        const originalText = saveBtn ? saveBtn.innerHTML : '';
        if (saveBtn) { saveBtn.disabled = true; saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...'; }

        try {
            const result = await apiCall('/api/user/profile', 'PUT', { name, bio, phone, location, birth_date, gender });

            if (result.success) {
                const storedUser = JSON.parse(localStorage.getItem('latanda_user') || '{}');
                Object.assign(storedUser, { name: result.user.name, bio: result.user.bio, phone: result.user.phone, location: result.user.location, birth_date: result.user.birth_date, gender: result.user.gender });
                localStorage.setItem('latanda_user', JSON.stringify(storedUser));

                this.userProfile.name = result.user.name;
                this.userProfile.bio = result.user.bio;
                this.userProfile.avatar = result.user.name.substring(0, 2).toUpperCase();
                this.updateProfileUI();
                showSuccess('Perfil actualizado exitosamente!');
            } else {
                throw new Error(result.message || 'Error al guardar');
            }
        } catch (error) {
            showError('Error al guardar perfil');
        } finally {
            if (saveBtn) { saveBtn.disabled = false; saveBtn.innerHTML = originalText; }
        }
    }

    async loadPortfolio() {
        const container = document.getElementById("portfolioGrid");
        if (!container) return;
        container.innerHTML = '<div class="loading"><div class="spinner"></div>Cargando portfolio...</div>';

        try {
            const [balanceData, statsData] = await Promise.all([
                apiCall("/api/wallet/balance"),
                apiCall("/api/user/me/stats")
            ]);

            if (balanceData.success) {
                const b = balanceData.data.balances || {};
                const stats = balanceData.data.stats || {};
                const userStats = statsData.success ? statsData.data : {};

                this.portfolio = [
                    { name: "Balance Wallet", icon: "fas fa-wallet", balance: b.available_usd || 0, currency: "L", type: "money" },
                    { name: "LTD Tokens", icon: "fas fa-coins", balance: b.ltd_tokens || 0, currency: "LTD", type: "money" },
                    { name: "Total Aportado", icon: "fas fa-piggy-bank", balance: stats.total_saved || 0, currency: "L", type: "money" },
                    { name: "Depositos Pendientes", icon: "fas fa-clock", balance: b.pending_deposits_usd || 0, currency: "L", type: "money" },
                    { name: "Grupos Activos", icon: "fas fa-users", balance: stats.active_tandas || (userStats.groups ? userStats.groups.total : 0) || 0, currency: "", type: "count" },
                    { name: "Pagos Completados", icon: "fas fa-check-circle", balance: (userStats.payments ? userStats.payments.completed : 0) || 0, currency: "", type: "count" },
                    { name: "Pagos Pendientes", icon: "fas fa-hourglass-half", balance: (userStats.payments ? userStats.payments.pending : 0) || 0, currency: "", type: "count" }
                ];
            } else {
                this.portfolio = [];
            }
            // Portfolio tab removed — data used for stats only
        } catch (error) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i> Error cargando portfolio</div>';
        }
    }

    renderPortfolio() {
        const container = document.getElementById("portfolioGrid");
        if (!container) return;

        const hasData = this.portfolio && this.portfolio.some(function(item) { return item.balance > 0; });

        if (!this.portfolio || this.portfolio.length === 0 || !hasData) {
            container.innerHTML = '<div class="empty-portfolio" style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">' +
                '<i class="fas fa-wallet" style="font-size: 64px; color: var(--tanda-cyan); margin-bottom: 20px; opacity: 0.5;"></i>' +
                '<h3 style="color: var(--text-primary); margin-bottom: 8px;">Tu portfolio esta vacio</h3>' +
                '<p style="color: var(--text-secondary); margin-bottom: 24px;">Unite a una tanda o hace un deposito para comenzar</p>' +
                '<a href="groups-advanced-system.html" class="btn-primary" style="display: inline-block; padding: 12px 24px; background: var(--tanda-cyan); color: #000; border-radius: 8px; text-decoration: none; font-weight: 600;">' +
                '<i class="fas fa-users"></i> Explorar Tandas</a></div>';
            return;
        }

        const portfolioHTML = this.portfolio.map(function(item) {
            if (item.balance === 0) return "";
            var displayValue = item.type === "money"
                ? item.currency + " " + item.balance.toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : item.balance.toLocaleString("es-HN");

            return '<div class="portfolio-card"><div class="portfolio-header">' +
                '<div class="portfolio-icon"><i class="' + escapeHtml(item.icon) + '"></i></div>' +
                '<div class="portfolio-title">' + escapeHtml(item.name) + '</div></div>' +
                '<div class="portfolio-value">' + displayValue + '</div></div>';
        }).filter(function(html) { return html !== ""; }).join("");

        container.innerHTML = portfolioHTML || '<div class="empty-state">Sin datos disponibles</div>';

        // Load extra cards: mining tier + chain balance
        this.loadPortfolioExtras(container);
    }

    async loadPortfolioExtras(container) {
        var token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
        if (!token) return;
        var extrasHtml = '';

        // Mining tier card
        try {
            var mRes = await fetch('/api/mining/status', { headers: { 'Authorization': 'Bearer ' + token } }).then(function(r) { return r.json(); });
            if (mRes.success && mRes.data) {
                var m = mRes.data;
                var tierColors = { bronze: '#CD7F32', silver: '#C0C0C0', gold: '#FFD700', platinum: '#E5E4E2', diamond: '#B9F2FF' };
                var tierIcons = { bronze: '🥉', silver: '🥈', gold: '🥇', platinum: '💎', diamond: '👑' };
                var tier = m.current_tier || 'bronze';
                var pts = m.achievement_points || 0;
                var nextThresholds = { bronze: 50, silver: 150, gold: 300, platinum: 500, diamond: null };
                var nextPts = nextThresholds[tier];
                var pct = nextPts ? Math.min(100, Math.round((pts / nextPts) * 100)) : 100;
                extrasHtml += '<div class="portfolio-card" style="border-left:3px solid ' + (tierColors[tier] || '#CD7F32') + ';">' +
                    '<div class="portfolio-header"><div class="portfolio-icon" style="font-size:1.5rem;">' + (tierIcons[tier] || '🥉') + '</div>' +
                    '<div class="portfolio-title">Mining Tier</div></div>' +
                    '<div class="portfolio-value" style="color:' + (tierColors[tier] || '#CD7F32') + ';text-transform:capitalize;">' + tier + '</div>' +
                    '<div style="margin-top:8px;height:6px;background:rgba(255,255,255,0.1);border-radius:3px;overflow:hidden;">' +
                    '<div style="height:100%;width:' + pct + '%;background:' + (tierColors[tier] || '#CD7F32') + ';border-radius:3px;"></div></div>' +
                    '<div style="font-size:0.7rem;color:var(--text-secondary,#8896a8);margin-top:4px;">' + pts + ' pts' + (nextPts ? ' / ' + nextPts + ' para siguiente tier' : ' — tier maximo') + '</div>' +
                    '<div style="font-size:0.7rem;color:var(--text-secondary,#8896a8);">' + (m.testnet_ltd_mined || 0).toFixed(2) + ' LTD minados total</div>' +
                    '</div>';
            }
        } catch(e) {}

        // Chain balance card
        try {
            var cRes = await fetch('/api/wallet/chain/status', { headers: { 'Authorization': 'Bearer ' + token } }).then(function(r) { return r.json(); });
            if (cRes.success && cRes.data) {
                if (cRes.data.linked) {
                    var b = cRes.data.balances || {};
                    var addr = cRes.data.chain_address || '';
                    var shortAddr = addr.substring(0, 8) + '...' + addr.substring(addr.length - 4);
                    extrasHtml += '<div class="portfolio-card" style="border-left:3px solid #00FFFF;">' +
                        '<div class="portfolio-header"><div class="portfolio-icon"><i class="fas fa-link" style="color:#00FFFF;"></i></div>' +
                        '<div class="portfolio-title">On-Chain</div></div>' +
                        '<div class="portfolio-value" style="color:#00FFFF;">' + (b.onchain_ltd || 0).toFixed(2) + ' LTD</div>' +
                        '<div style="font-size:0.7rem;color:var(--text-secondary,#8896a8);margin-top:4px;font-family:monospace;">' + shortAddr + '</div>' +
                        '</div>';
                } else {
                    extrasHtml += '<div class="portfolio-card" style="border-left:3px solid rgba(168,85,247,0.5);">' +
                        '<div class="portfolio-header"><div class="portfolio-icon"><i class="fas fa-link" style="color:#a78bfa;"></i></div>' +
                        '<div class="portfolio-title">Chain Wallet</div></div>' +
                        '<div style="font-size:0.82rem;color:var(--text-secondary,#8896a8);">No vinculada</div>' +
                        '<a href="/mi-perfil.html" onclick="switchTab(\'security\',event);return false;" style="font-size:0.75rem;color:#00FFFF;">Vincular Keplr →</a>' +
                        '</div>';
                }
            }
        } catch(e) {}

        if (extrasHtml) container.innerHTML += extrasHtml;
    }

    async loadHeroExtras() {
        var token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
        if (!token) return;
        var user = JSON.parse(localStorage.getItem('latanda_user') || '{}');

        // Show handle
        var handleEl = document.getElementById('heroHandleDisplay');
        if (handleEl && user.handle) handleEl.textContent = '@' + user.handle;

        // Set public profile link
        var pubLink = document.getElementById('viewPublicProfile');
        if (pubLink && user.handle) pubLink.href = '/perfil/' + user.handle;
        else if (pubLink && (user.user_id || user.id)) pubLink.href = '/perfil.html?id=' + (user.user_id || user.id);

        // Mining tier badge + streak
        try {
            var mRes = await fetch('/api/mining/status', { headers: { 'Authorization': 'Bearer ' + token } }).then(function(r) { return r.json(); });
            if (mRes.success && mRes.data) {
                var m = mRes.data;
                var tierColors = { bronze: '#CD7F32', silver: '#C0C0C0', gold: '#FFD700', platinum: '#E5E4E2', diamond: '#B9F2FF' };
                var tierNames = { bronze: 'Bronce', silver: 'Plata', gold: 'Oro', platinum: 'Platino', diamond: 'Diamante' };
                var tierIcons = { bronze: '\u{1F949}', silver: '\u{1F948}', gold: '\u{1F947}', platinum: '\u{1F48E}', diamond: '\u{1F451}' };
                var tier = m.current_tier || 'bronze';
                // Tier badge
                var badgeEl = document.getElementById('heroTierBadge');
                if (badgeEl) {
                    badgeEl.innerHTML = '<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;background:' + (tierColors[tier] || '#CD7F32') + '22;color:' + (tierColors[tier] || '#CD7F32') + ';border:1px solid ' + (tierColors[tier] || '#CD7F32') + '44;">' + (tierIcons[tier] || '') + ' ' + (tierNames[tier] || tier) + '</span>';
                }
                // Streak
                var streak = m.mining_streak || 0;
                var streakItem = document.getElementById('heroStreakItem');
                var streakVal = document.getElementById('heroStreakValue');
                if (streakItem && streakVal) {
                    streakItem.style.display = '';
                    streakVal.innerHTML = (streak > 0 ? '\u{1F525} ' : '<span style="opacity:0.4">\u{1F525}</span> ') + streak;
                    streakVal.style.color = streak >= 7 ? '#f59e0b' : streak > 0 ? '#fb923c' : '#64748b';
                }
            }
        } catch(e) {}

        // Referral count
        try {
            var sRes = await fetch('/api/user/me/stats', { headers: { 'Authorization': 'Bearer ' + token } }).then(function(r) { return r.json(); });
            if (sRes.success && sRes.data) {
                var refs = sRes.data.referrals_made || 0;
                var refItem = document.getElementById('heroReferralItem');
                var refVal = document.getElementById('heroReferralValue');
                if (refItem && refVal) {
                    refItem.style.display = '';
                    refVal.textContent = '\u{1F465} ' + refs;
                }
            }
        } catch(e) {}
    }

    setupHeroActions() {
        var user = JSON.parse(localStorage.getItem('latanda_user') || '{}');
        var userId = user.user_id || user.id || '';
        var handle = user.handle || '';
        var profileUrl = handle ? 'https://latanda.online/perfil/' + handle : 'https://latanda.online/perfil.html?id=' + userId;
        var referralUrl = 'https://latanda.online/auth-enhanced.html?ref=' + userId;

        // QR button
        var qrBtn = document.getElementById('heroQrBtn');
        if (qrBtn) {
            qrBtn.addEventListener('click', function() {
                var modal = document.getElementById('qrModal');
                modal.style.display = 'flex';
                window._qrProfileUrl = profileUrl;
                window._qrWalletAddr = null;
                // Check chain wallet
                var tk = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
                if (tk) {
                    fetch('/api/wallet/chain/status', { headers: { 'Authorization': 'Bearer ' + tk } })
                        .then(function(r) { return r.json(); })
                        .then(function(d) { if (d.success && d.data.linked) window._qrWalletAddr = d.data.chain_address; })
                        .catch(function() {});
                }
                generateQR('profile');
            });
        }

        // Referral button
        var refBtn = document.getElementById('heroRefBtn');
        if (refBtn) {
            refBtn.addEventListener('click', function() {
                navigator.clipboard.writeText(referralUrl).then(function() {
                    refBtn.innerHTML = '<i class="fas fa-check"></i> Copiado!';
                    setTimeout(function() { refBtn.innerHTML = '<i class="fas fa-user-plus"></i> Referir'; }, 2000);
                }).catch(function() {
                    prompt('Copia este link:', referralUrl);
                });
            });
        }

        // Share button
        var shareBtn = document.getElementById('heroShareBtn');
        if (shareBtn) {
            shareBtn.addEventListener('click', function() {
                if (navigator.share) {
                    navigator.share({ title: 'Mi perfil en La Tanda', url: profileUrl }).catch(function() {});
                } else {
                    navigator.clipboard.writeText(profileUrl).then(function() {
                        shareBtn.innerHTML = '<i class="fas fa-check"></i> Copiado!';
                        setTimeout(function() { shareBtn.innerHTML = '<i class="fas fa-share-alt"></i> Compartir'; }, 2000);
                    }).catch(function() {
                        prompt('Comparte este link:', profileUrl);
                    });
                }
            });
        }
    }

    async loadActivities() {
        const container = document.getElementById("activitiesList");
        if (!container) return;

        try {
            const result = await apiCall("/api/user/activity");
            if (result.success && result.activities) {
                this.activities = result.activities;
                this.renderActivities();
            } else {
                container.innerHTML = '<div class="empty-state"><i class="fas fa-history"></i><p>No hay actividad reciente</p></div>';
            }
        } catch (error) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Error al cargar actividad</p></div>';
        }
    }

    renderActivities() {
        const container = document.getElementById('activitiesList');
        if (!container) return;
        const _safeColor = c => /^#[0-9a-fA-F]{3,8}$/.test(c) ? c : '#6b7280';
        const _safeIcon = i => /^fa[srlbd]?\s+fa-[\w-]+$/.test(i) ? i : 'fas fa-circle';

        const activitiesHTML = this.activities.map(activity => {
            const color = _safeColor(activity.iconColor);
            const icon = _safeIcon(activity.icon);
            return '<div class="activity-item">' +
                '<div class="activity-icon" style="background: linear-gradient(135deg, ' + color + '20, ' + color + '10);">' +
                '<i class="' + icon + '" style="color: ' + color + '"></i></div>' +
                '<div class="activity-content"><div class="activity-title">' + escapeHtml(activity.title) + '</div>' +
                '<div class="activity-description">' + escapeHtml(activity.description) + '</div></div>' +
                '<div class="activity-time">' + escapeHtml(activity.time) + '</div></div>';
        }).join('');

        container.innerHTML = activitiesHTML;
    }

    async loadAchievements() {
        const container = document.getElementById("achievementsList");
        if (!container) return;

        try {
            const result = await apiCall("/api/user/achievements");
            if (result.success && result.achievements) {
                this.achievements = result.achievements;
                this.achievementStats = result.stats;
                this.renderAchievements();
            } else {
                container.innerHTML = '<div class="empty-state"><i class="fas fa-trophy"></i><p>No hay logros disponibles</p></div>';
            }
        } catch (error) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Error al cargar logros</p></div>';
        }
    }

    renderAchievements() {
        const container = document.getElementById('achievementsList');
        if (!container) return;

        const categories = {
            account: { name: 'Cuenta y Seguridad', icon: 'fas fa-user-shield', achievements: [] },
            financial: { name: 'Financiero', icon: 'fas fa-coins', achievements: [] },
            social: { name: 'Social', icon: 'fas fa-heart', achievements: [] }
        };

        this.achievements.forEach(a => { if (categories[a.category]) categories[a.category].achievements.push(a); });

        const unlocked = this.achievements.filter(a => a.unlocked).length;
        const total = this.achievements.length;
        const percent = total > 0 ? Math.round((unlocked / total) * 100) : 0;

        // Mining tier header (loaded async, inserted at top)
        var tierPlaceholder = '<div id="achievementsTierCard"></div>';

        (async function() {
            var tk = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
            if (!tk) return;
            try {
                var r = await fetch('/api/mining/status', { headers: { 'Authorization': 'Bearer ' + tk } }).then(function(r) { return r.json(); });
                if (!r.success || !r.data) return;
                var m = r.data;
                var tierColors = { bronze: '#CD7F32', silver: '#C0C0C0', gold: '#FFD700', platinum: '#E5E4E2', diamond: '#B9F2FF' };
                var tierNames = { bronze: 'Bronce', silver: 'Plata', gold: 'Oro', platinum: 'Platino', diamond: 'Diamante' };
                var tier = m.current_tier || 'bronze';
                var pts = m.achievement_points || 0;
                var nextT = { bronze: 50, silver: 150, gold: 300, platinum: 500, diamond: null };
                var nextPts = nextT[tier]; var pct = nextPts ? Math.min(100, Math.round((pts / nextPts) * 100)) : 100;
                var el = document.getElementById('achievementsTierCard');
                if (el) el.innerHTML = '<div style="margin-bottom:16px;padding:16px;background:rgba(0,0,0,0.3);border:1px solid ' + (tierColors[tier] || '#CD7F32') + '44;border-radius:12px;">' +
                    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
                    '<span style="font-weight:600;">⛏️ Mining Tier</span>' +
                    '<span style="color:' + (tierColors[tier]) + ';font-weight:700;font-size:1.1rem;text-transform:capitalize;">' + (tierNames[tier] || tier) + '</span></div>' +
                    '<div style="height:8px;background:rgba(255,255,255,0.1);border-radius:4px;overflow:hidden;margin-bottom:6px;">' +
                    '<div style="height:100%;width:' + pct + '%;background:' + (tierColors[tier]) + ';border-radius:4px;"></div></div>' +
                    '<div style="display:flex;justify-content:space-between;font-size:0.72rem;color:var(--text-secondary,#8896a8);">' +
                    '<span>' + pts + ' achievement pts</span>' +
                    '<span>' + (nextPts ? (nextPts - pts) + ' pts para ' + (tierNames[{ bronze:'silver',silver:'gold',gold:'platinum',platinum:'diamond' }[tier]] || 'max') : 'Tier maximo') + '</span></div></div>';
            } catch(e) {}
        })();

        let html = tierPlaceholder + '<div class="achievements-progress" style="margin-bottom: 24px; padding: 16px; background: var(--ds-cyan-muted, rgba(0,255,255,0.1)); border-radius: 12px; border: 1px solid rgba(0,255,255,0.2);">' +
            '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">' +
            '<span style="font-weight: 600; color: var(--text-primary);">Progreso Total</span>' +
            '<span style="color: var(--tanda-cyan); font-weight: bold;">' + unlocked + '/' + total + ' (' + percent + '%)</span></div>' +
            '<div style="height: 8px; background: var(--ds-border-hover, rgba(255,255,255,0.1)); border-radius: 4px; overflow: hidden;">' +
            '<div style="height: 100%; width: ' + percent + '%; background: linear-gradient(90deg, #00ffff, #22d55e); border-radius: 4px; transition: width 0.5s ease;"></div></div></div>';

        const _colorMap = {
            '#22d55e': '34,213,94', '#00ffff': '0,255,255', '#ffd700': '255,215,0',
            '#8b5cf6': '139,92,246', '#3b82f6': '59,130,246', '#f59e0b': '245,158,11',
            '#ec4899': '236,72,153', '#f43f5e': '244,63,94'
        };
        const _safeAchColor = c => _colorMap[c] ? c : '#6b7280';
        const _safeAchIcon = i => /^fa[srlbd]?\s+fa-[\w-]+$/.test(i) ? i : 'fas fa-trophy';

        Object.keys(categories).forEach(key => {
            const cat = categories[key];
            if (cat.achievements.length === 0) return;
            const catUnlocked = cat.achievements.filter(a => a.unlocked).length;

            html += '<div class="achievement-category" style="margin-bottom: 20px;">' +
                '<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--border-card);">' +
                '<i class="' + cat.icon + '" style="color: var(--tanda-cyan);"></i>' +
                '<span style="font-weight: 600; color: var(--text-primary);">' + cat.name + '</span>' +
                '<span style="margin-left: auto; font-size: 12px; color: var(--text-secondary);">' + catUnlocked + '/' + cat.achievements.length + '</span></div>' +
                '<div class="achievement-grid" style="display: grid; gap: 12px;">';

            cat.achievements.forEach(achievement => {
                const color = _safeAchColor(achievement.color);
                const rgb = _colorMap[color] || '107,114,128';
                const icon = _safeAchIcon(achievement.icon);
                html += '<div class="achievement-item ' + (achievement.unlocked ? '' : 'locked') + '" style="' +
                    'display: flex; align-items: center; gap: 12px; padding: 12px;' +
                    'background: ' + (achievement.unlocked ? 'rgba(' + rgb + ',0.15)' : 'rgba(107,114,128,0.1)') + ';' +
                    'border-radius: 10px; border: 1px solid ' + (achievement.unlocked ? color + '40' : 'var(--border-card)') + ';' +
                    'transition: border-color 0.3s ease, background 0.3s ease;">' +
                    '<div style="width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center;' +
                    'background: ' + (achievement.unlocked ? 'rgba(' + rgb + ',0.3)' : 'rgba(107,114,128,0.2)') + '; flex-shrink: 0;">' +
                    '<i class="' + icon + '" style="font-size: 18px; color: ' + (achievement.unlocked ? color : '#6b7280') + ';"></i></div>' +
                    '<div style="flex: 1; min-width: 0;">' +
                    '<div style="font-weight: 600; color: ' + (achievement.unlocked ? 'var(--text-primary)' : 'var(--text-secondary)') + '; margin-bottom: 2px;">' + escapeHtml(achievement.title) + '</div>' +
                    '<div style="font-size: 12px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">' + escapeHtml(achievement.description) + '</div></div>' +
                    '<div style="flex-shrink: 0;"><i class="fas ' + (achievement.unlocked ? 'fa-check-circle' : 'fa-lock') + '" style="font-size: 18px; color: ' + (achievement.unlocked ? '#22d55e' : '#6b7280') + ';"></i></div></div>';
            });

            html += '</div></div>';
        });

        container.innerHTML = html;
    }
}

// === Global functions ===

function switchTab(tabName, evt) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    var btn = evt && evt.target ? evt.target.closest('.tab-btn') : document.querySelector('.tab-btn[onclick*="' + tabName + '"]');
    if (btn) btn.classList.add('active');
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    const tabEl = document.getElementById(tabName + '-tab');
    if (tabEl) tabEl.classList.add('active');
    if (profileManager) profileManager.currentTab = tabName;
}

function uploadAvatar() {
    const authHeaders = window.getAuthHeaders();
    if (!authHeaders.Authorization) {
        showError("Debes iniciar sesion para cambiar tu avatar");
        window.location.href = "/auth-enhanced.html?redirect=" + encodeURIComponent(window.location.pathname);
        return;
    }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp";

    input.onchange = async function(e) {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) { showWarning("Archivo muy grande. Maximo 2MB"); return; }
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { showWarning("Tipo de archivo no permitido. Use JPG, PNG o WEBP"); return; }

        const formData = new FormData();
        formData.append("avatar", file);

        const avatarEl = document.querySelector(".profile-avatar");
        const originalContent = avatarEl.innerHTML;
        const originalBg = avatarEl.style.backgroundImage;
        avatarEl.innerHTML = '<i class="fas fa-spinner fa-spin" style="font-size: 40px;"></i>';
        avatarEl.style.backgroundImage = "";

        try {
            const response = await fetch("/api/user/avatar", { method: "POST", headers: authHeaders, body: formData });
            const result = await response.json();

            if (result.success) {
                avatarEl.innerHTML = '<div class="avatar-badge"><i class="fas fa-check"></i></div>';
                avatarEl.style.backgroundImage = "url(" + result.avatar_url + ")";
                avatarEl.style.backgroundSize = "cover";
                avatarEl.style.backgroundPosition = "center";

                const userData = JSON.parse(localStorage.getItem("latanda_user") || "{}");
                userData.avatar_url = result.avatar_url;
                localStorage.setItem("latanda_user", JSON.stringify(userData));

                if (window.LaTandaHeader && window.LaTandaHeader.loadUserAvatar) window.LaTandaHeader.loadUserAvatar();
                showSuccess("Avatar actualizado exitosamente!");
            } else {
                avatarEl.innerHTML = originalContent;
                avatarEl.style.backgroundImage = originalBg;
                if (response.status === 401) {
                    showWarning("Tu sesion ha expirado. Por favor, inicia sesion nuevamente.");
                    window.location.href = "/auth-enhanced.html?redirect=" + encodeURIComponent(window.location.pathname);
                } else {
                    showError(result.message || result.data?.error?.message || "Error al subir avatar");
                }
            }
        } catch (err) {
            avatarEl.innerHTML = originalContent;
            avatarEl.style.backgroundImage = originalBg;
            showError("Error de conexion al subir avatar");
        }
    };
    input.click();
}

async function changePassword() {
    const currentPassword = document.getElementById('currentPassword')?.value || '';
    const newPassword = document.getElementById('newPassword')?.value || '';
    const confirmPassword = document.getElementById('confirmPassword')?.value || '';

    if (!currentPassword || !newPassword || !confirmPassword) { showWarning('Todos los campos son requeridos'); return; }
    if (newPassword !== confirmPassword) { showWarning('Las contrasenas no coinciden'); return; }
    if (newPassword.length < 8) { showWarning('La contrasena debe tener al menos 8 caracteres'); return; }

    try {
        const result = await apiCall('/api/user/change-password', 'POST', { current_password: currentPassword, new_password: newPassword, confirm_password: confirmPassword });
        if (result.success) {
            showSuccess('Contrasena actualizada exitosamente!');
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmPassword').value = '';
        } else {
            showError(result.message || 'Error al cambiar contrasena');
        }
    } catch (err) { showError('Error de conexion'); }
}

// === 2FA Functions ===

async function load2FAStatus() {
    try {
        const result = await apiCall('/api/user/2fa/status');
        if (result.success) {
            const statusEl = document.getElementById('twoFactorStatus');
            const setupSection = document.getElementById('setup2FASection');
            const disableSection = document.getElementById('disable2FASection');
            const remainingEl = document.getElementById('backupCodesRemaining');

            if (result.enabled) {
                statusEl.textContent = 'Activo';
                statusEl.style.background = '#22d55e';
                setupSection.style.display = 'none';
                disableSection.style.display = 'block';
                remainingEl.textContent = result.backup_codes_remaining;
            } else {
                statusEl.textContent = 'Inactivo';
                statusEl.style.background = '#6c757d';
                setupSection.style.display = 'block';
                disableSection.style.display = 'none';
            }
        }
    } catch (err) { console.error('load2FAStatus:', err); }
}

async function setup2FA() {
    try {
        const result = await apiCall('/api/user/2fa/setup', 'POST');
        if (result.success) {
            document.getElementById('setup2FASection').style.display = 'none';
            document.getElementById('qrCodeSection').style.display = 'block';
            document.getElementById('qrCodeImage').src = result.qr_code;
            document.getElementById('secretKey').textContent = result.secret;
        } else {
            showError(result.message || 'Error al iniciar configuracion');
        }
    } catch (err) { showError('Error de conexion'); }
}

async function verify2FA() {
    const code = document.getElementById('verifyCode')?.value || '';
    if (code.length !== 6) { showWarning('Ingresa un codigo de 6 digitos'); return; }

    try {
        const result = await apiCall('/api/user/2fa/verify', 'POST', { code: code });
        if (result.success) {
            document.getElementById('qrCodeSection').style.display = 'none';
            document.getElementById('backupCodesSection').style.display = 'block';

            const codesList = document.getElementById('backupCodesList');
            codesList.innerHTML = result.backup_codes.map(function(c) {
                return '<div style="background: rgba(0,0,0,0.3); padding: 8px; border-radius: 4px; font-family: monospace; text-align: center;">' + escapeHtml(c) + '</div>';
            }).join('');

            document.getElementById('twoFactorStatus').textContent = 'Activo';
            document.getElementById('twoFactorStatus').style.background = '#22d55e';
        } else {
            showError(result.message || 'Codigo invalido');
        }
    } catch (err) { showError('Error de conexion'); }
}

function finish2FASetup() {
    document.getElementById('backupCodesSection').style.display = 'none';
    document.getElementById('disable2FASection').style.display = 'block';
    load2FAStatus();
}

function showDisable2FA() {
    document.getElementById('disableForm').style.display = 'block';
}

function disable2FA() {
    const code = document.getElementById('disableCode')?.value || '';
    if (!code) { showWarning('Ingresa un codigo de verificacion o codigo de respaldo'); return; }
    if (typeof showConfirm === 'function') {
        showConfirm('Estas seguro que deseas deshabilitar 2FA? Tu cuenta sera menos segura.', function() { doDisable2FA(code); });
    } else {
        doDisable2FA(code);
    }
}

async function doDisable2FA(code) {
    try {
        const body = code.length === 6 ? { code: code } : { backup_code: code };
        const result = await apiCall('/api/user/2fa/disable', 'POST', body);
        if (result.success) {
            showSuccess('2FA deshabilitado exitosamente');
            document.getElementById('disableCode').value = '';
            document.getElementById('disableForm').style.display = 'none';
            load2FAStatus();
        } else {
            showError(result.message || 'Error al deshabilitar 2FA');
        }
    } catch (err) { showError('Error de conexion'); }
}

// === Privacy Settings ===

var _privacySettings = {};

async function loadPrivacySettings() {
    try {
        var d = await apiCall('/api/user/privacy-settings');
        if (d.success && d.data) {
            _privacySettings = d.data;
            var map = {
                privProfilePublic: 'profile_public',
                privShowBio: 'show_bio',
                privShowLocation: 'show_location',
                privShowMemberSince: 'show_member_since',
                privShowGroups: 'show_groups'
            };
            for (var id in map) {
                var el = document.getElementById(id);
                if (el) {
                    if (d.data[map[id]] === false) el.classList.remove('active');
                    else el.classList.add('active');
                }
            }
            var msgEl = document.getElementById('privAllowMessages');
            if (msgEl) msgEl.value = d.data.allow_messages || 'everyone';
        }
    } catch(e) { console.warn('[Privacy] Load error:', e.message); }
}

async function togglePrivacy(element, key) {
    element.classList.toggle('active');
    _privacySettings[key] = element.classList.contains('active');
    try {
        var payload = {}; payload[key] = _privacySettings[key];
        await apiCall('/api/user/privacy-settings', 'PUT', payload);
    } catch(e) {
        console.warn('[Privacy] Toggle error:', e.message);
        element.classList.toggle('active');
        _privacySettings[key] = element.classList.contains('active');
    }
}

async function savePrivacySelect() {
    var val = document.getElementById('privAllowMessages')?.value || 'everyone';
    _privacySettings.allow_messages = val;
    try {
        await apiCall('/api/user/privacy-settings', 'PUT', { allow_messages: val });
    } catch(e) { console.warn('[Privacy] Save error:', e.message); }
}

// === Profile Completeness ===

async function loadProfileCompleteness() {
    try {
        var d = await apiCall('/api/user/profile-completeness');
        if (d.success && d.data) renderCompleteness(d.data);
    } catch(e) { console.warn('[Profile] Completeness error:', e.message); }
}

function renderCompleteness(data) {
    var container = document.getElementById('completenessCard');
    if (!container) return;
    var score = data.score;
    var color = score >= 80 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';
    var html = '<div style="display:flex;align-items:center;gap:16px;margin-bottom:12px;">' +
        '<div style="position:relative;width:64px;height:64px;">' +
            '<svg viewBox="0 0 36 36" style="width:64px;height:64px;transform:rotate(-90deg);">' +
                '<circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--ds-border-hover, rgba(255,255,255,0.1))" stroke-width="3"/>' +
                '<circle cx="18" cy="18" r="15.9" fill="none" stroke="' + color + '" stroke-width="3" stroke-dasharray="' + score + ' ' + (100 - score) + '" stroke-linecap="round"/>' +
            '</svg>' +
            '<span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:1rem;font-weight:700;color:' + color + ';">' + score + '%</span>' +
        '</div>' +
        '<div><div style="font-size:1rem;font-weight:600;color: var(--ds-text-secondary, #e2e8f0);">Perfil ' + (score >= 80 ? 'casi completo' : score >= 50 ? 'en progreso' : 'incompleto') + '</div>' +
        '<div style="font-size:0.78rem;color:var(--ds-text-secondary, rgba(255,255,255,0.5));">Completa tu perfil para mayor visibilidad</div></div></div>';

    var missing = data.items.filter(function(i) { return !i.done; });
    if (missing.length > 0) {
        html += '<div style="display:flex;flex-direction:column;gap:6px;">';
        missing.forEach(function(item) {
            html += '<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:var(--ds-bg-surface, rgba(255,255,255,0.03));border-radius:8px;font-size:0.82rem;">' +
                '<i class="far fa-circle" style="color:var(--ds-text-muted, rgba(255,255,255,0.3));font-size:0.7rem;"></i>' +
                '<span style="color:var(--ds-text-secondary, rgba(255,255,255,0.6));">' + item.label + '</span>' +
                '<span style="margin-left:auto;color:var(--ds-text-muted, rgba(255,255,255,0.3));font-size:0.72rem;">+' + item.weight + '%</span></div>';
        });
        html += '</div>';
    }
    container.innerHTML = html;
    container.style.display = 'block';
}

function toggleSwitch(element) {
    element.classList.toggle("active");
    var label = element.parentElement.querySelector("span");
    if (label) {
        var key = label.textContent.trim().replace(/\s+/g, "_").toLowerCase();
        var prefs = JSON.parse(localStorage.getItem("latanda_prefs") || "{}");
        prefs[key] = element.classList.contains("active");
        localStorage.setItem("latanda_prefs", JSON.stringify(prefs));
    }
}

function logout() {
    var doLogout = function() {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("latanda_auth_token");
        localStorage.removeItem("latanda_user");
        localStorage.removeItem("latanda_ltd");
        sessionStorage.clear();
        window.location.href = "auth-enhanced.html";
    };
    if (typeof showConfirm === 'function') {
        showConfirm("Estas seguro que deseas cerrar sesion?", doLogout);
    } else {
        doLogout();
    }
}

// === QR Generation (global for modal) ===
var _qrInstance = null;
window.generateQR = function(type) {
    var canvas = document.getElementById('qrCanvas');
    var label = document.getElementById('qrLabel');
    var tabProfile = document.getElementById('qrTabProfile');
    var tabWallet = document.getElementById('qrTabWallet');
    if (!canvas) return;

    canvas.innerHTML = '';
    if (_qrInstance) { _qrInstance.clear(); _qrInstance = null; }

    var url = '';
    if (type === 'wallet') {
        if (window._qrWalletAddr) {
            url = window._qrWalletAddr;
            if (label) label.textContent = url;
        } else {
            canvas.innerHTML = '<div style="padding:30px 20px;color:#a78bfa;font-size:0.85rem;"><i class="fas fa-link" style="font-size:2rem;display:block;margin-bottom:12px;"></i>Vincula tu wallet Keplr en<br><a href="#" onclick="document.getElementById(\'qrModal\').style.display=\'none\';switchTab(\'security\',event);return false;" style="color:#00FFFF;">Seguridad → La Tanda Chain Wallet</a></div>';
            if (label) label.textContent = 'Wallet no vinculada';
            if (tabProfile) tabProfile.style.background = 'rgba(0,0,0,0.3)';
            if (tabWallet) tabWallet.style.background = 'rgba(0,255,255,0.15)';
            return;
        }
        if (tabProfile) tabProfile.style.background = 'rgba(0,0,0,0.3)';
        if (tabWallet) tabWallet.style.background = 'rgba(0,255,255,0.15)';
    } else {
        url = window._qrProfileUrl || 'https://latanda.online';
        if (label) label.textContent = url;
        if (tabProfile) tabProfile.style.background = 'rgba(0,255,255,0.15)';
        if (tabWallet) tabWallet.style.background = 'rgba(0,0,0,0.3)';
    }

    if (typeof QRCode !== 'undefined') {
        _qrInstance = new QRCode(canvas, {
            text: url,
            width: 200,
            height: 200,
            colorDark: '#0f172a',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.M
        });
    } else {
        canvas.innerHTML = '<div style="padding:20px;color:#f87171;">QR library not loaded</div>';
    }
};

// === Init ===
let profileManager;
function _initProfile() {
    if (profileManager) return;
    profileManager = new ProfileManager();

    var params = new URLSearchParams(window.location.search);
    var tab = params.get('tab');
    if (tab && document.getElementById(tab + '-tab')) {
        document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
        document.querySelectorAll('.tab-content').forEach(function(c) { c.classList.remove('active'); });
        document.getElementById(tab + '-tab').classList.add('active');
        var tabBtns = document.querySelectorAll('.tab-btn');
        for (var i = 0; i < tabBtns.length; i++) {
            if (tabBtns[i].textContent.trim().toLowerCase().indexOf(tab) !== -1 ||
                tabBtns[i].getAttribute('onclick').indexOf(tab) !== -1) {
                tabBtns[i].classList.add('active');
                break;
            }
        }
        if (profileManager) profileManager.currentTab = tab;
    }
}

// Init: run when DOM is ready (handles both cases — script at bottom or deferred)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _initProfile);
} else {
    _initProfile();
}
