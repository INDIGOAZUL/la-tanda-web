// ============================================================
// La Tanda — Groups System (extracted from groups-advanced-system.html)
// v4.25.9 — Modularized 2026-03-25
// ============================================================
'use strict';

// --- Block 1 (originally inline) ---
// XSS prevention helper (v3.99.0)
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = String(text != null ? text : '');
        return div.innerHTML.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
// ===== CONFIGURATION =====
        const API_BASE = 'https://latanda.online';
        // ===== GLOBAL AUTH HELPER =====
        // Auth headers - Local definition for immediate use (shared-components.js overrides when loaded)
        window.getAuthHeaders = function() {
            const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') || '';
            return token ? { 'Authorization': 'Bearer ' + token } : {};
        }


        function getCurrentUserId() {
            try {
                // 1. Variables globales (si existen)
                if (typeof currentUser !== "undefined" && currentUser && currentUser.id) {
                    return String(currentUser.id);
                }
                if (typeof userData !== "undefined" && userData && userData.id) {
                    return String(userData.id);
                }

                // 2. latanda_user (fuente principal)
                const latandaUser = localStorage.getItem("latanda_user") ||
                                   sessionStorage.getItem("latanda_user");
                if (latandaUser) {
                    const parsed = JSON.parse(latandaUser);
                    if (parsed.id) return String(parsed.id);
                    if (parsed.user_id) return String(parsed.user_id);
                }

                // 3. Fallbacks de compatibilidad
                const fallbackId = localStorage.getItem("latanda_user_id") ||
                                  sessionStorage.getItem("latanda_user_id") ||
                                  localStorage.getItem("userId") ||
                                  localStorage.getItem("user_id");
                if (fallbackId) return String(fallbackId);

                // 4. No autenticado
                return null;

            } catch (error) {
                return null;
            }
        }


        const USER_ID = getCurrentUserId();

        // ===== STATE =====
        let allGroups = [];
        let filteredGroups = [];

        // ===== ROLE & STATUS LABELS =====
        const roleLabels = {
            creator: 'Creador',
            coordinator: 'Coordinador',
            member: 'Miembro'
        };

        const paymentStatusLabels = {
            up_to_date: 'Al día',
            pending: 'Pendiente',
            late: 'Atrasado',
            suspension_recommended: 'Muy atrasado',
            suspended: 'Suspendido — Paga para reactivar'
        };

        const alertIcons = {
            success: '✓',
            warning: '⚠',
            danger: '✕',
            info: 'ℹ'
        };

        // ===== POSTGRESQL DATA ADAPTER =====
        // Adapts PostgreSQL data structure to expected frontend format
        function adaptPostgreSQLGroup(pgGroup) {
            return {
                // IDs - handle both naming conventions
                id: pgGroup.group_id || pgGroup.id,
                group_id: pgGroup.group_id || pgGroup.id,
                
                // Basic data (exists in PostgreSQL)
                name: pgGroup.name || 'Sin nombre',
                description: pgGroup.description || '',
                category: pgGroup.category || 'general',
                location: pgGroup.location || '',
                contribution_amount: parseFloat(pgGroup.contribution_amount || 0),
                frequency: pgGroup.frequency || 'monthly',
                max_members: pgGroup.max_members || 0,
                status: pgGroup.status || 'active',
                start_date: pgGroup.start_date,
                lottery_scheduled_at: pgGroup.lottery_scheduled_at,
                lottery_executed_at: pgGroup.lottery_executed_at,
                lottery_executed: pgGroup.lottery_executed,
                created_at: pgGroup.created_at,
                total_amount_collected: parseFloat(pgGroup.total_amount_collected || 0),
                admin_id: pgGroup.admin_id,
                
                // Field with different name
                members_count: pgGroup.member_count || 0,
                total_positions: pgGroup.total_positions || pgGroup.member_count || 0,
                commission_rate: pgGroup.commission_rate !== undefined ? pgGroup.commission_rate : null,
                
                // Default values for missing fields (to prevent errors)
                my_role: pgGroup.my_role || 'member',  // v4.25.4: Safe default — API should always return role
                my_payment_status: pgGroup.my_payment_status || 'up_to_date',  // Default status
                my_days_late: pgGroup.my_days_late || 0,
                my_next_payment_due: pgGroup.my_next_payment_due,
                my_total_paid: parseFloat(pgGroup.my_total_paid || 0),
                my_alerts: pgGroup.my_alerts || [],
                my_num_positions: parseInt(pgGroup.my_num_positions) || 1,
                has_active_tanda: pgGroup.has_active_tanda || false,
                current_cycle: parseInt(pgGroup.current_cycle) || 0,
                current_turn_number: null,
                current_turn_recipient: null,
                tanda_status: pgGroup.tanda_status || null,
                tanda_id: pgGroup.tanda_id || null,
                my_turn_number: pgGroup.my_turn_number || null,
                turns_until_mine: pgGroup.turns_until_mine !== undefined ? pgGroup.turns_until_mine : null,
                current_turn: parseInt(pgGroup.tanda_current_turn) || 0,
                max_mora_cycles: parseInt(pgGroup.max_mora_cycles) || 4,
                my_next_payment_grace_deadline: pgGroup.my_next_payment_grace_deadline || null,
                grace_period: parseInt(pgGroup.grace_period) || 5,
                active_loans_count: parseInt(pgGroup.active_loans_count) || 0,
                my_turn_position: pgGroup.my_turn_position || pgGroup.my_turn_number || null
            };
        }

        // ===== FETCH GROUPS =====
        // ALG-06 T3: Show risk radar modal
    // v4.25.4: showRiskRadar removed — now in gestionar.html


    // v4.25.4: showAnomalyFlags removed — now in gestionar.html


    async function loadRecommendedGroups() {
        const token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
        if (!token) return;
        const card = document.getElementById('grRecCard');
        const list = document.getElementById('grRecList');
        if (!card || !list) return;

        try {
            const resp = await fetch('/api/groups/recommended', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const data = await resp.json();
            const groups = data?.data?.groups || [];
            if (groups.length === 0) { card.style.display = 'none'; return; }

            card.style.display = '';
            list.innerHTML = groups.slice(0, 5).map(function(g) {
                const score = g.recommendation_score || 0;
                const scoreClass = score >= 60 ? 'gr-rec-score-high' : score >= 40 ? 'gr-rec-score-med' : 'gr-rec-score-low';
                const freq = g.frequency === 'weekly' ? 'Semanal' : g.frequency === 'biweekly' ? 'Quincenal' : 'Mensual';
                const contrib = (window.ltFormatNumber ? ltFormatNumber(g.contribution_amount) : parseFloat(g.contribution_amount || 0).toLocaleString('es-HN'));
                const mf = g.match_factors || {};
                var tags = [];
                if (mf.location) tags.push('Cerca');
                if (mf.contribution_fit) tags.push('Tu rango');
                if (mf.frequency_match) tags.push(freq);
                if (mf.friends_in_group > 0) tags.push(mf.friends_in_group + ' amigo' + (mf.friends_in_group > 1 ? 's' : ''));
                if (mf.similar_users_count > 0) tags.push(mf.similar_users_count + ' similar' + (mf.similar_users_count > 1 ? 'es' : ''));
                var tagsHtml = tags.length > 0 ? '<div class="gr-rec-match">' + tags.map(function(t) { return '<span class="gr-rec-tag">' + t + '</span>'; }).join('') + '</div>' : '';
                var proofHtml = g.social_proof ? '<div class="gr-rec-proof"><i class="fas fa-user-friends"></i> ' + escapeHtml(g.social_proof) + '</div>' : '';

                return '<div class="gr-rec-item" data-action="gr-rec-join" data-group-id="' + (g.group_id || g.id) + '">' +
                    '<div class="gr-rec-avatar"><i class="fas fa-users"></i></div>' +
                    '<div class="gr-rec-info">' +
                        '<div class="gr-rec-name">' + escapeHtml(g.name) + '</div>' +
                        '<div class="gr-rec-meta">L. ' + contrib + ' · ' + freq + ' · ' + (g.member_count || 0) + '/' + (g.max_members || '?') + '</div>' +
                        tagsHtml +
                        proofHtml +
                    '</div>' +
                    '<span class="gr-rec-score ' + scoreClass + '">' + score + '%</span>' +
                    '<button class="gr-rec-dismiss" data-action="gr-rec-dismiss" data-group-id="' + (g.group_id || g.id) + '" title="No me interesa"><i class="fas fa-times"></i></button>' +
                '</div>';
            }).join('');
        } catch (e) {
            card.style.display = 'none';
        }
    }

    // ALG-05 T1: Handle click on recommended group
    document.addEventListener('click', function(e) {
        // Dismiss button
        var dismissBtn = e.target.closest('[data-action="gr-rec-dismiss"]');
        if (dismissBtn) {
            e.stopPropagation();
            var gid = dismissBtn.dataset.groupId;
            var token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
            if (gid && token) {
                fetch('/api/groups/recommended/dismiss', {
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ group_id: gid })
                }).then(function() {
                    var card = dismissBtn.closest('.gr-rec-item');
                    if (card) { card.style.opacity = '0'; card.style.transition = 'opacity 0.3s'; setTimeout(function() { card.remove(); }, 300); }
                    // Hide container if empty
                    setTimeout(function() {
                        var list = document.getElementById('grRecList');
                        if (list && list.children.length === 0) {
                            document.getElementById('grRecCard').style.display = 'none';
                        }
                    }, 400);
                }).catch(function() {});
            }
            return;
        }

        var item = e.target.closest('[data-action="gr-rec-join"]');
        if (!item) return;
        var groupId = item.dataset.groupId;
        if (!groupId) return;
        // Navigate to join flow — scroll to open groups section
        var divider = document.querySelector('.gc-section-divider');
        if (divider) divider.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    async function fetchMyGroups() {
            try {
                // Read token directly — do NOT require latanda_user (it may not exist)
                const authToken = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') || '';

                // Guard: skip API call if not authenticated (prevents 401 cascade)
                if (!authToken || !USER_ID) {
                    var gc = document.getElementById('groupsContainer');
                    if (gc) gc.innerHTML = '<div style="text-align:center;padding:60px 20px;"><i class="fas fa-lock" style="font-size:3rem;color:rgba(0,255,255,0.3);margin-bottom:12px;display:block;"></i><h3 style="color:#e2e8f0;margin-bottom:8px;">Inicia sesion para ver tus tandas</h3><p style="color:#94a3b8;margin-bottom:20px;">Necesitas una cuenta para crear y gestionar grupos de ahorro</p><a href="/auth-enhanced.html" style="display:inline-flex;align-items:center;gap:8px;text-decoration:none;padding:10px 20px;background:linear-gradient(135deg,#00FFFF,#00cccc);color:#0f172a;border-radius:10px;font-weight:600;"><i class="fas fa-sign-in-alt"></i> Iniciar Sesion</a></div>';
                    return;
                }

                const response = await fetch(`${API_BASE}/api/groups/my-groups-pg`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + authToken
                    }
                });
                const data = await response.json();

                if (data.success) {
                    allGroups = data.data.groups.map(adaptPostgreSQLGroup);
                    window.currentGroupsData = allGroups;  // Exponer para modal Administrar
                    filteredGroups = [...allGroups];
                    updateStats();
                    renderGroups();

                    // Also refresh tandas tab to sync turn positions
                    if (typeof refreshTandas === 'function') {
                        refreshTandas();
                    }

                    // Non-blocking fetch of public groups for discovery
                    (async function() {
                        try {
                            var pubRes = await fetch(API_BASE + '/api/groups/public-pg', {
                                headers: { 'Authorization': 'Bearer ' + authToken }
                            });
                            var pubData = await pubRes.json();
                            if (pubData.success) {
                                window.publicGroupsData = (pubData.data.groups || []).map(function(g) {
                                    var adapted = adaptPostgreSQLGroup(g);
                                    adapted.my_role = 'open';
                                    adapted.my_payment_status = null;
                                    adapted.my_alerts = [];
                                    adapted.is_public = true;
                                    adapted.health_score = g.health_score || 50;
                                    adapted.health_factors = g.health_factors || {};
                                    adapted.admin_name = g.admin_name || null;
                                    adapted.admin_verified = g.admin_verified || false;
                                    adapted.admin_since = g.admin_since || null;
                                    adapted.tanda_status = g.tanda_status || null;
                                    adapted.active_members = g.active_members || 0;
                      adapted.current_cycle = g.current_cycle || 0;
                                    adapted.views_count = parseInt(g.views_count) || 0;
                                    adapted.saves_count = parseInt(g.saves_count) || 0;
                                    adapted.start_date = g.start_date || null;
                                    adapted.grace_period = g.grace_period || 5;
                                    adapted.creator_score = g.creator_score ? parseInt(g.creator_score) : null;
                                    adapted.creator_credit_category = g.creator_credit_category || null;
                                    return adapted;
                                });
                            } else {
                                window.publicGroupsData = [];
                            }
                        } catch(e) {
                            window.publicGroupsData = [];
                        }
                        // Load saved state for authenticated users
                        var _authTk = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') || '';
                        if (_authTk && window.publicGroupsData && window.publicGroupsData.length > 0) {
                            (async function() {
                                try {
                                    var gids = window.publicGroupsData.map(function(g) { return g.id; });
                                    var svRes = await fetch(API_BASE + '/api/groups/my-saves', {
                                        headers: { 'Authorization': 'Bearer ' + _authTk }
                                    });
                                    // If endpoint doesn't exist yet, silently ignore
                                    if (svRes.ok) {
                                        var svData = await svRes.json();
                                        if (svData.success && Array.isArray(svData.data)) {
                                            var savedSet = new Set(svData.data.map(function(s) { return s.group_id; }));
                                            window.publicGroupsData.forEach(function(g) {
                                                g._is_saved = savedSet.has(g.id);
                                            });
                                        }
                                    }
                                } catch(e) { /* saved state is non-blocking */ }
                                if (typeof applyFilters === 'function') applyFilters();
                    loadRecommendedGroups();
                            })();
                        } else {
                            // Re-render to include public groups
                            if (typeof applyFilters === 'function') applyFilters();
                        }

                        // IntersectionObserver for view tracking on public group cards
                        setTimeout(function() {
                            if (window._gcViewObserver) window._gcViewObserver.disconnect();
                            var pendingViews = new Set();
                            var viewedSession = JSON.parse(sessionStorage.getItem('gc_viewed') || '{}');
                            window._gcViewObserver = new IntersectionObserver(function(entries) {
                                entries.forEach(function(entry) {
                                    var gid = entry.target.getAttribute('data-group-id');
                                    if (!gid || viewedSession[gid]) return;
                                    if (entry.isIntersecting) {
                                        entry.target._viewTimer = setTimeout(function() {
                                            pendingViews.add(gid);
                                            viewedSession[gid] = 1;
                                            sessionStorage.setItem('gc_viewed', JSON.stringify(viewedSession));
                                        }, 2000);
                                    } else {
                                        clearTimeout(entry.target._viewTimer);
                                    }
                                });
                            }, { threshold: 0.5 });
                            // Observe public group cards
                            document.querySelectorAll('.gc-card[data-public="true"]').forEach(function(card) {
                                window._gcViewObserver.observe(card);
                            });
                            // Flush every 5 seconds
                            window._gcViewFlush = setInterval(function() {
                                if (pendingViews.size === 0) return;
                                var ids = Array.from(pendingViews);
                                pendingViews.clear();
                                fetch(API_BASE + '/api/groups/track-views', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ group_ids: ids })
                                }).catch(function() {});
                            }, 5000);
                        }, 500);
                    })();

                    // ✅ Check if there's a newly created group to highlight
                    const newlyCreatedId = sessionStorage.getItem('newly_created_group_id');
                    if (newlyCreatedId) {
                        highlightNewGroup(newlyCreatedId);
                        sessionStorage.removeItem('newly_created_group_id');
                    }
                } else {
                    showError(data.error || data.message || 'Error al cargar grupos');
                }
            } catch (error) {
                showError('Error de conexion');
            }
        }

// ===== UPDATE STATS =====
        function updateStats() {
            // Calculate real stats from allGroups data

            const activeGroups = allGroups.filter(g => g.status === 'active');

            // Count pending payments (groups where my_payment_status is pending, late, or suspension_recommended)
            const pendingCount = allGroups.filter(g =>
                g.my_payment_status !== 'paid' && g.my_payment_status !== 'up_to_date' && g.status === 'active'
            ).length;

            // Sum total paid across all groups
            const totalPaidSum = allGroups.reduce((sum, g) => sum + (g.my_total_paid || 0), 0);

            // Count total alerts
            const alertsCount = allGroups.reduce((sum, g) => sum + (g.my_alerts?.length || 0), 0);

            // Total amount owed (contribution_amount for groups with pending/late status)
            const totalOwed = allGroups.reduce(function(sum, g) {
                if (g.my_payment_status === 'pending' || g.my_payment_status === 'late' || g.my_payment_status === 'suspension_recommended') {
                    return sum + (parseFloat(g.contribution_amount) || 0) * (parseInt(g.my_num_positions) || 1);
                }
                return sum;
            }, 0);

            // Cycle range across active groups
            var cycleValues = activeGroups.map(function(g) { return parseInt(g.current_cycle) || 0; }).filter(function(c) { return c > 0; });
            var cycleDisplay = '--';
            if (cycleValues.length > 0) {
                var minCycle = Math.min.apply(null, cycleValues);
                var maxCycle = Math.max.apply(null, cycleValues);
                cycleDisplay = minCycle === maxCycle ? 'Ciclo ' + minCycle : 'Ciclos ' + minCycle + '-' + maxCycle;
            }

            // Role breakdown
            var roleCreator = 0, roleCoord = 0, roleMember = 0;
            allGroups.forEach(function(g) {
                if (g.my_role === 'creator') roleCreator++;
                else if (g.my_role === 'coordinator') roleCoord++;
                else roleMember++;
            });

            var el;
            // 2x2 grid
            el = document.getElementById('totalGroups'); if (el) el.textContent = allGroups.length;
            el = document.getElementById('activeGroups'); if (el) el.textContent = activeGroups.length;
            el = document.getElementById('pendingPayments'); if (el) el.textContent = pendingCount;
            el = document.getElementById('totalAlerts'); if (el) el.textContent = alertsCount;

            // Detail rows
            el = document.getElementById('grpTotalPaid'); if (el) el.textContent = (window.ltFormatCurrency ? ltFormatCurrency(totalPaidSum) : 'L. ' + totalPaidSum.toLocaleString('es-HN', {minimumFractionDigits:2, maximumFractionDigits:2}));
            el = document.getElementById('grpTotalOwed'); if (el) {
                el.textContent = (window.ltFormatCurrency ? ltFormatCurrency(totalOwed) : 'L. ' + totalOwed.toLocaleString('es-HN', {minimumFractionDigits:2, maximumFractionDigits:2}));
                // Hide row if nothing owed
                var owedRow = el.closest('.gs-row');
                if (owedRow) owedRow.style.display = totalOwed > 0 ? 'flex' : 'none';
            }
            el = document.getElementById('grpCurrentCycle'); if (el) el.textContent = cycleDisplay;

            // Roles
            el = document.getElementById('grpRoleCreator'); if (el) el.textContent = roleCreator;
            el = document.getElementById('grpRoleCoord'); if (el) el.textContent = roleCoord;

            // v4.10.8: Tanda balance now shown via updateSidebarHubCards (below Mi Wallet)
            // This secondary path is disabled to avoid duplicates
            (async function() {
                return; // disabled — single source: updateSidebarHubCards
                try {
                    var token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
                    if (!token) return;
                    var tandaGroups = allGroups.filter(function(g) { return g.tanda_status === 'active'; });
                    if (tandaGroups.length === 0) return;
                    var pg = tandaGroups[0];
                    var tbResp = await fetch('/api/groups/' + encodeURIComponent(pg.group_id) + '/tanda-balances', {
                        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }
                    });
                    if (!tbResp.ok) return;
                    var tbData = await tbResp.json();
                    if (!tbData.success || !tbData.data || !tbData.data.members) return;
                    var uid = USER_ID || localStorage.getItem('latanda_user_id') || localStorage.getItem('user_id');
                    var me = tbData.data.members.find(function(m) { return m.user_id === uid; });
                    if (!me) return;
                    var tb = me.tanda_balance;
                    var sign = tb >= 0 ? '+' : '';
                    var color = tb >= 0 ? '#34d399' : '#f87171';
                    // Update inline row in Resumen
                    var inlineRow = document.getElementById('grpTandaRow');
                    var inlineVal = document.getElementById('grpTandaInline');
                    if (inlineRow && inlineVal) {
                        inlineRow.style.display = 'flex';
                        inlineVal.textContent = sign + (window.ltFormatCurrency ? ltFormatCurrency(Math.abs(tb)) : 'L. ' + Math.abs(tb).toLocaleString('es-HN', {minimumFractionDigits:2, maximumFractionDigits:2}));
                        inlineVal.style.color = color;
                    }
                    // Also update separate card if visible
                    var card = document.getElementById('grpTandaBalanceCard');
                    if (card) {
                        card.style.display = '';
                        var label = tb >= 0 ? 'Ahorro acumulado' : 'Prestamo pendiente';
                        var balEl = document.getElementById('grpTandaBalance');
                        if (balEl) { balEl.textContent = sign + (window.ltFormatCurrency ? ltFormatCurrency(Math.abs(tb)) : 'L. ' + Math.abs(tb).toLocaleString('es-HN', {minimumFractionDigits:2, maximumFractionDigits:2})); balEl.style.color = color; }
                        var lblEl = document.getElementById('grpTandaLabel');
                        if (lblEl) { lblEl.textContent = label; lblEl.style.color = color; }
                        var turnoEl = document.getElementById('grpTandaTurno');
                        if (turnoEl) turnoEl.textContent = 'Turno #' + (me.turn_position || '--');
                        var pagosEl = document.getElementById('grpTandaPagos');
                        if (pagosEl) pagosEl.textContent = (me.payments_count || 0) + ' pagos';
                        var grpEl = document.getElementById('grpTandaGroup');
                        if (grpEl) grpEl.textContent = pg.name || '--';
                    }
                    var distEl = document.getElementById('grpTandaDist');
                    if (distEl) distEl.textContent = (tbData.data.distributions_completed || 0) + ' dist.';
                } catch(e) { /* tanda balance is non-blocking */ }
            })();
            el = document.getElementById('grpRoleMember'); if (el) el.textContent = roleMember;

            // M3: Turn position display
            var turnPositions = allGroups.map(function(g) { return g.my_turn_number || null; }).filter(function(t) { return t !== null; });
            var turnEl = document.getElementById('grpMyTurn');
            var turnRow = document.getElementById('grpTurnRow');
            if (turnEl && turnRow) {
                if (turnPositions.length > 0) {
                    turnEl.textContent = turnPositions.length === 1 ? '#' + turnPositions[0] : turnPositions.map(function(t) { return '#' + t; }).join(', ');
                    turnRow.style.display = 'flex';
                } else {
                    turnRow.style.display = 'none';
                }
            }

            // Next payment due
            updateNextPaymentCard();
        }

        function updateNextPaymentCard() {
            var card = document.getElementById('grpSidebarNextPayment');
            if (!card) return;
            var listEl = document.getElementById('grpPaymentsList');
            if (!listEl) return;

            // Collect active groups with UNPAID next payment due
            var now = new Date();
            var entries = [];
            allGroups.forEach(function(g) {
                // v4.25.12: Use payment_window from API
                var pw = g.payment_window;
                if (pw && pw.isActive && pw.dueDate) {
                    entries.push({ group: g, date: new Date(pw.dueDate + 'T12:00:00'), pw: pw });
                }
            });

            // Sort by date ascending (most urgent first), cap at 5
            entries.sort(function(a, b) { return a.date - b.date; });
            entries = entries.slice(0, 5);

            if (entries.length === 0) {
                card.style.display = 'none';
                return;
            }

            card.style.display = 'block';
            var html = '';
            entries.forEach(function(entry) {
                var g = entry.group;
                var d = entry.date;
                var amt = (parseFloat(g.contribution_amount) || 0) * (parseInt(g.my_num_positions) || 1);
                var amtStr = (window.ltFormatCurrency ? ltFormatCurrency(amt) : 'L. ' + amt.toLocaleString('es-HN', {minimumFractionDigits:2, maximumFractionDigits:2}));
                var dateStr = d.toLocaleDateString('es-HN', { day: '2-digit', month: 'short' });

                // v4.25.12: Use payment_window for countdown
                var epw = entry.pw || {};
                var countdownText = '';
                var countdownClass = 'gs-next-countdown gs-countdown-ok';
                if (epw.status === 'overdue') {
                    countdownText = 'Vencido ' + epw.daysOverdue + 'd';
                    countdownClass = 'gs-next-countdown gs-countdown-late';
                } else if (epw.status === 'grace') {
                    countdownText = epw.daysUntilGrace + 'd gracia';
                    countdownClass = 'gs-next-countdown gs-countdown-soon';
                } else if (epw.daysUntilDue !== null && epw.daysUntilDue === 0) {
                    countdownText = 'Hoy';
                    countdownClass = 'gs-next-countdown gs-countdown-soon';
                } else if (epw.daysUntilDue !== null && epw.daysUntilDue <= 3 && epw.daysUntilDue > 0) {
                    countdownText = epw.daysUntilDue + 'd';
                    countdownClass = 'gs-next-countdown gs-countdown-soon';
                } else if (epw.daysUntilDue !== null && epw.daysUntilDue > 0) {
                    countdownText = epw.daysUntilDue + 'd';
                    countdownClass = 'gs-next-countdown gs-countdown-ok';
                } else {
                    countdownText = epw.label || '?';
                    countdownClass = 'gs-next-countdown gs-countdown-ok';
                }

                html += '<div class="gs-pay-item">' +
                    '<div class="gs-pay-item-left">' +
                        '<div class="gs-next-group">' + escapeHtml(g.name || 'Grupo') + '</div>' +
                        '<div class="gs-next-date">' + escapeHtml(dateStr) + '</div>' +
                    '</div>' +
                    '<div class="gs-pay-item-right">' +
                        '<div class="gs-next-amount">' + escapeHtml(amtStr) + '</div>' +
                        '<div class="' + countdownClass + '">' + escapeHtml(countdownText) + '</div>' +
                    '</div>' +
                '</div>';
            });
            listEl.innerHTML = html;
        }

        // ===== RENDER GROUPS =====
        function renderGroups() {
            const container = document.getElementById('groupsContainer');

            if (allGroups.length === 0 && (!window.publicGroupsData || window.publicGroupsData.length === 0)) {
                container.innerHTML = '<div class="empty-state">' +
                    '<div class="empty-state-icon"><i class="fas fa-users" style="font-size:3rem;color:#00FFFF;"></i></div>' +
                    '<h3>Comienza tu primera tanda</h3>' +
                    '<p>Crea un grupo de ahorro con amigos, familia o companeros de trabajo.</p>' +
                    '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:16px;">' +
                        '<button class="btn btn-primary ds-btn ds-btn-primary ds-btn-sm" data-action="switch-groups-tab" data-tab="create"><i class="fas fa-plus-circle"></i> Crear Grupo</button>' +
                    '</div>' +
                '</div>';
                return;
            }

            if (filteredGroups.length === 0) {
                var roleF = document.getElementById('filterRole') ? document.getElementById('filterRole').value : 'all';
                if (roleF === 'creator') {
                    container.innerHTML = '<div class="empty-state">' +
                        '<div class="empty-state-icon"><i class="fas fa-users" style="font-size:3rem;color:#00FFFF;"></i></div>' +
                        '<h3>Aun no has creado ningun grupo</h3>' +
                        '<p>Crea tu primer grupo de ahorro y empieza a administrar tu tanda.</p>' +
                        '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:16px;">' +
                            '<button class="btn btn-primary ds-btn ds-btn-primary ds-btn-sm" data-action="switch-groups-tab" data-tab="create"><i class="fas fa-plus-circle"></i> Crear Grupo</button>' +
                        '</div>' +
                    '</div>';
                } else {
                    container.innerHTML = '<div class="empty-state">' +
                        '<div class="empty-state-icon" style="font-size:3rem;">&#x1F50D;</div>' +
                        '<h3>Sin resultados</h3>' +
                        '<p>No se encontraron grupos con estos filtros.</p>' +
                        '<button class="btn btn-secondary" data-action="grp-reset-filters">Limpiar Filtros</button>' +
                    '</div>';
                }
                return;
            }

            var myCards = '';
            var pubCards = '';
            filteredGroups.forEach(function(group) {
                if (group.is_public) {
                    pubCards += renderGroupCard(group);
                } else {
                    myCards += renderGroupCard(group);
                }
            });
            var finalHtml = '<div class="groups-grid">' + myCards;
            if (pubCards) {
                finalHtml += '</div><div class="gc-section-divider"><span>Grupos Abiertos</span><select id="sortPublicGroups" class="gc-sort-select" title="Ordenar grupos abiertos"><option value="health">Salud</option><option value="newest">Recientes</option><option value="members">Miembros</option><option value="amount_low">Aporte menor</option></select></div><div class="groups-grid">' + pubCards;
            }
            finalHtml += '</div>';

            container.innerHTML = finalHtml;
            
            // Dispatch event for position requests to load
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('groupsRendered'));
            }, 100);
        }

        // ===== CALCULO DE COMISION DE PLATAFORMA =====
        // Comision variable: <L.50k=3%, L.50k-100k=2%, >L.100k=1%
        function calculatePlatformFee(totalPool) {
            if (totalPool < 50000) return totalPool * 0.03;      // 3%
            if (totalPool <= 100000) return totalPool * 0.02;   // 2%
            return totalPool * 0.01;                             // 1%
        }
        
        function getCommissionRate(totalPool) {
            if (totalPool < 50000) return 3;
            if (totalPool <= 100000) return 2;
            return 1;
        }
        
        function calculatePayoutBreakdown(contributionAmount, memberCount, customRate) {
            const totalPool = contributionAmount * memberCount;
            var commissionRate;
            if (customRate !== null && customRate !== undefined) {
                commissionRate = customRate;
            } else {
                commissionRate = getCommissionRate(totalPool);
            }
            var platformFee = totalPool * (commissionRate / 100);
            var coordPlatformFee = platformFee * 0.10;
            var userReceives = totalPool - platformFee;

            return {
                contribution_amount: contributionAmount,
                member_count: memberCount,
                total_pool: totalPool,
                platform_fee: platformFee,
                coordinator_fee: platformFee - coordPlatformFee,
                platform_share: coordPlatformFee,
                commission_rate: commissionRate,
                user_receives: userReceives
            };
        }

        // v4.10.4: Commission live calculator for create form
        function updateCommissionCalc() {
            var calcBody = document.getElementById('commission-calc-body');
            if (!calcBody) return;
            var contribInput = document.getElementById('contribution');
            var membersInput = document.getElementById('max-participants');
            var contribution = parseFloat(contribInput ? contribInput.value : 0) || 0;
            var members = parseInt(membersInput ? membersInput.value : 0) || 0;
            if (contribution <= 0 || members <= 0) {
                calcBody.innerHTML = '<span style="color:#64748b;">Ingresa contribucion y miembros para ver el calculo</span>';
                return;
            }
            var commType = document.querySelector('input[name="commission-type"]:checked');
            var typeVal = commType ? commType.value : 'default';
            var customRate = null;
            if (typeVal === 'none') {
                customRate = 0;
            } else if (typeVal === 'custom') {
                var rateInput = document.getElementById('custom-commission-rate');
                customRate = parseFloat(rateInput ? rateInput.value : 2) || 2;
            }
            var breakdown = calculatePayoutBreakdown(contribution, members, customRate);
            var fmtL = function(n) { return window.ltFormatCurrency ? ltFormatCurrency(n) : (window.ltFormatCurrency ? ltFormatCurrency(n) : 'L. ' + n.toLocaleString('es-HN', {minimumFractionDigits:2, maximumFractionDigits:2})); };
            calcBody.innerHTML =
                '<div>Fondo total (' + members + ' x ' + fmtL(contribution) + '): <strong style="color:#00FFFF;">' + fmtL(breakdown.total_pool) + '</strong></div>' +
                '<div>Comision coordinador (' + breakdown.commission_rate.toFixed(1) + '%): <strong>' + fmtL(breakdown.coordinator_fee) + '</strong></div>' +
                '<div>Comision plataforma (10% de coordinador): <strong>' + fmtL(breakdown.platform_share) + '</strong></div>' +
                '<div style="margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.1);">El beneficiario recibe: <strong style="color:#22c55e;font-size:1rem;">' + fmtL(breakdown.user_receives) + '</strong></div>';
        }

        // Wire up commission radio buttons and inputs
        (function setupCommissionUI() {
            document.addEventListener('change', function(e) {
                if (e.target.name === 'commission-type') {
                    var customGroup = document.getElementById('custom-commission-group');
                    if (customGroup) customGroup.style.display = e.target.value === 'custom' ? 'block' : 'none';
                    updateCommissionCalc();
                }
                if (e.target.id === 'custom-commission-rate' || e.target.id === 'contribution' || e.target.id === 'max-participants') {
                    updateCommissionCalc();
                }
            });
            document.addEventListener('input', function(e) {
                if (e.target.id === 'custom-commission-rate' || e.target.id === 'contribution' || e.target.id === 'max-participants') {
                    updateCommissionCalc();
                }
            });
            // Initial calc when step 3 loads
            setTimeout(updateCommissionCalc, 500);
        })();

        // M4: Set min date on start-date to today
        (function() {
            var sd = document.getElementById('start-date');
            if (sd) sd.min = new Date().toISOString().split('T')[0];
        })();

        // Calcular fecha limite de payout
        function calculatePayoutDeadline(startDate, frequency, turnNumber, gracePeriod) {
            const intervals = { weekly: 7, biweekly: 14, monthly: 30 };
            const daysInterval = intervals[frequency] || 30;
            
            const deadline = new Date(startDate);
            deadline.setDate(deadline.getDate() + (turnNumber * daysInterval) + gracePeriod);
            return deadline;
        }
        
        // Verificar si se puede procesar el payout
// v4.25.5: canProcessPayout removed (dead code)

        function _gcFmtL(val) {
            var n = parseFloat(val);
            return isNaN(n) || n === 0 ? '--' : (window.ltFormatCurrency ? ltFormatCurrency(n) : 'L. ' + n.toLocaleString('es-HN', {minimumFractionDigits:2, maximumFractionDigits:2}));
        }

        // Engagement bar for public group cards
        function _gcEngagementBar(group) {
            if (!group.is_public) return '';
            var views = parseInt(group.views_count) || 0;
            var saves = parseInt(group.saves_count) || 0;
            var viewsStr = views >= 1000 ? (views / 1000).toFixed(1) + 'k' : views;
            var savesStr = saves >= 1000 ? (saves / 1000).toFixed(1) + 'k' : saves;
            var isSaved = group._is_saved || false;
            return '<div class="gc-engagement">' +
                '<span class="gc-eng-stat" title="Vistas"><i class="far fa-eye"></i> ' + viewsStr + '</span>' +
                '<span class="gc-eng-stat" title="Guardados"><i class="' + (isSaved ? 'fas' : 'far') + ' fa-star"></i> ' + savesStr + '</span>' +
                '<button class="gc-eng-save ' + (isSaved ? 'gc-saved' : '') + '" data-action="grp-toggle-save" data-group-id="' + escapeHtml(group.id) + '" title="' + (isSaved ? 'Quitar de guardados' : 'Guardar grupo') + '">' +
                    '<i class="' + (isSaved ? 'fas' : 'far') + ' fa-star"></i>' +
                '</button>' +
            '</div>';
        }

        // v4.16.12: Trust badge for public group cards
        function _gcTrustBadge(group) {
            if (!group.is_public) return '';
            var score = group.creator_score;
            var cat = group.creator_credit_category;
            if (!score) return '<span class="gc-trust gc-trust-new" title="Creador nuevo"><i class="fas fa-shield-alt"></i> Nuevo</span>';
            var cls = 'gc-trust-regular';
            if (cat === 'excelente') cls = 'gc-trust-excellent';
            else if (cat === 'bueno') cls = 'gc-trust-good';
            else if (cat === 'riesgo') cls = 'gc-trust-risk';
            return '<span class="gc-trust ' + cls + '" title="Puntuacion del creador: ' + score + '"><i class="fas fa-shield-alt"></i> ' + score + '</span>';
        }

        // v4.25.5: Constants restored (were deleted with modal cleanup)
        const GC_STATUS_LABELS = { 'active': 'Activo', 'pending': 'Pendiente', 'completed': 'Completado', 'cancelled': 'Cancelado', 'paused': 'Pausado' };
        const GC_FREQ_LABELS = { 'weekly': 'Semanal', 'biweekly': 'Quincenal', 'monthly': 'Mensual' };
        const GC_ROLE_LABELS = { 'creator': 'Creador', 'coordinator': 'Coordinador', 'member': 'Miembro', 'open': 'Abierto' };
        const GC_ALERT_ICONS = { 'success': '&#10003;', 'warning': '&#9888;', 'danger': '&#10007;', 'info': '&#8505;' };

        function renderGroupCard(group) {
            const statusLabels = GC_STATUS_LABELS;
            const frequencyLabels = GC_FREQ_LABELS;
            const roleLabels = GC_ROLE_LABELS;
            const alertIcons = GC_ALERT_ICONS;

            // v4.25.12: Pending membership — simplified card with cancel button
            if (group.my_membership_status === 'pending') {
                var pendName = escapeHtml(group.name || 'Grupo');
                var pendLetter = (group.name || '?').charAt(0).toUpperCase();
                var pendFreq = frequencyLabels[group.frequency] || group.frequency || '--';
                var pendAmt = (window.ltFormatCurrency ? ltFormatCurrency(parseFloat(group.contribution_amount) || 0) : 'L. ' + (parseFloat(group.contribution_amount) || 0).toLocaleString('es-HN', {minimumFractionDigits:2}));
                var pendMembers = (group.member_count || 0) + '/' + (group.max_members || '?');
                return '<div class="gc-card" style="border-left:3px solid var(--ds-amber);opacity:0.85;" data-group-id="' + escapeHtml(group.id || group.group_id || '') + '">' +
                    '<div class="gc-header">' +
                        '<div class="gc-avatar" style="background:var(--ds-amber);color:#000;">' + pendLetter + '</div>' +
                        '<div class="gc-header-info">' +
                            '<div class="gc-title">' + pendName + '</div>' +
                            '<div class="gc-subtitle" style="font-size:0.72rem;color:var(--ds-text-faint);">' + pendFreq + ' &middot; ' + pendAmt + ' &middot; ' + pendMembers + ' miembros</div>' +
                        '</div>' +
                        '<span class="gc-role ds-badge-amber" style="font-size:0.65rem;">Solicitud Pendiente</span>' +
                    '</div>' +
                    '<div style="padding:8px 12px 12px;display:flex;align-items:center;justify-content:space-between;border-top:1px solid rgba(255,255,255,0.04);">' +
                        '<span style="font-size:0.75rem;color:var(--ds-amber);"><i class="fas fa-clock" style="margin-right:4px;"></i>Esperando aprobacion del coordinador</span>' +
                        '<button data-action="grp-cancel-join" data-group-id="' + escapeHtml(group.id || group.group_id || '') + '" style="background:transparent;border:1px solid var(--ds-red);color:var(--ds-red);padding:4px 12px;border-radius:8px;font-size:0.72rem;cursor:pointer;">Cancelar</button>' +
                    '</div>' +
                '</div>';
            }

            // Status color mapping
            var st = group.status || 'active';
            var statusColor = ({ active: '#00FFFF', completed: '#22c55e', pending: '#f59e0b', paused: '#f59e0b', suspended: '#ef4444', cancelled: '#64748b' })[st] || '#00FFFF';

            // Payment status from backend (trusted — no client-side override)
            let effectivePaymentStatus = group.my_payment_status;
            // Override card border for late/suspended/suspension_recommended payment
            if (effectivePaymentStatus === 'late' || effectivePaymentStatus === 'suspended' || effectivePaymentStatus === 'suspension_recommended') {
                statusColor = '#ef4444';
            }

            // Payout calculation (v4.10.4: use per-group commission_rate)
            const memberCount = group.max_members || group.members_count || 1;
            var groupCustomRate = (group.commission_rate !== null && group.commission_rate !== undefined) ? parseFloat(group.commission_rate) : null;
            const payout = calculatePayoutBreakdown(parseFloat(group.contribution_amount) || 0, memberCount, groupCustomRate);

            // Commission label for card
            var commLabel;
            if (groupCustomRate === null) commLabel = '5%';
            else if (groupCustomRate === 0) commLabel = '0%';
            else commLabel = groupCustomRate + '%';

            // Avatar letter
            var avatarLetter = escapeHtml((group.name || '?').charAt(0).toUpperCase());

            // Frequency label
            var freqLabel = frequencyLabels[group.frequency] || group.frequency || '--';

            // Members display (public cards use active_members if available)
            var memberNum = group.is_public ? (group.active_members || group.member_count || 0) : (group.members_count || group.member_count || 0);
            var membersDisplay = memberNum + '/' + (group.max_members || '?');

            // Role pill colors
            var roleClass = group.my_role === 'creator' ? 'gc-role-creator ds-badge-purple' : group.my_role === 'coordinator' ? 'gc-role-coord ds-badge-green' : 'gc-role-member ds-badge-blue';

            // v4.25.12: Distribution mode label
            var modeLabel = '';
            var dm = group.distribution_mode || 'rotation';
            if (dm === 'lottery') modeLabel = '<span class="gc-role ds-badge-purple" style="font-size:0.6rem;">Loteria</span>';
            else if (dm === 'accumulate') modeLabel = '<span class="gc-role ds-badge-green" style="font-size:0.6rem;">Ahorro</span>';
            else if (dm === 'shares') modeLabel = '<span class="gc-role ds-badge-green" style="font-size:0.6rem;">Inversion</span>';
            else if (dm === 'request') modeLabel = '<span class="gc-role" style="font-size:0.6rem;background:var(--ds-amber);color:#000;">Fondo</span>';

            // Category + location subtitle
            var subParts = [];
            if (group.category) subParts.push(escapeHtml(group.category));
            if (group.location) subParts.push('&#x1F4CD; ' + escapeHtml(group.location));
            var subtitle = subParts.join(' &middot; ');

            // Alerts HTML
            var alertsHtml = '';
            if (group.my_alerts && group.my_alerts.length > 0) {
                alertsHtml = group.my_alerts.map(function(alert) {
                    var sevClass = ({ success: 'gc-alert-success', warning: 'gc-alert-warning', danger: 'gc-alert-danger', info: 'gc-alert-info' })[alert.severity] || 'gc-alert-info';
                    return '<div class="gc-alert ' + sevClass + '">' +
                        '<span class="gc-alert-icon">' + (alertIcons[alert.severity] || '&#8505;') + '</span>' +
                        '<span class="gc-alert-msg">' + escapeHtml(alert.message) + '</span>' +
                        '</div>';
                }).join('');
            }

            // v4.25.4: Payment status info bar (visible to ALL roles)
            var statusInfoHtml = '';
            if (!group.is_public) {
                var psLabels = { 'paid': 'Al dia', 'up_to_date': 'Al dia', 'pending': 'Pendiente', 'late': 'Atrasado', 'mora': 'En Mora', 'suspension_recommended': 'Suspension pendiente', 'suspended': 'Suspendido', 'not_started': 'Sin iniciar' };
                var psColors = { 'paid': 'var(--ds-green)', 'up_to_date': 'var(--ds-green)', 'pending': 'var(--ds-amber)', 'late': 'var(--ds-red)', 'mora': 'var(--ds-red)', 'suspension_recommended': 'var(--ds-red)', 'suspended': '#94a3b8', 'not_started': '#64748b' };
                var psIcons = { 'paid': 'fa-check-circle', 'up_to_date': 'fa-check-circle', 'pending': 'fa-clock', 'late': 'fa-exclamation-triangle', 'mora': 'fa-exclamation-circle', 'suspension_recommended': 'fa-ban', 'suspended': 'fa-ban', 'not_started': 'fa-hourglass-start' };
                var psLabel = psLabels[effectivePaymentStatus] || (effectivePaymentStatus === 'not_started' ? 'Sin iniciar' : 'Pendiente');
                var psColor = psColors[effectivePaymentStatus] || 'var(--ds-amber)';
                var psIcon = psIcons[effectivePaymentStatus] || 'fa-clock';

                statusInfoHtml = '<div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:6px 0;border-top:1px solid rgba(255,255,255,0.04);margin-top:4px;font-size:0.75rem;">';
                // Payment status badge
                statusInfoHtml += '<span style="display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:10px;background:' + psColor + ';color:#000;font-weight:600;font-size:0.68rem;"><i class="fas ' + psIcon + '" style="font-size:0.6rem;"></i> ' + psLabel + '</span>';
                // Turn position + estimated payout
                if (group.my_turn_position || group.my_turn_number) {
                    var turnNum = group.my_turn_position || group.my_turn_number;
                    statusInfoHtml += '<span style="color:var(--ds-text-faint);"><i class="fas fa-sort-numeric-down" style="font-size:0.6rem;"></i> Turno #' + turnNum + '</span>';
                    // v4.25.9: Estimated payout date for member
                    if (group.estimated_payout_label) {
                        if (group.turns_until_mine !== null && group.turns_until_mine <= 0) {
                            statusInfoHtml += '<span style="color:var(--ds-green);font-weight:600;font-size:0.7rem;"><i class="fas fa-gift" style="font-size:0.6rem;"></i> Tu turno!</span>';
                        } else {
                            statusInfoHtml += '<span style="color:var(--ds-cyan);font-size:0.68rem;" title="Fecha estimada de tu cobro"><i class="fas fa-calendar-check" style="font-size:0.55rem;"></i> Cobro: ~' + escapeHtml(group.estimated_payout_label) + '</span>';
                        }
                    }
                }
                // Positions
                if (group.my_num_positions > 1) statusInfoHtml += '<span style="color:var(--ds-cyan);font-size:0.68rem;">' + group.my_num_positions + ' pos.</span>';
                // v4.25.12: Payment window from API (single source of truth)
                var pw = group.payment_window;
                if (pw && pw.isActive) {
                    var dueColor = pw.status === 'overdue' ? 'var(--ds-red)' : (pw.status === 'grace' || pw.daysUntilDue <= 3) ? 'var(--ds-amber)' : 'var(--ds-text-faint)';
                    statusInfoHtml += '<span style="color:' + dueColor + ';"><i class="fas fa-calendar" style="font-size:0.6rem;"></i> ' + escapeHtml(pw.label) + '</span>';
                }
                // Loans indicator (visible to all)
                if (group.active_loans_count > 0) statusInfoHtml += '<span style="color:var(--ds-red);font-size:0.65rem;"><i class="fas fa-hand-holding-usd" style="font-size:0.55rem;"></i> ' + group.active_loans_count + ' prestamo' + (group.active_loans_count > 1 ? 's' : '') + ' en grupo</span>';

                // v4.25.12: Mode-specific indicators
                var mode = group.distribution_mode || 'rotation';
                if (mode === 'lottery') {
                    statusInfoHtml += '<span style="color:var(--ds-purple,#a855f7);font-size:0.68rem;"><i class="fas fa-dice" style="font-size:0.55rem;"></i> Sorteo</span>';
                } else if (mode === 'accumulate') {
                    var poolAmt = parseFloat(group.pool_balance) || 0;
                    statusInfoHtml += '<span style="color:var(--ds-cyan);font-size:0.68rem;"><i class="fas fa-piggy-bank" style="font-size:0.55rem;"></i> Pool: L.' + poolAmt.toLocaleString('es-HN', {minimumFractionDigits:0}) + '</span>';
                } else if (mode === 'shares') {
                    var navVal = parseFloat(group.nav_per_share) || 100;
                    var myShrs = parseFloat(group.my_shares) || 0;
                    statusInfoHtml += '<span style="color:var(--ds-green);font-size:0.68rem;"><i class="fas fa-chart-line" style="font-size:0.55rem;"></i> NAV: L.' + navVal.toFixed(0) + '</span>';
                    if (myShrs > 0) statusInfoHtml += '<span style="color:var(--ds-cyan);font-size:0.68rem;">' + myShrs.toFixed(1) + ' acciones</span>';
                } else if (mode === 'request') {
                    var poolReq = parseFloat(group.pool_balance) || 0;
                    statusInfoHtml += '<span style="color:var(--ds-amber);font-size:0.68rem;"><i class="fas fa-hands-helping" style="font-size:0.55rem;"></i> Fondo: L.' + poolReq.toLocaleString('es-HN', {minimumFractionDigits:0}) + '</span>';
                }
                statusInfoHtml += '</div>';
            }

            // Action buttons (contextual by role)
            var isAdmin = ['creator', 'coordinator', 'admin'].includes(group.my_role);
            var actionsHtml = '<button class="btn btn-primary ds-btn ds-btn-primary" data-action="grp-view-group" data-group-id="' + escapeHtml(group.id) + '"><i class="fas fa-eye" style="margin-right:4px;font-size:0.7rem;"></i>Ver Detalles</button>';
            if (isAdmin) {
                actionsHtml += '<button class="btn btn-secondary ds-btn ds-btn-secondary" data-action="grp-manage-group" data-group-id="' + escapeHtml(group.id) + '"><i class="fas fa-cog" style="margin-right:4px;font-size:0.7rem;"></i>Administrar</button>';
            }

            // Member-specific actions
            if (!isAdmin) {
                actionsHtml += '<button class="btn btn-secondary ds-btn ds-btn-outline" data-action="grp-manage-members" data-group-id="' + escapeHtml(group.id) + '"><i class="fas fa-users" style="margin-right:4px;font-size:0.7rem;"></i>Miembros</button>';
                // v4.25.9: Contact coordinator button for regular members
                if (group.coordinator_name) {
                    var coordTitle = escapeHtml(group.coordinator_name);
                    var coordInfo = group.coordinator_phone ? ' (' + escapeHtml(group.coordinator_phone) + ')' : '';
                    actionsHtml += '<button class="btn btn-secondary ds-btn ds-btn-outline" data-action="grp-contact-coord" data-coord-name="' + coordTitle + '" data-coord-phone="' + (group.coordinator_phone ? escapeHtml(group.coordinator_phone) : '') + '" title="Ver info del coordinador"><i class="fas fa-headset" style="margin-right:4px;font-size:0.7rem;"></i>Coordinador</button>';
                }
                if (effectivePaymentStatus === 'pending' || effectivePaymentStatus === 'late' || effectivePaymentStatus === 'suspension_recommended') {
                    actionsHtml += '<button class="btn pr-request-btn" data-action="grp-request-extension" data-group-id="' + escapeHtml(group.id) + '"><i class="fas fa-clock" style="margin-right:4px;"></i>Solicitar Prorroga</button>';
                }
            }

            // Public group card overrides (discover open groups)
            if (group.is_public) {
                statusColor = '#f59e0b';
                roleClass = 'gc-role-open ds-badge-amber';

                // Creator info with verification badge
                var creatorParts = [];
                if (group.admin_name) {
                    var verifiedIcon = group.admin_verified
                        ? ' <span class="gc-verified" title="Creador verificado">&#10003;</span>'
                        : ' <span class="gc-unverified" title="Correo no verificado">&#9888;</span>';
                    creatorParts.push('Creado por: ' + escapeHtml(group.admin_name) + verifiedIcon);
                }
                subtitle = creatorParts.length > 0 ? creatorParts.join('') : subtitle;

                // Category line below creator
                var catLine = [];
                if (group.category) catLine.push(escapeHtml(group.category));
                if (group.location) catLine.push('&#x1F4CD; ' + escapeHtml(group.location));
                if (catLine.length > 0) {
                    subtitle += '<br><span style="font-size:0.72rem;color:#64748b;">' + catLine.join(' &middot; ') + '</span>';
                }

                // Trust/readiness alerts for public cards
                alertsHtml = '';
                var trustAlerts = [];

                // Start date info
                if (group.start_date) {
                    var sd = new Date(group.start_date.split('T')[0] + 'T12:00:00');
                    var sdLabel = sd.toLocaleDateString('es-HN', { day: 'numeric', month: 'short', year: 'numeric' });
                    var now = new Date();
                    if (sd > now) {
                        trustAlerts.push({ severity: 'info', message: 'Inicia: ' + sdLabel });
                    } else {
                        trustAlerts.push({ severity: 'success', message: 'Activo desde: ' + sdLabel });
                    }
                } else {
                    trustAlerts.push({ severity: 'warning', message: 'Fecha de inicio: Por definir' });
                }

                // Tanda status + cycle warning
                if (group.tanda_status === 'active') {
                    var cc = group.current_cycle || 0;
                    var mm = group.max_members || 1;
                    if (cc > 1) {
                        trustAlerts.push({ severity: 'warning', message: 'Tanda en ciclo ' + cc + ' de ' + mm + ' \u2014 al unirte deberas pagar el ciclo actual' });
                    } else {
                        trustAlerts.push({ severity: 'success', message: 'Tanda en progreso' });
                    }
                } else if (group.tanda_status === 'recruiting') {
                    trustAlerts.push({ severity: 'info', message: 'Reclutando miembros' });
                }

                // Health score alert
                if (group.health_score != null) {
                    var hs = group.health_score;
                    var hsCat, hsColor, hsIcon;
                    if (hs >= 80) { hsCat = 'Saludable'; hsColor = '#22c55e'; hsIcon = '&#9829;'; }
                    else if (hs >= 60) { hsCat = 'Estable'; hsColor = '#f59e0b'; hsIcon = '&#9733;'; }
                    else if (hs >= 40) { hsCat = 'En Riesgo'; hsColor = '#f97316'; hsIcon = '&#9888;'; }
                    else { hsCat = 'Critico'; hsColor = '#ef4444'; hsIcon = '&#10007;'; }
                    trustAlerts.unshift({ severity: hs >= 80 ? 'success' : hs >= 60 ? 'info' : hs >= 40 ? 'warning' : 'danger', message: hsIcon + ' Salud: ' + hs + '/100 (' + hsCat + ')' });
                }

                // Spaces remaining
                var spacesLeft = (group.max_members || 0) - (group.active_members || group.member_count || 0);
                if (spacesLeft <= 0) {
                    trustAlerts.push({ severity: 'danger', message: 'Grupo completo \u2014 sin espacios disponibles' });
                } else if (spacesLeft <= 3) {
                    trustAlerts.push({ severity: 'warning', message: spacesLeft + ' espacio' + (spacesLeft > 1 ? 's' : '') + ' disponible' + (spacesLeft > 1 ? 's' : '') });
                }

                if (trustAlerts.length > 0) {
                    alertsHtml = trustAlerts.map(function(a) {
                        var sevClass = ({ success: 'gc-alert-success', warning: 'gc-alert-warning', danger: 'gc-alert-danger', info: 'gc-alert-info' })[a.severity] || 'gc-alert-info';
                        var icon = ({ success: '&#10003;', warning: '&#9888;', info: '&#8505;' })[a.severity] || '&#8505;';
                        return '<div class="gc-alert ' + sevClass + '"><span class="gc-alert-icon">' + icon + '</span><span class="gc-alert-msg">' + a.message + '</span></div>';
                    }).join('');
                }

                var joinDisabled = spacesLeft <= 0;
                actionsHtml = '<button class="btn btn-secondary ds-btn ds-btn-secondary gc-btn-detail" data-action="grp-public-detail" data-group-id="' + escapeHtml(group.id) + '">Ver Detalles</button>' +
                    '<button class="btn ds-btn gc-btn-join" data-action="grp-join-request" data-group-id="' + escapeHtml(group.id) + '" data-group-name="' + escapeHtml(group.name) + '"' + (joinDisabled ? ' disabled' : '') + '>' + (joinDisabled ? 'Grupo Lleno' : 'Solicitar unirse') + '</button>';
            }

            return '<div class="group-card ds-card" ' + (group.is_public ? 'data-public="true" ' : '') + 'data-group-id="' + escapeHtml(group.id) + '" data-status="' + escapeHtml(st) + '" style="border-color:' + statusColor + '">' +
                '<div class="gc-header">' +
                    '<div class="gc-avatar" style="background:' + statusColor + ';color:' + (st === 'suspended' || st === 'cancelled' ? '#fff' : '#0f172a') + '">' + avatarLetter + '</div>' +
                    '<div class="gc-name">' +
                        '<h3>' + escapeHtml(group.name) + '</h3>' +
                        (subtitle ? '<div class="gc-sub">' + subtitle + '</div>' : '') +
                    '</div>' +
                    '<span class="gc-role ds-badge ' + roleClass + '">' + (roleLabels[group.my_role] || group.my_role) + '</span>' + modeLabel +
                    (group.active_loans_count > 0 ? '<span style="display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:12px;background:rgba(239,68,68,0.15);color:#f87171;font-size:0.68rem;font-weight:600;margin-left:6px;"><i class="fas fa-hand-holding-usd" style="font-size:0.6rem;"></i>' + (isAdmin ? group.active_loans_count + ' deuda' + (group.active_loans_count > 1 ? 's' : '') : 'Deudas activas') + '</span>' : '') +
                    _gcTrustBadge(group) +
                '</div>' +
                (group.description ? '<div class="gc-desc">' + escapeHtml(group.description) + '</div>' : '') +
                '<div class="gc-stats">' +
                    '<div class="gc-stat">' +
                        '<div class="gc-stat-val cyan">' + _gcFmtL(group.contribution_amount) + '</div>' +
                        '<div class="gc-stat-label">Aporte ' + escapeHtml(freqLabel) + '</div>' +
                    '</div>' +
                    '<div class="gc-stat">' +
                        '<div class="gc-stat-val cyan">' + _gcFmtL(payout.user_receives) + '</div>' +
                        '<div class="gc-stat-label">' + (group.is_public ? 'Pool (meta)' : 'Recibes' + ((group.my_num_positions || 1) > 1 ? ' \u00d7 ' + (group.my_num_positions || 1) + ' turnos' : '')) + '</div>' +
                    '</div>' +
                    '<div class="gc-stat">' +
                        '<div class="gc-stat-val">' + escapeHtml(membersDisplay) + '</div>' +
                        '<div class="gc-stat-label">Miembros</div>' +
                    '</div>' +
                    '<div class="gc-stat">' +
                        '<div class="gc-stat-val">' + escapeHtml(commLabel) + '</div>' +
                        '<div class="gc-stat-label">Comision</div>' +
                    '</div>' +
                '</div>' +
                alertsHtml +
                    statusInfoHtml +
                _gcEngagementBar(group) +
                '<div class="gc-actions">' + actionsHtml + '</div>' +
            '</div>';
        }

        // ===== PUBLIC GROUP DETAIL MODAL =====
        async function openPublicGroupDetail(groupId) {
            try {
                var authTk = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') || '';
                var headers = authTk ? { 'Authorization': 'Bearer ' + authTk } : {};
                var res = await fetch(API_BASE + '/api/groups/' + encodeURIComponent(groupId) + '/public-detail', { headers: headers });
                var data = await res.json();
                if (!data.success || !data.data) {
                    showNotification(data.error || 'Error al cargar detalles', 'error');
                    return;
                }
                var d = data.data;
                var g = d.group;
                var c = d.creator;
                var m = d.mora_policy;

                var freqMap = { weekly: 'Semanal', biweekly: 'Quincenal', monthly: 'Mensual' };
                var freqLabel = freqMap[g.frequency] || g.frequency || '--';
                var fillPct = Math.round((g.active_members / g.max_members) * 100);
                var fillColor = fillPct >= 75 ? '#22c55e' : (fillPct >= 40 ? '#f59e0b' : '#64748b');

                // Tanda status badge
                var statusBadge = '';
                if (g.tanda_status === 'active') {
                    statusBadge = '<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;background:rgba(34,197,94,0.15);color:#22c55e;font-size:0.72rem;font-weight:600;">Activa</span>';
                } else if (g.tanda_status === 'recruiting') {
                    statusBadge = '<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;background:rgba(245,158,11,0.15);color:#f59e0b;font-size:0.72rem;font-weight:600;">Reclutando</span>';
                }

                // Start date
                var startLabel = 'Por definir';
                if (g.start_date) {
                    var sd = new Date(g.start_date.split('T')[0] + 'T12:00:00');
                    startLabel = sd.toLocaleDateString('es-HN', { day: 'numeric', month: 'long', year: 'numeric' });
                }

                // Creator time on platform
                var creatorDays = 0;
                if (c.member_since) {
                    creatorDays = Math.floor((Date.now() - new Date(c.member_since).getTime()) / 86400000);
                }
                var creatorTimeLabel = creatorDays < 1 ? 'Hoy' : (creatorDays === 1 ? '1 dia' : creatorDays + ' dias');

                // Verified badge
                var verBadge = c.verified
                    ? '<span style="display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:10px;background:rgba(34,197,94,0.15);color:#22c55e;font-size:0.68rem;font-weight:600;">&#10003; Verificado</span>'
                    : '<span style="display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:10px;background:rgba(245,158,11,0.15);color:#f59e0b;font-size:0.68rem;font-weight:600;">&#9888; No verificado</span>';

                // Members list
                var roleLabels = { creator: 'Creador', coordinator: 'Coordinador', member: 'Miembro' };
                var membersHtml = d.members.map(function(mb) {
                    var initial = (mb.name || '?').charAt(0).toUpperCase();
                    var roleLabel = roleLabels[mb.role] || mb.role;
                    var roleColor = mb.role === 'creator' ? '#a78bfa' : (mb.role === 'coordinator' ? '#00FFFF' : '#64748b');
                    return '<div style="display:flex;align-items:center;gap:10px;padding:6px 0;">' +
                        '<div style="width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;font-size:0.72rem;color:#94a3b8;font-weight:600;">' + escapeHtml(initial) + '</div>' +
                        '<div style="flex:1;"><div style="font-size:0.8rem;color:#e2e8f0;">' + escapeHtml(mb.name) + '</div></div>' +
                        '<span style="font-size:0.68rem;color:' + roleColor + ';">' + escapeHtml(roleLabel) + '</span>' +
                    '</div>';
                }).join('');

                // Build modal
                var _row = function(label, value, valueColor) {
                    return '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04);">' +
                        '<span style="font-size:0.78rem;color:#64748b;">' + label + '</span>' +
                        '<span style="font-size:0.78rem;color:' + (valueColor || '#e2e8f0') + ';font-weight:600;">' + value + '</span></div>';
                };
                var _section = function(icon, title) {
                    return '<div style="display:flex;align-items:center;gap:6px;margin:16px 0 8px;"><span style="font-size:0.85rem;">' + icon + '</span><span style="font-size:0.75rem;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">' + title + '</span></div>';
                };

                var modalHtml = '<div id="publicDetailOverlay" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);backdrop-filter:blur(4px);z-index:100000;display:flex;align-items:center;justify-content:center;padding:16px;">' +
                    '<div style="background:#0f172a;border:1px solid rgba(0,255,255,0.15);border-radius:16px;max-width:420px;width:100%;max-height:85vh;overflow:hidden;box-shadow:0 25px 50px rgba(0,0,0,0.5);display:flex;flex-direction:column;">' +

                        // Header
                        '<div style="background:linear-gradient(135deg,rgba(245,158,11,0.15),rgba(245,158,11,0.05));padding:20px;border-bottom:1px solid rgba(245,158,11,0.1);position:relative;">' +
                            '<div style="display:flex;align-items:center;gap:12px;">' +
                                '<div style="width:44px;height:44px;border-radius:12px;background:#f59e0b;display:flex;align-items:center;justify-content:center;font-size:1.2rem;font-weight:700;color:#0f172a;">' + escapeHtml((g.name || '?').charAt(0).toUpperCase()) + '</div>' +
                                '<div style="flex:1;">' +
                                    '<h3 style="margin:0;font-size:1.15rem;font-weight:600;color:#f8fafc;">' + escapeHtml(g.name) + '</h3>' +
                                    '<div style="display:flex;align-items:center;gap:8px;margin-top:4px;">' + statusBadge +
                                        '<span style="font-size:0.72rem;color:#64748b;">' + escapeHtml(g.category || '') + '</span>' +
                                    '</div>' +
                                '</div>' +
                            '</div>' +
                            '<button data-action="grp-close-public-detail" style="position:absolute;top:14px;right:14px;background:rgba(255,255,255,0.1);border:none;width:30px;height:30px;border-radius:8px;color:#94a3b8;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:1rem;">&times;</button>' +
                        '</div>' +

                        // Body (scrollable)
                        '<div style="padding:16px;overflow-y:auto;flex:1;">' +

                            // Description
                            (g.description ? '<p style="margin:0 0 12px;font-size:0.82rem;color:#94a3b8;line-height:1.4;">' + escapeHtml(g.description) + '</p>' : '') +

                            // Creator section (v4.16.12: Trust profile)
                            _section('&#x1F464;', 'Creador') +
                            (function() {
                                // Credit score badge
                                var scoreHtml = '';
                                if (c.credit_score) {
                                    // has score — shown below
                                } else {
                                    scoreHtml = '<div class="gc-trust-score" style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:rgba(100,116,139,0.08);border:1px solid rgba(100,116,139,0.15);border-radius:8px;margin-bottom:8px;">' +
                                        '<div style="width:36px;height:36px;border-radius:50%;background:rgba(100,116,139,0.15);display:flex;align-items:center;justify-content:center;"><i class="fas fa-shield-alt" style="color:#64748b;font-size:0.9rem;"></i></div>' +
                                        '<div style="flex:1;"><div style="font-size:1rem;font-weight:700;color:#64748b;">--</div><div style="font-size:0.65rem;color:#64748b;text-transform:uppercase;letter-spacing:0.04em;">Sin puntaje aun</div></div>' +
                                    '</div>';
                                }
                                if (c.credit_score) {
                                    var sColor = '#64748b';
                                    var sCat = c.credit_category || '';
                                    if (sCat === 'excelente') sColor = '#22c55e';
                                    else if (sCat === 'bueno') sColor = '#3b82f6';
                                    else if (sCat === 'regular') sColor = '#f59e0b';
                                    else if (sCat === 'riesgo') sColor = '#ef4444';
                                    var sCatLabel = { excelente: 'Excelente', bueno: 'Bueno', regular: 'Regular', riesgo: 'Riesgo' }[sCat] || '';
                                    scoreHtml = '<div class="gc-trust-score" style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:rgba(' + (sCat === 'excelente' ? '34,197,94' : sCat === 'bueno' ? '59,130,246' : sCat === 'regular' ? '245,158,11' : '239,68,68') + ',0.08);border:1px solid rgba(' + (sCat === 'excelente' ? '34,197,94' : sCat === 'bueno' ? '59,130,246' : sCat === 'regular' ? '245,158,11' : '239,68,68') + ',0.15);border-radius:8px;margin-bottom:8px;">' +
                                        '<div style="width:36px;height:36px;border-radius:50%;background:rgba(' + (sCat === 'excelente' ? '34,197,94' : sCat === 'bueno' ? '59,130,246' : sCat === 'regular' ? '245,158,11' : '239,68,68') + ',0.15);display:flex;align-items:center;justify-content:center;"><i class="fas fa-shield-alt" style="color:' + sColor + ';font-size:0.9rem;"></i></div>' +
                                        '<div style="flex:1;"><div style="font-size:1rem;font-weight:700;color:' + sColor + ';">' + c.credit_score + '</div><div style="font-size:0.65rem;color:#64748b;text-transform:uppercase;letter-spacing:0.04em;">' + sCatLabel + '</div></div>' +
                                    '</div>';
                                }

                                // Stats row (always visible to motivate growth)
                                var punctColor = c.punctuality_rate !== null ? (c.punctuality_rate >= 80 ? '#22c55e' : c.punctuality_rate >= 60 ? '#f59e0b' : '#ef4444') : '#64748b';
                                var punctVal = c.punctuality_rate !== null ? c.punctuality_rate + '%' : '--';
                                var statsHtml = '<div class="gc-trust-stats">' +
                                    '<div class="gc-trust-stat"><div class="gc-trust-stat-val">' + (c.completed_tandas || 0) + '</div><div class="gc-trust-stat-lbl">Completadas</div></div>' +
                                    '<div class="gc-trust-stat"><div class="gc-trust-stat-val" style="color:' + punctColor + ';">' + punctVal + '</div><div class="gc-trust-stat-lbl">Puntualidad</div></div>' +
                                    '<div class="gc-trust-stat"><div class="gc-trust-stat-val">' + (c.achievements_count || 0) + '</div><div class="gc-trust-stat-lbl">Logros</div></div>' +
                                    '<div class="gc-trust-stat"><div class="gc-trust-stat-val">' + (c.followers || 0) + '</div><div class="gc-trust-stat-lbl">Seguidores</div></div>' +
                                '</div>';

                                // Profile link (always show, fallback to name display)
                                var profileLink = c.handle ? '<a href="/perfil/' + escapeHtml(c.handle) + '" class="gc-trust-profile-link"><i class="fas fa-external-link-alt"></i> Ver perfil completo</a>' : '<span class="gc-trust-profile-link" style="color:#64748b;cursor:default;"><i class="fas fa-user-circle"></i> Perfil no configurado</span>';

                                return '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:12px;">' +
                                    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
                                        '<span style="font-size:0.85rem;color:#e2e8f0;font-weight:500;">' + escapeHtml(c.name) + '</span>' +
                                        verBadge +
                                    '</div>' +
                                    '<div style="display:flex;gap:16px;margin-bottom:' + (scoreHtml || statsHtml ? '10' : '0') + 'px;">' +
                                        '<span style="font-size:0.72rem;color:#64748b;">En La Tanda: ' + escapeHtml(creatorTimeLabel) + '</span>' +
                                        '<span style="font-size:0.72rem;color:#64748b;">Grupos activos: ' + c.active_groups + '</span>' +
                                    '</div>' +
                                    scoreHtml +
                                    statsHtml +
                                    profileLink +
                                '</div>';
                            })() +

                            // Financial terms
                            _section('&#x1F4B0;', 'Terminos Financieros') +
                            '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:12px;">' +
                                _row('Aporte', (window.ltFormatCurrency ? ltFormatCurrency(g.contribution_amount) : 'L. ' + g.contribution_amount.toLocaleString('es-HN')) + ' ' + escapeHtml(freqLabel), '#00FFFF') +
                                _row('Pool por turno (meta)', (window.ltFormatCurrency ? ltFormatCurrency(Math.round(g.pool_meta)) : 'L. ' + Math.round(g.pool_meta).toLocaleString('es-HN')), '#22c55e') +
                                _row('Comision', g.commission_rate + '%', '#f59e0b') +
                                _row('Periodo de gracia', g.grace_period + ' dias') +
                            '</div>' +

                            // Mora policy
                            _section('&#x26A0;', 'Politica de Mora') +
                            '<div style="background:rgba(248,113,113,0.05);border:1px solid rgba(248,113,113,0.1);border-radius:10px;padding:12px;">' +
                                _row('Interes anual', m.interest_rate + '%', '#f87171') +
                                _row('Auto-suspension', 'Despues de ' + m.max_cycles + ' ciclos', '#f87171') +
                                _row('Gracia prestamo', m.loan_grace_days + ' dias') +
                                '<div style="margin-top:8px;font-size:0.7rem;color:#64748b;line-height:1.3;">Pagos atrasados generan un prestamo formal con interes. Despues de ' + m.max_cycles + ' ciclos consecutivos en mora, el miembro es suspendido automaticamente.</div>' +
                            '</div>' +

                            // Members progress
                            _section('&#x1F465;', 'Miembros (' + g.active_members + '/' + g.max_members + ')') +
                            '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:12px;">' +
                                '<div style="height:6px;background:rgba(255,255,255,0.08);border-radius:4px;overflow:hidden;margin-bottom:10px;">' +
                                    '<div style="height:100%;width:' + fillPct + '%;background:' + fillColor + ';border-radius:4px;transition:width 0.5s;"></div>' +
                                '</div>' +
                                membersHtml +
                            '</div>' +

                            // Start date & cycle
                            _section('&#x1F4C5;', 'Calendario') +
                            '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:12px;">' +
                                _row('Fecha de inicio', escapeHtml(startLabel)) +
                                _row('Ciclo actual', g.current_cycle > 0 ? 'Ciclo ' + g.current_cycle : 'No iniciado') +
                                _row('Frecuencia', escapeHtml(freqLabel)) +
                            '</div>' +
                            (g.tanda_status === 'active' && g.current_cycle > 1 ? '<div style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.2);border-radius:10px;padding:10px 12px;margin-top:8px;"><div style="color:#fbbf24;font-size:0.72rem;font-weight:600;margin-bottom:3px;"><i class="fas fa-exclamation-triangle" style="margin-right:4px;"></i>Tanda en curso</div><div style="color:#94a3b8;font-size:0.72rem;">Esta tanda ya va en el ciclo ' + g.current_cycle + '. Al unirte deberas pagar el ciclo actual de inmediato.</div></div>' : '') +

                        '</div>' +

                        // CTA footer
                        '<div style="padding:16px;border-top:1px solid rgba(255,255,255,0.08);background:rgba(0,0,0,0.2);">' +
                            '<button data-action="grp-join-from-detail" data-group-id="' + escapeHtml(g.id) + '" data-group-name="' + escapeHtml(g.name) + '" style="width:100%;padding:12px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#0f172a;border:none;border-radius:10px;font-size:0.9rem;font-weight:700;cursor:pointer;">Solicitar Unirse</button>' +
                        '</div>' +

                    '</div>' +
                '</div>';

                // Remove existing if any
                var existing = document.getElementById('publicDetailOverlay');
                if (existing) existing.remove();

                document.body.insertAdjacentHTML('beforeend', modalHtml); if(window.lockBodyScroll)window.lockBodyScroll();

                // Close handlers
                var overlay = document.getElementById('publicDetailOverlay');
                overlay.addEventListener('click', function(e) {
                    if (e.target === overlay) { overlay.remove(); if(window.unlockBodyScroll)window.unlockBodyScroll(); }
                    var actionBtn = e.target.closest('[data-action]');
                    if (!actionBtn) return;
                    var action = actionBtn.getAttribute('data-action');
                    if (action === 'grp-close-public-detail') {
                        overlay.remove();
                    } else if (action === 'grp-join-from-detail') {
                        var joinGid = actionBtn.getAttribute('data-group-id');
                        var joinName = actionBtn.getAttribute('data-group-name') || 'este grupo';
                        overlay.remove();
                        // Direct join with terms confirmation (replaces fragile DOM click delegation)
                        var joinGroup = (window.publicGroupsData || []).find(function(pg) { return pg.id === joinGid; });
                        var termsHtml = '';
                        if (joinGroup) {
                            var fqMap = { weekly: 'Semanal', biweekly: 'Quincenal', monthly: 'Mensual' };
                            var fq = fqMap[joinGroup.frequency] || joinGroup.frequency || '--';
                            var cAmt = parseFloat(joinGroup.contribution_amount || 0);
                            var cr = joinGroup.commission_rate;
                            var crText = cr === null || cr === undefined ? '5%' : (cr === 0 ? 'Sin comision' : cr + '%');
                            var cwHtml = '';
                            if (joinGroup.tanda_status === 'active' && (joinGroup.current_cycle || 0) > 1) {
                                cwHtml = '<div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:8px 10px;margin:8px 0 4px;">' +
                                    '<div style="color:#92400e;font-size:0.72rem;font-weight:600;"><i class="fas fa-exclamation-triangle" style="margin-right:4px;"></i>Tanda en curso (Ciclo ' + (joinGroup.current_cycle || 0) + ')</div>' +
                                    '<div style="color:#92400e;font-size:0.7rem;margin-top:2px;">Al unirte deberas pagar el ciclo actual. Aporte inmediato: ' + (window.ltFormatCurrency ? ltFormatCurrency(cAmt) : 'L. ' + cAmt.toLocaleString('es-HN')) + '</div>' +
                                '</div>';
                            }
                            termsHtml = '<div style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:10px;padding:10px 12px;margin:12px 0 8px;text-align:left;">' +
                                '<div style="color:#475569;font-size:0.75rem;font-weight:600;margin-bottom:6px;">Terminos del Grupo</div>' +
                                '<div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span style="color:#64748b;font-size:0.78rem;">Aporte</span><span style="color:#1e293b;font-size:0.78rem;font-weight:600;">L. ' + cAmt.toLocaleString('es-HN') + ' ' + escapeHtml(fq) + '</span></div>' +
                                '<div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span style="color:#64748b;font-size:0.78rem;">Comision</span><span style="color:#1e293b;font-size:0.78rem;font-weight:600;">' + escapeHtml(crText) + '</span></div>' +
                                '<div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span style="color:#64748b;font-size:0.78rem;">Miembros</span><span style="color:#1e293b;font-size:0.78rem;font-weight:600;">' + (joinGroup.members_count || joinGroup.member_count || '?') + '/' + (joinGroup.max_members || '?') + '</span></div>' +
                            '</div>';
                            termsHtml += cwHtml;
                            termsHtml += '<div style="margin-top:10px;text-align:left;"><label style="color:#475569;font-size:0.75rem;font-weight:600;display:block;margin-bottom:4px;">Mensaje para el coordinador <span style="font-weight:400;color:#94a3b8;">(opcional)</span></label><textarea id="join-message-input" maxlength="500" rows="2" placeholder="Ej: Me interesa ahorrar para..." style="width:100%;padding:8px 10px;border:1px solid #e2e8f0;border-radius:8px;font-size:0.78rem;resize:vertical;background:#f8fafc;color:#1e293b;font-family:inherit;box-sizing:border-box;"></textarea></div>';
                        }
                        showConfirm('Deseas solicitar unirte a ' + escapeHtml(joinName) + '?' + termsHtml, function() {
                            var joinMessage = (document.getElementById('join-message-input') || {}).value || '';
                            var authTk = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') || '';
                            fetch(API_BASE + '/api/groups/' + encodeURIComponent(joinGid) + '/join-pg', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + authTk },
                                body: JSON.stringify({ join_message: joinMessage.trim() || undefined })
                            })
                            .then(function(r) { return r.json(); })
                            .then(function(result) {
                                if (result.success && result.data && result.data.action === 'placeholder_claim_needed') {
                                    // Show placeholder claim modal
                                    var phs = result.data.placeholders || [];
                                    var phHtml = '<div style="margin-bottom:12px;color:#64748b;font-size:0.85rem;">' +
                                        'El coordinador ya pre-registro algunos miembros. Si tu nombre aparece abajo, seleccionalo para vincular tu cuenta:</div>';
                                    phHtml += '<div style="display:flex;flex-direction:column;gap:8px;">';
                                    for (var pi = 0; pi < phs.length; pi++) {
                                        phHtml += '<button class="ds-btn" style="text-align:left;padding:10px 14px;" ' +
                                            'data-action="claim-placeholder" data-ph-id="' + escapeHtml(phs[pi].placeholder_id) + '" ' +
                                            'data-join-gid="' + escapeHtml(joinGid) + '">' +
                                            '<i class="fas fa-user" style="margin-right:8px;color:var(--ds-primary);"></i>' +
                                            escapeHtml(phs[pi].name) + '</button>';
                                    }
                                    phHtml += '<button class="ds-btn" style="text-align:left;padding:10px 14px;opacity:0.6;" ' +
                                        'data-action="skip-placeholder-claim" data-join-gid="' + escapeHtml(joinGid) + '">' +
                                        '<i class="fas fa-user-plus" style="margin-right:8px;"></i>Ninguno soy yo — solicitar como nuevo</button>';
                                    phHtml += '</div>';
                                    showConfirm(phHtml, null, { title: 'Miembros pre-registrados', hideButtons: true });
                                } else if (result.success) {
                                    var msg = result.data && result.data.merged_placeholder
                                        ? (result.data.message || 'Tu lugar pre-asignado fue vinculado a tu cuenta.')
                                        : result.data && result.data.auto_approved
                                            ? 'Te has unido a ' + escapeHtml(joinName)
                                            : 'Solicitud enviada a ' + escapeHtml(joinName) + '. El administrador la revisara';
                                    showNotification(msg, 'success');
                                    window.publicGroupsData = (window.publicGroupsData || []).filter(function(pg) { return pg.id !== joinGid; });
                                    fetchMyGroups();
                                } else {
                                    showNotification(result.error || 'Error al solicitar ingreso', 'error');
                                }
                            })
                            .catch(function() { showNotification(t('messages.connection_error',{defaultValue:'Error de conexion'}), 'error'); });
                        });
                    }
                });

            } catch(e) {
                console.error('Public detail error:', e);
                showNotification('Error al cargar detalles del grupo', 'error');
            }
        }

        // ===== FILTERS (SIMPLIFIED) =====
        function applyFilters() {
            const roleFilter = document.getElementById('filterRole') ? document.getElementById('filterRole').value : 'all';
            const paymentFilter = document.getElementById('filterPayment') ? document.getElementById('filterPayment').value : 'all';
            const searchTerm = document.getElementById('searchGroups') ? document.getElementById('searchGroups').value.toLowerCase() : '';

            filteredGroups = allGroups.filter(group => {
                const matchesRole = roleFilter === 'all' || (group.my_role && group.my_role === roleFilter);
                const matchesPayment = paymentFilter === 'all' || (group.my_payment_status && group.my_payment_status === paymentFilter);
                const matchesSearch = !searchTerm || (group.name && group.name.toLowerCase().includes(searchTerm));

                return matchesRole && matchesPayment && matchesSearch;
            });

            // Append public groups only when both filters are "Todos"
            if (roleFilter === 'all' && paymentFilter === 'all') {
                var pubSortBy = document.getElementById('sortPublicGroups') ? document.getElementById('sortPublicGroups').value : 'health';
                var pubGroups = (window.publicGroupsData || []).filter(function(g) {
                    return !searchTerm || (g.name && g.name.toLowerCase().includes(searchTerm));
                });
                // Sort public groups
                if (pubSortBy === 'health') {
                    pubGroups.sort(function(a, b) { return (b.health_score || 0) - (a.health_score || 0); });
                } else if (pubSortBy === 'newest') {
                    pubGroups.sort(function(a, b) { return new Date(b.created_at) - new Date(a.created_at); });
                } else if (pubSortBy === 'members') {
                    pubGroups.sort(function(a, b) { return (b.active_members || b.member_count || 0) - (a.active_members || a.member_count || 0); });
                } else if (pubSortBy === 'amount_low') {
                    pubGroups.sort(function(a, b) { return parseFloat(a.contribution_amount || 0) - parseFloat(b.contribution_amount || 0); });
                }
                if (pubGroups.length > 0) {
                    filteredGroups = filteredGroups.concat(pubGroups);
                }
            }

            renderGroups();

                    // Also refresh tandas tab to sync turn positions
                    if (typeof refreshTandas === 'function') {
                        refreshTandas();
                    }
        }


        // Sort dropdown for public groups (ALG-01 T3)
        document.addEventListener('change', function(e) {
            if (e.target && e.target.id === 'sortPublicGroups') {
                applyFilters();
            }
        });
        function resetFilters() {
            document.getElementById('filterRole').value = 'all';
            document.getElementById('filterPayment').value = 'all';
            document.getElementById('searchGroups').value = '';
            filteredGroups = [...allGroups];
            renderGroups();

                    // Also refresh tandas tab to sync turn positions
                    if (typeof refreshTandas === 'function') {
                        refreshTandas();
                    }
        }

        // ===== ACTIONS =====
        // v4.25.5: Old viewGroup removed — replaced by modal in window.viewGroup
        function viewGroup(groupId) {
            if (typeof window.viewGroup === 'function') {
                window.viewGroup(groupId);
            }
        }

        function registerPayment(groupId) {

            // Check if payment integration manager exists
            if (window.paymentIntegrationManager) {
                const group = allGroups.find(g => g.id === groupId);
                if (group) {
                    // Open payment modal with group context
                    window.paymentIntegrationManager.openPaymentModal({
                        groupId: groupId,
                        amount: group.contribution_amount,
                        currency: 'HNL',
                        description: `Pago para ${escapeHtml(group.name)}`,
                        metadata: {
                            group_name: group.name,
                            payment_type: 'contribution'
                        }
                    });
                } else {
                    showError('Grupo no encontrado');
                }
            } else {
                // Fallback: navigate to payment page with group ID
                window.location.href = `/payment.html?group_id=${groupId}`;
            }
        }

        function handleAlertAction(groupId, actionUrl, alertType) {

            // Handle different action types
            switch (alertType) {
                case 'payment_due':
                case 'payment_overdue':
                    // Open payment registration
                    registerPayment(groupId);
                    break;

                case 'turn_upcoming':
                case 'your_turn_now':
                case 'can_advance_turn':
                    // Navigate to group details to see turn calendar
                    viewGroup(groupId);
                    break;

                case 'pending_approvals':
                    // Navigate to gestionar for admin actions
                    window.location.href = '/gestionar/' + encodeURIComponent(groupId) + '?tab=pagos';
                    break;

                case 'late_members':
                    // Navigate to gestionar members tab
                    window.location.href = '/gestionar/' + encodeURIComponent(groupId) + '?tab=miembros';
                    break;

                default:
                    // Generic navigation to action URL
                    if (actionUrl) {
                        if (actionUrl.startsWith('/') || actionUrl.startsWith('http')) {
                            window.location.href = actionUrl;
                        } else {
                            viewGroup(groupId);
                        }
                    }
            }
        }

        function getActionLabel(alertType) {
            const labels = {
                'payment_due': 'Pagar',
                'payment_overdue': 'Pagar Ahora',
                'turn_upcoming': 'Ver Calendario',
                'your_turn_now': 'Ver Estado',
                'pending_approvals': 'Aprobar',
                'can_advance_turn': 'Avanzar',
                'late_members': 'Ver Lista'
            };
            return labels[alertType] || 'Acción';
        }

        // ===== HIGHLIGHTING DE GRUPO RECIÉN CREADO =====
        function highlightNewGroup(groupId) {

            setTimeout(() => {
                // Find the group card by data attribute
                const groupCard = document.querySelector(`[data-group-id="${groupId}"]`);

                if (groupCard) {
                    // Add highlight class
                    groupCard.classList.add('newly-created');

                    // Scroll into view
                    groupCard.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });


                    // Remove highlight after 4 seconds
                    setTimeout(() => {
                        groupCard.classList.remove('newly-created');
                    }, 4000);
                } else {
                }
            }, 800); // Delay to ensure cards are rendered
        }

        // ===== UTILITIES =====
        function formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-HN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
        // ============================================
        // DATE HELPERS - Parse dates safely
        // ============================================
        
        // Parse date safely, avoiding timezone issues with DATE-only strings
        function parseDateLocal(dateString) {
            if (!dateString) return null;
            // If it is a DATE string (YYYY-MM-DD without time), add T00:00:00 to parse as local
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
                return new Date(dateString + "T00:00:00");
            }
            // Otherwise parse normally (includes timestamp)
            return new Date(dateString);
        }

        function formatDateLocal(dateString) {
            var date = parseDateLocal(dateString);
            if (!date || isNaN(date)) return "";
            return date.toLocaleDateString("es-HN", {
                year: "numeric",
                month: "short",
                day: "numeric"
            });
        }



        // =====================================================================
        // POSITION ASSIGNMENT COMPONENT
        // =====================================================================
// =====================================================================
// POSITION ASSIGNMENT COMPONENT FOR COORDINATORS
// To be integrated into groups-advanced-system.html
// =====================================================================

// ===== POSITION ASSIGNMENT RENDERING =====

/**
 * Renders the position assignment section for a group in awaiting_positions status
 * This appears inside the group card for coordinators
 */
function renderPositionAssignmentSection(group) {
    if (group.status !== 'awaiting_positions') {
        return ''; // Only show for groups in position assignment phase
    }

    // Only show for creators/coordinators
    if (group.my_role !== 'creator' && group.my_role !== 'coordinator') {
        return '';
    }

    const positions = group.positions || [];
    const positionRequests = group.position_requests || [];
    const pendingRequests = positionRequests.filter(r => r.status === 'pending');
    const assignedCount = positions.filter(p => p.status === 'confirmed').length;
    const totalPositions = group.participant_count || group.max_members;
    const isComplete = assignedCount === totalPositions;

    return `
        <div class="position-assignment-section">
            <div class="position-header">
                <h4>📍 Asignación de Posiciones</h4>
                <div class="position-progress">
                    <span class="progress-text">${assignedCount}/${totalPositions} asignadas</span>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${(assignedCount / totalPositions) * 100}%"></div>
                    </div>
                </div>
            </div>



            <div class="positions-grid-section">
                <h5>🎯 Estado de Posiciones</h5>
                <div class="positions-grid">
                    ${Array.from({ length: totalPositions }, (_, i) => {
                        const posNum = i + 1;
                        const pos = positions.find(p => p.position === posNum);
                        return renderPositionCell(posNum, pos, group.id);
                    }).join('')}
                </div>
            </div>

            <div class="position-actions">
                ${!isComplete ? `
                    <button class="btn btn-secondary btn-sm" data-action="grp-auto-assign-random" data-group-id="${group.id}">
                        🎲 Asignar Aleatorio
                    </button>
                    <button class="btn btn-secondary btn-sm" data-action="grp-auto-assign-order" data-group-id="${group.id}">
                        📋 Asignar por Orden
                    </button>
                ` : ''}

                ${isComplete ? `
                    <button class="btn btn-primary" data-action="grp-activate-tanda" data-group-id="${group.id}">
                        ✅ Activar Grupo
                    </button>
                ` : `
                    <button class="btn btn-disabled" disabled>
                        🔒 Completa asignaciones para activar
                    </button>
                `}
            </div>
        </div>
    `;
}

/**
 * Renders individual request card with approve/reject actions
 */
function renderRequestCard(request, groupId) {
    return `
        <div class="request-card" data-request-id="${request.id}">
            <div class="request-info">
                <div class="request-user">
                    <strong>${escapeHtml(request.user_name || request.user_id)}</strong>
                    <span class="request-position-badge">Posición #${request.requested_position}</span>
                </div>
                ${request.reason ? `
                    <div class="request-reason">
                        <em>"${escapeHtml(request.reason)}"</em>
                    </div>
                ` : ''}
                <div class="request-date">
                    ${formatRequestDate(request.created_at)}
                </div>
            </div>
            <div class="request-actions">
                <button class="btn btn-success btn-sm" data-action="grp-approve-position" data-group-id="${groupId}" data-request-id="${request.id}">
                    ✓ Aprobar
                </button>
                <button class="btn btn-danger btn-sm" data-action="grp-reject-position" data-group-id="${groupId}" data-request-id="${request.id}">
                    ✕ Rechazar
                </button>
            </div>
        </div>
    `;
}

/**
 * Renders individual position cell in the grid
 */
function renderPositionCell(positionNumber, positionData, groupId) {
    if (!positionData || positionData.status !== 'confirmed') {
        // Available position
        return `
            <div class="position-cell available" data-action="grp-open-manual-assign" data-group-id="${groupId}" data-position="${positionNumber}">
                <div class="position-number">${positionNumber}</div>
                <div class="position-status">Disponible</div>
            </div>
        `;
    }

    // Assigned position
    const assignmentTypeLabel = {
        'approved': '✓ Aprobada',
        'manual': '✍ Manual',
        'random': '🎲 Aleatoria',
        'auto': '⚡ Auto'
    }[positionData.assignment_type] || 'Asignada';

    return `
        <div class="position-cell assigned ${positionData.assignment_type}">
            <div class="position-number">${positionNumber}</div>
            <div class="position-user">${escapeHtml(positionData.user_name || positionData.user_id)}</div>
            <div class="position-type">${assignmentTypeLabel}</div>
        </div>
    `;
}

// ===== API INTERACTION FUNCTIONS =====

/**
 * Approve a position request
 */
async function approvePositionRequest(groupId, requestId) {
    try {
        showLoading('Aprobando solicitud...');

        const response = await fetch(`${API_BASE}/api/groups/approve-position-request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify({
                request_id: requestId,
                group_id: groupId,
                // approved_by removed (server uses JWT)
            })
        });

        const data = await response.json();
        hideLoading();

        if (data.success) {
            showNotification('✅ Solicitud aprobada exitosamente', 'success');
            await fetchMyGroups(); // Reload groups to show updated state
        } else {
            showNotification('No se pudo aprobar la solicitud', 'error');
        }
    } catch (error) {
        hideLoading();
        showNotification(t('messages.connection_error',{defaultValue:'Error de conexión'}), 'error');
    }
}

/**
 * Open modal to reject request with reason
 */
function openRejectModal(groupId, requestId) {
    const modal = document.getElementById('rejectModal') || createRejectModal();
    modal.dataset.groupId = groupId;
    modal.dataset.requestId = requestId;
    modal.style.display = 'flex'; modal.classList.add('active');
}

/**
 * Reject a position request with reason
 */
async function rejectPositionRequest(groupId, requestId, reason) {
    try {
        showLoading('Rechazando solicitud...');

        const response = await fetch(`${API_BASE}/api/groups/reject-position-request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify({
                request_id: requestId,
                group_id: groupId,
                // rejected_by removed (server uses JWT)
                reason: reason
            })
        });

        const data = await response.json();
        hideLoading();

        if (data.success) {
            showNotification('✅ Solicitud rechazada', 'success');
            closeRejectModal();
            await fetchMyGroups();
        } else {
            showNotification('No se pudo rechazar la solicitud', 'error');
        }
    } catch (error) {
        hideLoading();
        showNotification(t('messages.connection_error',{defaultValue:'Error de conexión'}), 'error');
    }
}

/**
 * Open modal to manually assign position to a user
 */
function openManualAssignModal(groupId, positionNumber) {
    const modal = document.getElementById('manualAssignModal') || createManualAssignModal();
    modal.dataset.groupId = groupId;
    modal.dataset.positionNumber = positionNumber;
    modal.style.display = 'flex'; modal.classList.add('active');

    // Load users without positions for this group
    loadUsersWithoutPositions(groupId);
}

/**
 * Manually assign position to user
 */
async function assignPositionManually(groupId, positionNumber, userId, userName) {
    try {
        showLoading('Asignando posición...');

        const response = await fetch(`${API_BASE}/api/groups/assign-position-manually`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify({
                group_id: groupId,
                user_id: userId,
                user_name: userName,
                position: positionNumber
            })
        });

        const data = await response.json();
        hideLoading();

        if (data.success) {
            showNotification('✅ Posición asignada exitosamente', 'success');
            closeManualAssignModal();
            await fetchMyGroups();
        } else {
            showNotification('No se pudo asignar la posicion', 'error');
        }
    } catch (error) {
        hideLoading();
        showNotification(t('messages.connection_error',{defaultValue:'Error de conexión'}), 'error');
    }
}

/**
 * Auto-assign all remaining positions
 */
async function autoAssignPositions(groupId, method = 'random') {
    showConfirm('Asignar automaticamente las posiciones restantes por metodo ' + (method === 'random' ? 'aleatorio' : 'de orden de ingreso') + '?', async function() {
    try {
        showLoading('Asignando posiciones automáticamente...');

        const response = await fetch(`${API_BASE}/api/groups/auto-assign-positions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify({
                group_id: groupId,
                method: method,
                // assigned_by removed (server uses JWT)
            })
        });

        const data = await response.json();
        hideLoading();

        if (data.success) {
            showNotification(`✅ ${data.data.assigned_count} posiciones asignadas`, 'success');
            await fetchMyGroups();
        } else {
            showNotification('No se pudo auto-asignar las posiciones', 'error');
        }
    } catch (error) {
        hideLoading();
        showNotification(t('messages.connection_error',{defaultValue:'Error de conexion'}), 'error');
    }
    }); // end showConfirm
}

/**
 * Activate tanda after all positions assigned
 */
async function activateTanda(groupId) {
    // Check if lottery was executed
    const group = window.currentGroupsData ? window.currentGroupsData.find(g => g.id === groupId || g.group_id === groupId) : null;
    const lotteryExecuted = group ? group.lottery_executed : false;

    let confirmMessage = '¿Activar este grupo? Se generará el calendario de pagos y comenzará el ciclo.';

    if (!lotteryExecuted) {
        confirmMessage = '⚠️ ADVERTENCIA: La tómbola NO se ha ejecutado.\n\n' +
            'Las posiciones actuales de turno serán usadas tal como están.\n\n' +
            '¿Deseas continuar sin sortear las posiciones?';
    }

    showConfirm(confirmMessage, async function() {
    try {
        showLoading('Activando grupo...');

        const response = await fetch(`${API_BASE}/api/groups/activate-tanda`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify({
                group_id: groupId,
                // activated_by removed (server uses JWT)
            })
        });

        const data = await response.json();
        hideLoading();

        if (data.success) {
            showNotification('✅ ¡Grupo activado exitosamente! El ciclo ha comenzado.', 'success');
            await fetchMyGroups();
        } else {
            showNotification('No se pudo activar el grupo', 'error');
        }
    } catch (error) {
        hideLoading();
        showNotification(t('messages.connection_error',{defaultValue:'Error de conexion'}), 'error');
    }
    }); // end showConfirm
}

// ===== HELPER FUNCTIONS =====

function formatRequestDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;

    return date.toLocaleDateString();
}

function showLoading(message = t('messages.loading',{defaultValue:'Cargando...'})) {
    let loader = document.getElementById('globalLoader');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'globalLoader';
        loader.className = 'global-loader';
        loader.innerHTML = `
            <div class="loader-content">
                <div class="loader-spinner"></div>
                <p class="loader-message">${message}</p>
            </div>
        `;
        document.body.appendChild(loader);
    } else {
        loader.querySelector('.loader-message').textContent = message;
    }
    loader.style.display = 'flex';
}

function hideLoading() {
    const loader = document.getElementById('globalLoader');
    if (loader) {
        loader.style.display = 'none';
    }
}

// v4.10.3: Toggle collapsible sections in Create Group Step 3
function toggleCollapsible(btn) {
    var header = btn.closest('.collapsible-header') || btn;
    var section = header.closest('.collapsible-section');
    if (!section) return;
    var content = section.querySelector('.collapsible-content');
    var icon = header.querySelector('.collapsible-icon');
    if (!content) return;
    var isExpanded = content.classList.contains('expanded');
    if (isExpanded) {
        content.classList.remove('expanded');
        content.style.maxHeight = '0';
        if (icon) icon.style.transform = 'rotate(0deg)';
    } else {
        content.classList.add('expanded');
        content.style.maxHeight = content.scrollHeight + 'px';
        if (icon) icon.style.transform = 'rotate(180deg)';
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ===== MODAL CREATION FUNCTIONS =====

function createRejectModal() {
    const modal = document.createElement('div');
    modal.id = 'rejectModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Rechazar Solicitud</h3>
                <button class="modal-close" data-action="grp-close-reject">×</button>
            </div>
            <div class="modal-body">
                <label for="rejectReason">Razón del rechazo (opcional):</label>
                <textarea id="rejectReason" rows="3" placeholder="Explica por qué se rechaza esta solicitud..."></textarea>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" data-action="grp-close-reject">Cancelar</button>
                <button class="btn btn-danger" data-action="grp-confirm-reject">Rechazar Solicitud</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    return modal;
}

function closeRejectModal() {
    const modal = document.getElementById('rejectModal');
    if (modal) {
        modal.style.display = 'none'; modal.classList.remove('active');
        document.getElementById('rejectReason').value = '';
    }
}

function confirmReject() {
    const modal = document.getElementById('rejectModal');
    const groupId = modal.dataset.groupId;
    const requestId = modal.dataset.requestId;
    const reason = document.getElementById('rejectReason').value.trim();

    rejectPositionRequest(groupId, requestId, reason);
}

function createManualAssignModal() {
    const modal = document.createElement('div');
    modal.id = 'manualAssignModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Asignar Posición Manualmente</h3>
                <button class="modal-close" data-action="grp-close-manual-assign">×</button>
            </div>
            <div class="modal-body">
                <p>Posición: <strong id="assignPositionNumber">-</strong></p>
                <label for="assignUserId">Seleccionar usuario:</label>
                <select id="assignUserId">
                    <option value="">Cargando usuarios...</option>
                </select>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" data-action="grp-close-manual-assign">Cancelar</button>
                <button class="btn btn-primary" data-action="grp-confirm-manual-assign">Asignar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    return modal;
}

function closeManualAssignModal() {
    const modal = document.getElementById('manualAssignModal');
    if (modal) {
        modal.style.display = 'none'; modal.classList.remove('active');
    }
}

function confirmManualAssign() {
    const modal = document.getElementById('manualAssignModal');
    const groupId = modal.dataset.groupId;
    const positionNumber = parseInt(modal.dataset.positionNumber);
    const select = document.getElementById('assignUserId');
    const userId = select.value;
    const userName = select.options[select.selectedIndex].text;

    if (!userId) {
        showWarning('Por favor selecciona un usuario');
        return;
    }

    assignPositionManually(groupId, positionNumber, userId, userName);
}

async function loadUsersWithoutPositions(groupId) {
    try {
        // Get group details from current state
        const group = allGroups.find(g => g.id === groupId);
        if (!group) return;

        // Find members without confirmed positions
        const assignedUserIds = (group.positions || [])
            .filter(p => p.status === 'confirmed')
            .map(p => p.user_id);

        // Get all members (this would need to come from API in real implementation)
        const response = await fetch(`${API_BASE}/api/groups/${groupId}/members`, {
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
        });

        const data = await response.json();

        if (data.success && data.data && data.data.members) {
            const availableUsers = data.data.members.filter(m => !assignedUserIds.includes(m.user_id));

            const select = document.getElementById('assignUserId');
            select.innerHTML = availableUsers.length > 0
                ? availableUsers.map(u => `<option value="${escapeHtml(u.user_id)}">${escapeHtml(u.name || u.user_id)}</option>`).join('')
                : '<option value="">No hay usuarios disponibles</option>';

            document.getElementById('assignPositionNumber').textContent = `#${document.getElementById('manualAssignModal').dataset.positionNumber}`;
        }
    } catch (error) {
        document.getElementById('assignUserId').innerHTML = '<option value="">Error cargando usuarios</option>';
    }
}

        function showError(message) {
        message = escapeHtml(message);
            document.getElementById('groupsContainer').innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">⚠️</div>
                    <h3>Error</h3>
                    <p>${message}</p>
                    <button class="btn btn-primary" data-action="grp-retry-load">Reintentar</button>
                </div>
            `;
        }

        // ===== WEBSOCKET INTEGRATION =====
        function initWebSocketListeners() {
            // Check if WebSocket manager is available
            if (window.wsManager) {

                // Listen for group updates
                window.wsManager.on('group_update', (data) => {

                    // If the updated group is in our list, refresh
                    if (data.groupId && allGroups.some(g => g.id === data.groupId)) {
                        fetchMyGroups();
                    }
                });

                // Listen for payment confirmations
                window.wsManager.on('payment_confirmed', (data) => {

                    // If payment is for a group in our list, refresh
                    if (data.groupId && allGroups.some(g => g.id === data.groupId)) {
                        fetchMyGroups();
                    }
                });

                // Listen for general notifications that might affect groups
                window.wsManager.on('notification', (data) => {
                    if (data.type && data.type.includes('group')) {
                        // Optionally refresh groups on relevant notifications
                        fetchMyGroups();
                    }
                });

            } else {
                // Fallback: poll for updates every 60 seconds
                if (window._groupsPollInterval) clearInterval(window._groupsPollInterval);
                window._groupsPollInterval = setInterval(function() {
                    fetchMyGroups();
                }, 60000);
            }
        }

        // ===== EVENT LISTENERS =====
        document.getElementById('filterRole').addEventListener('change', applyFilters);
        document.getElementById('filterPayment').addEventListener('change', applyFilters);
        var _searchDebounce;
        document.getElementById('searchGroups').addEventListener('input', function() {
            clearTimeout(_searchDebounce);
            _searchDebounce = setTimeout(applyFilters, 300);
        });

        // ===== INITIALIZE =====
        fetchMyGroups();

        // Initialize WebSocket listeners after a brief delay to ensure wsManager is loaded
        setTimeout(initWebSocketListeners, 1000);

// --- Block 2 (originally inline) ---
// Plantillas de grupos precreadas
        const groupTemplates = {
            'familiar-small': {
                name: "Grupo Familiar",
                description: "Grupo cooperativo entre familiares para ahorros y apoyo mutuo",
                type: "familiar",
                contribution: 1500,
                frequency: "monthly",
                maxParticipants: 8,
                location: "",
                virtualMeetings: true
            },
            'laboral': {
                name: "Tanda de Oficina",
                description: "Grupo cooperativo entre compañeros de trabajo",
                type: "laboral",
                contribution: 2000,
                frequency: "biweekly",
                maxParticipants: 12,
                location: "",
                virtualMeetings: true
            },
            'comunitario': {
                name: "Tanda Comunitaria",
                description: "Grupo cooperativo de vecinos para proyectos comunitarios",
                type: "comunitario",
                contribution: 500,
                frequency: "monthly",
                maxParticipants: 30,
                location: "",
                virtualMeetings: false
            },
            'comercial': {
                name: "Red de Emprendedores",
                description: "Grupo cooperativo de pequeños negocios para financiamiento mutuo",
                type: "comercial",
                contribution: 5000,
                frequency: "biweekly",
                maxParticipants: 15,
                location: "",
                virtualMeetings: true
            },
            'tanda-rapida': {
                name: "Tanda Rápida Semanal",
                description: "Ciclo corto de ahorro semanal para necesidades inmediatas",
                type: "familiar",
                contribution: 500,
                frequency: "weekly",
                maxParticipants: 10,
                location: "",
                virtualMeetings: true
            }
        };

        // Función para mostrar el modal de plantillas
        function showTemplateModal() {
            const modal = document.getElementById('template-modal');
            if (modal) {
                modal.style.display = 'flex'; modal.classList.add('active');
                setTimeout(() => {
                    modal.classList.add('active');
                }, 10);
            }
        }

        // Función para cerrar el modal de plantillas
        function closeTemplateModal() {
            const modal = document.getElementById('template-modal');
            if (modal) {
                modal.classList.remove('active');
                setTimeout(() => {
                    modal.style.display = 'none'; modal.classList.remove('active');
                }, 300);
            }
        }

        // Función para seleccionar una plantilla
        function selectGroupTemplate(templateId) {

            if (templateId === 'custom') {
                // Usuario quiere empezar desde cero
                closeTemplateModal();
                return;
            }

            const template = groupTemplates[templateId];
            if (!template) {
                return;
            }

            // Pre-llenar formulario con datos de la plantilla
            const groupNameInput = document.getElementById('group-name');
            const groupDescInput = document.getElementById('group-description');
            const groupTypeSelect = document.getElementById('group-type');
            const contributionInput = document.getElementById('contribution');
            const frequencySelect = document.getElementById('payment-frequency');
            const maxParticipantsInput = document.getElementById('max-participants');

            if (groupNameInput) groupNameInput.value = template.name;
            if (groupDescInput) {
                groupDescInput.value = template.description;
                // Actualizar contador de caracteres
                const charCounter = document.getElementById('desc-count');
                if (charCounter) charCounter.textContent = template.description.length;
            }
            if (groupTypeSelect) groupTypeSelect.value = template.type;
            if (contributionInput) contributionInput.value = template.contribution;
            if (frequencySelect) frequencySelect.value = template.frequency;
            if (maxParticipantsInput) maxParticipantsInput.value = template.maxParticipants;

            // Seleccionar reuniones virtuales
            const virtualMeetingValue = template.virtualMeetings ? 'yes' : 'no';
            const virtualMeetingRadio = document.querySelector(`input[name="virtual-meetings"][value="${virtualMeetingValue}"]`);
            if (virtualMeetingRadio) virtualMeetingRadio.checked = true;


            // Cerrar modal
            closeTemplateModal();

            // Mostrar notificación
            if (typeof showToast === 'function') {
                showToast(t('messages.template_loaded',{defaultValue:'Plantilla cargada. Puedes modificar todos los valores.'}), 'success');
            }
        }

        // Event listener para cerrar modal con botón X
        document.addEventListener('DOMContentLoaded', function() {
            const closeBtn = document.querySelector('.modal-close-templates');
            if (closeBtn) {
                closeBtn.addEventListener('click', closeTemplateModal);
            }

            // Cerrar modal al hacer clic fuera del contenido
            const modalOverlay = document.getElementById('template-modal');
            if (modalOverlay) {
                modalOverlay.addEventListener('click', function(e) {
                    if (e.target === modalOverlay) {
                        closeTemplateModal();
                    }
                });
            }
        });

        // Mostrar modal automáticamente cuando se entra al tab "Create Group"
        // Esta función se llama desde el sistema de navegación de tabs
        function onCreateGroupTabActivated() {
            // Solo mostrar modal si no hay datos en el formulario
            const groupNameInput = document.getElementById('group-name');
            if (groupNameInput && !groupNameInput.value) {
                showTemplateModal();
            }
        }

        // Hook para interceptar cambio de tab a "Create Group"
        const originalSwitchTab = typeof switchTab !== 'undefined' ? switchTab : null;
        if (originalSwitchTab) {
            window.switchTab = function(tabName) {
                originalSwitchTab(tabName);
                if (tabName === 'create') {
                    setTimeout(onCreateGroupTabActivated, 300);
                }
            };
        }

// --- Block 3 (originally inline) ---
// Load position requests for awaiting_positions groups
(function() {

    async function loadPositionRequestsForGroup(groupId) {
        try {
            const authToken = localStorage.getItem("auth_token") || '';

            const response = await fetch(`/api/groups/position-requests?group_id=${groupId}`, {
                headers: { ...getAuthHeaders(),
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                }
            });

            const data = await response.json();

            if (data.success && data.data && data.data.requests) {
                const requests = data.data.requests;
                const pendingRequests = requests.filter(r => r.status === 'pending');

                updatePendingRequestsDisplay(groupId, pendingRequests);

                return pendingRequests;
            } else {
                updatePendingRequestsDisplay(groupId, []);
                return [];
            }
        } catch (error) {
            updatePendingRequestsDisplay(groupId, []);
            return [];
        }
    }

    function updatePendingRequestsDisplay(groupId, pendingRequests) {
        const groupCard = document.querySelector(`[data-group-id="${groupId}"]`);
        if (!groupCard) {
            return;
        }

        const positionSection = groupCard.querySelector('.position-assignment-section');
        if (!positionSection) {
            return;
        }

        let container = positionSection.querySelector('.pending-requests-list');
        if (!container) {
            const header = positionSection.querySelector('.position-header');
            if (header) {
                container = document.createElement('div');
                container.className = 'pending-requests-list';
                header.insertAdjacentElement('afterend', container);
            } else {
                return;
            }
        }

        if (pendingRequests.length > 0) {
            const requestsHTML = pendingRequests.map(request => `
                <div class="request-card" data-request-id="${request.id}">
                    <div class="request-header">
                        <div class="request-user">
                            <div class="request-avatar">${(request.user_name || 'User').charAt(0).toUpperCase()}</div>
                            <div class="request-info">
                                <div class="request-name">${escapeHtml(request.user_name || request.user_id)}</div>
                                <div class="request-position-badge">Posición #${request.requested_position}</div>
                            </div>
                        </div>
                        <div class="request-actions">
                            <button class="btn-approve" data-action="grp-approve-position" data-group-id="${groupId}" data-request-id="${request.id}">✓</button>
                            <button class="btn-reject" data-action="grp-reject-position" data-group-id="${groupId}" data-request-id="${request.id}">✕</button>
                        </div>
                    </div>
                    ${request.reason ? `<div class="request-reason">"${escapeHtml(request.reason)}"</div>` : ''}
                    <div class="request-timestamp">${formatRequestDate ? formatRequestDate(request.created_at) : new Date(request.created_at).toLocaleDateString()}</div>
                </div>
            `).join('');

            container.innerHTML = requestsHTML;
        } else {
            container.innerHTML = '<div class="no-requests">✅ No hay solicitudes pendientes</div>';
        }
    }

    function initializePositionRequests() {
        const positionSections = document.querySelectorAll('.position-assignment-section');

        positionSections.forEach(section => {
            const groupCard = section.closest('[data-group-id]');
            if (groupCard) {
                const groupId = groupCard.getAttribute('data-group-id');
                loadPositionRequestsForGroup(groupId);
            }
        });
    }

    // Re-init position requests when groups re-render
    window.addEventListener('groupsRendered', () => {
        setTimeout(initializePositionRequests, 500);
    });

})();

    

// ========================================
// Create advancedGroupsSystem object if it doesn not exist
if (typeof advancedGroupsSystem === 'undefined') {
    if (typeof window.advancedGroupsSystem === "undefined") {
        window.advancedGroupsSystem = {};
    }
}

// TANDAS TAB FUNCTIONALITY
// ========================================

// Global state for tandas

// ========== DASHBOARD UPDATE FUNCTION ==========
// [REMOVED] updateTandasDashboard + payNextDue — replaced by updateTandasSidebar



// ===== FASE 3: LISTA DE PAGOS URGENTES =====
// [REMOVED] renderUrgentPayments — info now in tanda card alerts
// [REMOVED] renderCurrentCollectors — info now in tanda card stats
// ===== FIN FASE 3 & 4 =====

// ===== FASE 5: MODAL DE PAGO RAPIDO =====
let currentPaymentTanda = null;
let userWalletBalance = 0;

async function quickPay(tandaId) {
    
    const tanda = window.tandasData ? window.tandasData.find(t => t.tanda_id === tandaId) : null;
    
    if (!tanda) {
        showToast("No se encontró la tanda: " + tandaId, "error");
        return;
    }
    
    currentPaymentTanda = tanda;
    
    // Fetch wallet balance
    let walletBalance = 0;
    try {
        const response = await fetch("/api/wallet/balance", {
            headers: { ...getAuthHeaders()
            }
        });
        if (response.ok) {
            const data = await response.json();
            walletBalance = parseFloat(data.balance || data.available || 0);
        }
    } catch (e) {
    }
    
    userWalletBalance = walletBalance;
    const amount = parseFloat(tanda.contribution_amount || tanda.amount || 0);
    const collector = tanda.current_collector || tanda.collecting_member;
    const beneficiaryName = collector ? (collector.name || collector.full_name || "Participante") : "Por definir";
    const dueDate = tanda.next_payment_date 
        ? new Date(tanda.next_payment_date.split("T")[0] + "T12:00:00").toLocaleDateString("es-HN", { day: "numeric", month: "long", year: "numeric" })
        : "Sin fecha";
    
    const insufficientFunds = walletBalance < amount;
    
    const content = `
        <div class="payment-summary" style="background: rgba(0,255,255,0.05); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <div class="summary-row" style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <span style="color: #888;">Tanda:</span>
                <strong style="color: #fff;">${escapeHtml(tanda.name || tanda.group_name || '')}</strong>
            </div>
            <div class="summary-row" style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <span style="color: #888;">Monto:</span>
                <strong style="color: #00ffff;">L. ${window.ltFormatNumber ? ltFormatNumber(amount, 2) : amount.toLocaleString('es-HN', {minimumFractionDigits:2})}</strong>
            </div>
            <div class="summary-row" style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <span style="color: #888;">Beneficiario:</span>
                <strong style="color: #fff;">${escapeHtml(beneficiaryName)}</strong>
            </div>
            <div class="summary-row" style="display: flex; justify-content: space-between; padding: 10px 0;">
                <span style="color: #888;">Vencimiento:</span>
                <strong style="color: #fff;">${dueDate}</strong>
            </div>
        </div>
        
        <div class="wallet-info" style="background: rgba(0,255,255,0.1); border-radius: 8px; padding: 15px; margin-bottom: 20px; text-align: center;">
            <span style="color: #00ffff;">💰 Saldo disponible: L. ${window.ltFormatNumber ? ltFormatNumber(walletBalance, 2) : walletBalance.toLocaleString('es-HN', {minimumFractionDigits:2})}</span>
            ${insufficientFunds ? '<div style="color: #ff6b6b; margin-top: 10px;">⚠️ Fondos insuficientes para pago con billetera</div>' : ''}
        </div>
        
        <div class="payment-methods" style="margin-bottom: 20px;">
            <label style="display: flex; align-items: center; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px; margin-bottom: 10px; cursor: pointer;">
                <input type="radio" name="modalPaymentMethod" value="wallet" ${insufficientFunds ? '' : 'checked'} style="margin-right: 10px;">
                <span>💳 Billetera La Tanda</span>
            </label>
            <label style="display: flex; align-items: center; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px; cursor: pointer;">
                <input type="radio" name="modalPaymentMethod" value="transfer" ${insufficientFunds ? 'checked' : ''} style="margin-right: 10px;">
                <span>🏦 Transferencia Bancaria</span>
            </label>
        </div>
    `;
    
    window.advancedGroupsSystem.showModal({
        title: '💳 Realizar Pago',
        content: content,
        size: 'medium',
        buttons: [
            { text: 'Cancelar', class: 'btn-secondary', action: 'grp-hide-modal' },
            { text: 'Pagar Ahora', class: 'btn-primary', action: 'modal-process-payment' }
        ]
    });
}

async function processModalPayment() {
    if (!currentPaymentTanda) {
        showToast(t("messages.no_tanda_selected",{defaultValue:"Error: No hay tanda seleccionada"}), "error");
        return;
    }
    
    const selectedMethod = document.querySelector("input[name='modalPaymentMethod']:checked");
    if (!selectedMethod) {
        showToast(t("messages.select_payment_method",{defaultValue:"Selecciona un método de pago"}), "warning");
        return;
    }
    
    const amount = parseFloat(currentPaymentTanda.contribution_amount || currentPaymentTanda.amount || 0);
    const tandaId = currentPaymentTanda.tanda_id || currentPaymentTanda.id || currentPaymentTanda.group_id;
    
    // Show loading in modal
    const modalContent = document.querySelector('.modal-content');
    if (modalContent) {
        modalContent.innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin" style="font-size: 40px; color: #00ffff;"></i><p style="margin-top: 20px;">Procesando pago...</p></div>';
    }
    
    try {
        const payload = {
            tanda_id: tandaId,
            amount: amount,
            payment_method: selectedMethod.value
        };
        
        const response = await fetch("/api/tandas/pay", {
            method: "POST",
            headers: { ...getAuthHeaders(),
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            window.advancedGroupsSystem.hideModal();
            showToast(t("messages.payment_success",{defaultValue:"Pago realizado exitosamente!"}), "success");
            currentPaymentTanda = null;
            if (typeof refreshTandas === "function") {
                refreshTandas();
            }
        } else {
            throw new Error("Error al procesar el pago");
        }
    } catch (error) {
        showToast(t("messages.payment_error",{defaultValue:"Error al procesar el pago"}), "error");
        window.advancedGroupsSystem.hideModal();
    }
}



// ===== FASE 6: HISTORIAL PERSONAL =====
let historyData = { payments: [], collections: [] };
let currentHistoryTab = "payments";

async function openHistoryModal() {
    
    // Show loading modal first
    window.advancedGroupsSystem.showModal({
        title: '📜 Historial de Pagos',
        content: '<div style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin" style="font-size: 40px; color: #00ffff;"></i><p style="margin-top: 20px;">Cargando historial...</p></div>',
        size: 'large'
    });
    
    let payments = [];
    let collections = [];
    
    try {
        // Fetch payments sent
        const paymentsResponse = await fetch("/api/payments/history?type=sent", {
            headers: { ...getAuthHeaders()
            }
        });
        if (paymentsResponse.ok) {
            const data = await paymentsResponse.json();
            payments = data.payments || (data.data && data.data.payments) || [];
        }
        
        // Fetch collections received
        const collectionsResponse = await fetch("/api/payments/history?type=received", {
            headers: { ...getAuthHeaders()
            }
        });
        if (collectionsResponse.ok) {
            const data = await collectionsResponse.json();
            collections = data.payments || (data.data && data.data.payments) || [];
        }
    } catch (error) {
    }
    
    // Store for tab switching
    window.historyModalData = { payments, collections };
    
    const content = `
        <div class="history-tabs" style="display: flex; gap: 10px; margin-bottom: 20px;">
            <button class="history-tab active" data-action="grp-switch-history-tab" data-htab="payments" id="tab-payments" 
                style="flex: 1; padding: 12px; background: #00ffff; color: #000; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">
                📤 Pagos Enviados (${payments.length})
            </button>
            <button class="history-tab" data-action="grp-switch-history-tab" data-htab="collections" id="tab-collections"
                style="flex: 1; padding: 12px; background: rgba(255,255,255,0.1); color: #fff; border: none; border-radius: 8px; cursor: pointer;">
                📥 Cobros Recibidos (${collections.length})
            </button>
        </div>
        
        <div id="history-payments" class="history-list" style="max-height: 400px; overflow-y: auto;">
            ${payments.length ? payments.map(p => `
                <div class="history-item" style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px; margin-bottom: 10px;">
                    <div style="flex: 1;">
                        <div style="color: #fff; font-weight: bold;">${escapeHtml(p.tanda_name || p.group_name || 'Tanda')}</div>
                        <div style="color: #888; font-size: 12px;">${escapeHtml(p.recipient || 'Participante')}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="color: #ff6b6b; font-weight: bold;">-L. ${window.ltFormatNumber ? ltFormatNumber(p.amount, 2) : parseFloat(p.amount || 0).toLocaleString('es-HN', {minimumFractionDigits: 2})}</div>
                        <div style="color: #888; font-size: 12px;">${p.date ? new Date(p.date).toLocaleDateString('es-HN') : ''}</div>
                    </div>
                </div>
            `).join('') : '<div style="text-align: center; padding: 40px; color: #888;"><i class="fas fa-inbox" style="font-size: 40px; margin-bottom: 10px;"></i><p>No hay pagos enviados</p></div>'}
        </div>
        
        <div id="history-collections" class="history-list" style="max-height: 400px; overflow-y: auto; display: none;">
            ${collections.length ? collections.map(c => `
                <div class="history-item" style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px; margin-bottom: 10px;">
                    <div style="flex: 1;">
                        <div style="color: #fff; font-weight: bold;">${escapeHtml(c.tanda_name || c.group_name || 'Tanda')}</div>
                        <div style="color: #888; font-size: 12px;">${c.cycle_number ? 'Ciclo ' + c.cycle_number : escapeHtml(c.sender || 'Distribuci\u00f3n')}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="color: #00ff88; font-weight: bold;">+L. ${window.ltFormatNumber ? ltFormatNumber(c.amount, 2) : parseFloat(c.amount || 0).toLocaleString('es-HN', {minimumFractionDigits: 2})}</div>
                        <div style="color: #888; font-size: 12px;">${c.date ? new Date(c.date).toLocaleDateString('es-HN') : ''}</div>
                    </div>
                </div>
            `).join('') : '<div style="text-align: center; padding: 40px; color: #888;"><i class="fas fa-inbox" style="font-size: 40px; margin-bottom: 10px;"></i><p>No hay cobros recibidos</p></div>'}
        </div>
    `;
    
    window.advancedGroupsSystem.showModal({
        title: '📜 Historial de Pagos',
        content: content,
        size: 'large',
        buttons: [
            { text: 'Cerrar', class: 'btn-secondary', action: 'grp-hide-modal' }
        ]
    });
}

window.tandasData = [];
window.filteredTandas = [];

// 1. REFRESH TANDAS (Main loader)
// ===== mergeTandaWithGroup helper =====
function mergeTandaWithGroup(tanda) {
    var group = (window.currentGroupsData || []).find(function(g) { return g.id === tanda.group_id; });
    if (!group) return tanda;
    return Object.assign({}, tanda, {
        role: group.my_role || tanda.role || 'member',
        // Tanda API is authoritative for payment data (uses centralized helper + correct grace period)
        payment_status: tanda.payment_status || group.my_payment_status || 'unknown',
        // Let renderTandaCard generate alerts from correct tanda data
        alerts: [],
        commission_rate_custom: group.commission_rate,
        next_payment_grace_deadline: tanda.next_payment_grace_deadline || group.my_next_payment_grace_deadline || null,
        category: group.category || tanda.category,
        location: group.location || tanda.location,
        frequency_label: group.frequency || tanda.frequency,
        max_members: group.max_members || tanda.max_members,
        group_status: group.status || tanda.group_status,
        lottery_executed: tanda.lottery_executed || group.lottery_executed || false,
        num_positions: group.my_num_positions || tanda.num_positions || 1
    });
}

// ===== updateTandasSidebar =====
async function showFinancialReport(groupId) {
            var token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
            if (!token) return;

            var overlayEl = document.createElement('div');
            overlayEl.className = 'modal-overlay ch-overlay';
            overlayEl.innerHTML = '<div class="modal-content ch-modal" style="max-width:600px;"><div class="ch-header" style="border-color:rgba(34,197,94,0.3);"><h3 style="color:#22c55e;"><i class="fas fa-chart-bar" style="margin-right:8px;"></i>Reporte Financiero</h3><button class="ch-close" data-action="fr-close">&times;</button></div><div class="ch-body"><div style="text-align:center;padding:40px;color:#94a3b8;"><i class="fas fa-spinner fa-spin" style="font-size:2rem;color:#22c55e;"></i><p style="margin-top:12px;">Generando reporte...</p></div></div></div>';
            document.body.appendChild(overlayEl);
            setTimeout(function() { overlayEl.classList.add('active'); }, 10);

            overlayEl.addEventListener('click', function(e) {
                if (e.target === overlayEl || e.target.closest('[data-action="fr-close"]')) {
                    overlayEl.classList.remove('active');
                    setTimeout(function() { overlayEl.remove(); }, 300);
                }
            });

            try {
                var resp = await fetch('/api/groups/' + groupId + '/financial-report', {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                var data = await resp.json();
                if (!data.success) throw new Error(data.data?.error?.message || 'Error');
                var r = data.data;

                var fmt = function(n) { return window.ltFormatNumber ? ltFormatNumber(n, 0) : parseFloat(n || 0).toLocaleString('es-HN', { minimumFractionDigits: 0, maximumFractionDigits: 0 }); };
                var pct = function(n) { return (n || 0) + '%'; };
                var rateColor = function(v) { return v >= 80 ? '#22c55e' : v >= 50 ? '#f59e0b' : '#ef4444'; };

                var bodyHtml = '';

                // Summary cards
                bodyHtml += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;">';
                bodyHtml += '<div style="background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);border-radius:10px;padding:12px;text-align:center;">' +
                    '<div style="color:#64748b;font-size:0.72rem;">Recaudado</div>' +
                    '<div style="color:#22c55e;font-size:1.3rem;font-weight:700;">L. ' + fmt(r.collections.total_collected) + '</div>' +
                    '<div style="color:#475569;font-size:0.68rem;">de L. ' + fmt(r.collections.theoretical_total) + ' (' + pct(r.collections.collection_rate) + ')</div></div>';
                bodyHtml += '<div style="background:rgba(96,165,250,0.08);border:1px solid rgba(96,165,250,0.2);border-radius:10px;padding:12px;text-align:center;">' +
                    '<div style="color:#64748b;font-size:0.72rem;">Distribuido</div>' +
                    '<div style="color:#60a5fa;font-size:1.3rem;font-weight:700;">L. ' + fmt(r.distributions.total_distributed) + '</div>' +
                    '<div style="color:#475569;font-size:0.68rem;">' + r.distributions.total_distributions + ' distribuciones</div></div>';
                bodyHtml += '<div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:10px;padding:12px;text-align:center;">' +
                    '<div style="color:#64748b;font-size:0.72rem;">Deuda Activa</div>' +
                    '<div style="color:#ef4444;font-size:1.3rem;font-weight:700;">L. ' + fmt(r.debt.total_owed) + '</div>' +
                    '<div style="color:#475569;font-size:0.68rem;">' + r.debt.active_loans + ' prestamos activos</div></div>';
                bodyHtml += '<div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:10px;padding:12px;text-align:center;">' +
                    '<div style="color:#64748b;font-size:0.72rem;">Tasa de Mora</div>' +
                    '<div style="color:' + rateColor(100 - r.mora.mora_rate) + ';font-size:1.3rem;font-weight:700;">' + pct(r.mora.mora_rate) + '</div>' +
                    '<div style="color:#475569;font-size:0.68rem;">' + r.mora.members_in_mora + ' de ' + r.members.length + ' miembros</div></div>';
                bodyHtml += '</div>';

                // Debt recovery
                if (r.debt.active_loans > 0) {
                    var recPct = r.debt.recovery_rate;
                    bodyHtml += '<div style="background:rgba(15,23,42,0.5);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:12px;margin-bottom:12px;">' +
                        '<div style="display:flex;justify-content:space-between;margin-bottom:6px;">' +
                            '<span style="color:#94a3b8;font-size:0.78rem;">Recuperacion de Deuda</span>' +
                            '<span style="color:' + rateColor(recPct) + ';font-size:0.78rem;font-weight:600;">' + pct(recPct) + '</span></div>' +
                        '<div style="height:6px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden;">' +
                            '<div style="height:100%;width:' + Math.min(100, recPct) + '%;background:' + rateColor(recPct) + ';border-radius:3px;"></div></div>' +
                        '<div style="display:flex;justify-content:space-between;margin-top:6px;font-size:0.7rem;color:#475569;">' +
                            '<span>Recuperado: L. ' + fmt(r.debt.total_recovered) + '</span>' +
                            '<span>Intereses: L. ' + fmt(r.debt.total_interest) + '</span></div></div>';
                }

                // Commission summary
                if (r.distributions.total_platform_fees > 0 || r.distributions.total_coordinator_fees > 0) {
                    bodyHtml += '<div style="background:rgba(15,23,42,0.5);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:12px;margin-bottom:12px;">' +
                        '<div style="color:#94a3b8;font-size:0.78rem;margin-bottom:6px;">Comisiones Generadas</div>' +
                        '<div style="display:flex;justify-content:space-between;font-size:0.8rem;">' +
                            '<span style="color:#64748b;">Coordinador:</span><span style="color:#e2e8f0;">L. ' + fmt(r.distributions.total_coordinator_fees) + '</span></div>' +
                        '<div style="display:flex;justify-content:space-between;font-size:0.8rem;">' +
                            '<span style="color:#64748b;">Plataforma:</span><span style="color:#e2e8f0;">L. ' + fmt(r.distributions.total_platform_fees) + '</span></div></div>';
                }

                // Member compliance table
                bodyHtml += '<div style="margin-top:4px;">' +
                    '<div style="color:#94a3b8;font-size:0.78rem;margin-bottom:8px;">Cumplimiento por Miembro</div>' +
                    '<div style="max-height:250px;overflow-y:auto;">';
                r.members.sort(function(a, b) { return b.punctuality - a.punctuality; });
                for (var i = 0; i < r.members.length; i++) {
                    var m = r.members[i];
                    var pColor = rateColor(m.punctuality);
                    var moraTag = m.active_moras > 0 ? ' <span style="color:#ef4444;font-size:0.65rem;background:rgba(239,68,68,0.15);padding:1px 6px;border-radius:8px;">' + m.active_moras + ' mora' + (m.active_moras > 1 ? 's' : '') + '</span>' : '';
                    bodyHtml += '<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04);">' +
                        '<div style="flex:1;min-width:0;">' +
                            '<span style="color:#e2e8f0;font-size:0.8rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block;">' + (typeof escapeHtml === 'function' ? escapeHtml(m.name) : m.name) + moraTag + '</span>' +
                            '<span style="color:#475569;font-size:0.68rem;">' + m.paid + '/' + m.expected + ' pagos</span></div>' +
                        '<div style="text-align:right;min-width:50px;">' +
                            '<span style="color:' + pColor + ';font-weight:600;font-size:0.85rem;">' + pct(m.punctuality) + '</span></div></div>';
                }
                bodyHtml += '</div></div>';

                // Group info footer
                bodyHtml += '<div style="margin-top:12px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.06);display:flex;justify-content:space-between;font-size:0.68rem;color:#475569;">' +
                    '<span>' + (r.group.name || '') + '</span>' +
                    '<span>Ciclo ' + r.group.current_cycle + ' | ' + r.group.max_members + ' miembros</span></div>';

                overlayEl.querySelector('.ch-body').innerHTML = bodyHtml;
            } catch (err) {
                overlayEl.querySelector('.ch-body').innerHTML = '<div style="text-align:center;padding:40px;color:#ef4444;"><i class="fas fa-exclamation-triangle" style="font-size:2rem;"></i><p style="margin-top:12px;">' + (err.message || 'Error al generar reporte') + '</p></div>';
            }
        }

function loadCreditScoreBadge() {
        var token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
        if (!token) return;
        fetch('/api/users/credit-score', { headers: { 'Authorization': 'Bearer ' + token } })
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (!data.success || !data.data.score) return;
                var score = data.data.score;
                var cat = data.data.category;
                var catMap = { excelente: { label: 'Excelente', color: '#22c55e', bg: 'rgba(34,197,94,0.15)' }, bueno: { label: 'Bueno', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' }, regular: { label: 'Regular', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' }, riesgo: { label: 'Riesgo', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' } };
                var s = catMap[cat] || catMap.regular;
                var el = document.getElementById('creditScoreCard');
                if (el) {
                    el.innerHTML =
                        '<div style="display:flex;align-items:center;justify-content:space-between;">' +
                            '<div style="display:flex;align-items:center;gap:8px;">' +
                                '<div style="width:40px;height:40px;border-radius:50%;background:' + s.bg + ';display:flex;align-items:center;justify-content:center;"><i class="fas fa-shield-alt" style="color:' + s.color + ';font-size:1rem;"></i></div>' +
                                '<div><div style="color:#94a3b8;font-size:0.7rem;">Tu Score Crediticio</div><div style="color:' + s.color + ';font-weight:700;font-size:1.2rem;">' + score + '</div></div>' +
                            '</div>' +
                            '<span style="padding:3px 10px;border-radius:12px;background:' + s.bg + ';color:' + s.color + ';font-size:0.72rem;font-weight:600;">' + s.label + '</span>' +
                        '</div>';
                    el.style.display = 'block';
                }
            }).catch(function() {});
    }

    function updateTandasSidebar(tandas) {
    var recruitingTandas = tandas.filter(function(t) { return t.status === 'recruiting' || t.status === 'pending' || t.status === 'scheduled'; });
    var activeTandas = tandas.filter(function(t) { return t.status === 'active' || t.status === 'waiting-turn' || t.status === 'collecting' || t.status === 'paused'; });

    // === Proximos Pagos (H1: multi-tanda list) ===
    var payCard = document.getElementById('tscNextPayment');
    var payListEl = document.getElementById('tscPaymentsList');

    var pendingPayments = activeTandas.filter(function(t) { return t.next_payment_date; }).sort(function(a, b) { return new Date(a.next_payment_date) - new Date(b.next_payment_date); });

    if (payListEl) {
        if (pendingPayments.length > 0) {
            var payHtml = '';
            var payCap = Math.min(pendingPayments.length, 5);
            for (var pi = 0; pi < payCap; pi++) {
                var pp = pendingPayments[pi];
                var ppNumPos = parseInt(pp.num_positions) || 1;
                var ppAmount = (pp.contribution_amount || 0) * ppNumPos;
                var ppDateStr = pp.next_payment_date;
                var ppDueDate = new Date(typeof ppDateStr === 'string' && ppDateStr.length === 10 ? ppDateStr + 'T12:00:00' : ppDateStr);
                var ppTodayNoon = new Date(); ppTodayNoon.setHours(12, 0, 0, 0);
                var ppDaysLeft = Math.round((ppDueDate - ppTodayNoon) / 86400000);
                var ppCountdownText = '';
                var ppCountdownClass = 'gs-countdown-ok';
                if (ppDaysLeft <= 0) {
                    var ppGrace = pp.next_payment_grace_deadline || pp.my_next_payment_grace_deadline;
                    if (ppGrace) {
                        var ppGraceDays = Math.ceil((new Date(ppGrace + 'T23:59:59') - new Date()) / 86400000);
                        if (ppGraceDays > 0) { ppCountdownText = 'Gracia: ' + ppGraceDays + 'd'; ppCountdownClass = 'gs-countdown-soon'; }
                        else { ppCountdownText = 'Atrasado'; ppCountdownClass = 'gs-countdown-late'; }
                    } else { ppCountdownText = 'Vencido'; ppCountdownClass = 'gs-countdown-late'; }
                } else {
                    ppCountdownText = ppDaysLeft + 'd';
                    ppCountdownClass = ppDaysLeft <= 3 ? 'gs-countdown-late' : ppDaysLeft <= 7 ? 'gs-countdown-soon' : 'gs-countdown-ok';
                }
                var ppDateLabel = ppDueDate.toLocaleDateString('es-HN', { day: 'numeric', month: 'short' });
                payHtml += '<div class="gs-pay-item"><div class="gs-pay-item-left"><div class="gs-next-group">' + escapeHtml(pp.group_name || '') + '</div><div class="gs-next-date">' + escapeHtml(ppDateLabel) + '</div></div><div class="gs-pay-item-right"><div class="gs-next-amount">' + (window.ltFormatCurrency ? ltFormatCurrency(ppAmount) : 'L. ' + ppAmount.toLocaleString('es-HN')) + '</div><span class="gs-next-countdown ' + ppCountdownClass + '">' + escapeHtml(ppCountdownText) + '</span></div></div>';
            }
            payListEl.innerHTML = payHtml;
            if (payCard) payCard.style.display = '';
        } else if (recruitingTandas.length > 0) {
            payListEl.innerHTML = '<div style="font-size:0.78rem;color:#94a3b8;padding:4px 0">Esperando inicio</div>';
            if (payCard) payCard.style.display = '';
        } else {
            payListEl.innerHTML = '';
            if (payCard) payCard.style.display = 'none';
        }
    }

    // === Proximos Cobros (H2: multi-tanda list) ===
    var collCard = document.getElementById('tscMyCollection');
    var collListEl = document.getElementById('tscCollectionList');

    if (collListEl) {
        var cobros = activeTandas.map(function(t) {
            var ta = (t.my_turn_position || 0) > 0 ? Math.max(0, (t.my_turn_position || 0) - (t.current_turn || 0)) : -1;
            var pool = (t.contribution_amount || 0) * (t.max_members || t.total_participants || 1);
            return { turnsAway: ta, pool: pool, group_name: t.group_name || '', is_my_turn: t.is_my_turn || false };
        }).filter(function(c) { return c.is_my_turn || c.turnsAway > 0; }).sort(function(a, b) { return a.turnsAway - b.turnsAway; });

        if (cobros.length > 0) {
            var cobHtml = '';
            var cobCap = Math.min(cobros.length, 5);
            for (var ci = 0; ci < cobCap; ci++) {
                var cb = cobros[ci];
                var cbBadgeClass = cb.turnsAway === 0 ? 'gs-cobro-now' : 'gs-cobro-soon';
                var cbBadgeText = cb.turnsAway === 0 ? '\u00a1Te toca!' : 'En ' + cb.turnsAway + ' turno' + (cb.turnsAway > 1 ? 's' : '');
                cobHtml += '<div class="gs-cobro-item"><div class="gs-pay-item-left"><div class="gs-next-group">' + escapeHtml(cb.group_name) + '</div><div class="gs-next-date">~' + (window.ltFormatCurrency ? ltFormatCurrency(cb.pool) : 'L. ' + cb.pool.toLocaleString('es-HN')) + '</div></div><div class="gs-pay-item-right"><span class="gs-cobro-badge ' + cbBadgeClass + '">' + escapeHtml(cbBadgeText) + '</span></div></div>';
            }
            collListEl.innerHTML = cobHtml;
            if (collCard) collCard.style.display = '';
        } else {
            collListEl.innerHTML = '';
            if (collCard) collCard.style.display = 'none';
        }
    }

    // === Resumen ===
    var totalEl = document.getElementById('tscTotalTandas');
    var activeEl = document.getElementById('tscActiveTandas');
    var paidEl = document.getElementById('tscPaidCycles');
    var pendEl = document.getElementById('tscPendingCycles');
    var totalPaidEl = document.getElementById('tscTotalPaid');

    var paidCount = tandas.reduce(function(s, t) { return s + (t.my_contributions_paid || 0); }, 0);
    var totalPaid = tandas.reduce(function(s, t) { var np = parseInt(t.num_positions) || 1; return s + ((t.my_contributions_paid || 0) * (t.contribution_amount || 0) * np); }, 0);

    if (totalEl) totalEl.textContent = tandas.length;
    if (activeEl) activeEl.textContent = activeTandas.length;
    if (paidEl) paidEl.textContent = paidCount;
    // M2: pendientes x num_positions
    // v4.25.4: Only count pending for tandas where user hasn't fully paid current cycle
    var pendingDue = tandas.reduce(function(s, t) {
        if (t.payment_status === 'paid' || t.payment_status === 'up_to_date') return s;
        if (t.status === 'completed' || t.status === 'recruiting') return s;
        var cycle = t.current_cycle || 0;
        var paid = t.my_contributions_paid || 0;
        var numPos = parseInt(t.num_positions) || 1;
        return s + Math.max(0, (cycle * numPos) - paid);
    }, 0);
    if (pendEl) pendEl.textContent = pendingDue;
    if (totalPaidEl) totalPaidEl.textContent = (window.ltFormatCurrency ? ltFormatCurrency(totalPaid) : 'L. ' + totalPaid.toLocaleString('es-HN'));
}

// ===== refreshTandas (rewritten with merge + sidebar) =====
async function refreshTandas() {
    try {
        var container = document.getElementById('tandasList');
        if (!container) return;

        container.innerHTML = '<div class="loading-state"><div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i></div><p class="loading-text">Cargando tus tandas...</p></div>';

        var allTandas = [];
        try {
            var response = await fetch('/api/tandas/my-tandas', { headers: Object.assign({}, getAuthHeaders()) });
            if (response.ok) {
                var data = await response.json();
                if (data.success && (data.tandas || (data.data && data.data.tandas))) {
                    allTandas = data.tandas || data.data.tandas || [];
                }
            }
        } catch(apiError) { /* network error */ }

        // Merge with group data
        allTandas = allTandas.map(mergeTandaWithGroup);

        window.tandasData = allTandas;
        window.filteredTandas = allTandas.slice();

        if (window.tandasData.length === 0) {
            var userGroupCount = window.currentGroupsData ? window.currentGroupsData.length : 0;
            if (userGroupCount === 0) {
                showTandasEmptyState('NO_GROUPS');
            } else {
                showTandasEmptyState('NO_TANDAS', userGroupCount);
            }
            updateTandasSidebar([]);
            return;
        }

        updateTandasSidebar(window.tandasData);
        renderTandas();
        startTandaLotteryCountdowns();

    } catch (error) {
        showTandasEmptyState('Error al cargar tandas. Intenta de nuevo.');
    }
}

// 2. RENDER TANDAS
function formatRelativeDate(dateStr) {
        if (!dateStr) return '--';
    if (!dateStr || dateStr === 'null') return 'Pendiente';
    var todayNoon = new Date(); todayNoon.setHours(12, 0, 0, 0);
    var target = new Date(dateStr.length === 10 ? dateStr + 'T12:00:00' : dateStr);
    if (isNaN(target.getTime())) return 'Pendiente';
    var days = Math.round((target - todayNoon) / 86400000);
    if (days < 0) return 'Vencido';
    if (days === 0) return 'Hoy';
    if (days === 1) return 'Ma\u00f1ana';
    return 'En ' + days + ' d\u00edas';
}

// v4.25.4: Mis Tandas rewritten as financial dashboard (not card duplicates)
function renderTandas() {
    var container = document.getElementById('tandasList');
    if (!container) return;
    var tandas = window.filteredTandas || window.tandasData || [];

    if (tandas.length === 0) {
        container.innerHTML = '<div class="gm-empty" style="padding:40px 20px;text-align:center;"><i class="fas fa-piggy-bank" style="font-size:2.5rem;color:rgba(0,255,255,0.3);margin-bottom:12px;display:block;"></i><h3 style="color:#e2e8f0;margin-bottom:8px;">Sin tandas activas</h3><p style="color:#94a3b8;margin-bottom:16px;">Unete a un grupo o crea uno para comenzar</p><button class="ds-btn ds-btn-primary" data-action="switch-groups-tab" data-tab="create"><i class="fas fa-plus-circle"></i> Crear Grupo</button></div>';
        return;
    }

    var html = '';
    var now = new Date();

    // === SECTION 1: ACTIVIDAD (items needing attention) ===
    var activityItems = [];

    tandas.forEach(function(t) {
        var gid = t.group_id || t.id || '';
        var gName = escapeHtml(t.group_name || 'Grupo');

        // Lottery countdown
        if (t.lottery_scheduled_at && !t.lottery_executed) {
            var lottDate = new Date(t.lottery_scheduled_at);
            if (lottDate > now) {
                var lottDiff = Math.ceil((lottDate - now) / 3600000);
                var lottLabel = lottDiff > 24 ? Math.floor(lottDiff / 24) + 'd ' + (lottDiff % 24) + 'h' : lottDiff + 'h';
                activityItems.push({ priority: 1, icon: 'fa-dice', color: 'var(--ds-purple,#a855f7)', title: gName + ' — Tombola en ' + lottLabel, sub: 'Posiciones se asignaran automaticamente', gid: gid, action: 'td-go-grupo', countdown: t.lottery_scheduled_at });
            }
        }

        // Collecting (it's my turn!)
        if (t.status === 'collecting' || (t.my_turn_position && t.current_turn && t.my_turn_position === t.current_turn)) {
            var pool = (t.contribution_amount || 0) * (t.max_members || t.total_participants || 1);
            activityItems.push({ priority: 0, icon: 'fa-gift', color: 'var(--ds-green)', title: gName + ' — Te toca cobrar!', sub: 'Pool: L. ' + formatTandaNumber(pool), gid: gid, action: 'td-go-gestionar' });
        }

        // Recruiting (show preference)
        if (t.status === 'recruiting' || t.status === 'pending' || t.status === 'scheduled') {
            var joined = t.members_joined || t.member_count || 0;
            var needed = t.members_needed || t.max_members || 0;
            var prefLabel = t.my_preference ? ({ early: 'Temprano', middle: 'Medio', late: 'Tardio', any: 'Cualquiera' }[t.my_preference] || t.my_preference) : 'Sin preferencia';
            activityItems.push({ priority: 2, icon: 'fa-users', color: 'var(--ds-amber)', title: gName + ' — En reclutamiento (' + joined + '/' + needed + ')', sub: 'Tu preferencia: ' + prefLabel, gid: gid, action: 'td-go-grupo', hasPref: true, groupId: gid, pref: t.my_preference });
        }

        // Payment overdue
        if (t.payment_status === 'late' || t.payment_status === 'suspension_recommended') {
            activityItems.push({ priority: 0, icon: 'fa-exclamation-triangle', color: 'var(--ds-red)', title: gName + ' — Pago atrasado!', sub: 'Contacta al coordinador para regularizarte', gid: gid, action: 'td-go-gestionar' });
        }
    });

    activityItems.sort(function(a, b) { return a.priority - b.priority; });

    if (activityItems.length > 0) {
        html += '<div style="margin-bottom:16px;"><div style="font-size:0.85rem;font-weight:600;color:var(--ds-text-secondary);margin-bottom:8px;"><i class="fas fa-bell" style="color:var(--ds-amber);margin-right:6px;"></i>Actividad</div>';
        activityItems.forEach(function(item) {
            html += '<div class="ds-card" style="padding:12px;margin-bottom:6px;border-left:3px solid ' + item.color + ';cursor:pointer;" data-action="' + item.action + '" data-gid="' + escapeHtml(item.gid) + '">';
            html += '<div style="display:flex;align-items:center;gap:10px;">';
            html += '<i class="fas ' + item.icon + '" style="color:' + item.color + ';font-size:1.1rem;width:20px;text-align:center;"></i>';
            html += '<div style="flex:1;"><div style="font-weight:600;font-size:0.85rem;">' + item.title + '</div>';
            html += '<div style="font-size:0.75rem;color:var(--ds-text-faint);">' + item.sub + '</div></div>';
            html += '<i class="fas fa-chevron-right" style="color:var(--ds-text-faint);font-size:0.7rem;"></i>';
            html += '</div></div>';
        });
        html += '</div>';
    }

    // === SECTION 2: RESUMEN FINANCIERO ===
    var activeTandas = tandas.filter(function(t) { return t.status !== 'completed' && t.status !== 'recruiting' && t.status !== 'pending' && t.status !== 'scheduled'; });
    var totalPaidAll = 0, totalOwedAll = 0, totalPoolAll = 0;
    var nextCobro = null, nextCobroCycles = 999;

    activeTandas.forEach(function(t) {
        var np = parseInt(t.num_positions) || 1;
        var paid = t.my_contributions_paid || 0;
        var amt = parseFloat(t.contribution_amount) || 0;
        totalPaidAll += paid * amt;
        var cycle = t.current_cycle || 0;
        var owed = Math.max(0, (cycle * np) - paid) * amt;
        totalOwedAll += owed;
        totalPoolAll += amt * (t.max_members || t.total_participants || 1);

        // Find nearest cobro
        if (t.my_turn_position && t.current_turn) {
            var turnsAway = t.my_turn_position - t.current_turn;
            if (turnsAway > 0 && turnsAway < nextCobroCycles) {
                nextCobroCycles = turnsAway;
                nextCobro = t;
            }
        }
    });

    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;">';
    html += '<div class="ds-card" style="padding:12px;text-align:center;"><div style="font-size:1.3rem;font-weight:700;color:var(--ds-green);">L. ' + formatTandaNumber(totalPaidAll) + '</div><div style="font-size:0.72rem;color:var(--ds-text-faint);">Total Pagado</div></div>';
    html += '<div class="ds-card" style="padding:12px;text-align:center;"><div style="font-size:1.3rem;font-weight:700;color:' + (totalOwedAll > 0 ? 'var(--ds-red)' : 'var(--ds-green)') + ';">L. ' + formatTandaNumber(totalOwedAll) + '</div><div style="font-size:0.72rem;color:var(--ds-text-faint);">Pendiente</div></div>';
    html += '</div>';

    if (nextCobro) {
        var cobroPool = (nextCobro.contribution_amount || 0) * (nextCobro.max_members || 1);
        html += '<div class="ds-card" style="padding:12px;margin-bottom:16px;border-left:3px solid var(--ds-cyan);">';
        html += '<div style="font-size:0.75rem;color:var(--ds-text-faint);margin-bottom:4px;">Proximo cobro</div>';
        html += '<div style="display:flex;justify-content:space-between;align-items:center;">';
        html += '<div><span style="font-weight:600;">' + escapeHtml(nextCobro.group_name || '') + '</span><div style="font-size:0.75rem;color:var(--ds-text-faint);">En ' + nextCobroCycles + ' ciclo' + (nextCobroCycles > 1 ? 's' : '') + '</div></div>';
        html += '<div style="text-align:right;"><div style="font-size:1.1rem;font-weight:700;color:var(--ds-cyan);">~L. ' + formatTandaNumber(cobroPool) + '</div><div style="font-size:0.68rem;color:var(--ds-text-faint);">Pool estimado</div></div>';
        html += '</div></div>';
    }

    // === SECTION 3: MIS TANDAS (compact list, not cards) ===
    html += '<div style="margin-bottom:16px;"><div style="font-size:0.85rem;font-weight:600;color:var(--ds-text-secondary);margin-bottom:8px;"><i class="fas fa-list" style="color:var(--ds-cyan);margin-right:6px;"></i>Mis Tandas (' + tandas.length + ')</div>';

    var statusLabels = { 'active': 'Activa', 'recruiting': 'Reclutando', 'pending': 'Pendiente', 'scheduled': 'Programada', 'collecting': 'Cobrando', 'waiting-turn': 'En turno', 'paused': 'Pausada', 'completed': 'Completada' };
    var statusColors = { 'active': 'var(--ds-cyan)', 'recruiting': 'var(--ds-amber)', 'collecting': 'var(--ds-green)', 'completed': '#22c55e', 'paused': 'var(--ds-amber)', 'waiting-turn': 'var(--ds-blue,#3b82f6)' };
    var payStatusLabels = { 'paid': 'Al dia', 'up_to_date': 'Al dia', 'pending': 'Pendiente', 'late': 'Atrasado', 'mora': 'En mora', 'suspended': 'Suspendido' };
    var payStatusColors = { 'paid': 'var(--ds-green)', 'up_to_date': 'var(--ds-green)', 'pending': 'var(--ds-amber)', 'late': 'var(--ds-red)', 'mora': 'var(--ds-red)', 'suspended': '#94a3b8' };

    tandas.forEach(function(t) {
        var gid = t.group_id || t.id || '';
        var gName = escapeHtml(t.group_name || 'Grupo');
        var stLabel = statusLabels[t.status] || t.status || '?';
        var stColor = statusColors[t.status] || 'var(--ds-text-faint)';
        var isActive = t.status === 'active' || t.status === 'collecting' || t.status === 'waiting-turn' || t.status === 'paused';
        var isRecruiting = t.status === 'recruiting' || t.status === 'pending' || t.status === 'scheduled';
        var isCompleted = t.status === 'completed';
        var np = parseInt(t.num_positions) || 1;
        var amt = parseFloat(t.contribution_amount) || 0;
        var role = t.role || 'member';
        var isAdmin = role === 'creator' || role === 'coordinator';

        html += '<div class="ds-card" style="padding:12px;margin-bottom:6px;cursor:pointer;" data-action="' + (isAdmin ? 'td-go-gestionar' : 'td-go-grupo') + '" data-gid="' + escapeHtml(gid) + '">';
        html += '<div style="display:flex;align-items:center;gap:10px;">';

        // Avatar
        var initial = gName.charAt(0).toUpperCase();
        html += '<div style="width:40px;height:40px;border-radius:12px;background:' + stColor + ';color:#000;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1rem;flex-shrink:0;">' + initial + '</div>';

        // Info
        html += '<div style="flex:1;min-width:0;">';
        html += '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">';
        html += '<span style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + gName + '</span>';
        html += '<span style="font-size:0.6rem;padding:1px 6px;border-radius:8px;background:' + stColor + ';color:#000;font-weight:600;">' + stLabel + '</span>';
        if (isActive && t.payment_status) {
            var psLabel = payStatusLabels[t.payment_status] || '';
            var psColor = payStatusColors[t.payment_status] || '';
            if (psLabel) html += '<span style="font-size:0.6rem;padding:1px 6px;border-radius:8px;background:' + psColor + ';color:#000;font-weight:600;">' + psLabel + '</span>';
        }
        html += '</div>';

        // Details row
        html += '<div style="display:flex;gap:8px;flex-wrap:wrap;font-size:0.72rem;color:var(--ds-text-faint);margin-top:2px;">';
        html += '<span>L.' + formatTandaNumber(amt) + '</span>';
        if (isActive) {
            html += '<span>Ciclo ' + (t.current_cycle || '?') + '</span>';
            if (t.my_turn_position) html += '<span>Turno #' + t.my_turn_position + '</span>';
            if (np > 1) html += '<span>' + np + ' pos.</span>';
            html += '<span>' + (t.my_contributions_paid || 0) + '/' + ((t.current_cycle || 1) * np) + ' pagos</span>';
        } else if (isRecruiting) {
            html += '<span>' + (t.members_joined || 0) + '/' + (t.members_needed || t.max_members || '?') + ' miembros</span>';
        } else if (isCompleted) {
            html += '<span>' + (t.my_contributions_paid || 0) + ' pagos totales</span>';
        }
        html += '</div>';

        // Loan indicator
        if (t.active_loan) {
            html += '<div style="font-size:0.7rem;color:var(--ds-red);margin-top:2px;"><i class="fas fa-hand-holding-usd" style="font-size:0.6rem;"></i> Prestamo: L.' + formatTandaNumber(t.active_loan.total_owed) + '</div>';
        }

        html += '</div>'; // end info

        // Right: next payment or cobro indicator
        html += '<div style="text-align:right;flex-shrink:0;">';
        if (isActive && t.next_payment_date && t.payment_status !== 'paid' && t.payment_status !== 'up_to_date') {
            var npDate = new Date(t.next_payment_date);
            var daysUntil = Math.ceil((npDate - now) / 86400000);
            html += '<div style="font-size:0.75rem;font-weight:600;color:' + (daysUntil < 0 ? 'var(--ds-red)' : daysUntil <= 3 ? 'var(--ds-amber)' : 'var(--ds-text-faint)') + ';">' + formatRelativeDate(t.next_payment_date) + '</div>';
        } else if (isActive && (t.payment_status === 'paid' || t.payment_status === 'up_to_date')) {
            html += '<i class="fas fa-check-circle" style="color:var(--ds-green);"></i>';
        }
        if (isAdmin) html += '<div style="font-size:0.6rem;color:var(--ds-purple,#a855f7);margin-top:2px;">Admin</div>';
        html += '</div>';

        html += '</div>'; // end flex row
        html += '</div>'; // end card
    });

    html += '</div>';

    container.innerHTML = html;
}

// Legacy functions removed — renderTandaCard, filterAndSortTandas, getLotteryBadge, getGoalBadge
// All tanda management now in gestionar.html


function formatTandaNumber(num) {
    try {
        return new Intl.NumberFormat("es-HN").format(num);
    } catch (e) {
        return num;
    }
}

// Add tandas functions to global scope for onclick handlers
// Add tandas functions to global scope - DEFERRED until system ready

// Lottery countdown functionality for tanda cards

// =============================================
// LOTTERY LIVE ANIMATION SYSTEM
// =============================================

// Show lottery animation overlay
function // Show animation with updated data structure
                    showLotteryAnimation(groupName, members, results, myTurn) {
    // Remove existing overlay if any
    const existingOverlay = document.querySelector('.lottery-animation-overlay');
    if (existingOverlay) existingOverlay.remove();

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'lottery-animation-overlay';

    // Build members HTML
    const membersHtml = members.map((member, idx) => {
        const result = results.find(r => r.member_id === member.id);
        const turnNum = result ? result.turn_number : '?';
        return '<div class="lottery-member" data-member-id="' + member.id + '">' +
               '<span class="member-name">' + escapeHtml(member.name) + '</span>' +
               '<span class="turn-number">#' + escapeHtml(String(turnNum)) + '</span>' +
               '</div>';
    }).join('');

    overlay.innerHTML =
        '<div class="lottery-container">' +
            '<h2 class="lottery-title"><i class="fas fa-dice"></i> TOMBOLA EN VIVO</h2>' +
            '<div style="display:flex;gap:8px;justify-content:center;margin-bottom:0.5rem;">' +
                '<span style="background:rgba(0,255,255,0.15);color:#00FFFF;padding:3px 10px;border-radius:12px;font-size:0.72rem;" id="lottery-mode-badge">Aleatorio</span>' +
            '</div>' +
            '<p style="color: #9ca3af; margin-bottom: 1rem;">' + escapeHtml(groupName) + '</p>' +
            '<div class="lottery-wheel">' +
                '<div class="lottery-pointer"></div>' +
                '<div class="lottery-wheel-inner">' +
                    '<div class="lottery-wheel-center"><i class="fas fa-dice"></i></div>' +
                '</div>' +
            '</div>' +
            '<div class="lottery-members">' + membersHtml + '</div>' +
            '<div class="lottery-results">' +
                '<h4><i class="fas fa-check-circle"></i> Posiciones Asignadas</h4>' +
                (myTurn ?
                    '<div class="lottery-your-turn">' +
                        '<p style="margin: 0 0 0.5rem 0; opacity: 0.8;">Tu turno asignado:</p>' +
                        '<h3><i class="fas fa-trophy"></i> #' + myTurn + '</h3>' +
                    '</div>'
                : '') +
                '<button class="lottery-close-btn" data-action="grp-close-lottery"><i class="fas fa-check"></i> Continuar</button>' +
            '</div>' +
        '</div>';

    document.body.appendChild(overlay);

    // Activate overlay
    setTimeout(() => overlay.classList.add('active'), 100);

    // Animate members one by one
    const memberElements = overlay.querySelectorAll('.lottery-member');
    results.forEach((result, idx) => {
        setTimeout(() => {
            const memberEl = overlay.querySelector('[data-member-id="' + result.member_id + '"]');
            if (memberEl) {
                memberEl.classList.add('assigned');
                // Play sound if available
                playLotterySound();
            }
        }, 3000 + (idx * 500)); // Start after wheel spin (3s) + stagger
    });

    // Show results after all animations
    setTimeout(() => {
        const resultsEl = overlay.querySelector('.lottery-results');
        if (resultsEl) resultsEl.classList.add('show');
    }, 3000 + (results.length * 500) + 500);
}

function closeLotteryAnimation() {
    const overlay = document.querySelector('.lottery-animation-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 500);
    }
    // Refresh tandas to show updated data
    if (typeof refreshTandas === 'function') {
        refreshTandas();
    }
}

function playLotterySound() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.2);
    } catch (e) {
        // Audio not supported, ignore
    }
}

// Poll for lottery execution (when countdown reaches zero)
function pollForLotteryExecution(tandaId, groupId) {
    let pollCount = 0;
    const maxPolls = 30; // Poll for 30 seconds max

    const pollInterval = setInterval(async () => {
        pollCount++;

        if (pollCount > maxPolls) {
            clearInterval(pollInterval);
            refreshTandas();
            return;
        }

        try {
            const token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
            const response = await fetch('/api/groups/' + groupId + '/lottery-results', {
                headers: { 'Authorization': 'Bearer ' + token }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data?.executed && data.data?.results) {
                    clearInterval(pollInterval);

                    // Get current user's turn
                    const userId = getCurrentUserId();
                    const myResult = data.data.results.find(r => r.user_id === userId);
                    const myTurn = myResult ? myResult.turn_number : null;

                    // Show animation
                    showLotteryAnimation(
                        data.data?.tanda_name || 'Tanda',
                        data.data?.results?.map(r => ({id: r.user_id, name: r.name})) || [],
                        data.data.results.map(r => ({member_id: r.user_id, turn_number: r.position})),
                        myTurn
                    );
                }
            }
        } catch (error) {
        }
    }, 1000);
}
// getCurrentUserId() - Now provided by LaTandaAuth in shared-components.js (removed duplicate)

function startTandaLotteryCountdowns() {
    if (window._countdownIntervals) {
        window._countdownIntervals.forEach(function(id) { clearInterval(id); });
    }
    window._countdownIntervals = [];
    const countdownElements = document.querySelectorAll('[data-countdown]');

    countdownElements.forEach(el => {
        const scheduledAt = new Date(el.dataset.countdown);
        const timerSpan = el.querySelector('.countdown-timer');

        if (!timerSpan) return;

        function updateCountdown() {
            const now = new Date();
            const diff = scheduledAt - now;

            if (diff <= 0) {
                timerSpan.textContent = 'Iniciando...';
                clearInterval(intervalId);
                // Start polling for lottery results
                const tandaId = el.dataset.tandaId;
                if (tandaId) {
                    const card = el.closest('.tc-card');
                    const cardTandaId = card?.dataset?.tandaId;
                    const tandaData = (window.tandasData || []).find(function(t) { return t.tanda_id === cardTandaId; });
                    const groupId = tandaData?.group_id;
                    if (groupId) pollForLotteryExecution(tandaId, groupId);
                }
                // Refresh tandas after a short delay
                setTimeout(() => {
                    if (typeof refreshTandas === 'function') {
                        refreshTandas();
                    }
                }, 2000);
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const secs = Math.floor((diff % (1000 * 60)) / 1000);

            if (days > 0) {
                timerSpan.textContent = days + 'd ' + hours + 'h';
            } else if (hours > 0) {
                timerSpan.textContent = hours + 'h ' + mins + 'm';
            } else {
                timerSpan.textContent = mins + ':' + (secs < 10 ? '0' : '') + secs;
            }
        }

        updateCountdown();
        var intervalId = setInterval(updateCountdown, 1000);
        window._countdownIntervals.push(intervalId);
    });
}

// Call after rendering tandas
window.startTandaLotteryCountdowns = startTandaLotteryCountdowns;

function attachTandasFunctions() {
    // Ensure window.advancedGroupsSystem exists
    if (!window.advancedGroupsSystem) {
        window.advancedGroupsSystem = {};
    }
    
    // Assign tandas functions (v4.25.5: removed dead refs to showTandaHistory, viewTandaDetails, makeTandaPayment, openHistoryModal)
    window.advancedGroupsSystem.refreshTandas = refreshTandas;
    window.refreshTandas = refreshTandas;
    if (typeof quickPay === 'function') window.quickPay = quickPay;

    // ========== SHOWMODAL / HIDEMODAL ==========
    if (!window.advancedGroupsSystem.showModal) {
        window.advancedGroupsSystem.showModal = function(options) {
            var title = options.title || "Modal";
            var content = options.content || "";
            var size = options.size || "large";
            var buttons = options.buttons || [];
            
            var existing = document.getElementById("modalOverlay");
            if (existing) existing.remove();

            var maxWidth = size === "large" ? "800px" : size === "medium" ? "600px" : "400px";
            
            var buttonsHtml = "";
            if (buttons.length > 0) {
                buttonsHtml = "<div class=\"modal-footer\" style=\"padding:20px;border-top:1px solid rgba(255,255,255,0.1);display:flex;gap:10px;justify-content:flex-end;\">";
                buttons.forEach(function(btn) {
                    var btnStyle = btn.class === "btn-primary" 
                        ? "background:linear-gradient(135deg,#00ffff,#00d4aa);color:#000;" 
                        : "background:rgba(255,255,255,0.1);color:#fff;";
                    buttonsHtml += "<button class=\"" + (btn.class || "btn-secondary") + "\" data-action=\"" + (btn.action || "grp-hide-modal") + "\" style=\"padding:12px 24px;border-radius:8px;border:none;cursor:pointer;font-weight:500;" + btnStyle + "\">" + escapeHtml(btn.text || '') + "</button>";
                });
                buttonsHtml += "</div>";
            }
            
            var modalHTML = "<div class=\"modal-overlay active\" id=\"modalOverlay\" style=\"visibility:visible;opacity:1;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:99999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);\">" +
                "<div class=\"modal-container " + size + "\" id=\"modalContainer\" style=\"background:rgba(15,23,42,0.98);border:1px solid rgba(0,255,255,0.3);border-radius:16px;max-width:" + maxWidth + ";width:90%;max-height:90vh;overflow-y:auto;box-shadow:0 25px 50px rgba(0,0,0,0.5);\">" +
                    "<div class=\"modal-header\" style=\"padding:20px;border-bottom:1px solid rgba(255,255,255,0.1);display:flex;justify-content:space-between;align-items:center;\">" +
                        "<h3 style=\"color:#fff;margin:0;font-size:1.25rem;\">" + escapeHtml(title || '') + "</h3>" +
                        "<button data-action=\"grp-hide-modal\" style=\"background:none;border:none;color:#888;font-size:28px;cursor:pointer;line-height:1;\">&times;</button>" +
                    "</div>" +
                    "<div class=\"modal-content\" style=\"padding:20px;color:#fff;\">" + content + "</div>" +
                    buttonsHtml +
                "</div>" +
            "</div>";
            
            document.body.insertAdjacentHTML("beforeend", modalHTML); if(window.lockBodyScroll)window.lockBodyScroll();
        };
    }

    if (!window.advancedGroupsSystem.hideModal) {
        window.advancedGroupsSystem.hideModal = function() {
            var modal = document.getElementById("modalOverlay");
            if (modal) {
                modal.style.opacity = "0";
                setTimeout(function() { modal.remove(); if(window.unlockBodyScroll)window.unlockBodyScroll(); }, 200);
            }
        };
    }
    // ========== END SHOWMODAL / HIDEMODAL ==========

    // ========== MISSING METHODS FIX - Added 2026-01-17 ==========
    
    // closeModal - Close a specific modal by ID
    if (!window.advancedGroupsSystem.closeModal) {
        window.advancedGroupsSystem.closeModal = function(modalId) {
            var modal = document.getElementById(modalId);
            if (modal) {
                modal.style.display = "none";
                modal.classList.remove("active");
            }
        };
    }
    
    // switchSettingsTab - Switch between settings tabs
    if (!window.advancedGroupsSystem.switchSettingsTab) {
        window.advancedGroupsSystem.switchSettingsTab = function(tabName) {
            // Map tab names to IDs
            var tabIds = {
                "general": "generalSettings",
                "notifications": "notificationSettings", 
                "privacy": "privacySettings",
                "appearance": "appearanceSettings",
                "language": "languageSettings"
            };
            
            // Hide all settings tabs
            document.querySelectorAll(".settings-tab").forEach(function(tab) {
                tab.style.display = "none";
            });
            
            // Remove active from all nav buttons
            document.querySelectorAll(".settings-nav-btn").forEach(function(btn) {
                btn.classList.remove("active");
            });
            
            // Show selected tab
            var targetId = tabIds[tabName] || (tabName + "Settings");
            var targetTab = document.getElementById(targetId);
            if (targetTab) {
                targetTab.style.display = "block";
            }
            
            // Activate the clicked button
            event.target.classList.add("active");
        };
    }
    
    // switchWalletTab - Switch between wallet tabs
    if (!window.advancedGroupsSystem.switchWalletTab) {
        window.advancedGroupsSystem.switchWalletTab = function(tabName) {
            // Map tab names to IDs
            var tabIds = {
                "transactions": "walletTransactions",
                "methods": "walletMethods",
                "security": "walletSecurity"
            };
            
            // Hide all wallet tabs
            document.querySelectorAll("#myWalletModal .tab-content").forEach(function(tab) {
                tab.style.display = "none";
            });
            
            // Remove active from all tab buttons
            document.querySelectorAll("#myWalletModal .tab-btn").forEach(function(btn) {
                btn.classList.remove("active");
            });
            
            // Show selected tab
            var targetId = tabIds[tabName] || ("wallet" + tabName.charAt(0).toUpperCase() + tabName.slice(1));
            var targetTab = document.getElementById(targetId);
            if (targetTab) {
                targetTab.style.display = "block";
            }
            
            // Activate clicked button
            if (event && event.target) {
                event.target.classList.add("active");
            }
        };
    }
    
    // quickSearchAction - Handle quick search suggestions
    if (!window.advancedGroupsSystem.quickSearchAction) {
        window.advancedGroupsSystem.quickSearchAction = function(action) {
            advancedGroupsSystem.closeQuickSearch();
            
            switch(action) {
                case "groups-active":
                    if (typeof switchTab === "function") switchTab("mis-grupos");
                    break;
                case "tandas-pending":
                    if (typeof switchTab === "function") switchTab("tandas");
                    break;
                case "payments-due":
                    if (typeof switchTab === "function") switchTab("tandas");
                    break;
                default:
            }
        };
    }
    
    // showHelpCategory - Show a specific help category
    if (!window.advancedGroupsSystem.showHelpCategory) {
        window.advancedGroupsSystem.showHelpCategory = function(category) {
            // Could expand a section or filter FAQs
            var helpContent = document.querySelector(".help-content");
            if (helpContent) {
                var sections = helpContent.querySelectorAll(".faq-section");
                sections.forEach(function(section) {
                    var sectionCategory = section.getAttribute("data-category");
                    if (sectionCategory === category || !sectionCategory) {
                        section.style.display = "block";
                    }
                });
            }
        };
    }
    
    // toggleFAQ - Toggle FAQ accordion item
    if (!window.advancedGroupsSystem.toggleFAQ) {
        window.advancedGroupsSystem.toggleFAQ = function(index) {
            var faqItems = document.querySelectorAll(".faq-item");
            if (faqItems[index]) {
                faqItems[index].classList.toggle("active");
                var answer = faqItems[index].querySelector(".faq-answer");
                if (answer) {
                    answer.style.display = answer.style.display === "none" ? "block" : "none";
                }
            }
        };
    }
    
    // closeUserMenu - Close the user menu panel
    if (!window.advancedGroupsSystem.closeUserMenu) {
        window.advancedGroupsSystem.closeUserMenu = function() {
            var userMenu = document.querySelector(".user-menu-panel");
            if (userMenu) {
                userMenu.classList.remove("active");
                userMenu.style.display = "none";
            }
            var overlay = document.querySelector(".menu-overlay");
            if (overlay) overlay.remove();
        };
    }
    
    // closeNotifications - Close notifications panel
    if (!window.advancedGroupsSystem.closeNotifications) {
        window.advancedGroupsSystem.closeNotifications = function() {
            var panel = document.getElementById("notificationsPanel");
            if (panel) {
                panel.style.display = "none";
                panel.classList.remove("active");
            }
        };
    }
    
    // closeQuickSearch - Close quick search panel  
    if (!window.advancedGroupsSystem.closeQuickSearch) {
        window.advancedGroupsSystem.closeQuickSearch = function() {
            var searchPanel = document.querySelector(".quick-search-panel");
            if (searchPanel) {
                searchPanel.classList.remove("active");
                searchPanel.style.display = "none";
            }
            var searchInput = document.getElementById("quickSearchInput");
            if (searchInput) searchInput.value = "";
        };
    }
    
    // openProfile - Open edit profile modal
    if (!window.advancedGroupsSystem.openProfile) {
        window.advancedGroupsSystem.openProfile = function() {
            advancedGroupsSystem.closeUserMenu();
            var modal = document.getElementById("editProfileModal");
            if (modal) {
                modal.style.display = "flex";
                modal.classList.add("active");
            }
        };
    }
    
    // openHelp - Open help/support modal
    if (!window.advancedGroupsSystem.openHelp) {
        window.advancedGroupsSystem.openHelp = function() {
            advancedGroupsSystem.closeUserMenu();
            var modal = document.getElementById("helpModal");
            if (modal) {
                modal.style.display = "flex";
                modal.classList.add("active");
            } else {
                // Fallback: show help via showModal
                advancedGroupsSystem.showModal({
                    title: "Centro de Ayuda",
                    content: "<p>¿Necesitas ayuda? Contactanos:</p><ul><li>Email: soporte@latanda.online</li><li>WhatsApp: +504 XXXX-XXXX</li></ul>",
                    size: "medium"
                });
            }
        };
    }
    
    // openWalletSettings - Open wallet in settings mode
    if (!window.advancedGroupsSystem.openWalletSettings) {
        window.advancedGroupsSystem.openWalletSettings = function() {
            advancedGroupsSystem.closeUserMenu();
            var modal = document.getElementById("myWalletModal");
            if (modal) {
                modal.style.display = "flex";
                modal.classList.add("active");
            }
        };
    }
    
    // openSecuritySettings - Open security settings
    if (!window.advancedGroupsSystem.openSecuritySettings) {
        window.advancedGroupsSystem.openSecuritySettings = function() {
            advancedGroupsSystem.closeUserMenu();
            var modal = document.getElementById("settingsModal");
            if (modal) {
                modal.style.display = "flex";
                advancedGroupsSystem.switchSettingsTab("privacy");
            }
        };
    }
    
    // openNotificationSettings - Open notification settings
    if (!window.advancedGroupsSystem.openNotificationSettings) {
        window.advancedGroupsSystem.openNotificationSettings = function() {
            advancedGroupsSystem.closeUserMenu();
            var modal = document.getElementById("settingsModal");
            if (modal) {
                modal.style.display = "flex";
                advancedGroupsSystem.switchSettingsTab("notifications");
            }
        };
    }
    
    // openPrivacySettings - Open privacy settings
    if (!window.advancedGroupsSystem.openPrivacySettings) {
        window.advancedGroupsSystem.openPrivacySettings = function() {
            advancedGroupsSystem.closeUserMenu();
            var modal = document.getElementById("settingsModal");
            if (modal) {
                modal.style.display = "flex";
                advancedGroupsSystem.switchSettingsTab("privacy");
            }
        };
    }
    
    // openVerification - Open KYC verification modal
    if (!window.advancedGroupsSystem.openVerification) {
        window.advancedGroupsSystem.openVerification = function() {
            advancedGroupsSystem.closeUserMenu();
            var modal = document.getElementById("kycVerificationModal");
            if (modal) {
                modal.style.display = "flex";
                modal.classList.add("active");
            }
        };
    }
    
    // openFeedback / openFeedbackModal - Open feedback form
    if (!window.advancedGroupsSystem.openFeedback) {
        window.advancedGroupsSystem.openFeedback = function() {
            advancedGroupsSystem.closeUserMenu();
            advancedGroupsSystem.showModal({
                title: "Enviar Feedback",
                content: "<textarea id=\"feedbackText\" placeholder=\"Tu opinión nos ayuda a mejorar...\" style=\"width:100%;height:150px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:8px;color:#fff;padding:12px;resize:none;\"></textarea>",
                size: "medium",
                buttons: [
                    { text: "Cancelar", class: "btn-secondary", action: "grp-hide-modal" },
                    { text: "Enviar", class: "btn-primary", action: "modal-submit-feedback" }
                ]
            });
        };
        window.advancedGroupsSystem.openFeedbackModal = window.advancedGroupsSystem.openFeedback;
    }
    
    // submitFeedback - Submit feedback form
    if (!window.advancedGroupsSystem.submitFeedback) {
        window.advancedGroupsSystem.submitFeedback = function() {
            var feedback = document.getElementById("feedbackText");
            if (feedback && feedback.value.trim()) {
                advancedGroupsSystem.hideModal();
                // Show success notification
                if (typeof showNotification === "function") {
                    showNotification("¡Gracias por tu feedback!", "success");
                }
            }
        };
    }
    
    // saveSettings - Save settings form
    if (!window.advancedGroupsSystem.saveSettings) {
        window.advancedGroupsSystem.saveSettings = function() {
            // Collect settings from form
            advancedGroupsSystem.closeModal("settingsModal");
            if (typeof showNotification === "function") {
                showNotification("Configuración guardada", "success");
            }
        };
    }
    
    // markAllAsRead - Mark all notifications as read
    if (!window.advancedGroupsSystem.markAllAsRead) {
        window.advancedGroupsSystem.markAllAsRead = function() {
            var notifications = document.querySelectorAll(".notification-item.unread");
            notifications.forEach(function(notif) {
                notif.classList.remove("unread");
            });
            // Update badge
            var badge = document.querySelector(".notification-badge");
            if (badge) badge.style.display = "none";
        };
    }
    
    // startChat - Start chat with support
    if (!window.advancedGroupsSystem.startChat) {
        window.advancedGroupsSystem.startChat = function() {
            window.open("https://wa.me/50412345678?text=Hola, necesito ayuda con La Tanda", "_blank");
        };
    }
    
    // logout - Logout user
    if (!window.advancedGroupsSystem.logout) {
        window.advancedGroupsSystem.logout = function() {
            showConfirm("Estas seguro que deseas cerrar sesion?", function() {
                localStorage.removeItem("auth_token");
                localStorage.removeItem("latanda_user");
                window.location.href = "/auth-enhanced.html";
            });
        };
    }
    
    // ========== END MISSING METHODS FIX ==========

}

// Attach immediately AND on DOM load (defensive)
attachTandasFunctions();

// === Phase 4: Delegated event listeners for converted inline handlers ===
// Wrapped in DOMContentLoaded because form/modal HTML is below this script block
(function() {
    function _attachPhase4Listeners() {
        // Form submits
        var editForm = document.getElementById('editGroupForm');
        if (editForm) editForm.addEventListener('submit', function(e) { submitGroupEdit(e); });

        var inviteForm = document.getElementById('inviteForm');
        if (inviteForm) inviteForm.addEventListener('submit', function(e) { submitSimpleInvitation(e); });

        // User search with debounce
        var userSearchInput = document.getElementById('userSearchInput');
        if (userSearchInput) {
            var _userSearchTimer = null;
            userSearchInput.addEventListener('input', function() {
                clearTimeout(_userSearchTimer);
                var val = this.value;
                _userSearchTimer = setTimeout(function() { searchUsersToInvite(val); }, 300);
            });
        }

        // Proof file upload
        var proofFileInput = document.getElementById('proofFileInput');
        if (proofFileInput) proofFileInput.addEventListener('change', function(e) { handleProofUpload(e); });

        // History filters
        var historyTandaFilter = document.getElementById('historyTandaFilter');
        if (historyTandaFilter) historyTandaFilter.addEventListener('change', function() { if (typeof filterHistory === 'function') filterHistory(); });

        var historyPeriodFilter = document.getElementById('historyPeriodFilter');
        if (historyPeriodFilter) historyPeriodFilter.addEventListener('change', function() { if (typeof filterHistory === 'function') filterHistory(); });
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', _attachPhase4Listeners);
    } else {
        _attachPhase4Listeners();
    }
})();
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", attachTandasFunctions);
} else {
    // DOM already loaded, attach again after a short delay to ensure system is ready
    setTimeout(attachTandasFunctions, 500);
}

// --- Block 4 (originally inline) ---
// Enhanced Toast System
        window.showToast = function(message, type = 'info', duration = 4000) {
            var container = document.getElementById('toastContainer');
            if (!container) {
                container = document.createElement('div');
                container.id = 'toastContainer';
                container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 99999; display: flex; flex-direction: column; gap: 10px;';
                document.body.appendChild(container);
            }

            var icons = {
                success: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
                error: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
                info: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
                warning: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
            };

            var titles = {
                success: 'Exito',
                error: 'Error',
                info: 'Informacion',
                warning: 'Advertencia'
            };

            var toast = document.createElement('div');
            toast.className = 'toast-notification ' + type;
            toast.innerHTML = '<div class="toast-icon">' + icons[type] + '</div>' +
                '<div class="toast-content">' +
                '<div class="toast-title">' + titles[type] + '</div>' +
                '<div class="toast-message">' + escapeHtml(message) + '</div>' +
                '</div>' +
                '<button class="toast-close" data-action="grp-toast-close">' +
                '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
                '</button>';

            container.appendChild(toast);

            // Auto remove
            setTimeout(function() {
                if (toast.parentElement) {
                    toast.classList.add('removing');
                    setTimeout(function() {
                        toast.remove();
                    }, 300);
                }
            }, duration);
        };

        // Override existing functions
        window.showSuccess = function(message) {
            window.showToast(message, 'success');
        };

        window.showError = function(message) {
            window.showToast(message, 'error');
        };

        window.showInfo = function(message) {
            window.showToast(message, 'info');
        };

        window.showWarning = function(message) {
            window.showToast(message, 'warning');
        };

        // Loading overlay
        window.showLoadingOverlay = function(text) {
            var overlay = document.createElement('div');
            overlay.id = 'loadingOverlay';
            overlay.className = 'loading-overlay';
            overlay.innerHTML = '<div class="loading-spinner"></div><div class="loading-text">' + escapeHtml(text || t('messages.loading',{defaultValue:'Cargando...'})) + '</div>';
            document.body.appendChild(overlay);
        };

        window.hideLoadingOverlay = function() {
            var overlay = document.getElementById('loadingOverlay');
            if (overlay) overlay.remove();
        };

        // Confirmation dialog
        window.showConfirm = function(message, onConfirm, onCancel) {
            var overlay = document.createElement('div');
            overlay.className = 'modal-overlay active';
            overlay.style.cssText = 'display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); backdrop-filter: blur(4px); justify-content: center; align-items: center; z-index: 100000;';
            overlay.innerHTML = '<div style="background: #0f172a; border: 1px solid rgba(0,255,255,0.2); border-radius: 16px; padding: 24px; max-width: 400px; width: 90%; text-align: center; box-shadow: 0 25px 50px rgba(0,0,0,0.5);">' +
                '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="1.5" style="margin-bottom: 16px;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' +
                '<h3 style="margin: 0 0 8px; color: #f8fafc;">Confirmar Accion</h3>' +
                '<p style="margin: 0 0 24px; color: #94a3b8; white-space: pre-line;">' + message + '</p>' +
                '<div style="display: flex; gap: 12px; justify-content: center;">' +
                '<button data-action="grp-confirm-cancel" style="padding: 10px 24px; background: rgba(255,255,255,0.1); color: #e2e8f0; border: none; border-radius: 8px; cursor: pointer;">Cancelar</button>' +
                '<button data-action="grp-confirm-action" style="padding: 10px 24px; background: #ef4444; color: white; border: none; border-radius: 8px; cursor: pointer;">Confirmar</button>' +
                '</div></div>';

            window.confirmAction = onConfirm || function(){};
            window.confirmCancel = onCancel || function(){};

            document.body.appendChild(overlay);

            overlay.addEventListener('click', function(e) {
                if (e.target === overlay) {
                    overlay.remove();
                    if (onCancel) onCancel();
                }
            });
        };

// --- Block 5 (originally inline) ---
// ============================================
        // MODAL SYSTEM - JavaScript Functions
        // ============================================

        // Global variables for modals
        var currentMembersGroupId = null;
        var currentPaymentsGroupId = null;
        var currentInviteGroupId = null;
        var currentInviteMethod = 'email';

        // ============================================
        // VIEW MEMBERS MODAL
        // ============================================
        function viewGroupMembers(groupId) {
            closeModal(); // Close admin modal first
            setTimeout(function() {
                showMembersModal(groupId);
            }, 100);
        }
        window.viewGroupMembers = viewGroupMembers;

        async function showMembersModal(groupId) {
            currentMembersGroupId = groupId;
            var modal = document.getElementById('groupMembersModal');
            var loading = document.getElementById('membersLoading');
            var list = document.getElementById('membersList');
            var empty = document.getElementById('membersEmpty');
            var currentUserId = getCurrentUserId();

            // Reset state
            loading.style.display = 'flex';
            list.style.display = 'none';
            empty.style.display = 'none';
            list.innerHTML = '';

            // Show modal
            modal.style.display = 'flex'; modal.classList.add('active');
            document.body.style.overflow = 'hidden';

            // Load members
            try {
                var apiBase = window.API_BASE_URL || 'https://latanda.online';
                var response = await fetch(apiBase + '/api/groups/' + groupId + '/members', { headers: getAuthHeaders() });
                var data = await response.json();

                loading.style.display = 'none';

                if (data.success && data.data.members && data.data.members.length > 0) {
                    var members = data.data.members;
                    var expandedOrder = data.data.expanded_order || data.expanded_order || [];
                    var html = '';
                    var currentUserRole = null;
                    
                    // Build position map from expanded_order (user_id -> [positions])
                    var userPositions = {};
                    expandedOrder.forEach(function(pos, index) {
                        var uid = pos.user_id || pos;
                        if (!userPositions[uid]) userPositions[uid] = [];
                        userPositions[uid].push(index + 1);
                    });
                    
                    // Find current user's role
                    var currentMember = members.find(function(m) { return m.user_id === currentUserId; });
                    if (currentMember) currentUserRole = currentMember.role;

                    // Search bar
                    html += '<div style="margin-bottom: 12px;"><input type="text" id="memberSearchInput" placeholder="Buscar miembro..." style="width: 100%; padding: 10px 14px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #f8fafc; font-size: 0.875rem; box-sizing: border-box;"></div>';

                    var currentCycle = data.data.current_cycle || 1;

                    members.forEach(function(member) {
                        var isCurrentUser = member.user_id === currentUserId;
                        var initials = (member.name || 'U').charAt(0).toUpperCase();
                        var roleClass = member.role || 'member';
                        var roleText = member.role === 'creator' ? 'Creador' :
                                       member.role === 'coordinator' ? 'Coordinador' :
                                       member.role === 'admin' ? 'Admin' : 'Miembro';

                        // Display name logic (anonymous)
                        var displayName = member.name || 'Usuario';
                        var isAnonymous = member.is_anonymous;
                        if (isAnonymous && !isCurrentUser && currentUserRole !== 'creator' && currentUserRole !== 'admin') {
                            displayName = 'Miembro Anonimo';
                            initials = '?';
                        }

                        // Anonymous indicator for admin/creator
                        var anonymousIndicator = '';
                        if (isAnonymous && (currentUserRole === 'creator' || currentUserRole === 'admin')) {
                            anonymousIndicator = ' <span style="font-size:0.7rem;color:#f59e0b;">(Anonimo)</span>';
                        }

                        // Payment status for this cycle
                        var numPos = parseInt(member.num_positions) || 1;
                        var paidThisCycle = member.paid_this_cycle || 0;
                        var isPaid = paidThisCycle >= numPos;
                        var payIcon = isPaid ? '<span style="color:#34d399;font-size:0.85rem;" title="Pagado ciclo ' + currentCycle + '">&#x2714;</span>' : '<span style="color:#ef4444;font-size:0.85rem;" title="Pendiente ciclo ' + currentCycle + '">&#x2716;</span>';

                        // Status + num_positions badges
                        var statusBadge = '';
                        if (member.status === 'suspended') statusBadge = ' <span style="font-size:0.65rem;background:rgba(239,68,68,0.15);color:#ef4444;padding:2px 6px;border-radius:4px;">Suspendido</span>';
                        var posBadge = numPos > 1 ? ' <span style="font-size:0.65rem;background:rgba(0,255,255,0.12);color:#00FFFF;padding:2px 6px;border-radius:4px;">x' + numPos + '</span>' : '';

                        // Joined date
                        var joinedStr = '';
                        if (member.joined_at) {
                            var jd = new Date(member.joined_at);
                            joinedStr = jd.toLocaleDateString('es-HN', { day: 'numeric', month: 'short', year: 'numeric' });
                        }

                        // Contact info (coordinators only)
                        var contactHtml = '';
                        var isCoord = currentUserRole === 'creator' || currentUserRole === 'coordinator' || currentUserRole === 'admin';
                        if (isCoord && !isCurrentUser && !isAnonymous && member.phone) {
                            contactHtml = '<a href="tel:' + escapeHtml(member.phone) + '" style="color:#60a5fa;font-size:0.7rem;text-decoration:none;" title="Llamar">&#x1F4DE; ' + escapeHtml(member.phone) + '</a>';
                        }

                        html += '<div class="member-card' + (isCurrentUser ? ' current-user' : '') + '" data-user-id="' + member.user_id + '">' +
                            '<div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;">' +
                                '<div class="member-avatar' + (isAnonymous ? ' anonymous' : '') + '">' + initials + '</div>' +
                                '<div class="member-info" style="flex:1;min-width:0;">' +
                                    '<div class="member-name" style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;">' + escapeHtml(displayName) + posBadge + statusBadge + anonymousIndicator + (isCurrentUser ? ' <span style="color:#8b5cf6;font-size:0.75rem;">(Tu)</span>' : '') + '</div>' +
                                    '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">' +
                                        '<span class="member-role ' + roleClass + '">' + roleText + '</span>' +
                                        (member.is_placeholder ? ' <span class="member-placeholder-badge">Pendiente</span>' : '') +
                                        (joinedStr ? '<span style="font-size:0.65rem;color:#64748b;">' + joinedStr + '</span>' : '') +
                                    '</div>' +
                                    (contactHtml ? '<div style="margin-top:2px;">' + contactHtml + '</div>' : '') +
                                '</div>' +
                            '</div>' +
                            '<div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">' +
                                payIcon +
                                '<div class="member-position" style="font-size:0.75rem;">' + (function() { var pos = userPositions[member.user_id] || (member.turn_position ? [member.turn_position] : []); if (pos.length === 0) return 'Sin turno'; if (pos.length === 1) return '#' + pos[0]; return '#' + pos.join(', #'); })() + '</div>' +
                            '</div>' +
                        '</div>';
                        
                        // Add action buttons for current user
                        if (isCurrentUser) {
                            html += '<div class="member-actions">';
                            
                            // Toggle Anonymous button
                            html += '<button data-action="grp-toggle-anonymous" data-group-id="' + groupId + '" data-user-id="' + member.user_id + '" data-value="' + !isAnonymous + '" class="action-btn anonymous-btn">' +
                                '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>' +
                                (isAnonymous ? ' Mostrar Nombre' : ' Ocultar Nombre') +
                            '</button>';
                            
                            // Request Role button (only for members and coordinators)
                            if (member.role === 'member' || member.role === 'coordinator') {
                                html += '<button data-action="grp-request-role" data-group-id="' + groupId + '" data-current-role="' + member.role + '" class="action-btn role-btn">' +
                                    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>' +
                                    ' Solicitar Rol' +
                                '</button>';
                            }
                            
                            // Leave Group button
                            if (member.role === 'creator') {
                                html += '<button data-action="grp-transfer-ownership" data-group-id="' + groupId + '" class="action-btn leave-btn warning">' +
                                    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>' +
                                    ' Transferir y Salir' +
                                '</button>';
                            } else {
                                html += '<button data-action="grp-leave-group" data-group-id="' + groupId + '" class="action-btn leave-btn">' +
                                    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>' +
                                    ' Salir del Grupo' +
                                '</button>';
                            }
                            
                            html += '</div>';
                        // Admin action buttons (remove member) for admins/coordinators
                        } else if (!isCurrentUser && (currentUserRole === "creator" || currentUserRole === "coordinator" || currentUserRole === "admin")) {
                            // Cannot remove creator
                            if (member.role !== "creator") {
                                // safeName removed — using data-attributes with escapeHtml
                                html += "<div class=\"member-actions\">";
                                html += "<button data-action=\"grp-remove-member\" data-group-id=\"" + groupId + "\" data-user-id=\"" + member.user_id + "\" data-user-name=\"" + escapeHtml(displayName) + "\" class=\"action-btn leave-btn\" style=\"background: rgba(239, 68, 68, 0.1); color: #ef4444;\">" +
                                    "<svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2\"/><circle cx=\"8.5\" cy=\"7\" r=\"4\"/><line x1=\"18\" y1=\"8\" x2=\"23\" y2=\"13\"/><line x1=\"23\" y1=\"8\" x2=\"18\" y2=\"13\"/></svg>" +
                                    " Remover" +
                                "</button>";
                                html += "</div>";
                            }

                        }
                    });

                    list.innerHTML = html;
                    list.style.display = 'block';
                    // Wire search bar
                    var searchInput = document.getElementById("memberSearchInput");
                    if (searchInput) {
                        searchInput.addEventListener("input", function() {
                            var v = this.value.toLowerCase();
                            list.querySelectorAll(".member-card").forEach(function(c) {
                                c.style.display = c.textContent.toLowerCase().includes(v) ? "" : "none";
                            });
                        });
                    }
                    document.getElementById('membersModalSubtitle').textContent = members.length + ' miembros' + (expandedOrder.length > members.length ? ' (' + expandedOrder.length + ' turnos)' : '');
                } else {
                    empty.style.display = 'block';
                }
            } catch (err) {
                loading.innerHTML = '<p style="color: #ef4444;">Error al cargar miembros</p>';
            }
        }

        // ============================================
        // MEMBER ACTION FUNCTIONS
        // ============================================
        
        // Toggle anonymous mode for member
        async function toggleMemberAnonymous(groupId, userId, makeAnonymous) {
            try {
                var apiBase = window.API_BASE_URL || 'https://latanda.online';
                var response = await fetch(apiBase + '/api/groups/' + groupId + '/members/' + userId + '/anonymous', {
                    method: 'PUT',
                    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                    body: JSON.stringify({ is_anonymous: makeAnonymous })
                });
                var result = await response.json();
                
                if (result.success) {
                    showNotification(makeAnonymous ? 'Tu nombre ahora esta oculto' : 'Tu nombre ahora es visible', 'success');
                    // Reload members list
                    showMembersModal(groupId);
                } else {
                    showNotification('Error al cambiar modo anonimo', 'error');
                }
            } catch (err) {
                showNotification(t('messages.connection_error',{defaultValue:'Error de conexion'}), 'error');
            }
        }
        window.toggleMemberAnonymous = toggleMemberAnonymous;
        
        // Confirm leave group
        var pendingLeaveGroupId = null;
        
        async function confirmLeaveGroup(groupId) {
            pendingLeaveGroupId = groupId;
            
            try {
                var apiBase = window.API_BASE_URL || 'https://latanda.online';
                var userId = getCurrentUserId();
                
                var url = apiBase + '/api/groups/' + groupId + '/members/' + userId + '/can-leave';
                
                var response = await fetch(url, { headers: getAuthHeaders() });
                
                var result = await response.json();
                
                var canLeave = (result.data && result.data.can_leave) || result.can_leave;
                
                if (!result.success || !canLeave) {
                    var reason = (result.data && result.data.reason) || result.reason || 'Tienes pagos pendientes';
                    // v4.25.9: Show blockers modal if available
                    var blockers = (result.data && result.data.blockers) || [];
                    if (blockers.length > 0) {
                        var bHtml = blockers.map(function(b) {
                            return '<div style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;background:rgba(239,68,68,0.08);border-radius:8px;margin-bottom:6px;">' +
                                '<i class="fas ' + (b.icon || 'fa-times') + '" style="color:#ef4444;margin-top:2px;flex-shrink:0;"></i>' +
                                '<span style="color:var(--ds-text-secondary,#cbd5e1);font-size:0.85rem;">' + escapeHtml(b.text) + '</span></div>';
                        }).join('');
                        var bm = document.getElementById('leaveBlockerModal');
                        if (bm) bm.remove();
                        bm = document.createElement('div');
                        bm.id = 'leaveBlockerModal';
                        bm.style.cssText = 'position:fixed;inset:0;z-index:10001;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);';
                        bm.innerHTML = '<div style="background:var(--ds-bg-card,#1e293b);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:24px;max-width:420px;width:90%;">' +
                            '<h3 style="color:#ef4444;margin:0 0 12px;font-size:1.1rem;"><i class="fas fa-shield-alt" style="margin-right:8px;"></i>No puedes salir</h3>' +
                            '<p style="color:var(--ds-text-muted,#94a3b8);font-size:0.85rem;margin:0 0 16px;">Motivos:</p>' + bHtml +
                            '<button style="margin-top:16px;width:100%;padding:10px;border:none;border-radius:8px;background:var(--ds-bg-tertiary,#334155);color:var(--ds-text-primary,#f8fafc);cursor:pointer;font-size:0.9rem;" onclick="document.getElementById(\'leaveBlockerModal\').remove()">Entendido</button></div>';
                        document.body.appendChild(bm);
                        bm.addEventListener('click', function(ev) { if (ev.target === bm) bm.remove(); });
                    } else {
                        showNotification('No puedes salir: ' + reason, 'error');
                    }
                    return;
                }
                
                var modal = document.getElementById('leaveGroupConfirmModal');
                if (modal) {
                    modal.style.display = 'flex'; modal.classList.add('active');
                } else {
                }
            } catch (err) {
                // Show confirmation anyway on error
                var modal = document.getElementById('leaveGroupConfirmModal');
                if (modal) {
                    modal.style.display = 'flex'; modal.classList.add('active');
                }
            }
        }
        window.confirmLeaveGroup = confirmLeaveGroup;
        
        function closeLeaveConfirmModal() {
            var modal = document.getElementById('leaveGroupConfirmModal');
            if (modal) { modal.style.display = 'none'; modal.classList.remove('active'); }
            pendingLeaveGroupId = null;
        }
        window.closeLeaveConfirmModal = closeLeaveConfirmModal;
        
        async function executeLeaveGroup() {
            if (!pendingLeaveGroupId) return;
            
            var btn = document.getElementById('confirmLeaveBtn');
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<span class="spinner-small"></span> Saliendo...';
            }
            
            try {
                var apiBase = window.API_BASE_URL || 'https://latanda.online';
                var userId = getCurrentUserId();
                var response = await fetch(apiBase + '/api/groups/' + pendingLeaveGroupId + '/members/' + userId, {
                    method: 'DELETE',
                    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }
                });
                var result = await response.json();
                
                if (result.success) {
                    showNotification('Has salido del grupo exitosamente', 'success');
                    closeLeaveConfirmModal();
                    closeMembersModal();
                    // Reload groups and tandas
                    if (typeof fetchMyGroups === 'function') {
                        fetchMyGroups().then(() => {
                            if (typeof renderGroups === 'function') renderGroups();
                        }).catch(function() {});
                    }
                    if (typeof refreshTandas === 'function') {
                        refreshTandas();
                    }
                } else {
                    showNotification('No se pudo salir del grupo', 'error');
                }
            } catch (err) {
                showNotification(t('messages.connection_error',{defaultValue:'Error de conexion'}), 'error');
            } finally {
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = 'Si, Salir';
                }
            }
        }
        window.executeLeaveGroup = executeLeaveGroup;
        
        // Show request role modal
        var pendingRoleRequest = { groupId: null, currentRole: null };
        
        function showRequestRoleModal(groupId, currentRole) {
            pendingRoleRequest.groupId = groupId;
            pendingRoleRequest.currentRole = currentRole;
            
            var modal = document.getElementById('requestRoleModal');
            var roleOptions = document.getElementById('roleOptionsContainer');
            
            if (modal && roleOptions) {
                // Build role options based on current role
                var html = '';
                if (currentRole === 'member') {
                    html += '<label class="role-option"><input type="radio" name="requestedRole" value="coordinator"> <span>Coordinador</span> <small>Ayuda a gestionar el grupo</small></label>';
                }
                html += '<label class="role-option"><input type="radio" name="requestedRole" value="admin"> <span>Administrador</span> <small>Permisos completos de gestion</small></label>';
                
                roleOptions.innerHTML = html;
                modal.style.display = 'flex'; modal.classList.add('active');
            }
        }
        window.showRequestRoleModal = showRequestRoleModal;
        
        function closeRequestRoleModal() {
            var modal = document.getElementById('requestRoleModal');
            if (modal) { modal.style.display = 'none'; modal.classList.remove('active'); }
            pendingRoleRequest = { groupId: null, currentRole: null };
        }
        window.closeRequestRoleModal = closeRequestRoleModal;
        
        async function submitRoleRequest() {
            var selectedRole = document.querySelector('input[name="requestedRole"]:checked');
            var reason = document.getElementById('roleRequestReason')?.value || '';
            
            if (!selectedRole) {
                showNotification('Selecciona un rol', 'error');
                return;
            }
            
            var btn = document.getElementById('submitRoleRequestBtn');
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<span class="spinner-small"></span> Enviando...';
            }
            
            try {
                var apiBase = window.API_BASE_URL || 'https://latanda.online';
                var userId = getCurrentUserId();
                var response = await fetch(apiBase + '/api/groups/' + pendingRoleRequest.groupId + '/role-requests', {
                    method: 'POST',
                    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        requested_role: selectedRole.value,
                        reason: reason
                    })
                });
                var result = await response.json();
                
                if (result.success) {
                    showNotification('Solicitud enviada. El administrador la revisara pronto.', 'success');
                    closeRequestRoleModal();
                } else {
                    showNotification('Error al enviar solicitud', 'error');
                }
            } catch (err) {
                showNotification(t('messages.connection_error',{defaultValue:'Error de conexion'}), 'error');
            } finally {
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = 'Enviar Solicitud';
                }
            }
        }
        window.submitRoleRequest = submitRoleRequest;
        
        // Transfer ownership modal
        var pendingTransferGroupId = null;
        
        async function showTransferOwnershipModal(groupId) {
            pendingTransferGroupId = groupId;
            
            var modal = document.getElementById('transferOwnershipModal');
            var memberSelect = document.getElementById('newOwnerSelect');
            
            if (!modal || !memberSelect) return;
            
            // Load members for selection
            try {
                var apiBase = window.API_BASE_URL || 'https://latanda.online';
                var response = await fetch(apiBase + '/api/groups/' + groupId + '/members', { headers: getAuthHeaders() });
                var result = await response.json();
                
                if (result.success && result.data.members) {
                    var currentUserId = getCurrentUserId();
                    var html = '<option value="">Selecciona un miembro...</option>';
                    
                    result.data.members.forEach(function(m) {
                        if (m.user_id !== currentUserId) {
                            html += '<option value="' + m.user_id + '">' + escapeHtml(m.name || m.user_id) + ' (' + escapeHtml(m.role) + ')</option>';
                        }
                    });
                    
                    memberSelect.innerHTML = html;
                    modal.style.display = 'flex'; modal.classList.add('active');
                }
            } catch (err) {
                showNotification('Error al cargar miembros', 'error');
            }
        }
        window.showTransferOwnershipModal = showTransferOwnershipModal;
        
        function closeTransferOwnershipModal() {
            var modal = document.getElementById('transferOwnershipModal');
            if (modal) { modal.style.display = 'none'; modal.classList.remove('active'); }
            pendingTransferGroupId = null;
        }
        window.closeTransferOwnershipModal = closeTransferOwnershipModal;
        
        async function executeTransferOwnership() {
            var newOwnerId = document.getElementById('newOwnerSelect')?.value;
            
            if (!newOwnerId) {
                showNotification('Selecciona un miembro para transferir', 'error');
                return;
            }
            
            var btn = document.getElementById('confirmTransferBtn');
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<span class="spinner-small"></span> Transfiriendo...';
            }
            
            try {
                var apiBase = window.API_BASE_URL || 'https://latanda.online';
                var response = await fetch(apiBase + '/api/groups/' + pendingTransferGroupId + '/transfer-ownership', {
                    method: 'POST',
                    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                    body: JSON.stringify({ new_owner_id: newOwnerId })
                });
                var result = await response.json();
                
                if (result.success) {
                    showNotification('Propiedad transferida exitosamente', 'success');
                    closeTransferOwnershipModal();
                    closeMembersModal();
                    // Now can leave group
                    confirmLeaveGroup(pendingTransferGroupId);
                } else {
                    showNotification('Error al transferir propiedad', 'error');
                }
            } catch (err) {
                showNotification(t('messages.connection_error',{defaultValue:'Error de conexion'}), 'error');
            } finally {
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = 'Transferir y Continuar';
                }
            }
        }
        window.executeTransferOwnership = executeTransferOwnership;

        function closeMembersModal() {
            var modal = document.getElementById('groupMembersModal');
            if (modal) {
                modal.style.display = 'none'; modal.classList.remove('active');
                document.body.style.overflow = '';
            }
            currentMembersGroupId = null;
        }

        // Close on overlay click
        document.addEventListener('DOMContentLoaded', function() {
            var modal = document.getElementById('groupMembersModal');
            if (modal) {
                modal.addEventListener('click', function(e) {
                    if (e.target === modal) closeMembersModal();
                });
            }
        });

        // ============================================
        // VIEW PAYMENTS MODAL (Redesigned v4.10.7)
        // ============================================
        var phCurrentGroupId = null;
        var phCurrentTab = 'resumen';
        var phResumenData = null;
        var phHistorialData = null;

        function viewGroupPayments(groupId) {
            closeModal(); // Close admin modal first
            setTimeout(function() {
                // v4.25.4: Payments modal removed — use gestionar.html
                window.location.href = '/gestionar/' + encodeURIComponent(groupId);
            }, 100);
        }
        window.viewGroupPayments = viewGroupPayments;

        var phMethodLabels = {
            'cash': 'Efectivo',
            'bank_transfer': 'Transferencia',
            'mobile_money': 'Tigo Money',
            'card': 'Tarjeta',
            'crypto': 'Crypto',
            'coordinator_manual': 'Manual',
            'coordinator_bulk': 'Masivo'
        };

        // v4.25.4: Payment functions (phFormatAmount, phRenderResumen, phRenderHistorial, showPaymentsModal) removed — in gestionar.html


        // ============================================
        // INVITE MEMBERS MODAL
        // ============================================
        function inviteToGroup(groupId) {
            closeModal(); // Close admin modal first
            setTimeout(function() {
                showInviteModal(groupId);
            }, 100);
        }
        window.inviteToGroup = inviteToGroup;

        // ============================================
        // PRE-ADD MEMBER FUNCTIONS
        // ============================================
        var currentPreAddGroupId = null;

        function openPreAddModal(groupId) {
            closeModal();
            setTimeout(function() {
                currentPreAddGroupId = groupId;
                var modal = document.getElementById('preAddMemberModal');
                if (!modal) return;
                document.getElementById('preAddName').value = '';
                document.getElementById('preAddPhone').value = '';
                document.getElementById('preAddEmail').value = '';
                document.getElementById('preAddPositions').value = '1';
                var errEl = document.getElementById('preAddError');
                errEl.style.display = 'none';
                errEl.textContent = '';
                var sugEl = document.getElementById('preAddSuggestions');
                if (sugEl) sugEl.style.display = 'none';
                modal.style.display = 'flex';
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
                if (window.innerWidth > 768) document.getElementById('preAddName').focus();
            }, 100);
        }
        window.openPreAddModal = openPreAddModal;

        function closePreAddModal() {
            var modal = document.getElementById('preAddMemberModal');
            if (modal) { modal.style.display = 'none'; modal.classList.remove('active'); document.body.style.overflow = ''; }
            currentPreAddGroupId = null;
        }
        window.closePreAddModal = closePreAddModal;

        async function submitPreAdd(skipSuggestions) {
            var nameEl = document.getElementById('preAddName');
            var phoneEl = document.getElementById('preAddPhone');
            var emailEl = document.getElementById('preAddEmail');
            var posEl = document.getElementById('preAddPositions');
            var errEl = document.getElementById('preAddError');
            var btn = document.getElementById('preAddSubmitBtn');
            var sugEl = document.getElementById('preAddSuggestions');
            var name = (nameEl.value || '').trim();
            var phone = (phoneEl.value || '').trim();
            var email = (emailEl.value || '').trim();
            var num_positions = parseInt(posEl.value) || 1;

            errEl.style.display = 'none';
            if (sugEl) sugEl.style.display = 'none';
            if (name.length < 2) {
                errEl.textContent = 'El nombre debe tener al menos 2 caracteres';
                errEl.style.display = 'block';
                return;
            }

            btn.disabled = true;
            btn.textContent = 'Buscando...';
            try {
                var apiBase = window.API_BASE_URL || 'https://latanda.online';
                var payload = { name: name, phone: phone || null, email: email || null, num_positions: num_positions };
                if (skipSuggestions) payload.skip_suggestions = true;
                var resp = await fetch(apiBase + '/api/groups/' + currentPreAddGroupId + '/members/pre-add', {
                    method: 'POST',
                    headers: Object.assign({ 'Content-Type': 'application/json' }, getAuthHeaders()),
                    body: JSON.stringify(payload)
                });
                var data = await resp.json();
                if (!resp.ok || !data.success) {
                    errEl.textContent = (data.error && data.error.message) || data.message || 'Error al agregar miembro';
                    errEl.style.display = 'block';
                    return;
                }
                // Handle suggestions response
                if (data.data && data.data.action === 'confirm_needed') {
                    renderPreAddSuggestions(data.data.suggestions, data.data.original);
                    return;
                }
                closePreAddModal();
                var toastMsg = (data.data && data.data.member && data.data.member.direct_add)
                    ? escapeHtml(name) + ' agregado directamente (ya tiene cuenta)'
                    : 'Miembro pre-agregado: ' + escapeHtml(name);
                if (window.showToast) window.showToast(toastMsg, 'success');
                if (typeof fetchMyGroups === 'function') fetchMyGroups();
            } catch (e) {
                errEl.textContent = 'Error de conexion';
                errEl.style.display = 'block';
            } finally {
                btn.disabled = false;
                btn.textContent = 'Agregar';
            }
        }
        window.submitPreAdd = submitPreAdd;

        function renderPreAddSuggestions(suggestions, original) {
            var container = document.getElementById('preAddSuggestions');
            var list = document.getElementById('preAddSuggestionsList');
            if (!container || !list) return;
            var html = '';
            for (var i = 0; i < suggestions.length; i++) {
                var s = suggestions[i];
                html += '<div style="display: flex; align-items: center; justify-content: space-between; padding: 10px; background: rgba(255,255,255,0.04); border-radius: 8px; margin-bottom: 8px;">';
                html += '<div>';
                html += '<div style="color: #f8fafc; font-weight: 500; font-size: 0.9rem;">' + escapeHtml(s.display_name) + '</div>';
                html += '<div style="color: #94a3b8; font-size: 0.78rem;">';
                if (s.masked_email) html += escapeHtml(s.masked_email);
                if (s.masked_email && s.masked_phone) html += ' &middot; ';
                if (s.masked_phone) html += escapeHtml(s.masked_phone);
                html += '</div></div>';
                html += '<button data-action="grp-confirm-suggestion" data-user-id="' + escapeHtml(s.user_id) + '" style="padding: 6px 14px; background: linear-gradient(135deg, #06b6d4, #0891b2); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.8rem; white-space: nowrap;">Es esta persona</button>';
                html += '</div>';
            }
            list.innerHTML = html;
            container.style.display = 'block';
        }

        async function confirmPreAddSuggestion(userId) {
            var errEl = document.getElementById('preAddError');
            var posEl = document.getElementById('preAddPositions');
            var num_positions = parseInt(posEl.value) || 1;
            errEl.style.display = 'none';
            try {
                var apiBase = window.API_BASE_URL || 'https://latanda.online';
                var resp = await fetch(apiBase + '/api/groups/' + currentPreAddGroupId + '/members/pre-add/confirm', {
                    method: 'POST',
                    headers: Object.assign({ 'Content-Type': 'application/json' }, getAuthHeaders()),
                    body: JSON.stringify({ confirmed_user_id: userId, num_positions: num_positions })
                });
                var data = await resp.json();
                if (!resp.ok || !data.success) {
                    errEl.textContent = (data.error && data.error.message) || data.message || 'Error al confirmar miembro';
                    errEl.style.display = 'block';
                    return;
                }
                closePreAddModal();
                if (window.showToast) window.showToast(t('messages.member_added',{defaultValue:'Miembro agregado directamente al grupo'}), 'success');
                if (typeof fetchMyGroups === 'function') fetchMyGroups();
            } catch (e) {
                errEl.textContent = 'Error de conexion';
                errEl.style.display = 'block';
            }
        }

        // Pre-add modal event delegation
        (function() {
            var paModal = document.getElementById('preAddMemberModal');
            if (!paModal) return;
            paModal.addEventListener('click', function(e) {
                if (e.target === paModal) { closePreAddModal(); return; }
                var btn = e.target.closest('[data-action]');
                if (!btn) return;
                var action = btn.getAttribute('data-action');
                if (action === 'grp-close-pre-add') closePreAddModal();
                else if (action === 'grp-submit-pre-add') submitPreAdd();
                else if (action === 'grp-skip-suggestions') submitPreAdd(true);
                else if (action === 'grp-confirm-suggestion') { var uid = btn.getAttribute('data-user-id'); if (uid) confirmPreAddSuggestion(uid); }
            });
            // Enter key in form
            paModal.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') { e.preventDefault(); submitPreAdd(); }
            });
        })();

        function showInviteModal(groupId) {
            currentInviteGroupId = groupId;
            var modal = document.getElementById('inviteMembersModal');
            if (!modal) return;

            // Reset form
            resetInviteForm();

            // Show modal
            modal.style.display = 'flex';
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function setInviteMethod(method) {
            currentInviteMethod = method;
            var emailBtn = document.getElementById('inviteMethodEmail');
            var phoneBtn = document.getElementById('inviteMethodPhone');
            var emailField = document.getElementById('inviteEmailField');
            var phoneField = document.getElementById('invitePhoneField');
            var emailInput = document.getElementById('inviteeEmail');
            var phoneInput = document.getElementById('inviteePhone');

            if (method === 'email') {
                emailBtn.classList.add('active');
                phoneBtn.classList.remove('active');
                emailField.style.display = 'block';
                phoneField.style.display = 'none';
                emailInput.required = true;
                phoneInput.required = false;
            } else {
                phoneBtn.classList.add('active');
                emailBtn.classList.remove('active');
                emailField.style.display = 'none';
                phoneField.style.display = 'block';
                emailInput.required = false;
                phoneInput.required = true;
            }
        }

        
        // Store the generated invite link
        var lastGeneratedInviteLink = '';
        
        // Copy invite link to clipboard
        function copyInviteLink() {
            var linkInput = document.getElementById('generatedInviteLink');
            if (linkInput && linkInput.value) {
                navigator.clipboard.writeText(linkInput.value).then(function() {
                    document.getElementById('inviteLinkCopied').style.display = 'block';
                    setTimeout(function() {
                        document.getElementById('inviteLinkCopied').style.display = 'none';
                    }, 3000);
                }).catch(function(err) {
                    // Fallback for older browsers
                    linkInput.select();
                    document.execCommand('copy');
                    document.getElementById('inviteLinkCopied').style.display = 'block';
                    setTimeout(function() {
                        document.getElementById('inviteLinkCopied').style.display = 'none';
                    }, 3000);
                });
            }
        }
        window.copyInviteLink = copyInviteLink;
        
        // Share via WhatsApp
        function shareViaWhatsApp() {
            var linkInput = document.getElementById('generatedInviteLink');
            if (linkInput && linkInput.value) {
                var inviteeName = document.getElementById('inviteeName').value.trim() || 'Amigo';
                var text = 'Hola ' + inviteeName + '! Te invito a unirte a mi grupo de ahorro en La Tanda. Usa este link: ' + linkInput.value;
                var whatsappUrl = 'https://wa.me/?text=' + encodeURIComponent(text);
                window.open(whatsappUrl, '_blank');
            }
        }
        window.shareViaWhatsApp = shareViaWhatsApp;

        // Share via Email
        function shareViaEmail() {
            var linkInput = document.getElementById('generatedInviteLink');
            if (linkInput && linkInput.value) {
                var inviteeName = document.getElementById('inviteeName').value.trim() || 'Amigo';
                var subject = encodeURIComponent('Invitacion a La Tanda - Grupo de Ahorro');
                var body = encodeURIComponent('Hola ' + inviteeName + '!\n\nTe invito a unirte a mi grupo de ahorro en La Tanda.\n\nUsa este link para unirte:\n' + linkInput.value + '\n\nSaludos!');
                var mailtoUrl = 'mailto:?subject=' + subject + '&body=' + body;
                window.location.href = mailtoUrl;
            }
        }
        window.shareViaEmail = shareViaEmail;

        // Simplified invitation - just generates a link
        async function submitSimpleInvitation(event) {
            event.preventDefault();

            var name = document.getElementById('inviteeName').value.trim();
            var message = document.getElementById('inviteMessage').value.trim();
            var errorDiv = document.getElementById('inviteError');
            var submitBtn = document.getElementById('inviteSubmitBtn');

            errorDiv.style.display = 'none';
            submitBtn.disabled = true;
            submitBtn.textContent = 'Generando...';

            try {
                var apiBase = window.API_BASE_URL || 'https://latanda.online';
                var userId = getCurrentUserId();

                // Check if a registered user was selected
                var selectedUserId = document.getElementById('selectedUserId') ? document.getElementById('selectedUserId').value : null;

                var inviteData = {
                    inviter_id: userId,
                    invitee_name: name || null,
                    message: message || null,
                    user_id: selectedUserId || null  // Include user_id if inviting existing user
                };

                var response = await fetch(apiBase + '/api/groups/' + currentInviteGroupId + '/members/invite', {
                    method: 'POST',
                    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                    body: JSON.stringify(inviteData)
                });

                var data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error('Error al crear invitacion');
                }

                // Get invitation token from response
                var inviteData = data.data || data;
                var token = inviteData.token || inviteData.invitation_token;
                
                if (!token) {
                    throw new Error('No se pudo obtener el token de invitacion');
                }

                // Store the invite link for sharing
                var inviteLink = 'https://latanda.online/invitaciones.html?token=' + token;
                window.currentInviteLink = inviteLink;
                
                // Set the link in the input field
                document.getElementById('generatedInviteLink').value = inviteLink;

                // Show success with link
                document.getElementById('inviteFormFields').style.display = 'none';
                document.getElementById('inviteFormFooter').style.display = 'none';
                document.getElementById('inviteSuccess').style.display = 'block';

                // Clear selected user after successful invitation
                if (typeof clearSelectedUser === 'function') {
                    clearSelectedUser();
                }

                if (typeof window.showSuccess === 'function') {
                    window.showSuccess(selectedUserId ? 'Invitacion enviada al usuario' : 'Link de invitacion generado');
                }

            } catch (err) {
                errorDiv.textContent = 'Error al crear la invitacion';
                errorDiv.style.display = 'block';
                submitBtn.disabled = false;
                submitBtn.textContent = 'Generar Link';
            }
        }
        window.submitSimpleInvitation = submitSimpleInvitation;


        function resetInviteForm() {
            document.getElementById('inviteForm').reset();
            document.getElementById('inviteFormFields').style.display = 'block';
            document.getElementById('inviteFormFooter').style.display = 'flex';
            document.getElementById('inviteSuccess').style.display = 'none';
            document.getElementById('inviteError').style.display = 'none';
            document.getElementById('inviteSubmitBtn').disabled = false;
            // setInviteMethod removed - simplified form
        }

        async function submitInvitation(event) {
            event.preventDefault();

            var name = document.getElementById('inviteeName').value.trim();
            var email = document.getElementById('inviteeEmail').value.trim();
            var phone = document.getElementById('inviteePhone').value.trim();
            var message = document.getElementById('inviteMessage').value.trim();
            var errorDiv = document.getElementById('inviteError');
            var submitBtn = document.getElementById('inviteSubmitBtn');

            // Validation
            if (currentInviteMethod === 'email' && !email) {
                errorDiv.textContent = 'Por favor ingresa un email';
                errorDiv.style.display = 'block';
                return;
            }
            if (currentInviteMethod === 'phone' && !phone) {
                errorDiv.textContent = 'Por favor ingresa un telefono';
                errorDiv.style.display = 'block';
                return;
            }

            errorDiv.style.display = 'none';
            submitBtn.disabled = true;
            submitBtn.textContent = 'Enviando...';

            try {
                var apiBase = window.API_BASE_URL || 'https://latanda.online';
                var userId = getCurrentUserId();

                var inviteData = {
                    inviter_id: userId,
                    invitee_name: name || null,
                    message: message || null
                };

                if (currentInviteMethod === 'email') {
                    inviteData.invitee_email = email;
                } else {
                    inviteData.invitee_phone = phone;
                }

                var response = await fetch(apiBase + '/api/groups/' + currentInviteGroupId + '/members/invite', {
                    method: 'POST',
                    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                    body: JSON.stringify(inviteData)
                });

                var data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(data.data?.error?.message || 'Error al enviar invitacion');
                }

                // Show success
                document.getElementById('inviteFormFields').style.display = 'none';
                document.getElementById('inviteFormFooter').style.display = 'none';
                document.getElementById('inviteSuccess').style.display = 'block';

                if (typeof window.showSuccess === 'function') {
                    window.showSuccess('Invitacion enviada exitosamente');
                    // Refresh groups to show updated member count
                    if (typeof fetchMyGroups === 'function') fetchMyGroups();
                }

            } catch (err) {
                errorDiv.textContent = 'Error al enviar la invitacion';
                errorDiv.style.display = 'block';
                submitBtn.disabled = false;
                submitBtn.textContent = 'Enviar Invitacion';
            }
        }

        function closeInviteModal() {
            var modal = document.getElementById('inviteMembersModal');
            if (modal) {
                modal.style.display = 'none'; modal.classList.remove('active');
                document.body.style.overflow = '';
            }
            currentInviteGroupId = null;
        }

        // Close on overlay click
        document.addEventListener('DOMContentLoaded', function() {
            var modal = document.getElementById('inviteMembersModal');
            if (modal) {
                modal.addEventListener('click', function(e) {
                    if (e.target === modal) closeInviteModal();
                });
            }
        });


        // ============================================
        // PENDING INVITATIONS & REMINDERS
        // ============================================
        
        async function loadPendingInvitations(groupId) {
            try {
                var apiBase = window.API_BASE_URL || "https://latanda.online";
                var userId = getCurrentUserId();
                var response = await fetch(apiBase + "/api/invitations/sent/" + userId, { headers: getAuthHeaders() });
                var data = await response.json();
                
                if (data.success && data.data && data.data.invitations) {
                    var groupInvitations = data.data.invitations.filter(function(inv) {
                        return inv.group_id === groupId && inv.status === "pending";
                    });
                    
                    var container = document.getElementById("pendingInvitationsList");
                    if (!container) return;
                    
                    if (groupInvitations.length === 0) {
                        container.innerHTML = "<p style=\"font-size: 0.875rem; color: #9ca3af; text-align: center; padding: 1rem;\">No hay invitaciones pendientes</p>";
                        return;
                    }
                    
                    var html = "";
                    groupInvitations.forEach(function(inv) {
                        var name = inv.invitee_name || inv.invitee_email || inv.invitee_phone || "Invitado";
                        var safeName = name.replace(/\x27/g, "\\\x27");
                        var contact = inv.invitee_email || inv.invitee_phone || "";
                        var expiresDate = new Date(inv.expires_at);
                        var isExpired = expiresDate < new Date();
                        var reminderCount = inv.reminder_count || 0;
                        var lastReminded = inv.last_reminded_at ? new Date(inv.last_reminded_at) : null;
                        var canRemind = true;
                        
                        if (lastReminded) {
                            var hoursSince = (Date.now() - lastReminded.getTime()) / (1000 * 60 * 60);
                            canRemind = hoursSince >= 24;
                        }
                        
                        html += "<div class=\"invitation-card\" style=\"background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 0.75rem 1rem; margin-bottom: 0.5rem; display: flex; align-items: center; justify-content: space-between;\">";
                        html += "<div style=\"flex: 1;\">";
                        html += "<div style=\"font-weight: 500; font-size: 0.875rem; color: #e2e8f0;\">" + escapeHtml(name) + "</div>";
                        if (contact) {
                            html += "<div style=\"font-size: 0.75rem; color: #94a3b8;\">" + escapeHtml(contact) + "</div>";
                        }
                        if (reminderCount > 0) {
                            html += "<div style=\"font-size: 0.7rem; color: #9ca3af; margin-top: 0.25rem;\">Recordatorios enviados: " + reminderCount + "</div>";
                        }
                        html += "</div>";
                        
                        if (!isExpired && canRemind) {
                            html += "<button type=\"button\" data-action=\"grp-send-reminder\" data-group-id=\"" + groupId + "\" data-invitation-id=\"" + inv.id + "\" data-invitee-name=\"" + escapeHtml(safeName) + "\" class=\"action-btn\" style=\"background: rgba(139, 92, 246, 0.1); color: #8b5cf6; font-size: 0.8rem; padding: 0.5rem 0.75rem;\">";
                            html += "<svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z\"/></svg>";
                            html += " Recordar";
                            html += "</button>";
                        } else if (!canRemind) {
                            html += "<span style=\"font-size: 0.7rem; color: #9ca3af;\">Espera 24h</span>";
                        } else if (isExpired) {
                            html += "<span style=\"font-size: 0.7rem; color: #ef4444;\">Expirado</span>";
                        }

                        // Delete button - always show for pending invitations
                        html += "<button type=\"button\" data-action=\"grp-delete-invitation\" data-group-id=\"" + groupId + "\" data-invitation-id=\"" + inv.id + "\" data-invitee-name=\"" + escapeHtml(safeName) + "\" style=\"background: rgba(239, 68, 68, 0.1); color: #ef4444; padding: 6px 8px; border: none; border-radius: 6px; cursor: pointer; margin-left: 8px; display: inline-flex; align-items: center;\" title=\"Eliminar\">";                        html += "<svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><polyline points=\"3 6 5 6 21 6\"/><path d=\"M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2\"/></svg>";                        html += "</button>";
                        
                        html += "</div>";
                    });
                    
                    container.innerHTML = html;
                }
            } catch (err) {
            }
        }
        window.loadPendingInvitations = loadPendingInvitations;

        // Delete pending invitation
        async function deleteInvitation(groupId, invitationId, inviteeName) {
            showConfirm("Eliminar la invitacion para " + escapeHtml(inviteeName) + "? Esta accion no se puede deshacer.", async function() {
            try {
                var apiBase = window.API_BASE_URL || "https://latanda.online";
                var response = await fetch(apiBase + "/api/groups/" + groupId + "/invitations/" + invitationId, {
                    method: "DELETE",
                    headers: getAuthHeaders()
                });
                var result = await response.json();

                if (result.success) {
                    showNotification("Invitación eliminada", "success");
                    loadPendingInvitations(groupId);
                } else {
                    showNotification("Error al eliminar la invitacion", "error");
                }
            } catch (err) {
                showNotification("Error al eliminar invitacion", "error");
            }
            }); // end showConfirm
        }
        window.deleteInvitation = deleteInvitation;
        
        // Send invitation reminder with promotional card
        async function sendInvitationReminder(groupId, invitationId, inviteeName) {
            try {
                var apiBase = window.API_BASE_URL || "https://latanda.online";
                var response = await fetch(apiBase + "/api/groups/" + groupId + "/invitations/" + invitationId + "/remind", {
                    method: "POST",
                    headers: Object.assign({}, getAuthHeaders(), {"Content-Type": "application/json"})
                });
                var result = await response.json();
                
                if (result.success) {
                    var data = result.data || result;
                    showNotification("Recordatorio registrado para " + inviteeName, "success");
                    
                    var groupData = null;
                    if (window.myGroupsCache) {
                        groupData = window.myGroupsCache.find(function(g) { return g.group_id === groupId; });
                    }
                    if (!groupData && window.currentGroupsData) {
                        groupData = window.currentGroupsData.find(function(g) { return g.group_id === groupId; });
                    }
                    
                    if (data.invite_link) {
                        if (!window.InvitationCardGenerator && window.LaTandaComponentLoader) {
                            await LaTandaComponentLoader.loadInvitationCards();
                        }
                        
                        if (window.InvitationCardGenerator) {
                            var currentUser = JSON.parse(localStorage.getItem("latanda_user") || "{}");
                            var inviterName = currentUser.name || currentUser.email || "Tu amigo";
                            
                            InvitationCardGenerator.show({
                                groupName: groupData ? groupData.name : "Grupo de Ahorro",
                                groupDesc: groupData ? (groupData.description || "Únete a nuestra tanda") : "Únete a nuestra tanda",
                                contribution: groupData ? parseFloat(groupData.contribution_amount) : 0,
                                frequency: groupData ? groupData.frequency : "monthly",
                                members: groupData ? parseInt(groupData.members_count || groupData.member_count || 0) : 0,
                                maxMembers: groupData ? parseInt(groupData.max_members) : 10,
                                inviteLink: data.invite_link,
                                inviterName: inviterName,
                                theme: "purple"
                            });
                        } else {
                            showConfirm("Compartir el link de invitacion por WhatsApp?", function() {
                                var text = "Hola " + inviteeName + "! Te recuerdo que tienes una invitacion pendiente. Usa este link: " + data.invite_link;
                                var whatsappUrl = "https://wa.me/?text=" + encodeURIComponent(text);
                                window.open(whatsappUrl, "_blank");
                            });
                        }
                    }
                    
                    loadPendingInvitations(groupId);
                } else {
                    showNotification("Error al enviar recordatorio", "error");
                }
            } catch (err) {
                showNotification("Error de conexion", "error");
            }
        }
        window.sendInvitationReminder = sendInvitationReminder;

        // ============================================
        // USER SEARCH FOR INVITATIONS
        // ============================================
        var userSearchTimeout = null;
        var selectedInviteUser = null;

        async function searchUsersToInvite(query) {
            clearTimeout(userSearchTimeout);
            var resultsDiv = document.getElementById('userSearchResults');

            if (!query || query.length < 2) {
                resultsDiv.innerHTML = '';
                return;
            }

            userSearchTimeout = setTimeout(async function() {
                try {
                    resultsDiv.innerHTML = '<p style="font-size: 0.8125rem; color: #94a3b8; padding: 8px;">Buscando...</p>';

                    var apiBase = window.API_BASE_URL || 'https://latanda.online';
                    var groupId = currentInviteGroupId || '';
                    var response = await fetch(apiBase + '/api/users/search-to-invite?q=' + encodeURIComponent(query) + '&group_id=' + groupId, {
                        headers: getAuthHeaders()
                    });
                    var result = await response.json();

                    if (result.success && result.data.users.length > 0) {
                        var html = '';
                        result.data.users.forEach(function(user) {
                            html += '<div data-action="grp-select-invite-user" data-user-id="' + escapeHtml(user.user_id) + '" data-user-name="' + escapeHtml(user.name) + '" data-user-email="' + escapeHtml(user.email_masked) + '" ';
                            html += 'class="grp-search-result-item" style="padding: 10px 12px; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; justify-content: space-between; align-items: center;">';
                            html += '<div>';
                            html += '<div style="font-weight: 500; color: #f8fafc;">' + escapeHtml(user.name) + '</div>';
                            html += '<div style="font-size: 0.75rem; color: #94a3b8;">' + escapeHtml(user.email_masked) + '</div>';
                            html += '</div>';
                            html += '<span style="font-size: 0.6875rem; padding: 2px 6px; border-radius: 4px; ' + (user.status === 'verified' ? 'background: rgba(16,185,129,0.15); color: #10b981;' : 'background: rgba(245,158,11,0.15); color: #f59e0b;') + '">' + (user.status === 'verified' ? 'Verificado' : 'Sin verificar') + '</span>';
                            html += '</div>';
                        });
                        resultsDiv.innerHTML = html;
                    } else {
                        resultsDiv.innerHTML = '<p style="font-size: 0.8125rem; color: #9ca3af; padding: 8px; text-align: center;">No se encontraron usuarios</p>';
                    }
                } catch (err) {
                    resultsDiv.innerHTML = '<p style="font-size: 0.8125rem; color: #dc2626; padding: 8px;">Error al buscar</p>';
                }
            }, 300);
        }

        function selectUserToInvite(userId, userName, userEmail) {
            selectedInviteUser = { user_id: userId, name: userName, email: userEmail };

            document.getElementById('userSearchResults').innerHTML = '';
            document.getElementById('userSearchInput').value = '';

            document.getElementById('selectedUserId').value = userId;
            document.getElementById('selectedUserName').textContent = userName;
            document.getElementById('selectedUserEmail').textContent = userEmail;
            document.getElementById('selectedUserDisplay').style.display = 'block';

            // Update the invitee name field
            document.getElementById('inviteeName').value = userName;
        }

        function clearSelectedUser() {
            selectedInviteUser = null;
            document.getElementById('selectedUserId').value = '';
            document.getElementById('selectedUserDisplay').style.display = 'none';
            document.getElementById('inviteeName').value = '';
        }

        window.searchUsersToInvite = searchUsersToInvite;
        window.selectUserToInvite = selectUserToInvite;
        window.clearSelectedUser = clearSelectedUser;



        // ============================================
        // REMOVE MEMBER FUNCTIONALITY
        // ============================================
        var pendingRemoveMember = { groupId: null, userId: null, userName: null };
        
        async function confirmRemoveMember(groupId, userId, userName) {
            pendingRemoveMember = { groupId: groupId, userId: userId, userName: userName };
            showConfirm("Estas seguro de que deseas remover a " + escapeHtml(userName) + " del grupo?\n\nEsta accion no se puede deshacer.", async function() {
                await executeRemoveMember();
            });
        }
        window.confirmRemoveMember = confirmRemoveMember;
        
        async function executeRemoveMember() {
            if (!pendingRemoveMember.groupId || !pendingRemoveMember.userId) return;
            
            try {
                var apiBase = window.API_BASE_URL || "https://latanda.online";
                var response = await fetch(apiBase + "/api/groups/" + pendingRemoveMember.groupId + "/members/" + pendingRemoveMember.userId, {
                    method: "DELETE",
                    headers: Object.assign({}, getAuthHeaders(), {"Content-Type": "application/json"}),
                    body: JSON.stringify({ action: "remove" })
                });
                var result = await response.json();
                
                if (result.success) {
                    showNotification(pendingRemoveMember.userName + " ha sido removido del grupo", "success");
                    showMembersModal(pendingRemoveMember.groupId);
                    pendingRemoveMember = { groupId: null, userId: null, userName: null };
                } else {
                    showNotification("No se pudo remover al miembro", "error");
                }
            } catch (err) {
                showNotification("Error de conexion", "error");
            }
        }
        window.executeRemoveMember = executeRemoveMember;

// --- Block 6 (originally inline) ---
// ============================================
        // EDIT GROUP MODAL FUNCTIONS
        // ============================================
        var currentEditGroupId = null;

        function editGroup(groupId) {
            closeModal(); // Close admin modal first
            setTimeout(function() {
                showEditGroupModal(groupId);
            }, 100);
        }
        window.editGroup = editGroup;

        async function showEditGroupModal(groupId) {
            currentEditGroupId = groupId;
            var modal = document.getElementById('editGroupModal');
            var loading = document.getElementById('editGroupLoading');
            var formFields = document.getElementById('editGroupFormFields');
            var success = document.getElementById('editGroupSuccess');

            // Reset state
            if (loading) loading.style.display = 'flex';
            if (formFields) formFields.style.display = 'none';
            if (success) success.style.display = 'none';

            var errorDiv = document.getElementById('editGroupError');
            if (errorDiv) errorDiv.style.display = 'none';

            var submitBtn = document.getElementById('editGroupSubmitBtn');
            if (submitBtn) submitBtn.disabled = false;

            var footer = document.getElementById('editGroupFormFooter');
            if (footer) footer.style.display = 'flex';

            // Show modal
            modal.style.display = 'flex'; modal.classList.add('active');
            document.body.style.overflow = 'hidden';

            // Load group data
            try {
                var apiBase = window.API_BASE_URL || 'https://latanda.online';
                var response = await fetch(apiBase + '/api/groups/' + groupId, { headers: getAuthHeaders() });
                var data = await response.json();

                if (!data.success) {
                    throw new Error('Error al cargar datos del grupo');
                }

                var group = data.data.data || data.data;

                // Populate form
                document.getElementById('editGroupName').value = group.name || '';
                document.getElementById('editGroupDescription').value = group.description || '';
                document.getElementById('editGroupAmount').value = group.contribution_amount || '';
                document.getElementById('editGroupFrequency').value = group.frequency || 'weekly';
                document.getElementById('editGroupMaxMembers').value = group.max_members || '';
                document.getElementById('editGroupLocation').value = group.location || '';
                document.getElementById('editGroupStartDate').value = group.start_date ? group.start_date.split('T')[0] : '';
                document.getElementById('editGroupStatus').value = group.status || 'active';

                var thresholdField = document.getElementById('editGroupThreshold');
                if (thresholdField) thresholdField.value = group.advance_threshold || 80;

                if (loading) loading.style.display = 'none';
                if (formFields) formFields.style.display = 'block';

            } catch (err) {
                if (loading) {
                    loading.innerHTML = '<p style="color: #ef4444;">Error al cargar datos</p><button type="button" data-action="grp-retry-edit-load" style="margin-top: 16px; padding: 10px 20px; background: rgba(0,255,255,0.2); color: #00FFFF; border: 1px solid rgba(0,255,255,0.3); border-radius: 8px; cursor: pointer;">Reintentar</button>';
                }
            }
        }

        function closeEditGroupModal() {
            var modal = document.getElementById('editGroupModal');
            if (modal) {
                modal.style.display = 'none'; modal.classList.remove('active');
                document.body.style.overflow = '';
            }
            currentEditGroupId = null;
        }

        // ===== DELETE GROUP FUNCTIONALITY =====
        var deleteGroupId = null;
        
        function confirmDeleteGroup(groupId) {
            deleteGroupId = groupId;
            
            // Find the group to show its name
            var group = (window.currentGroupsData || []).find(function(g) { return g.group_id == groupId || g.id == groupId; });
            var groupName = group ? group.name : 'este grupo';
            
            // Update modal content
            document.getElementById('deleteGroupName').textContent = groupName;
            
            // Show modal
            var modal = document.getElementById('deleteGroupModal');
            if (modal) {
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
            
            // Close admin modal if open
            var adminModal = document.getElementById('groupManageModal');
            if (adminModal) {
                adminModal.style.display = 'none';
            }
        }
        window.confirmDeleteGroup = confirmDeleteGroup;
        
        function closeDeleteGroupModal() {
            var modal = document.getElementById('deleteGroupModal');
            if (modal) {
                modal.style.display = 'none'; modal.classList.remove('active');
                document.body.style.overflow = '';
            }
            deleteGroupId = null;
        }
        
        async function executeDeleteGroup() {
            if (!deleteGroupId) {
                showNotification('Error: No se seleccionó ningún grupo', 'error');
                return;
            }
            
            var deleteBtn = document.getElementById('confirmDeleteBtn');
            if (deleteBtn) {
                deleteBtn.disabled = true;
                deleteBtn.innerHTML = '<span class="spinner-small"></span> Eliminando...';
            }
            
            try {
                var response = await fetch((window.API_BASE_URL || 'https://latanda.online') + '/api/groups/' + deleteGroupId, {
                    method: 'DELETE',
                    headers: { ...getAuthHeaders(),
                        'Content-Type': 'application/json'
                    }
                });
                
                var result = await response.json();
                
                if (response.ok && result.success) {
                    showNotification('Grupo eliminado exitosamente', 'success');
                    closeDeleteGroupModal();
                    
                    // Refresh groups list
                    await fetchMyGroups();
                    renderGroups();

                    // Also refresh tandas tab to sync turn positions
                    if (typeof refreshTandas === 'function') {
                        refreshTandas();
                    }
                } else {
                    var errorMsg = 'No se pudo eliminar el grupo';
                    
                    // Special handling for groups with contributions
                    if (errorMsg.includes('contribuciones') || errorMsg.includes('contributions')) {
                        showNotification('No se puede eliminar: el grupo tiene contribuciones registradas. Debe completar el ciclo.', 'error');
                    } else {
                        showNotification(errorMsg, 'error');
                    }
                }
            } catch (error) {
                showNotification('Error de conexión al eliminar grupo', 'error');
            } finally {
                if (deleteBtn) {
                    deleteBtn.disabled = false;
                    deleteBtn.innerHTML = 'Sí, Eliminar Grupo';
                }
            }
        }
        // Expose delete functions to window
        window.confirmDeleteGroup = confirmDeleteGroup;
        window.closeDeleteGroupModal = closeDeleteGroupModal;
        window.executeDeleteGroup = executeDeleteGroup;
        // ===== END DELETE GROUP FUNCTIONALITY =====

        // ===== MANAGE TURNS FUNCTIONALITY =====
        var manageTurnsGroupId = null;
        var turnsMembers = [];
        
        async function manageTurns(groupId) {
            manageTurnsGroupId = groupId;
            
            // Close admin modal if open
            var adminModal = document.getElementById('groupManageModal');
            if (adminModal) {
                adminModal.style.display = 'none';
            }
            
            // Show loading in modal
            var modal = document.getElementById('manageTurnsModal');
            if (modal) {
                modal.style.display = 'flex';
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
            
            // Load members with their turn positions
            // Load expanded turns system if not loaded
            try { if (!window.expandMembersToPositions && window.LaTandaComponentLoader) {
                await LaTandaComponentLoader.loadExpandedTurns(); } } catch(e) { /* expanded turns optional — fails silently if not available */ }
            
            await loadTurnsMembers(groupId);
        }
        
        async function loadTurnsMembers(groupId) {
            var loadingDiv = document.getElementById('turnsLoading');
            var contentDiv = document.getElementById('turnsContent');
            var errorDiv = document.getElementById('turnsError');
            
            if (loadingDiv) loadingDiv.style.display = 'block';
            if (contentDiv) contentDiv.style.display = 'none';
            if (errorDiv) errorDiv.style.display = 'none';
            
            try {
                var response = await fetch((window.API_BASE_URL || 'https://latanda.online') + '/api/groups/' + groupId + '/members', { headers: getAuthHeaders() });
                var result = await response.json();
                
                if (result.success && (result.members || result.data?.members)) {
                    turnsMembers = (result.members || result.data?.members || []).map(function(m) {
                        m.turn_locked = m.turn_locked || false;
                        m.num_positions = parseInt(m.num_positions) || 1;
                        return m;
                    }).sort(function(a, b) {
                        return (a.turn_position || 999) - (b.turn_position || 999);
                    });
                    // Use expanded_order from API if available, otherwise expand from members
                    var expandedOrder = result.expanded_order || result.data?.expanded_order;
                    if (expandedOrder && expandedOrder.length > 0) {
                        // Reconstruct expandedTurns from server's expanded_order
                        var memberMap = {};
                        turnsMembers.forEach(function(m) { memberMap[m.user_id] = m; });
                        
                        window.expandedTurns = expandedOrder.map(function(pos) {
                            var member = memberMap[pos.user_id];
                            var posLocks = member ? (member.position_locks || []) : [];
                            var lockInfo = posLocks[pos.slot] || {};
                            return {
                                user_id: pos.user_id,
                                name: member ? member.name : 'Usuario',
                                role: member ? member.role : 'member',
                                slot_index: pos.slot || 0,
                                total_slots: member ? member.num_positions : 1,
                                turn_locked: lockInfo.locked === true,
                                original_member: member
                            };
                        });
                    } else if (window.expandMembersToPositions) {
                        // Fallback: expand from members (positions will be consecutive)
                        window.expandedTurns = window.expandMembersToPositions(turnsMembers);
                    }
                    renderTurnsList();
                } else {
                    showTurnsError('No se pudieron cargar los miembros');
                }
            } catch (error) {
            } finally {
                if (loadingDiv) loadingDiv.style.display = 'none';
            }
        }
        
function renderTurnsList() {
            var contentDiv = document.getElementById('turnsContent');
            if (!contentDiv) return;
            
            // Use expanded turns if available, otherwise fall back to turnsMembers
            var displayList = window.expandedTurns || turnsMembers.map(function(m, i) {
                return { user_id: m.user_id, name: m.name || m.full_name, role: m.role, slot_index: 0, total_slots: 1, turn_locked: m.turn_locked };
            });
            
            // Lottery action bar
            var actionsHtml = '<div style="display: flex; gap: 10px; margin-bottom: 16px; padding: 12px; background: rgba(245,158,11,0.1); border-radius: 10px; border: 1px solid rgba(245,158,11,0.3); flex-wrap: wrap;">' +
                '<button data-action="grp-start-lottery-countdown" style="flex: 1; min-width: 140px; padding: 10px 16px; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 8px;"><span style="font-size: 1.2rem;">🎲</span> Iniciar Ahora</button>' +
                '<button data-action="grp-open-schedule-lottery" style="flex: 1; min-width: 140px; padding: 10px 16px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 8px;"><span style="font-size: 1.2rem;">📅</span> Programar</button>' +
            '</div>';
            
            var html = actionsHtml + '<div id="turnsList" style="display: flex; flex-direction: column; gap: 8px;">';
            
            displayList.forEach(function(pos, index) {
                var position = index + 1;
                var isLocked = pos.turn_locked === true;
                var lockIcon = isLocked ? '🔒' : '🔓';
                var lockBg = isLocked ? '#059669' : '#374151';
                var itemBg = isLocked ? '#1e3a3a' : '#1e293b';
                var itemBorder = isLocked ? '#059669' : '#334155';
                
                // Show name with position indicator if member has multiple slots
                var displayName = pos.name || 'Usuario';
                if (pos.total_slots > 1) {
                    displayName += ' ' + (pos.slot_index + 1) + '/' + pos.total_slots;
                }
                var placeholderBadge = (pos.original_member && pos.original_member.is_placeholder) ? ' <span class="member-placeholder-badge">Pendiente</span>' : '';

                var roleText = (pos.role === 'creator' || pos.role === 'admin') ? 'Administrador' : 'Miembro';
                if (isLocked) roleText += ' • Anclado';
                
                html += '<div class="turn-item' + (isLocked ? ' turn-locked' : '') + '" ' + 
                    (!isLocked ? 'draggable="true"' : '') + 
                    ' data-user-id="' + pos.user_id + '" data-index="' + index + '" data-slot="' + pos.slot_index + '" data-locked="' + isLocked + '" ' +
                    'style="display: flex; align-items: center; gap: 12px; padding: 12px; background: ' + itemBg + '; border: 1px solid ' + itemBorder + '; border-radius: 10px; cursor: ' + (!isLocked ? 'grab' : 'default') + ';">' +
                    '<div style="width: 32px; height: 32px; background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; color: white; font-size: 0.875rem;">' + position + '</div>' +
                    '<div style="flex: 1;">' +
                        '<div style="font-weight: 500; color: #f8fafc;">' + escapeHtml(displayName) + placeholderBadge + '</div>' +
                        '<div style="font-size: 0.75rem; color: #9ca3af;">' + escapeHtml(roleText) + '</div>' +
                    '</div>' +
                    '<button data-action="grp-toggle-lock" data-index="' + index + '" style="width: 32px; height: 32px; background: ' + lockBg + '; border: none; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1rem;" title="' + (isLocked ? 'Desbloquear' : 'Anclar posicion') + '">' + lockIcon + '</button>' +
                    '<div style="display: flex; align-items: center; gap: 3px; background: #374151; padding: 4px 6px; border-radius: 6px;" title="Posiciones">' +
                        '<button data-action="grp-remove-position" data-user-id="' + pos.user_id + '" data-slot="' + pos.slot_index + '" style="width: 22px; height: 22px; background: ' + (pos.total_slots > 1 ? '#dc2626' : '#4b5563') + '; border: none; border-radius: 4px; color: white; cursor: ' + (pos.total_slots > 1 ? 'pointer' : 'not-allowed') + '; font-size: 1rem; opacity: ' + (pos.total_slots > 1 ? '1' : '0.4') + ';" ' + (pos.total_slots > 1 ? '' : 'disabled') + '>-</button>' +
                        '<span style="min-width: 20px; text-align: center; color: #f59e0b; font-weight: 600; font-size: 0.85rem;">' + pos.total_slots + '</span>' +
                        '<button data-action="grp-add-position" data-user-id="' + pos.user_id + '" style="width: 22px; height: 22px; background: #059669; border: none; border-radius: 4px; color: white; cursor: pointer; font-size: 1rem;">+</button>' +
                    '</div>' +
                    '<div style="display: flex; gap: 4px;">' +
                        '<button data-action="grp-move-up" data-index="' + index + '" style="width: 28px; height: 28px; background: #374151; border: none; border-radius: 6px; color: ' + (isLocked ? '#4b5563' : '#9ca3af') + '; cursor: ' + (isLocked || index === 0 ? 'not-allowed' : 'pointer') + '; display: flex; align-items: center; justify-content: center; opacity: ' + (isLocked || index === 0 ? '0.3' : '1') + ';" ' + (isLocked || index === 0 ? 'disabled' : '') + '>' +
                            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 15l-6-6-6 6"/></svg>' +
                        '</button>' +
                        '<button data-action="grp-move-down" data-index="' + index + '" style="width: 28px; height: 28px; background: #374151; border: none; border-radius: 6px; color: ' + (isLocked ? '#4b5563' : '#9ca3af') + '; cursor: ' + (isLocked || index === displayList.length - 1 ? 'not-allowed' : 'pointer') + '; display: flex; align-items: center; justify-content: center; opacity: ' + (isLocked || index === displayList.length - 1 ? '0.3' : '1') + ';" ' + (isLocked || index === displayList.length - 1 ? 'disabled' : '') + '>' +
                            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>' +
                        '</button>' +
                    '</div>' +
                    (pos.slot_index === 0 ? '<button data-action="grp-remove-from-turns" data-user-id="' + pos.user_id + '" style="width: 28px; height: 28px; background: #dc2626; border: none; border-radius: 6px; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; font-weight: 700; margin-left: 2px;" title="Eliminar del turno">&#x2715;</button>' : '') +
                '</div>';
            });
            
            html += '</div>';

            // Unassigned members section — members in group but not in turns_order
            var assignedUserIds = {};
            displayList.forEach(function(pos) { assignedUserIds[pos.user_id] = true; });
            var unassigned = turnsMembers.filter(function(m) { return !assignedUserIds[m.user_id]; });
            if (unassigned.length > 0) {
                html += '<div style="margin-top: 16px; padding: 12px; background: rgba(251,191,36,0.08); border: 1px solid rgba(251,191,36,0.2); border-radius: 10px;">' +
                    '<div style="font-size: 0.82rem; font-weight: 600; color: #d97706; margin-bottom: 10px;">Miembros sin turno asignado (' + unassigned.length + ')</div>';
                unassigned.forEach(function(m) {
                    var initials = (m.name || 'U').charAt(0).toUpperCase();
                    var phBadge = m.is_placeholder ? ' <span class="member-placeholder-badge">Pendiente</span>' : '';
                    html += '<div style="display: flex; align-items: center; gap: 10px; padding: 8px; background: rgba(30,41,59,0.6); border-radius: 8px; margin-bottom: 6px;">' +
                        '<div style="width: 32px; height: 32px; background: rgba(251,191,36,0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; color: #f59e0b; font-size: 0.85rem;">' + escapeHtml(initials) + '</div>' +
                        '<div style="flex: 1;">' +
                            '<div style="font-weight: 500; color: #f8fafc; font-size: 0.88rem;">' + escapeHtml(m.name || 'Usuario') + phBadge + '</div>' +
                            '<div style="font-size: 0.72rem; color: #94a3b8;">' + (m.num_positions > 1 ? m.num_positions + ' posiciones' : '1 posicion') + '</div>' +
                        '</div>' +
                        '<button data-action="grp-add-to-turns" data-user-id="' + escapeHtml(m.user_id) + '" style="padding: 6px 14px; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.78rem; font-weight: 600;">Agregar</button>' +
                    '</div>';
                });
                html += '</div>';
            }

            contentDiv.innerHTML = html;
            contentDiv.style.display = 'block';

            // Enable drag and drop (only for unlocked items)
            initExpandedDragAndDrop();
        }
        
        // Add unassigned member to turns list
        function addMemberToTurns(userId) {
            var member = turnsMembers.find(function(m) { return m.user_id === userId; });
            if (!member) return;
            if (!window.expandedTurns) window.expandedTurns = [];
            var numPos = member.num_positions || 1;
            for (var s = 0; s < numPos; s++) {
                window.expandedTurns.push({
                    user_id: member.user_id,
                    name: member.name || 'Usuario',
                    role: member.role || 'member',
                    slot_index: s,
                    total_slots: numPos,
                    turn_locked: false,
                    original_member: member
                });
            }
            // Update total_slots on all entries for this user
            window.expandedTurns.forEach(function(pos) {
                if (pos.user_id === userId) pos.total_slots = numPos;
            });
            renderTurnsList();
        }
        window.addMemberToTurns = addMemberToTurns;

        // Remove member from turns list (back to unassigned)
        function removeMemberFromTurns(userId) {
            if (!window.expandedTurns) return;
            window.expandedTurns = window.expandedTurns.filter(function(pos) { return pos.user_id !== userId; });
            renderTurnsList();
        }
        window.removeMemberFromTurns = removeMemberFromTurns;

        // Move position up in expanded list
        function moveExpandedUp(index) {
            if (!window.expandedTurns || index <= 0) return;
            if (window.expandedTurns[index].turn_locked) return;
            // Also check if destination is locked
            if (window.expandedTurns[index - 1].turn_locked) return;
            var temp = window.expandedTurns[index];
            window.expandedTurns[index] = window.expandedTurns[index - 1];
            window.expandedTurns[index - 1] = temp;
            renderTurnsList();
        }
        
        // Move position down in expanded list
        function moveExpandedDown(index) {
            if (!window.expandedTurns) return;
            if (window.expandedTurns[index].turn_locked) return;
            if (index >= window.expandedTurns.length - 1) return;
            // Also check if destination is locked
            if (window.expandedTurns[index + 1].turn_locked) return;
            var temp = window.expandedTurns[index];
            window.expandedTurns[index] = window.expandedTurns[index + 1];
            window.expandedTurns[index + 1] = temp;
            renderTurnsList();
        }
        
        // Toggle lock on expanded position
        function toggleExpandedLock(index) {
            if (!window.expandedTurns || index < 0 || index >= window.expandedTurns.length) return;
            window.expandedTurns[index].turn_locked = !window.expandedTurns[index].turn_locked;
            renderTurnsList();
        }
        
        // Drag and drop for expanded turns
        function initExpandedDragAndDrop() {
            var items = document.querySelectorAll('.turn-item');
            var draggedItem = null;
            
            items.forEach(function(item) {
                item.addEventListener('dragstart', function(e) {
                    if (this.dataset.locked === 'true') {
                        e.preventDefault();
                        return;
                    }
                    draggedItem = this;
                    this.style.opacity = '0.5';
                });
                
                item.addEventListener('dragend', function(e) {
                    this.style.opacity = '1';
                    draggedItem = null;
                });
                
                item.addEventListener('dragover', function(e) {
                    e.preventDefault();
                    if (this.dataset.locked !== 'true') {
                        this.style.borderColor = '#f59e0b';
                    }
                });
                
                item.addEventListener('dragleave', function(e) {
                    this.style.borderColor = this.dataset.locked === 'true' ? '#059669' : '#334155';
                });
                
                item.addEventListener('drop', function(e) {
                    e.preventDefault();
                    this.style.borderColor = this.dataset.locked === 'true' ? '#059669' : '#334155';
                    
                    if (draggedItem && draggedItem !== this && window.expandedTurns) {
                        var fromIndex = parseInt(draggedItem.dataset.index);
                        var toIndex = parseInt(this.dataset.index);
                        
                        // Check if either position is locked
                        if (window.expandedTurns[fromIndex].turn_locked || window.expandedTurns[toIndex].turn_locked) {
                            return;
                        }
                        
                        // Reorder array
                        var item = window.expandedTurns.splice(fromIndex, 1)[0];
                        window.expandedTurns.splice(toIndex, 0, item);
                        renderTurnsList();
                    }
                });
            });
        }
        
        // Expose new functions to window
        window.moveExpandedUp = moveExpandedUp;
        window.moveExpandedDown = moveExpandedDown;
        window.toggleExpandedLock = toggleExpandedLock;

        // Add position for a member
        function addExpandedPosition(userId) {
            if (window.addPositionForMember) {
                window.addPositionForMember(userId);
            } else {
            }
        }
        window.addExpandedPosition = addExpandedPosition;

        // Remove position for a member
        function removeExpandedPosition(userId, slotIndex) {
            if (window.removePositionForMember) {
                window.removePositionForMember(userId, slotIndex);
            } else {
            }
        }
        window.removeExpandedPosition = removeExpandedPosition;

        function showTurnsError(message) {
            var errorDiv = document.getElementById('turnsError');
            if (errorDiv) {
                errorDiv.textContent = message;
                errorDiv.style.display = 'block';
            }
        }
        
        function closeManageTurnsModal() {
            var modal = document.getElementById('manageTurnsModal');
            if (modal) {
                modal.style.display = 'none'; modal.classList.remove('active');
                document.body.style.overflow = '';
            }
            manageTurnsGroupId = null;
            turnsMembers = [];
        }
        
        async function saveTurnsOrder() {
            var saveBtn = document.getElementById('saveTurnsBtn');
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.innerHTML = '<span class="spinner-small"></span> Guardando...';
            }
            
            try {
                // Collapse expanded positions back to member format
                var collapsedMembers = window.collapsePositionsToMembers && window.expandedTurns ? window.collapsePositionsToMembers(window.expandedTurns) : turnsMembers;
                
                var memberTurns = collapsedMembers.map(function(member, index) {
                    return {
                        user_id: member.user_id,
                        new_position: index + 1,
                        turn_locked: member.turn_locked || false,
                        num_positions: member.num_positions || 1,
                        position_locks: member.position_locks || []
                    };
                });
                
                var response = await fetch((window.API_BASE_URL || 'https://latanda.online') + '/api/groups/' + manageTurnsGroupId + '/reorder-turns', {
                    method: 'PUT',
                    headers: { ...getAuthHeaders(),
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ member_turns: memberTurns, expanded_turns: window.expandedTurns })
                });
                
                var result = await response.json();
                
                if (response.ok && result.success) {
                    showNotification('Turnos actualizados exitosamente', 'success');
                    closeManageTurnsModal();
                    
                    // Refresh groups
                    await fetchMyGroups();
                    renderGroups();

                    // Also refresh tandas tab to sync turn positions
                    if (typeof refreshTandas === 'function') {
                        refreshTandas();
                    }
                } else {
                    showNotification('Error al guardar turnos', 'error');
                }
            } catch (error) {
                showNotification('Error de conexion al guardar', 'error');
            } finally {
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = 'Guardar Cambios';
                }
            }
        }
        // Expose functions to window for onclick
        window.manageTurns = manageTurns;

        // Toggle tanda pause status
        async function toggleTandaPause(groupId) {
            if (!groupId) {
                showNotification("Error: ID de grupo no especificado", "error");
                return;
            }
            
            try {
                var apiBase = window.API_BASE_URL || "https://latanda.online";
                var response = await fetch(apiBase + "/api/groups/" + groupId + "/toggle-pause", {
                    method: "POST",
                    headers: getAuthHeaders(),
                    body: JSON.stringify({})
                });
                
                var data = await response.json();
                
                if (data.success) {
                    var newStatus = data.data.new_status;
                    var message = newStatus === "paused" ? "Tanda pausada exitosamente" : "Tanda reanudada exitosamente";
                    showNotification(message, "success");
                    closeModal();
                    // Refresh the groups list
                    if (typeof fetchMyGroups === "function") fetchMyGroups();
                } else {
                    showNotification("Error al cambiar estado de la tanda", "error");
                }
            } catch (error) {
                showNotification("Error de conexion", "error");
            }
        }
        window.toggleTandaPause = toggleTandaPause;
        window.closeManageTurnsModal = closeManageTurnsModal;

        // =============================================
        // SCHEDULE LOTTERY FUNCTIONALITY
        // =============================================
        
        // Variable to store existing lottery data
        var scheduleLotteryExistingData = null;
        
        async function openScheduleLotteryModal() {
            // Get group ID from manage turns context
            var groupId = manageTurnsGroupId || currentStartGroupId;
            if (!groupId) {
                showNotification("Error: No se ha seleccionado un grupo", "error");
                return;
            }
            
            // FIX 2025-12-31: Load existing lottery schedule
            try {
                var response = await fetch((window.API_BASE_URL || "https://latanda.online") + "/api/groups/" + groupId + "/lottery-status", {
                    headers: getAuthHeaders()
                });
                var result = await response.json();
                if (result.success && result.data) {
                    scheduleLotteryExistingData = {
                        scheduled_at: result.data.scheduled_at,
                        countdown_seconds: result.data.countdown_seconds
                    };
                } else {
                    scheduleLotteryExistingData = null;
                }
            } catch (e) {
                scheduleLotteryExistingData = null;
            }
            
            // Create modal HTML
            var modalHtml = 
                "<div id=\"scheduleLotteryModal\" style=\"position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 10001; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px);\">" +
                    "<div style=\"background: linear-gradient(135deg, #1e293b, #0f172a); border-radius: 16px; max-width: 420px; width: 90%; max-height: 90vh; overflow: hidden; border: 1px solid rgba(59,130,246,0.3);\">" +
                        "<div style=\"background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 20px; position: relative;\">" +
                            "<div style=\"display: flex; align-items: center; gap: 12px;\">" +
                                "<div style=\"width: 48px; height: 48px; background: rgba(255,255,255,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center;\">" +
                                    "<span style=\"font-size: 1.5rem;\">📅</span>" +
                                "</div>" +
                                "<div>" +
                                    "<h3 style=\"margin: 0; font-size: 1.25rem; font-weight: 600; color: white;\">Programar Tombola</h3>" +
                                    "<p style=\"margin: 4px 0 0; font-size: 0.875rem; opacity: 0.9; color: white;\">Los miembros seran notificados</p>" +
                                "</div>" +
                            "</div>" +
                            "<button data-action=\"grp-close-schedule-lottery\" style=\"position: absolute; top: 16px; right: 16px; background: rgba(255,255,255,0.2); border: none; width: 32px; height: 32px; border-radius: 8px; color: white; cursor: pointer;\">✕</button>" +
                        "</div>" +
                        "<div style=\"padding: 24px;\">" +
                            "<div style=\"margin-bottom: 20px;\">" +
                                "<label style=\"display: block; font-weight: 500; color: #e5e7eb; margin-bottom: 8px;\">Fecha y Hora</label>" +
                                "<input type=\"datetime-local\" id=\"scheduleLotteryDateTime\" style=\"width: 100%; padding: 12px; border: 1px solid #374151; border-radius: 8px; background: #1e293b; color: white; font-size: 1rem; box-sizing: border-box;\">" +
                            "</div>" +
                            "<div style=\"margin-bottom: 20px;\">" +
                                "<label style=\"display: block; font-weight: 500; color: #e5e7eb; margin-bottom: 8px;\">Modo de Tombola</label>" +
                                "<select id=\"scheduleLotteryMode\" style=\"width: 100%; padding: 12px; border: 1px solid #374151; border-radius: 8px; background: #1e293b; color: white; font-size: 1rem;\">" +
                                    "<option value=\"random\">🎲 Aleatorio — Todos tienen la misma probabilidad</option>" +
                                    "<option value=\"weighted\">🧠 Inteligente — Pagadores confiables cobran al final</option>" +
                                    "<option value=\"manual\">✋ Manual — Turnos ya asignados manualmente</option>" +
                                "</select>" +
                                "<p style=\"margin: 6px 0 0; font-size: 0.75rem; color: #94a3b8;\">Inteligente usa puntaje crediticio + puntualidad para reducir riesgo de impago</p>" +
                            "</div>" +
                            "<div style=\"margin-bottom: 20px;\">" +
                                "<label style=\"display: block; font-weight: 500; color: #e5e7eb; margin-bottom: 8px;\">Tiempo de Conteo (segundos)</label>" +
                                "<select id=\"scheduleLotteryCountdown\" style=\"width: 100%; padding: 12px; border: 1px solid #374151; border-radius: 8px; background: #1e293b; color: white; font-size: 1rem;\">" +
                                    "<option value=\"5\">5 segundos</option>" +
                                    "<option value=\"10\" selected>10 segundos</option>" +
                                    "<option value=\"15\">15 segundos</option>" +
                                    "<option value=\"30\">30 segundos</option>" +
                                    "<option value=\"60\">1 minuto</option>" +
                                "</select>" +
                            "</div>" +
                            "<div style=\"background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.3); border-radius: 8px; padding: 12px; margin-bottom: 20px;\">" +
                                "<p style=\"margin: 0; color: #93c5fd; font-size: 0.875rem;\">💡 Todos los miembros del grupo recibiran una notificacion cuando programes la tombola.</p>" +
                            "</div>" +
                            "<div id=\"scheduleLotteryError\" style=\"display: none; padding: 12px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 8px; color: #fca5a5; margin-bottom: 16px;\"></div>" +
                            "<div style=\"display: flex; gap: 12px;\">" +
                                "<button data-action=\"grp-close-schedule-lottery\" style=\"flex: 1; padding: 12px; background: #374151; border: none; border-radius: 8px; color: white; cursor: pointer; font-weight: 500;\">Cancelar</button>" +
                                "<button data-action=\"grp-submit-schedule-lottery\" id=\"scheduleLotteryBtn\" style=\"flex: 1; padding: 12px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); border: none; border-radius: 8px; color: white; cursor: pointer; font-weight: 600;\">Programar</button>" +
                            "</div>" +
                        "</div>" +
                    "</div>" +
                "</div>";
            
            document.body.insertAdjacentHTML("beforeend", modalHtml);
            
            // Set minimum datetime to now + 5 minutes
            var now = new Date();
            now.setMinutes(now.getMinutes() + 5);
            var minDateTime = now.toISOString().slice(0, 16);
            document.getElementById("scheduleLotteryDateTime").min = minDateTime;
            
            // FIX 2025-12-31: Load existing scheduled date if available
            var existingDate = scheduleLotteryExistingData?.scheduled_at;
            var existingCountdown = scheduleLotteryExistingData?.countdown_seconds;
            
            if (existingDate) {
                var existingDateTime = new Date(existingDate).toISOString().slice(0, 16);
                document.getElementById("scheduleLotteryDateTime").value = existingDateTime;
            } else {
                document.getElementById("scheduleLotteryDateTime").value = minDateTime;
            }
            
            if (existingCountdown) {
                document.getElementById("scheduleLotteryCountdown").value = existingCountdown.toString();
            }
        }
        
        function closeScheduleLotteryModal() {
            var modal = document.getElementById("scheduleLotteryModal");
            if (modal) modal.remove();
        }
        
        async function submitScheduleLottery() {
            var groupId = manageTurnsGroupId || currentStartGroupId;
            var dateTimeInput = document.getElementById("scheduleLotteryDateTime");
            var countdownSelect = document.getElementById("scheduleLotteryCountdown");
            var errorDiv = document.getElementById("scheduleLotteryError");
            var submitBtn = document.getElementById("scheduleLotteryBtn");
            
            if (!dateTimeInput.value) {
                errorDiv.textContent = "Por favor selecciona una fecha y hora";
                errorDiv.style.display = "block";
                return;
            }
            
            var scheduledAt = new Date(dateTimeInput.value);
            if (scheduledAt <= new Date()) {
                errorDiv.textContent = "La fecha debe ser en el futuro";
                errorDiv.style.display = "block";
                return;
            }
            
            errorDiv.style.display = "none";
            submitBtn.disabled = true;
            submitBtn.textContent = "Programando...";
            
            try {

                // Save lottery mode (ALG-02 T1)
                var lotteryMode = document.getElementById('scheduleLotteryMode');
                if (lotteryMode && lotteryMode.value !== 'random') {
                    try {
                        await fetch((window.API_BASE_URL || "https://latanda.online") + "/api/groups/" + groupId + "/lottery-mode", {
                            method: "PUT",
                            headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
                            body: JSON.stringify({ mode: lotteryMode.value })
                        });
                    } catch (_) {}
                }
                var response = await fetch((window.API_BASE_URL || "https://latanda.online") + "/api/groups/" + groupId + "/lottery-schedule", {
                    method: "POST",
                    headers: {
                        ...getAuthHeaders(),
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        scheduled_at: scheduledAt.toISOString(),
                        countdown_seconds: parseInt(countdownSelect.value)
                    })
                });
                
                var result = await response.json();
                
                if (result.success) {
                    closeScheduleLotteryModal();
                    closeManageTurnsModal();
                    showNotification("Tombola programada! " + result.data.members_notified + " miembros notificados", "success");
                    
                    // Refresh data
                    if (typeof refreshTandas === "function") refreshTandas();
                    if (typeof fetchMyGroups === "function") {
                        fetchMyGroups().then(function() {
                            if (typeof renderGroups === "function") renderGroups();
                        }).catch(function() {});
                    }
                } else {
                    errorDiv.textContent = "Error al programar la loteria";
                    errorDiv.style.display = "block";
                }
            } catch (error) {
                errorDiv.textContent = "Error de conexion";
                errorDiv.style.display = "block";
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = "Programar";
            }
        }
        
        // Expose functions to global scope
        window.openScheduleLotteryModal = openScheduleLotteryModal;
        window.closeScheduleLotteryModal = closeScheduleLotteryModal;
        window.submitScheduleLottery = submitScheduleLottery;

        window.saveTurnsOrder = saveTurnsOrder;
        window.loadTurnsMembers = loadTurnsMembers;
        window.moveExpandedUp = moveExpandedUp;
        window.moveExpandedDown = moveExpandedDown;
        // increasePositions/decreasePositions removed (undefined)
        window.toggleTurnLock = toggleExpandedLock;
        window.renderTurnsList = renderTurnsList;
        // ===== END MANAGE TURNS FUNCTIONALITY =====



        async function submitGroupEdit(event) {
            event.preventDefault();

            var name = document.getElementById('editGroupName').value.trim();
            var description = document.getElementById('editGroupDescription').value.trim();
            var amount = document.getElementById('editGroupAmount').value;
            var frequency = document.getElementById('editGroupFrequency').value;
            var maxMembers = document.getElementById('editGroupMaxMembers').value;
            var location = document.getElementById('editGroupLocation').value.trim();
            var status = document.getElementById('editGroupStatus').value;
            var start_date = document.getElementById('editGroupStartDate').value;
            var errorDiv = document.getElementById('editGroupError');
            var submitBtn = document.getElementById('editGroupSubmitBtn');

            if (!name) {
                if (errorDiv) {
                    errorDiv.textContent = 'El nombre del grupo es requerido';
                    errorDiv.style.display = 'block';
                }
                return;
            }

            if (errorDiv) errorDiv.style.display = 'none';
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Guardando...';
            }

            try {
                var apiBase = window.API_BASE_URL || 'https://latanda.online';
                var userId = getCurrentUserId();

                var updateData = {
                    name: name,
                    description: description || null,
                    status: status
                };

                if (amount) updateData.contribution_amount = parseFloat(amount);
                if (frequency) updateData.frequency = frequency;
                if (maxMembers) updateData.max_members = parseInt(maxMembers);
                if (start_date) updateData.start_date = start_date;
                if (location) updateData.location = location;

                var thresholdVal = document.getElementById('editGroupThreshold') ? document.getElementById('editGroupThreshold').value : null;
                if (thresholdVal) updateData.advanceThreshold = parseInt(thresholdVal);
                // updated_by removed (server uses JWT identity)

                var response = await fetch(apiBase + '/api/groups/' + currentEditGroupId + '/update', {
                    method: 'PATCH',
                    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                    body: JSON.stringify(updateData)
                });

                var data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error('Error al actualizar el grupo');
                }

                // Show success
                document.getElementById('editGroupFormFields').style.display = 'none';
                document.getElementById('editGroupFormFooter').style.display = 'none';
                document.getElementById('editGroupSuccess').style.display = 'block';

                if (typeof window.showSuccess === 'function') {
                    window.showSuccess('Grupo actualizado exitosamente');
                }

                // Refresh groups list after 1.5 seconds
                setTimeout(function() {
                    closeEditGroupModal();
                    if (typeof fetchMyGroups === "function") {
                        fetchMyGroups();
                    }
                }, 1500);

            } catch (err) {
                if (errorDiv) {
                    errorDiv.textContent = 'Error al actualizar el grupo';
                    errorDiv.style.display = 'block';
                }
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Guardar Cambios';
                }
            }
        }

        // Close edit group modal on overlay click
        document.addEventListener('DOMContentLoaded', function() {
            var modal = document.getElementById('editGroupModal');
            if (modal) {
                modal.addEventListener('click', function(e) {
                    if (e.target === modal) closeEditGroupModal();
                });
            }
        });

        // ============================================
        // REGISTER PAYMENT MODAL FUNCTIONS
        // ============================================
        var currentPaymentGroupId = null;


        // ========== PAYMENT MODAL - Step-based Flow ==========
        var currentPaymentStep = 1;
        var currentPaymentData = null;
        var selectedPaymentMethod = null;
        var proofFile = null;

        function registerGroupPayment(groupId) {
            closeModal();
            setTimeout(function() {
                var groupData = window.currentGroupsData ? window.currentGroupsData.find(function(g) { return g.id === groupId || g.group_id === groupId; }) : null;
                var role = groupData ? (groupData.my_role || "member") : "member";
                if (role === "creator" || role === "coordinator") {
                    showCoordinatorPaymentView(groupId, groupData);
                } else {
                    showRegisterPaymentModal(groupId);
                }
            }, 100);
        }
        window.registerGroupPayment = registerGroupPayment;

        // v4.10.5: Coordinator Payment Management — Individual + Bulk
        function showCoordinatorPaymentView(groupId, groupData) {
            var existingModal = document.getElementById('cpPaymentModal');
            if (existingModal) existingModal.remove();

            var groupName = groupData ? escapeHtml(groupData.name || 'Grupo') : 'Grupo';
            var dark = 'rgba(15,23,42,0.98)';
            var darkBorder = 'rgba(100,116,139,0.2)';

            var modalHtml =
                '<div id="cpPaymentModal" style="position:fixed;inset:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:10001;backdrop-filter:blur(4px);padding:16px;">' +
                '<div style="background:' + dark + ';border:1px solid ' + darkBorder + ';border-radius:16px;width:100%;max-width:560px;max-height:90vh;display:flex;flex-direction:column;overflow:hidden;">' +
                    '<div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid ' + darkBorder + ';">' +
                        '<div>' +
                            '<h3 style="margin:0;font-size:1.15rem;font-weight:600;color:#f8fafc;">Registrar Pagos</h3>' +
                            '<div id="cpThresholdBar" style="margin-top:8px;"></div>' +
                            '<p style="margin:4px 0 0;font-size:0.8rem;color:#64748b;">' + groupName + '</p>' +
                        '</div>' +
                        '<button data-action="cp-close" style="background:none;border:none;color:#94a3b8;font-size:1.5rem;cursor:pointer;padding:4px 8px;line-height:1;">&times;</button>' +
                    '</div>' +
                    '<div style="display:flex;border-bottom:1px solid ' + darkBorder + ';padding:0 20px;">' +
                        '<button data-action="cp-tab-individual" class="cp-tab cp-tab-active" style="flex:1;">Individual</button>' +
                        '<button data-action="cp-tab-masivo" class="cp-tab" style="flex:1;">Masivo</button>' +
                    '</div>' +
                    '<div id="cpSummaryBar" style="padding:12px 20px;background:rgba(0,255,255,0.05);border-bottom:1px solid ' + darkBorder + ';font-size:0.85rem;color:#94a3b8;">Cargando...</div>' +
                    '<div id="cpTabContent" style="flex:1;overflow-y:auto;padding:12px 20px;">' +
                        '<div style="text-align:center;padding:40px 0;color:#64748b;"><div class="cp-spinner"></div>Cargando miembros...</div>' +
                    '</div>' +
                '</div>' +
                '</div>';

            document.body.insertAdjacentHTML('beforeend', modalHtml); if(window.lockBodyScroll)window.lockBodyScroll();
            document.body.style.overflow = 'hidden';

            var modal = document.getElementById('cpPaymentModal');
            var cpState = {
                groupId: groupId,
                groupData: groupData,
                members: [],
                cycleNumber: 1,
                contributionAmount: 0,
                paidCount: 0,
                pendingCount: 0,
                activeTab: 'individual',
                selectedMembers: {},
                bulkMethod: 'cash',
                bulkAmount: 0,
                loadingInline: null
            };

            function cpClose() {
                modal.remove();
                document.body.style.overflow = '';
            }

            async function cpLoadData() {
                try {
                    var resp = await fetch('/api/groups/' + encodeURIComponent(groupId) + '/members/payment-status', {
                        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
                    });
                    var json = await resp.json();
                    if (!json.success || !json.data) {
                        document.getElementById('cpTabContent').innerHTML = '<div style="text-align:center;padding:40px 0;color:#ef4444;">Error al cargar datos</div>';
                        return;
                    }
                    cpState.members = json.data.members || [];
                    cpState.cycleNumber = json.data.cycle_number || 1;
                    cpState.contributionAmount = json.data.group_contribution_amount || 0;
                    cpState.paidCount = json.data.paid_count || 0;
                    cpState.pendingCount = json.data.pending_count || 0;
                    cpState.bulkAmount = cpState.contributionAmount;
                    cpState.selectedMembers = {};
                    cpUpdateSummary();
                    cpRenderTab();
                    cpRenderThresholdBar();
                } catch (err) {
                    document.getElementById('cpTabContent').innerHTML = '<div style="text-align:center;padding:40px 0;color:#ef4444;">Error de conexion</div>';
                }
            }

            function cpUpdateSummary() {
                var bar = document.getElementById('cpSummaryBar');
                if (!bar) return;
                var total = cpState.members.length;
                var pct = total > 0 ? Math.round((cpState.paidCount / total) * 100) : 0;
                bar.innerHTML =
                    '<div style="display:flex;align-items:center;justify-content:space-between;">' +
                        '<span><strong style="color:#00FFFF;">' + cpState.paidCount + '</strong>/' + total + ' miembros pagados — Ciclo ' + escapeHtml(String(cpState.cycleNumber)) + '</span>' +
                        '<span style="font-weight:600;color:' + (pct === 100 ? '#22c55e' : '#f59e0b') + ';">' + pct + '%</span>' +
                    '</div>' +
                    '<div style="margin-top:6px;height:4px;background:rgba(100,116,139,0.2);border-radius:2px;overflow:hidden;">' +
                        '<div style="height:100%;width:' + pct + '%;background:' + (pct === 100 ? '#22c55e' : '#00FFFF') + ';border-radius:2px;transition:width 0.3s;"></div>' +
                    '</div>';
            }

            function cpRenderTab() {
                if (cpState.activeTab === 'individual') {
                    cpRenderIndividual();
                } else {
                    cpRenderBulk();
                }
            }

            function cpGetStatusPill(status) {
                var map = {
                    'paid': { label: 'Pagado', bg: 'rgba(34,197,94,0.15)', color: '#22c55e' },
                    'up_to_date': { label: 'Al dia', bg: 'rgba(59,130,246,0.15)', color: '#3b82f6' },
                    'pending': { label: 'Pendiente', bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
                    'mora': { label: 'En Mora', bg: 'rgba(220,38,38,0.2)', color: '#dc2626' },
                    'late': { label: 'Atrasado', bg: 'rgba(239,68,68,0.15)', color: '#ef4444' },
                    'suspended': { label: 'Suspendido', bg: 'rgba(100,116,139,0.15)', color: '#94a3b8' }
                };
                var s = map[status] || map['pending'];
                return '<span style="display:inline-block;padding:2px 10px;border-radius:20px;font-size:0.72rem;font-weight:600;background:' + s.bg + ';color:' + s.color + ';">' + s.label + '</span>';
            }

            function cpGetAvatar(member) {
                if (member.avatar) {
                    return '<img src="' + escapeHtml(member.avatar) + '" style="width:36px;height:36px;border-radius:50%;object-fit:cover;" alt="">';
                }
                var initial = member.name ? escapeHtml(member.name.charAt(0).toUpperCase()) : '?';
                return '<div style="width:36px;height:36px;border-radius:50%;background:rgba(0,255,255,0.15);color:#00FFFF;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:0.9rem;">' + initial + '</div>';
            }

            function cpMethodOptions(selected) {
                var methods = [
                    { value: 'cash', label: 'Efectivo' },
                    { value: 'bank_transfer', label: 'Transferencia' },
                    { value: 'mobile_money', label: 'Tigo Money' },
                    { value: 'card', label: 'Tarjeta' },
                    { value: 'crypto', label: 'Crypto' },
                    { value: 'wallet', label: 'Billetera' }
                ];
                return methods.map(function(m) {
                    return '<option value="' + m.value + '"' + (m.value === selected ? ' selected' : '') + '>' + m.label + '</option>';
                }).join('');
            }

            function cpRenderIndividual() {
                var html = '';
                if (cpState.members.length === 0) {
                    html = '<div style="text-align:center;padding:40px 0;color:#64748b;">No hay miembros en este grupo</div>';
                } else {
                    cpState.members.forEach(function(m) {
                        var canPay = m.payment_status !== 'paid' && m.payment_status !== 'mora';
                        var isMora = m.payment_status === 'mora';
                        var isUpToDate = m.payment_status === 'up_to_date';
                        var amtPending = m.amount_pending != null ? m.amount_pending : cpState.contributionAmount;
                        var amountDisplay = window.ltFormatCurrency ? ltFormatCurrency(amtPending) : 'L. ' + (amtPending > 0 ? amtPending.toLocaleString('es-HN', { minimumFractionDigits: 2 }) : '0.00');
                        var posLabel = (m.num_positions && m.num_positions > 1) ? '<div style="font-size:0.65rem;color:#00FFFF;margin-top:1px;">' + m.num_positions + ' numeros</div>' : '';
                        var pastUnpaid = (m.unpaid_cycles || []).filter(function(c) { return c < cpState.cycleNumber; });
                        var cuotasLabel = pastUnpaid.length > 0 ? '<div style="font-size:0.68rem;color:#ef4444;margin-top:1px;">Debe: C' + pastUnpaid.join(', C') + ' (L. ' + (window.ltFormatNumber ? ltFormatNumber(pastUnpaid.length * cpState.contributionAmount * (m.num_positions || 1)) : (pastUnpaid.length * cpState.contributionAmount * (m.num_positions || 1)).toLocaleString('es-HN')) + ')</div>' : (m.payment_status === 'up_to_date' ? '<div style="font-size:0.68rem;color:#3b82f6;margin-top:1px;">Al dia - puede adelantar</div>' : (m.cycles_pending > 0 ? '<div style="font-size:0.68rem;color:#f59e0b;margin-top:1px;">Pendiente ciclo actual</div>' : ''));
                        var loanBadge = '';
                        if (m.active_loan) {
                            loanBadge = '<div style="font-size:0.68rem;color:#f87171;margin-top:1px;display:flex;align-items:center;gap:4px;"><i class="fas fa-hand-holding-usd" style="font-size:0.6rem;"></i>Prestamo: ' + (window.ltFormatCurrency ? ltFormatCurrency(m.active_loan.total_owed) : 'L. ' + parseFloat(m.active_loan.total_owed).toLocaleString('es-HN')) + '</div>';
                        }
                        html += '<div class="cp-member-row" id="cp-row-' + escapeHtml(m.user_id) + '">' +
                            '<div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;">' +
                                cpGetAvatar(m) +
                                '<div style="flex:1;min-width:0;">' +
                                    '<div style="font-size:0.88rem;font-weight:500;color:#f8fafc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(m.name || 'Usuario') + (m.is_placeholder ? ' <span class="member-placeholder-badge">Pendiente</span>' : '') + '</div>' +
                                    '<div style="display:flex;align-items:center;gap:6px;margin-top:2px;">' +
                                        (m.turn_position ? '<span style="font-size:0.7rem;color:#64748b;">Turno #' + escapeHtml(String(m.turn_position)) + '</span>' : '') +
                                        (m.member_role && m.member_role !== 'member' ? '<span style="font-size:0.65rem;padding:1px 6px;border-radius:8px;background:rgba(139,92,246,0.15);color:#a78bfa;">' + escapeHtml(m.member_role) + '</span>' : '') +
                                    '</div>' +
                                '</div>' +
                            '</div>' +
                            '<div style="display:flex;align-items:center;gap:8px;">' +
                                '<div style="text-align:right;">' +
                                    '<div style="font-size:0.8rem;font-weight:600;color:#cbd5e1;">' + amountDisplay + '</div>' +
                                    cpGetStatusPill(m.payment_status) + posLabel + cuotasLabel + loanBadge +
                                '</div>' +
                                (isMora ? '<span style="padding:4px 10px;border-radius:8px;background:rgba(220,38,38,0.15);color:#dc2626;font-size:0.72rem;font-weight:600;">En Mora' + (m.mora_cycles && m.mora_cycles.length > 0 ? ' (C' + m.mora_cycles.join(',C') + ')' : '') + '</span>' +
                                '<button data-action="cp-register-single" data-uid="' + escapeHtml(m.user_id) + '" style="padding:6px 10px;border-radius:8px;border:1px solid rgba(34,197,94,0.3);background:rgba(34,197,94,0.1);color:#22c55e;font-size:0.72rem;font-weight:500;cursor:pointer;white-space:nowrap;">Pagar deuda</button>' +
                                (m.active_loan ? '<button data-action="cp-loan-pay" data-uid="' + escapeHtml(m.user_id) + '" data-loan-id="' + escapeHtml(m.active_loan.id) + '" style="padding:6px 8px;border-radius:8px;border:1px solid rgba(248,113,113,0.3);background:rgba(248,113,113,0.1);color:#f87171;font-size:0.72rem;font-weight:500;cursor:pointer;white-space:nowrap;"><i class="fas fa-hand-holding-usd" style="margin-right:3px;font-size:0.65rem;"></i>Abonar</button>' : '') :
                                isUpToDate ? '<button data-action="cp-register-single" data-uid="' + escapeHtml(m.user_id) + '" style="padding:6px 12px;border-radius:8px;border:1px solid rgba(59,130,246,0.3);background:rgba(59,130,246,0.1);color:#3b82f6;font-size:0.78rem;font-weight:500;cursor:pointer;white-space:nowrap;">Adelantar</button>' :
                                canPay ? '<button data-action="cp-register-single" data-uid="' + escapeHtml(m.user_id) + '" style="padding:6px 12px;border-radius:8px;border:1px solid rgba(0,255,255,0.3);background:rgba(0,255,255,0.1);color:#00FFFF;font-size:0.78rem;font-weight:500;cursor:pointer;white-space:nowrap;">Registrar</button>' +
                                '<button data-action="cp-mark-mora" data-uid="' + escapeHtml(m.user_id) + '" data-name="' + escapeHtml(m.name || 'Usuario') + '" style="padding:6px 8px;border-radius:8px;border:1px solid rgba(239,68,68,0.3);background:rgba(239,68,68,0.1);color:#f87171;font-size:0.72rem;font-weight:500;cursor:pointer;white-space:nowrap;">Mora</button>' +
                                (m.active_loan ? '<button data-action="cp-loan-pay" data-uid="' + escapeHtml(m.user_id) + '" data-loan-id="' + escapeHtml(m.active_loan.id) + '" style="padding:6px 8px;border-radius:8px;border:1px solid rgba(248,113,113,0.3);background:rgba(248,113,113,0.1);color:#f87171;font-size:0.72rem;font-weight:500;cursor:pointer;white-space:nowrap;"><i class="fas fa-hand-holding-usd" style="margin-right:3px;font-size:0.65rem;"></i>Abonar</button>' : '') : '') +
                            '</div>' +
                        '</div>' +
                        '<div id="cp-form-' + escapeHtml(m.user_id) + '" style="display:none;"></div>';
                    });
                }
                document.getElementById('cpTabContent').innerHTML = html;
            }

            function cpShowInlineForm(userId) {
                // Close any other open form
                if (cpState.loadingInline && cpState.loadingInline !== userId) {
                    var prev = document.getElementById('cp-form-' + cpState.loadingInline);
                    if (prev) prev.style.display = 'none';
                }
                cpState.loadingInline = userId;

                var formEl = document.getElementById('cp-form-' + userId);
                if (!formEl) return;

                formEl.style.display = 'block';
                formEl.innerHTML =
                    '<div class="cp-inline-form">' +
                        '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
                            '<div style="flex:1;min-width:100px;">' +
                                '<label style="font-size:0.72rem;color:#64748b;display:block;margin-bottom:3px;">Monto</label>' +
                                '<input type="number" id="cp-amount-' + escapeHtml(userId) + '" value="' + cpState.contributionAmount + '" step="0.01" min="0.01" style="width:100%;padding:8px;border-radius:8px;border:1px solid rgba(100,116,139,0.3);background:rgba(30,41,59,0.8);color:#f8fafc;font-size:0.85rem;">' +
                            '</div>' +
                            '<div style="flex:1;min-width:120px;">' +
                                '<label style="font-size:0.72rem;color:#64748b;display:block;margin-bottom:3px;">Metodo</label>' +
                                '<select id="cp-method-' + escapeHtml(userId) + '" style="width:100%;padding:8px;border-radius:8px;border:1px solid rgba(100,116,139,0.3);background:rgba(30,41,59,0.8);color:#f8fafc;font-size:0.85rem;">' +
                                    cpMethodOptions('cash') +
                                '</select>' +
                            '</div>' +
                        '</div>' +
                        '<div style="margin-top:8px;">' +
                            '<label style="font-size:0.72rem;color:#64748b;display:block;margin-bottom:3px;">Notas (opcional)</label>' +
                            '<input type="text" id="cp-notes-' + escapeHtml(userId) + '" placeholder="Ej: Pago en efectivo" maxlength="500" style="width:100%;padding:8px;border-radius:8px;border:1px solid rgba(100,116,139,0.3);background:rgba(30,41,59,0.8);color:#f8fafc;font-size:0.85rem;">' +
                        '</div>' +
                        '<div style="display:flex;gap:8px;margin-top:10px;justify-content:flex-end;">' +
                            '<button data-action="cp-cancel-single" data-uid="' + escapeHtml(userId) + '" style="padding:7px 16px;border-radius:8px;border:1px solid rgba(100,116,139,0.3);background:transparent;color:#94a3b8;font-size:0.8rem;cursor:pointer;">Cancelar</button>' +
                            '<button data-action="cp-confirm-single" data-uid="' + escapeHtml(userId) + '" style="padding:7px 16px;border-radius:8px;border:none;background:#00FFFF;color:#0f172a;font-size:0.8rem;font-weight:600;cursor:pointer;">Confirmar</button>' +
                        '</div>' +
                    '</div>';
            }

            async function cpConfirmSingle(userId) {
                var amountEl = document.getElementById('cp-amount-' + userId);
                var methodEl = document.getElementById('cp-method-' + userId);
                var notesEl = document.getElementById('cp-notes-' + userId);
                if (!amountEl || !methodEl) return;

                var amount = parseFloat(amountEl.value);
                if (!Number.isFinite(amount) || amount <= 0) {
                    showNotification(t('messages.invalid_amount',{defaultValue:'Monto invalido'}), 'error');
                    return;
                }

                var btn = modal.querySelector('[data-action="cp-confirm-single"][data-uid="' + userId + '"]');
                if (btn) { btn.disabled = true; btn.textContent = 'Guardando...'; }

                try {
                    var resp = await fetch('/api/groups/' + encodeURIComponent(cpState.groupId) + '/contributions/record-for-member', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                        body: JSON.stringify({
                            member_user_id: userId,
                            amount: amount,
                            payment_method: methodEl.value,
                            notes: notesEl ? notesEl.value : ''
                        })
                    });
                    var json = await resp.json();
                    if (json.success) {
                        // Update local state
                        // Reload data to get accurate state (handles num_positions)
                        await cpLoadData();
                        cpUpdateSummary();
                        cpRenderTab();
                    } else {
                        showNotification('No se pudo registrar el pago', 'error');
                    }
                } catch (err) {
                    showNotification(t('messages.connection_error',{defaultValue:'Error de conexion'}), 'error');
                } finally {
                    if (btn) { btn.disabled = false; btn.textContent = 'Confirmar'; }
                }
            }

            // === BULK TAB ===

            function cpRenderBulk() {
                var pendingMembers = cpState.members.filter(function(m) { return m.payment_status !== 'paid'; });
                var selectedCount = Object.keys(cpState.selectedMembers).filter(function(k) { return cpState.selectedMembers[k]; }).length;

                var html = '';
                if (pendingMembers.length === 0 && cpState.members.length > 0) {
                    html = '<div style="text-align:center;padding:40px 0;color:#22c55e;">&#10003; Todos los miembros han pagado este ciclo</div>';
                } else if (cpState.members.length === 0) {
                    html = '<div style="text-align:center;padding:40px 0;color:#64748b;">No hay miembros en este grupo</div>';
                } else {
                    // Bulk controls
                    html += '<div class="cp-bulk-bar">' +
                        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">' +
                            '<label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:0.82rem;color:#cbd5e1;">' +
                                '<input type="checkbox" id="cpSelectAll" data-action="cp-select-all-pending" ' + (selectedCount === pendingMembers.length && pendingMembers.length > 0 ? 'checked' : '') + ' style="width:16px;height:16px;accent-color:#00FFFF;">' +
                                'Seleccionar todos pendientes (' + pendingMembers.length + ')' +
                            '</label>' +
                        '</div>' +
                        '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">' +
                            '<div style="flex:1;min-width:100px;">' +
                                '<label style="font-size:0.72rem;color:#64748b;display:block;margin-bottom:3px;">Monto global</label>' +
                                '<input type="number" id="cpBulkAmount" value="' + cpState.bulkAmount + '" step="0.01" min="0.01" style="width:100%;padding:8px;border-radius:8px;border:1px solid rgba(100,116,139,0.3);background:rgba(30,41,59,0.8);color:#f8fafc;font-size:0.85rem;">' +
                            '</div>' +
                            '<div style="flex:1;min-width:120px;">' +
                                '<label style="font-size:0.72rem;color:#64748b;display:block;margin-bottom:3px;">Metodo de pago</label>' +
                                '<select id="cpBulkMethod" style="width:100%;padding:8px;border-radius:8px;border:1px solid rgba(100,116,139,0.3);background:rgba(30,41,59,0.8);color:#f8fafc;font-size:0.85rem;">' +
                                    cpMethodOptions(cpState.bulkMethod) +
                                '</select>' +
                            '</div>' +
                        '</div>' +
                        '<div style="margin-top:8px;">' +
                            '<label style="font-size:0.72rem;color:#64748b;display:block;margin-bottom:3px;">Notas (opcional)</label>' +
                            '<textarea id="cpBulkNotes" placeholder="Notas para estos pagos..." rows="2" style="width:100%;padding:8px;border-radius:8px;border:1px solid rgba(100,116,139,0.3);background:rgba(30,41,59,0.8);color:#f8fafc;font-size:0.82rem;resize:vertical;font-family:inherit;"></textarea>' +
                        '</div>' +
                        '<div style="font-size:0.72rem;color:#94a3b8;margin-top:6px;font-style:italic;">Cada registro aplica 1 cuota por miembro (al ciclo mas antiguo impago)</div>' +
                    '</div>';

                    // Member checkboxes
                    cpState.members.forEach(function(m) {
                        var isPaid = m.payment_status === 'paid';
                        var isChecked = !isPaid && cpState.selectedMembers[m.user_id];
                        html += '<div class="cp-member-row" style="' + (isPaid ? 'opacity:0.5;' : '') + '">' +
                            '<div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;">' +
                                (!isPaid ? '<input type="checkbox" data-action="cp-toggle-select" data-uid="' + escapeHtml(m.user_id) + '" ' + (isChecked ? 'checked' : '') + ' style="width:16px;height:16px;accent-color:#00FFFF;flex-shrink:0;">' : '<div style="width:16px;flex-shrink:0;"></div>') +
                                cpGetAvatar(m) +
                                '<div style="flex:1;min-width:0;">' +
                                    '<div style="font-size:0.88rem;font-weight:500;color:#f8fafc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(m.name || 'Usuario') + (m.is_placeholder ? ' <span class="member-placeholder-badge">Pendiente</span>' : '') + '</div>' +
                                    '<div style="font-size:0.72rem;color:#64748b;">' +
                                        (m.turn_position ? 'Turno #' + escapeHtml(String(m.turn_position)) : '') +
                                    '</div>' +
                                '</div>' +
                            '</div>' +
                            '<div style="text-align:right;">' +
                                '<div style="font-size:0.75rem;font-weight:600;color:#cbd5e1;">L. ' + (m.amount_pending > 0 ? m.amount_pending.toLocaleString('es-HN', { minimumFractionDigits: 2 }) : '0.00') + '</div>' +
                                cpGetStatusPill(m.payment_status) +
                                ((m.num_positions && m.num_positions > 1) ? '<div style="font-size:0.62rem;color:#00FFFF;">' + m.num_positions + ' num.</div>' : '') +
                                ((m.unpaid_cycles || []).filter(function(c) { return c < cpState.cycleNumber; }).length > 0 ? '<div style="font-size:0.65rem;color:#ef4444;">Debe: C' + (m.unpaid_cycles || []).filter(function(c) { return c < cpState.cycleNumber; }).join(', C') + '</div>' : (m.cycles_pending > 0 ? '<div style="font-size:0.65rem;color:#f59e0b;">Pendiente</div>' : '')) +
                            '</div>' +
                        '</div>';
                    });

                    // Submit button
                    html += '<div style="padding:16px 0 4px;text-align:center;">' +
                        '<button data-action="cp-submit-bulk" id="cpBulkSubmitBtn" style="width:100%;padding:12px;border-radius:10px;border:none;background:' + (selectedCount > 0 ? '#00FFFF' : 'rgba(100,116,139,0.3)') + ';color:' + (selectedCount > 0 ? '#0f172a' : '#64748b') + ';font-size:0.9rem;font-weight:600;cursor:' + (selectedCount > 0 ? 'pointer' : 'default') + ';"' + (selectedCount === 0 ? ' disabled' : '') + '>' +
                            'Registrar ' + selectedCount + ' pago' + (selectedCount !== 1 ? 's' : '') +
                        '</button>' +
                    '</div>';
                }
                document.getElementById('cpTabContent').innerHTML = html;
            }

            function cpToggleSelect(userId) {
                cpState.selectedMembers[userId] = !cpState.selectedMembers[userId];
                cpRenderBulk();
            }

            function cpSelectAllPending() {
                var allChecked = document.getElementById('cpSelectAll')?.checked;
                cpState.members.forEach(function(m) {
                    if (m.payment_status !== 'paid') {
                        cpState.selectedMembers[m.user_id] = allChecked;
                    }
                });
                cpRenderBulk();
            }

            async function cpSubmitBulk() {
                var selected = Object.keys(cpState.selectedMembers).filter(function(k) { return cpState.selectedMembers[k]; });
                if (selected.length === 0) return;

                var amountEl = document.getElementById('cpBulkAmount');
                var methodEl = document.getElementById('cpBulkMethod');
                var notesEl = document.getElementById('cpBulkNotes');
                var amount = parseFloat(amountEl ? amountEl.value : cpState.bulkAmount);
                var method = methodEl ? methodEl.value : cpState.bulkMethod;
                var bulkNotes = notesEl ? notesEl.value.trim() : '';

                if (!Number.isFinite(amount) || amount <= 0) {
                    showNotification(t('messages.invalid_amount',{defaultValue:'Monto invalido'}), 'error');
                    return;
                }

                var btn = document.getElementById('cpBulkSubmitBtn');
                if (btn) { btn.disabled = true; btn.textContent = 'Registrando...'; btn.style.background = 'rgba(0,255,255,0.5)'; }

                var membersPayload = selected.map(function(uid) {
                    var item = { member_user_id: uid, amount: amount };
                    if (bulkNotes) item.notes = bulkNotes;
                    return item;
                });

                try {
                    var resp = await fetch('/api/groups/' + encodeURIComponent(cpState.groupId) + '/contributions/record-bulk', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                        body: JSON.stringify({
                            members: membersPayload,
                            payment_method: method
                        })
                    });
                    var json = await resp.json();
                    if (json.success) {
                        var d = json.data;
                        showNotification(d.recorded + ' pago(s) registrados' + (d.failed > 0 ? ', ' + d.failed + ' fallido(s)' : ''), 'success');
                        // Reload data
                        cpState.selectedMembers = {};
                        await cpLoadData();
                    } else {
                        showNotification('No se pudieron registrar los pagos', 'error');
                    }
                } catch (err) {
                    showNotification(t('messages.connection_error',{defaultValue:'Error de conexion'}), 'error');
                } finally {
                    if (btn) { btn.disabled = false; btn.textContent = 'Registrar ' + selected.length + ' pagos'; btn.style.background = '#00FFFF'; }
                }
            }

            // === DELEGATED EVENT HANDLER ===
            modal.addEventListener('click', function(e) {
                if (e.target === modal) { cpClose(); return; }
                var btn = e.target.closest('[data-action]');
                if (!btn) {
                    // Handle checkbox changes
                    if (e.target.type === 'checkbox' && e.target.dataset.action) {
                        // handled below
                    } else {
                        return;
                    }
                }
                var target = btn || e.target;
                var action = target.getAttribute('data-action');
                var uid = target.getAttribute('data-uid');

                switch (action) {
                    case 'cp-close':
                        cpClose();
                        break;
                    case 'cp-tab-individual':
                        cpState.activeTab = 'individual';
                        modal.querySelectorAll('.cp-tab').forEach(function(t) { t.classList.remove('cp-tab-active'); });
                        target.classList.add('cp-tab-active');
                        cpRenderTab();
                        break;
                    case 'cp-tab-masivo':
                        cpState.activeTab = 'masivo';
                        modal.querySelectorAll('.cp-tab').forEach(function(t) { t.classList.remove('cp-tab-active'); });
                        target.classList.add('cp-tab-active');
                        cpRenderTab();
                        break;
                    case 'cp-register-single':
                        cpShowInlineForm(uid);
                        break;
                    case 'cp-confirm-single':
                        cpConfirmSingle(uid);
                        break;
                    case 'cp-loan-pay':
                    (function() {
                        var lpLoanId = btn.getAttribute('data-loan-id');
                        var lpUid = btn.getAttribute('data-uid');
                        if (!lpLoanId || !cpState || !cpState.groupId) return;
                        var lpMember = cpState.members.find(function(mm) { return mm.user_id === lpUid; });
                        var lpLoan = lpMember && lpMember.active_loan ? lpMember.active_loan : null;
                        if (!lpLoan) { showNotification('Prestamo no encontrado', 'error'); return; }
                        var lpOwed = parseFloat(lpLoan.total_owed);
                        showConfirm(
                            'Registrar Abono a Prestamo',
                            '<div style="margin-bottom:12px;color:#94a3b8;">Deuda de <strong style="color:#ef4444;">' + (window.ltFormatCurrency ? ltFormatCurrency(lpOwed) : 'L. ' + lpOwed.toLocaleString('es-HN')) + '</strong> para <strong style="color:#e2e8f0;">' + escapeHtml(lpMember.name || 'Miembro') + '</strong></div>' +
                            '<div style="margin-bottom:8px;"><label style="color:#94a3b8;font-size:0.8rem;">Monto</label><input type="number" id="cpLoanAmt" min="1" max="' + lpOwed + '" value="' + lpOwed + '" style="width:100%;padding:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.15);border-radius:8px;color:#e2e8f0;margin-top:4px;box-sizing:border-box;" /></div>' +
                            '<div style="margin-bottom:8px;"><label style="color:#94a3b8;font-size:0.8rem;">Metodo</label><select id="cpLoanMethod" style="width:100%;padding:10px;background:#1e293b;border:1px solid rgba(255,255,255,0.15);border-radius:8px;color:#e2e8f0;margin-top:4px;box-sizing:border-box;">' + cpMethodOptions('cash') + '</select></div>' +
                            '<div><label style="color:#94a3b8;font-size:0.8rem;">Nota</label><input type="text" id="cpLoanNotes" maxlength="500" style="width:100%;padding:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.15);border-radius:8px;color:#e2e8f0;margin-top:4px;box-sizing:border-box;" /></div>'
                        ).then(async function(confirmed) {
                            if (!confirmed) return;
                            var amt = parseFloat(document.getElementById('cpLoanAmt')?.value);
                            var mth = document.getElementById('cpLoanMethod')?.value || 'cash';
                            var nts = document.getElementById('cpLoanNotes')?.value || '';
                            if (!amt || amt <= 0) { showNotification(t('messages.invalid_amount',{defaultValue:'Monto invalido'}), 'error'); return; }
                            try {
                                var r = await fetch('/api/groups/' + encodeURIComponent(cpState.groupId) + '/loans/' + lpLoanId + '/pay', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                                    body: JSON.stringify({ amount: amt, payment_method: mth, notes: nts })
                                });
                                var d = await r.json();
                                if (!d.success) throw new Error(d.data?.error?.message || 'Error');
                                showNotification(d.data.message, 'success');
                                cpLoadData();
                            } catch (err) { showNotification(err.message || 'Error al registrar pago', 'error'); }
                        });
                    })();
                    break;

                case 'cp-mark-mora':
                        var moraName = btn.getAttribute('data-name') || 'este miembro';
                        var moraMember = cpState.members ? cpState.members.find(function(mm) { return mm.user_id === uid; }) : null;
                        var moraUnpaid = moraMember ? (moraMember.unpaid_cycles || []) : [];
                        if (moraUnpaid.length === 0) {
                            if (typeof window.showNotification === 'function') window.showNotification('Este miembro no tiene ciclos vencidos sin pagar', 'info');
                            break;
                        }
                        var moraMsg = moraUnpaid.length > 1
                            ? 'Marcar a ' + escapeHtml(moraName) + ' en mora para ' + moraUnpaid.length + ' ciclos vencidos (C' + moraUnpaid.join(', C') + ')?'
                            : 'Marcar a ' + escapeHtml(moraName) + ' en mora para ciclo ' + moraUnpaid[0] + '?';
                        showConfirm(moraMsg, function() {
                            cpMarkMora(uid, moraUnpaid);
                        });
                        break;
                    case 'cp-cancel-single':
                        var formEl = document.getElementById('cp-form-' + uid);
                        if (formEl) formEl.style.display = 'none';
                        cpState.loadingInline = null;
                        break;
                    case 'cp-toggle-select':
                        cpToggleSelect(uid);
                        break;
                    case 'cp-select-all-pending':
                        cpSelectAllPending();
                        break;
                    case 'cp-submit-bulk':
                        cpSubmitBulk();
                        break;
                }
            });

            // Handle checkbox change events (for select-all)
            modal.addEventListener('change', function(e) {
                if (e.target.id === 'cpSelectAll') {
                    cpSelectAllPending();
                } else if (e.target.dataset.action === 'cp-toggle-select') {
                    cpToggleSelect(e.target.dataset.uid);
                }
            });

            // Load data
            cpLoadData();

            // =============================================
            // v4.11.0: COORDINATOR MARK MORA
            // =============================================
            async function cpMarkMora(userId, unpaidCycles) {
                try {
                    var apiBase = window.API_BASE_URL || 'https://latanda.online';
                    var bodyData = unpaidCycles && unpaidCycles.length > 0 ? { cycles: unpaidCycles } : {};
                    var resp = await fetch(apiBase + '/api/groups/' + encodeURIComponent(cpState.groupId) + '/members/' + encodeURIComponent(userId) + '/mark-mora', {
                        method: 'POST',
                        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                        body: JSON.stringify(bodyData)
                    });
                    var data = await resp.json();
                    if (!resp.ok || !data.success) throw new Error(data.message || 'Error');
                    var msg = data.data && data.data.cycles_marked ? data.data.cycles_marked.length + ' ciclo(s) marcados en mora' : 'Mora registrada';
                    if (typeof window.showSuccess === 'function') window.showSuccess(msg);
                    await cpLoadData();
                    cpRenderTab();
                } catch (e) {
                    if (typeof window.showError === 'function') window.showError(e.message || 'Error al registrar mora');
                }
            }

            // =============================================
            // v4.11.0: THRESHOLD PROGRESS BAR IN COORDINATOR VIEW
            // =============================================
            function cpRenderThresholdBar() {
                var bar = document.getElementById('cpThresholdBar');
                if (!bar || !cpState.members) return;
                var total = 0, paid = 0;
                cpState.members.forEach(function(m) {
                    var pos = m.num_positions || 1;
                    total += pos;
                    if (m.payment_status === 'paid') paid += pos;
                });
                var threshold = cpState.threshold || 80;
                var pct = total > 0 ? Math.round(paid / total * 100) : 0;
                var needed = Math.ceil(total * threshold / 100);
                var color = pct >= threshold ? '#22c55e' : '#f59e0b';
                bar.innerHTML = '<div style="display:flex;align-items:center;gap:8px;font-size:0.75rem;color:#94a3b8;">' +
                    '<div style="flex:1;height:6px;border-radius:3px;background:rgba(100,116,139,0.2);overflow:hidden;">' +
                        '<div style="width:' + Math.min(pct, 100) + '%;height:100%;background:' + color + ';border-radius:3px;transition:width 0.3s;"></div>' +
                    '</div>' +
                    '<span>Pagos: ' + paid + '/' + total + ' (' + pct + '%) — Umbral: ' + threshold + '% (' + needed + ' necesarios)</span>' +
                '</div>';
            }

        }
        window.showCoordinatorPaymentView = showCoordinatorPaymentView;



        // =============================================
        // v4.11.0: EXTENSION REQUEST MODAL (pr- prefix)
        // =============================================
        async function showExtensionRequestModal(groupId) {
            // Fetch group info
            var apiBase = window.API_BASE_URL || 'https://latanda.online';
            var groupData = null;
            try {
                var resp = await fetch(apiBase + '/api/groups/' + encodeURIComponent(groupId), { headers: getAuthHeaders() });
                var d = await resp.json();
                groupData = d.data?.data || d.data;
            } catch (e) { /* group data parse failure handled by null check below */ }

            var groupName = groupData ? escapeHtml(groupData.name || 'Grupo') : 'Grupo';
            var cycle = groupData ? (groupData.current_cycle || 1) : '?';
            var amount = groupData ? (window.ltFormatNumber ? ltFormatNumber(groupData.contribution_amount, 2) : parseFloat(groupData.contribution_amount || 0).toLocaleString('es-HN', {minimumFractionDigits:2})) : '0.00';

            // Calculate next quincena
            var now = new Date();
            var quinDay = now.getDate() < 15 ? 15 : new Date(now.getFullYear(), now.getMonth() + 1, 15).getDate();
            var quinMonth = now.getDate() < 15 ? now.getMonth() : now.getMonth() + 1;
            var quinDate = new Date(now.getFullYear(), quinMonth, 15);
            var quinLabel = quinDate.toLocaleDateString('es-HN', { day: 'numeric', month: 'long', year: 'numeric' });

            var overlay = document.createElement('div');
            overlay.id = 'prOverlay';
            overlay.className = 'pr-overlay';
            overlay.innerHTML =
                '<div class="pr-modal">' +
                    '<div class="pr-header">' +
                        '<h3>Solicitar Prorroga</h3>' +
                        '<button data-action="pr-close" class="pr-close-btn">&times;</button>' +
                    '</div>' +
                    '<div class="pr-body">' +
                        '<div class="pr-info">' +
                            '<div class="pr-info-row"><span>' + groupName + '</span><span>Ciclo ' + escapeHtml(String(cycle)) + '</span></div>' +
                            '<div class="pr-info-row"><span>Monto pendiente:</span><span style="color:#f59e0b;font-weight:600;">L. ' + amount + '</span></div>' +
                        '</div>' +
                        '<div class="pr-section">' +
                            '<label class="pr-label">Cuando podras pagar?</label>' +
                            '<label class="pr-radio-label"><input type="radio" name="prDateType" value="quincena" checked> Proxima Quincena: ' + escapeHtml(quinLabel) + '</label>' +
                            '<label class="pr-radio-label"><input type="radio" name="prDateType" value="custom"> Otra fecha:</label>' +
                            '<input type="date" id="prCustomDate" class="pr-input" style="display:none;" min="' + now.toISOString().split('T')[0] + '">' +
                        '</div>' +
                        '<div class="pr-section">' +
                            '<label class="pr-label">Motivo (requerido):</label>' +
                            '<textarea id="prReason" class="pr-textarea" maxlength="500" placeholder="Explica brevemente por que necesitas la prorroga..."></textarea>' +
                            '<div class="pr-char-count"><span id="prCharCount">0</span>/500</div>' +
                        '</div>' +
                        '<div id="prError" class="pr-error" style="display:none;"></div>' +
                    '</div>' +
                    '<div class="pr-footer">' +
                        '<button data-action="pr-close" class="pr-btn-cancel">Cancelar</button>' +
                        '<button data-action="pr-submit" class="pr-btn-submit" data-group-id="' + escapeHtml(groupId) + '">Enviar Solicitud</button>' +
                    '</div>' +
                '</div>';

            document.body.appendChild(overlay);
            document.body.style.overflow = 'hidden';
            requestAnimationFrame(function() { overlay.classList.add('active'); });

            // Toggle custom date visibility
            overlay.addEventListener('change', function(e) {
                if (e.target.name === 'prDateType') {
                    document.getElementById('prCustomDate').style.display = e.target.value === 'custom' ? 'block' : 'none';
                }
            });

            // Char counter
            var ta = document.getElementById('prReason');
            if (ta) ta.addEventListener('input', function() {
                document.getElementById('prCharCount').textContent = ta.value.length;
            });
        }

        async function prSubmitRequest(groupId) {
            var errDiv = document.getElementById('prError');
            var submitBtn = document.querySelector('[data-action="pr-submit"]');
            var reason = (document.getElementById('prReason') || {}).value || '';
            if (reason.trim().length < 1) {
                if (errDiv) { errDiv.textContent = 'El motivo es requerido'; errDiv.style.display = 'block'; }
                return;
            }

            var dateType = document.querySelector('input[name="prDateType"]:checked');
            var bodyData = { reason: reason.trim() };
            if (dateType && dateType.value === 'quincena') {
                bodyData.next_quincena = true;
            } else {
                var customDate = (document.getElementById('prCustomDate') || {}).value;
                if (customDate) bodyData.proposed_date = customDate;
            }

            if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Enviando...'; }
            if (errDiv) errDiv.style.display = 'none';

            try {
                var apiBase = window.API_BASE_URL || 'https://latanda.online';
                var resp = await fetch(apiBase + '/api/groups/' + encodeURIComponent(groupId) + '/extensions/request', {
                    method: 'POST',
                    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                    body: JSON.stringify(bodyData)
                });
                var data = await resp.json();
                if (!resp.ok || !data.success) throw new Error(data?.data?.error?.message || 'Error');

                // Success
                prClose();
                if (typeof window.showSuccess === 'function') window.showSuccess(t('messages.extension_sent',{defaultValue:'Solicitud de prorroga enviada'}));
            } catch (e) {
                if (errDiv) { errDiv.textContent = 'Error al enviar solicitud'; errDiv.style.display = 'block'; }
                if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Enviar Solicitud'; }
            }
        }

        function prClose() {
            var overlay = document.getElementById('prOverlay');
            if (overlay) {
                overlay.classList.remove('active');
                setTimeout(function() { overlay.remove(); document.body.style.overflow = ''; }, 300);
            }
        }

        // =============================================
        // v4.11.0: EXTENSION MANAGER PANEL (ext- prefix)
        // =============================================
        async function showExtensionManager(groupId) {
            var apiBase = window.API_BASE_URL || 'https://latanda.online';
            var overlay = document.createElement('div');
            overlay.id = 'extOverlay';
            overlay.className = 'ext-overlay';
            overlay.innerHTML =
                '<div class="ext-modal">' +
                    '<div class="ext-header">' +
                        '<h3>Prorrogas y Moras</h3>' +
                        '<button data-action="ext-close" class="ext-close-btn">&times;</button>' +
                    '</div>' +
                    '<div class="ext-tabs">' +
                        '<button class="ext-tab active" data-action="ext-filter" data-filter="active">Pendientes</button>' +
                        '<button class="ext-tab" data-action="ext-filter" data-filter="approved">Aprobadas</button>' +
                        '<button class="ext-tab" data-action="ext-filter" data-filter="all">Todas</button>' +
                    '</div>' +
                    '<div id="extContent" class="ext-content"><div class="ext-loading">Cargando...</div></div>' +
                    '<div id="extSummary" class="ext-summary"></div>' +
                '</div>';

            document.body.appendChild(overlay);
            document.body.style.overflow = 'hidden';
            requestAnimationFrame(function() { overlay.classList.add('active'); });

            overlay.setAttribute('data-group-id', groupId);

            // Load data
            await extLoadData(groupId, 'active');

            // Delegated events
            overlay.addEventListener('click', async function(e) {
                var btn = e.target.closest('[data-action]');
                if (!btn) return;
                var action = btn.getAttribute('data-action');
                if (action === 'ext-close') {
                    extClose();
                } else if (action === 'ext-filter') {
                    overlay.querySelectorAll('.ext-tab').forEach(function(t) { t.classList.remove('active'); });
                    btn.classList.add('active');
                    await extLoadData(groupId, btn.getAttribute('data-filter'));
                } else if (action === 'ext-approve' || action === 'ext-reject') {
                    var defId = btn.getAttribute('data-id');
                    var act = action === 'ext-approve' ? 'approve' : 'reject';
                    btn.disabled = true;
                    try {
                        var resp = await fetch(apiBase + '/api/groups/' + encodeURIComponent(groupId) + '/extensions/' + encodeURIComponent(defId), {
                            method: 'PATCH',
                            headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: act })
                        });
                        var data = await resp.json();
                        if (!resp.ok || !data.success) throw new Error('Error');
                        if (typeof window.showSuccess === 'function') window.showSuccess(act === 'approve' ? 'Prorroga aprobada' : 'Prorroga rechazada');
                        var filter = overlay.querySelector('.ext-tab.active');
                        await extLoadData(groupId, filter ? filter.getAttribute('data-filter') : 'active');
                    } catch (err) {
                        btn.disabled = false;
                        if (typeof window.showError === 'function') window.showError('Error al procesar');
                    }
                }
            });
        }

        async function extLoadData(groupId, status) {
            var apiBase = window.API_BASE_URL || 'https://latanda.online';
            var contentEl = document.getElementById('extContent');
            var summaryEl = document.getElementById('extSummary');
            if (!contentEl) return;
            contentEl.innerHTML = '<div class="ext-loading">Cargando...</div>';

            try {
                var url = apiBase + '/api/groups/' + encodeURIComponent(groupId) + '/extensions?status=' + (status || 'active');
                var resp = await fetch(url, { headers: getAuthHeaders() });
                var data = await resp.json();
                if (!resp.ok || !data.success) throw new Error('Error');

                var deferrals = data.data?.deferrals || [];
                var summary = data.data?.summary || {};

                // Render summary
                if (summaryEl) {
                    summaryEl.innerHTML = '<span>' + (summary.active_moras || 0) + ' moras activas</span> · <span>' + (summary.pending_extensions || 0) + ' prorrogas pendientes</span> · <span>' + (summary.approved_extensions || 0) + ' aprobadas</span>';
                }

                if (deferrals.length === 0) {
                    contentEl.innerHTML = '<div style="text-align:center;padding:40px;color:#64748b;">Sin registros</div>';
                    return;
                }

                var html = '';
                deferrals.forEach(function(d) {
                    var isMora = d.type === 'mora';
                    var icon = isMora ? '<span style="color:#ef4444;">&#x1F534;</span>' : '<span style="color:#f59e0b;">&#x1F536;</span>';
                    var typeLabel = isMora ? 'MORA' : 'PRORROGA';
                    var name = escapeHtml(d.user_name || 'Usuario');
                    var amount = d.amount_owed ? (window.ltFormatCurrency ? ltFormatCurrency(parseFloat(d.amount_owed)) : 'L. ' + parseFloat(d.amount_owed).toLocaleString('es-HN', {minimumFractionDigits:2})) : '';
                    var dateStr = '';
                    if (d.proposed_date) {
                        dateStr = 'Fecha: ' + new Date(d.proposed_date).toLocaleDateString('es-HN');
                    } else if (d.mora_method) {
                        dateStr = d.mora_method === 'auto_threshold' ? 'Auto (umbral)' : 'Manual';
                    }

                    html += '<div class="ext-item ext-item-' + d.type + '">' +
                        '<div class="ext-item-header">' +
                            icon + ' <strong>' + typeLabel + '</strong> — ' + name + (d.is_placeholder ? ' <span class="member-placeholder-badge">Pendiente</span>' : '') +
                        '</div>' +
                        '<div class="ext-item-meta">Ciclo ' + escapeHtml(String(d.cycle_number)) + ' | ' + amount + (dateStr ? ' | ' + escapeHtml(dateStr) : '') + '</div>' +
                        (d.reason ? '<div class="ext-item-reason">"' + escapeHtml(d.reason) + '"</div>' : '') +
                        '<div class="ext-item-status">Estado: <span class="ext-status-' + d.status + '">' + escapeHtml(d.status) + '</span></div>';

                    // Action buttons for active extensions
                    if (!isMora && d.status === 'active') {
                        html += '<div class="ext-item-actions">' +
                            '<button data-action="ext-approve" data-id="' + escapeHtml(d.id) + '" class="ext-btn-approve">Aprobar</button>' +
                            '<button data-action="ext-reject" data-id="' + escapeHtml(d.id) + '" class="ext-btn-reject">Rechazar</button>' +
                        '</div>';
                    }
                    html += '</div>';
                });

                contentEl.innerHTML = html;
            } catch (e) {
                contentEl.innerHTML = '<div style="text-align:center;padding:40px;color:#ef4444;">Error al cargar datos</div>';
            }
        }

        function extClose() {
            var overlay = document.getElementById('extOverlay');
            if (overlay) {
                overlay.classList.remove('active');
                setTimeout(function() { overlay.remove(); document.body.style.overflow = ''; }, 300);
            }
        }

        // Delegated handlers for pr- and ext- actions
        document.addEventListener('click', function(e) {
            var btn = e.target.closest('[data-action]');
            if (!btn) return;
            var action = btn.getAttribute('data-action');
            if (action === 'pr-close') prClose();
            else if (action === 'pr-submit') {
                var gid = btn.getAttribute('data-group-id');
                if (gid) prSubmitRequest(gid);
            }
        });

        async function showRegisterPaymentModal(groupId) {
            currentPaymentGroupId = groupId;
            currentPaymentStep = 1;
            currentPaymentData = null;
            selectedPaymentMethod = null;
            proofFile = null;
            
            var modal = document.getElementById('registerPaymentModal');
            
            // Reset to step 1
            resetPaymentModal();
            
            // Show modal
            modal.style.display = 'flex'; modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function resetPaymentModal() {
            currentPaymentStep = 1;
            selectedPaymentMethod = null;
            proofFile = null;
            
            // Reset form fields
            var amountInput = document.getElementById('paymentAmount');
            if (amountInput) amountInput.value = '';
            
            // Reset method selection
            document.querySelectorAll('.payment-method-card').forEach(function(card) {
                card.classList.remove('selected');
            });
            var methodInput = document.getElementById('paymentMethod');
            if (methodInput) methodInput.value = '';
            
            // Reset proof upload
            var proofPreview = document.getElementById('proofPreview');
            var proofPrompt = document.getElementById('proofUploadPrompt');
            if (proofPreview) proofPreview.style.display = 'none';
            if (proofPrompt) proofPrompt.style.display = 'block';
            
            // Show step 1, hide others
            showPaymentStep(1);
            updateStepIndicator(1);
            updatePaymentButtons();
        }

        function selectPaymentMethod(method) {
            selectedPaymentMethod = method;
            document.getElementById('paymentMethod').value = method;
            
            // Update visual selection
            document.querySelectorAll('.payment-method-card').forEach(function(card) {
                card.classList.remove('selected');
            });
            document.querySelector('.payment-method-card[data-method="' + method + '"]').classList.add('selected');
        }

        function showPaymentStep(step) {
            document.querySelectorAll('.payment-step').forEach(function(s) {
                s.style.display = 'none';
            });
            
            var stepEl = document.getElementById('paymentStep' + step);
            if (stepEl) stepEl.style.display = 'block';
            
            // Special handling for success
            if (step === 'success') {
                document.getElementById('paymentSuccess').style.display = 'block';
            }
        }

        function updateStepIndicator(step) {
            document.querySelectorAll('.step-dot').forEach(function(dot, index) {
                dot.classList.remove('active', 'completed');
                if (index + 1 < step) {
                    dot.classList.add('completed');
                } else if (index + 1 === step) {
                    dot.classList.add('active');
                }
            });
        }

        function updatePaymentButtons() {
            var backBtn = document.getElementById('paymentBackBtn');
            var nextBtn = document.getElementById('paymentNextBtn');
            var cancelBtn = document.getElementById('paymentCancelBtn');
            var doneBtn = document.getElementById('paymentDoneBtn');
            var stepIndicator = document.getElementById('paymentStepIndicator');
            
            if (currentPaymentStep === 1) {
                backBtn.style.display = 'none';
                nextBtn.style.display = 'block';
                cancelBtn.style.display = 'block';
                doneBtn.style.display = 'none';
                stepIndicator.style.display = 'flex';
                nextBtn.textContent = 'Continuar →';
            } else if (currentPaymentStep === 2) {
                backBtn.style.display = 'block';
                nextBtn.style.display = 'block';
                cancelBtn.style.display = 'none';
                doneBtn.style.display = 'none';
                stepIndicator.style.display = 'flex';
                nextBtn.textContent = 'Ya realice el pago →';
            } else if (currentPaymentStep === 3) {
                backBtn.style.display = 'block';
                nextBtn.style.display = 'block';
                cancelBtn.style.display = 'none';
                doneBtn.style.display = 'none';
                stepIndicator.style.display = 'flex';
                nextBtn.textContent = 'Enviar Comprobante';
            } else if (currentPaymentStep === 4) {
                // Success state
                backBtn.style.display = 'none';
                nextBtn.style.display = 'none';
                cancelBtn.style.display = 'none';
                doneBtn.style.display = 'block';
                stepIndicator.style.display = 'none';
            }
        }

        async function paymentNextStep() {
            if (currentPaymentStep === 1) {
                // Validate step 1
                var amount = parseFloat(document.getElementById('paymentAmount').value);
                var method = document.getElementById('paymentMethod').value;
                var errorDiv = document.getElementById('paymentStep1Error');
                
                if (!amount || amount <= 0) {
                    errorDiv.textContent = 'Por favor ingresa un monto valido';
                    errorDiv.style.display = 'block';
                    return;
                }
                if (!method) {
                    errorDiv.textContent = 'Por favor selecciona un metodo de pago';
                    errorDiv.style.display = 'block';
                    return;
                }
                errorDiv.style.display = 'none';
                
                // Request payment code from API
                var nextBtn = document.getElementById('paymentNextBtn');
                nextBtn.disabled = true;
                nextBtn.textContent = 'Generando codigo...';
                
                try {
                    var userId = (function() {
                        // Try multiple sources for user ID
                        var latandaUser = localStorage.getItem('latanda_user');
                        if (latandaUser) {
                            try {
                                var userData = JSON.parse(latandaUser);
                                if (userData.user_id) return userData.user_id;
                                if (userData.id) return userData.id;
                            } catch(e) { /* localStorage parse may fail in private browsing */ }
                        }
                        return localStorage.getItem('latanda_user_id') || 
                               sessionStorage.getItem('latanda_user_id') ||
                               localStorage.getItem('userId') ||
                               window.currentUserId ||
                               'user_unknown';
                    })();
                    var apiBase = window.API_BASE_URL || 'https://latanda.online';
                    
                    var response = await fetch(apiBase + '/api/contributions/request', {
                        method: 'POST',
                        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            group_id: currentPaymentGroupId,
                            amount: amount,
                            payment_method: method
                        })
                    });
                    
                    var result = await response.json();
                    
                    if (!result.success || !result.data) {
                        throw new Error(result.data?.error?.message || 'Error al generar codigo');
                    }
                    
                    currentPaymentData = result.data;
                    
                    // Display instructions
                    displayPaymentInstructions(currentPaymentData);
                    
                    // Move to step 2
                    currentPaymentStep = 2;
                    showPaymentStep(2);
                    updateStepIndicator(2);
                    updatePaymentButtons();
                    
                } catch (err) {
                    errorDiv.textContent = 'Error al generar codigo de pago';
                    errorDiv.style.display = 'block';
                } finally {
                    nextBtn.disabled = false;
                    nextBtn.textContent = 'Continuar →';
                }
                
            } else if (currentPaymentStep === 2) {
                // Move to step 3 (upload proof)
                currentPaymentStep = 3;
                showPaymentStep(3);
                updateStepIndicator(3);
                updatePaymentButtons();
                
            } else if (currentPaymentStep === 3) {
                // Submit proof and complete
                await submitPaymentWithProof();
            }
        }

        function paymentPrevStep() {
            if (currentPaymentStep > 1) {
                currentPaymentStep--;
                showPaymentStep(currentPaymentStep);
                updateStepIndicator(currentPaymentStep);
                updatePaymentButtons();
            }
        }

        function displayPaymentInstructions(data) {
            // Reference code
            document.getElementById('referenceCodeDisplay').textContent = data.reference_code;
            
            // Instructions title
            document.getElementById('instructionsTitle').textContent = data.instructions.title;
            
            // Instructions steps
            var stepsList = document.getElementById('instructionsSteps');
            stepsList.innerHTML = '';
            data.instructions.steps.forEach(function(step) {
                var li = document.createElement('li');
                li.textContent = step;
                li.style.marginBottom = '8px';
                stepsList.appendChild(li);
            });
            
            // Bank details (if applicable)
            var bankBox = document.getElementById('bankDetailsBox');
            if (data.instructions.bank_details) {
                bankBox.style.display = 'block';
                var bankContent = document.getElementById('bankDetailsContent');
                var bd = data.instructions.bank_details;
                var _piEsc = typeof escapeHtml === 'function' ? escapeHtml : function(s) {
                    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
                };
                bankContent.innerHTML =
                    '<div style="margin-bottom: 6px;"><strong>Banco:</strong> ' + _piEsc(bd.bank_name || '') + '</div>' +
                    '<div style="margin-bottom: 6px;"><strong>Cuenta:</strong> ' + _piEsc(bd.account_number || '') + '</div>' +
                    '<div style="margin-bottom: 6px;"><strong>Titular:</strong> ' + _piEsc(bd.account_holder || '') + '</div>' +
                    '<div><strong>Tipo:</strong> ' + _piEsc(bd.account_type || '') + '</div>';
            } else {
                bankBox.style.display = 'none';
            }
            
            // Verification time
            document.getElementById('verificationTimeText').textContent = 
                'Tiempo de verificacion: ' + data.instructions.verification_time;
        }

        function copyReferenceCode() {
            var code = document.getElementById('referenceCodeDisplay').textContent;
            navigator.clipboard.writeText(code).then(function() {
                if (typeof window.showSuccess === 'function') {
                    window.showSuccess(t('messages.code_copied',{defaultValue:'Codigo copiado!'}));
                } else {
                    showSuccess(t('messages.code_copied',{defaultValue:'Codigo copiado!'}));
                }
            }).catch(function() { /* clipboard API may not be available */ });
        }

        function handleProofUpload(event) {
            var file = event.target.files[0];
            if (!file) return;
            
            // Validate file type
            if (!file.type.startsWith('image/')) {
                var errorDiv = document.getElementById('paymentStep3Error');
                errorDiv.textContent = 'Por favor selecciona una imagen';
                errorDiv.style.display = 'block';
                return;
            }
            
            proofFile = file;
            
            // Show preview
            var reader = new FileReader();
            reader.onload = function(e) {
                var previewImg = document.getElementById('proofPreviewImage');
                previewImg.src = e.target.result;
                document.getElementById('proofPreview').style.display = 'block';
                document.getElementById('proofUploadPrompt').style.display = 'none';
            };
            reader.readAsDataURL(file);
            
            document.getElementById('paymentStep3Error').style.display = 'none';
        }

        async function submitPaymentWithProof() {
            var errorDiv = document.getElementById('paymentStep3Error');
            var nextBtn = document.getElementById('paymentNextBtn');

            // Validate proof file
            if (!proofFile) {
                errorDiv.textContent = 'Por favor sube un comprobante';
                errorDiv.style.display = 'block';
                return;
            }

            // Validate we have contribution data
            if (!currentPaymentData || !currentPaymentData.contribution_id) {
                errorDiv.textContent = 'Error: datos de contribucion no encontrados';
                errorDiv.style.display = 'block';
                return;
            }

            nextBtn.disabled = true;
            nextBtn.textContent = 'Enviando...';
            errorDiv.style.display = 'none';

            try {
                var apiBase = window.API_BASE_URL || 'https://latanda.online';

                // Create FormData for file upload
                var formData = new FormData();
                formData.append('proof', proofFile);

                // Upload proof to backend
                var response = await fetch(apiBase + '/api/contributions/' + currentPaymentData.contribution_id + '/upload-proof', {
                    method: 'POST',
                    headers: { ...getAuthHeaders() },
                    body: formData
                });

                var result = await response.json();

                if (!response.ok || !result.success) {
                    throw new Error('Error al subir comprobante');
                }

                // Show success
                currentPaymentStep = 4;
                showPaymentStep('success');

                document.getElementById('paymentSuccessMessage').textContent =
                    'Pago de L. ' + (window.ltFormatNumber ? ltFormatNumber(currentPaymentData.amount, 2) : currentPaymentData.amount.toLocaleString('es-HN', {minimumFractionDigits: 2})) + ' registrado';
                document.getElementById('paymentSuccessCode').textContent =
                    'Codigo: ' + currentPaymentData.reference_code;
                document.getElementById('paymentSuccessStatus').textContent =
                    'Estado: Esperando verificacion';

                updatePaymentButtons();

                if (typeof window.showSuccess === 'function') {
                    window.showSuccess('Comprobante enviado exitosamente');
                }

                // Refresh the page data after a short delay
                setTimeout(function() {
                    if (typeof loadGroupsData === 'function') {
                        loadGroupsData();
                    }
                }, 2000);

            } catch (err) {
                errorDiv.textContent = 'Error al enviar comprobante';
                errorDiv.style.display = 'block';
            } finally {
                nextBtn.disabled = false;
                nextBtn.textContent = 'Enviar Comprobante';
            }
        }

        function closeRegisterPaymentModal() {
            var modal = document.getElementById('registerPaymentModal');
            if (modal) {
                modal.style.display = 'none'; modal.classList.remove('active');
                document.body.style.overflow = '';
            }
            currentPaymentGroupId = null;
            currentPaymentData = null;
            proofFile = null;
        }

        // Keep legacy functions for backwards compatibility
        function resetPaymentForm() {
            resetPaymentModal();
        }

        async function loadMembersForPayment(groupId) {
            // Legacy function - no longer needed in new flow
            return;
        }

        async function submitPayment(event) {
            // Legacy function - redirects to new flow
            if (event) event.preventDefault();
            paymentNextStep();
        }
        // ========== END PAYMENT MODAL ==========

        // Close register payment modal on overlay click
        document.addEventListener('DOMContentLoaded', function() {
            var modal = document.getElementById('registerPaymentModal');
            if (modal) {
                modal.addEventListener('click', function(e) {
                    if (e.target === modal) closeRegisterPaymentModal();
                });
            }
        });

// --- Block 7 (originally inline) ---
// v4.25.4: Tab switching handler (restored — was removed with modal cleanup)
    document.addEventListener('click', function(e) {
        var tabBtn = e.target.closest('[data-action="switch-groups-tab"]');
        if (tabBtn) {
            var tabName = tabBtn.getAttribute('data-tab');
            if (!tabName) return;

            // Update tab buttons
            document.querySelectorAll('.groups-tab').forEach(function(t) {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            tabBtn.classList.add('active');
            tabBtn.setAttribute('aria-selected', 'true');

            // Switch content sections
            document.querySelectorAll('.content-section').forEach(function(s) { s.classList.remove('active'); });
            var section = document.getElementById(tabName);
            if (section) section.classList.add('active');

            // Toggle sidebar cards based on active tab
            var tandasSidebar = document.getElementById('tandasSidebarCards');
            var grpStats = document.getElementById('grpSidebarStats');
            var grpTandaBalance = document.getElementById('grpTandaBalanceCard');
            var grpRoles = document.getElementById('grpSidebarRoles');
            var grpActions = document.getElementById('grpSidebarActions');
            var grpNextPay = document.getElementById('grpSidebarNextPayment');
            var hubCards = document.getElementById('sidebarHubCards');
            var createSidebar = document.getElementById('createGroupSidebar');

            if (tabName === 'tandas') {
                if (tandasSidebar) tandasSidebar.style.display = '';
                if (grpStats) grpStats.style.display = 'none';
                if (grpTandaBalance) grpTandaBalance.style.display = 'none';
                if (grpRoles) grpRoles.style.display = 'none';
                if (grpActions) grpActions.style.display = 'none';
                if (grpNextPay) grpNextPay.style.display = 'none';
                if (hubCards) hubCards.style.display = 'none';
                if (createSidebar) createSidebar.style.display = 'none';
                if (typeof refreshTandas === 'function') refreshTandas().catch(function(){});
            } else if (tabName === 'create') {
                if (tandasSidebar) tandasSidebar.style.display = 'none';
                if (grpStats) grpStats.style.display = 'none';
                if (grpTandaBalance) grpTandaBalance.style.display = 'none';
                if (grpRoles) grpRoles.style.display = 'none';
                if (grpActions) grpActions.style.display = 'none';
                if (grpNextPay) grpNextPay.style.display = 'none';
                if (hubCards) hubCards.style.display = '';
                if (createSidebar) createSidebar.style.display = '';
                if (typeof updateCgsCalculator === 'function') updateCgsCalculator();
                if (typeof updateCgsContract === 'function') updateCgsContract();
                if (typeof updateCgsTips === 'function') updateCgsTips(1);
            } else {
                if (tandasSidebar) tandasSidebar.style.display = 'none';
                if (createSidebar) createSidebar.style.display = 'none';
                if (grpStats) grpStats.style.display = '';
                if (grpRoles) grpRoles.style.display = '';
                if (grpActions) grpActions.style.display = '';
                if (grpNextPay) grpNextPay.style.display = '';
                if (hubCards) hubCards.style.display = '';
            }
            return;
        }
    });

    // Delegated event handler for group card actions
    document.addEventListener('click', function(e) {
        var btn = e.target.closest('[data-action]');
        if (!btn) return;
        var action = btn.getAttribute('data-action');

        switch(action) {
            // v4.25.12: Cancel pending join request
            case 'grp-cancel-join':
                var cancelGid = btn.getAttribute('data-group-id');
                if (!cancelGid || !confirm('Cancelar tu solicitud de union a este grupo?')) break;
                (async function() {
                    try {
                        var token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
                        var resp = await fetch('/api/groups/' + encodeURIComponent(cancelGid) + '/cancel-join', {
                            method: 'POST',
                            headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }
                        });
                        var data = await resp.json();
                        if (data.success) {
                            var card = btn.closest('.gc-card');
                            if (card) card.remove();
                            if (window.showToast) showToast('Solicitud cancelada', 'success');
                        } else {
                            if (window.showToast) showToast(data.data?.error?.message || 'Error', 'error');
                        }
                    } catch(err) { if (window.showToast) showToast('Error de conexion', 'error'); }
                })();
                break;
            // Group card primary actions
            case 'grp-view-group':
                var gid = btn.getAttribute('data-group-id');
                if (gid && typeof window.viewGroup === 'function') window.viewGroup(gid);
                break;
            case 'grp-manage-group':
                var gid2 = btn.getAttribute('data-group-id');
                if (gid2) window.location.href = '/gestionar/' + encodeURIComponent(gid2);
                break;
            case 'grp-manage-members':
                var gid3 = btn.getAttribute('data-group-id');
                if (gid3) window.location.href = '/gestionar/' + encodeURIComponent(gid3) + '?tab=miembros';
                break;
            // Position assignment actions — redirect to gestionar
            case 'grp-approve-position':
            case 'grp-reject-position':
            case 'grp-open-manual-assign':
            case 'grp-auto-assign-random':
            case 'grp-auto-assign-order':
            case 'grp-activate-tanda':

            case 'grp-contact-coord':
                var cName = btn.getAttribute('data-coord-name') || 'Coordinador';
                var cPhone = btn.getAttribute('data-coord-phone');
                var cMsg = 'Coordinador: ' + cName;
                if (cPhone) cMsg += '\nTelefono: ' + cPhone;
                alert(cMsg);
                break;
            // Dead modal handlers removed — handled below
            case 'grp-request-extension':
                var extGid = btn.getAttribute('data-group-id');
                if (extGid && typeof showExtensionRequestModal === 'function') showExtensionRequestModal(extGid);
                break;

            // v4.25.9: Modal close/confirm actions (were missing after extraction)
            case 'grp-close-delete':
                if (typeof closeDeleteGroupModal === 'function') closeDeleteGroupModal();
                break;
            case 'grp-confirm-delete':
                if (typeof executeDeleteGroup === 'function') executeDeleteGroup();
                break;
            case 'grp-close-leave-confirm':
                if (typeof closeLeaveConfirmModal === 'function') closeLeaveConfirmModal();
                break;
            case 'grp-execute-leave':
                if (typeof executeLeaveGroup === 'function') executeLeaveGroup();
                break;
            case 'grp-close-edit':
                if (typeof closeEditGroupModal === 'function') closeEditGroupModal();
                break;
            case 'grp-close-members':
                if (typeof closeMembersModal === 'function') { closeMembersModal(); }
                else { var mm = btn.closest('.gc-modal-overlay,.modal-overlay'); if (mm) mm.remove(); }
                break;
            case 'grp-close-manage-turns':
                if (typeof closeManageTurnsModal === 'function') closeManageTurnsModal();
                else { var mt = btn.closest('.gc-modal-overlay,.modal-overlay'); if (mt) mt.remove(); }
                break;
            case 'grp-save-turns':
                if (typeof saveTurnsOrder === 'function') saveTurnsOrder();
                break;
            case 'grp-close-register-payment':
                if (typeof closeRegisterPaymentModal === 'function') closeRegisterPaymentModal();
                else { var pm = btn.closest('.gc-modal-overlay,.modal-overlay'); if (pm) { pm.remove(); if (window.unlockBodyScroll) window.unlockBodyScroll(); } }
                break;
            case 'grp-payment-next':
                if (typeof paymentNextStep === 'function') paymentNextStep();
                break;
            case 'grp-payment-prev':
                if (typeof paymentPrevStep === 'function') paymentPrevStep();
                break;
            case 'grp-select-payment-method':
                var method = btn.getAttribute('data-method');
                if (method && typeof selectPaymentMethod === 'function') selectPaymentMethod(method);
                break;
            case 'grp-upload-proof':
                if (typeof uploadPaymentProof === 'function') uploadPaymentProof();
                break;
            case 'grp-copy-reference':
                var ref = btn.getAttribute('data-reference') || btn.textContent;
                if (navigator.clipboard) { navigator.clipboard.writeText(ref); showNotification('Referencia copiada', 'success'); }
                break;
            case 'grp-close-request-role':
                if (typeof closeRequestRoleModal === 'function') closeRequestRoleModal();
                else { var rm = btn.closest('.gc-modal-overlay,.modal-overlay'); if (rm) rm.remove(); }
                break;
            case 'grp-submit-role-request':
                if (typeof submitRoleRequest === 'function') submitRoleRequest();
                break;
            case 'grp-close-transfer-ownership':
                if (typeof closeTransferOwnershipModal === 'function') closeTransferOwnershipModal();
                else { var to = btn.closest('.gc-modal-overlay,.modal-overlay'); if (to) to.remove(); }
                break;
            case 'grp-execute-transfer':
                if (typeof executeTransferOwnership === 'function') executeTransferOwnership();
                break;
            case 'grp-select-template':
                var tplId = btn.getAttribute('data-template');
                if (tplId && typeof selectGroupTemplate === 'function') selectGroupTemplate(tplId);
                break;
            case 'grp-toggle-collapsible':
                var target = btn.nextElementSibling;
                if (target) { target.style.display = target.style.display === 'none' ? '' : 'none'; btn.classList.toggle('active'); }
                break;
            case 'gs-view-invitations':
                if (typeof viewInvitations === 'function') viewInvitations();
                else window.location.href = '/invitaciones.html';
                break;

            // Public group actions
            case 'grp-public-detail':
                var detailGid = btn.getAttribute('data-group-id');
                if (detailGid && typeof openPublicGroupDetail === 'function') openPublicGroupDetail(detailGid);
                break;
            case 'grp-close-public-detail':
                var overlay = btn.closest('.gc-detail-overlay');
                if (overlay) overlay.remove();
                break;
            case 'grp-join-from-detail':
            case 'grp-join-request':
                (function() {
                    var joinBtn = btn;
                    var joinGid = joinBtn.getAttribute('data-group-id');
                    var joinName = joinBtn.getAttribute('data-group-name') || 'este grupo';
                    if (!joinGid) return;
                    var joinGroup = (window.publicGroupsData || []).find(function(g) { return g.id === joinGid; });
                    var termsHtml = '';
                    if (joinGroup) {
                        var freqMap = { weekly: 'Semanal', biweekly: 'Quincenal', monthly: 'Mensual' };
                        var freq = freqMap[joinGroup.frequency] || joinGroup.frequency || '--';
                        var contrib = parseFloat(joinGroup.contribution_amount || 0);
                        termsHtml = '<div style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:10px;padding:10px 12px;margin:12px 0 8px;text-align:left;">' +
                            '<div style="color:#475569;font-size:0.75rem;font-weight:600;margin-bottom:6px;">Terminos del Grupo</div>' +
                            '<div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span style="color:#64748b;font-size:0.78rem;">Aporte</span><span style="color:#1e293b;font-size:0.78rem;font-weight:600;">L. ' + contrib.toLocaleString('es-HN') + ' ' + escapeHtml(freq) + '</span></div>' +
                            '<div style="display:flex;justify-content:space-between;"><span style="color:#64748b;font-size:0.78rem;">Miembros</span><span style="color:#1e293b;font-size:0.78rem;font-weight:600;">' + (joinGroup.members_count || joinGroup.member_count || '?') + '/' + (joinGroup.max_members || '?') + '</span></div>' +
                        '</div>';
                        termsHtml += '<div style="margin-top:10px;text-align:left;"><label style="color:#475569;font-size:0.75rem;font-weight:600;display:block;margin-bottom:4px;">Mensaje para el coordinador <span style="font-weight:400;color:#94a3b8;">(opcional)</span></label><textarea id="join-message-input" maxlength="500" rows="2" placeholder="Ej: Me interesa ahorrar para..." style="width:100%;padding:8px 10px;border:1px solid #e2e8f0;border-radius:8px;font-size:0.78rem;resize:vertical;background:#f8fafc;color:#1e293b;font-family:inherit;box-sizing:border-box;"></textarea></div>';
                    }
                    showConfirm('Deseas solicitar unirte a ' + escapeHtml(joinName) + '?' + termsHtml, function() {
                        var joinMessage = (document.getElementById('join-message-input') || {}).value || '';
                        joinBtn.disabled = true;
                        joinBtn.textContent = 'Enviando...';
                        var authTk = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') || '';
                        fetch((window.API_BASE_URL || 'https://latanda.online') + '/api/groups/' + encodeURIComponent(joinGid) + '/join-pg', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + authTk },
                            body: JSON.stringify({ join_message: joinMessage.trim() || undefined })
                        })
                        .then(function(r) { return r.json(); })
                        .then(function(result) {
                            if (result.success && result.data && result.data.action === 'placeholder_claim_needed') {
                                var phs = result.data.placeholders || [];
                                var phHtml = '<div style="margin-bottom:12px;color:#64748b;font-size:0.85rem;">' +
                                    'El coordinador ya pre-registro algunos miembros. Si tu nombre aparece abajo, seleccionalo para vincular tu cuenta:</div>';
                                phHtml += '<div style="display:flex;flex-direction:column;gap:8px;">';
                                for (var pi = 0; pi < phs.length; pi++) {
                                    phHtml += '<button class="ds-btn" style="text-align:left;padding:10px 14px;" ' +
                                        'data-action="claim-placeholder" data-ph-id="' + escapeHtml(phs[pi].placeholder_id) + '" ' +
                                        'data-join-gid="' + escapeHtml(joinGid) + '">' +
                                        '<i class="fas fa-user" style="margin-right:8px;color:var(--ds-primary);"></i>' +
                                        escapeHtml(phs[pi].name) + '</button>';
                                }
                                phHtml += '<button class="ds-btn" style="text-align:left;padding:10px 14px;opacity:0.6;" ' +
                                    'data-action="skip-placeholder-claim" data-join-gid="' + escapeHtml(joinGid) + '">' +
                                    '<i class="fas fa-user-plus" style="margin-right:8px;"></i>Ninguno soy yo</button>';
                                phHtml += '</div>';
                                showConfirm(phHtml, null, { title: 'Miembros pre-registrados', hideButtons: true });
                                joinBtn.disabled = false; joinBtn.textContent = 'Solicitar unirse';
                            } else if (result.success) {
                                var msg = result.data && result.data.merged_placeholder
                                    ? (result.data.message || 'Tu lugar pre-asignado fue vinculado.')
                                    : result.data && result.data.auto_approved
                                        ? 'Te has unido a ' + escapeHtml(joinName)
                                        : 'Solicitud enviada. El administrador la revisara.';
                                showNotification(msg, 'success');
                                window.publicGroupsData = (window.publicGroupsData || []).filter(function(g) { return g.id !== joinGid; });
                                if (typeof fetchMyGroups === 'function') fetchMyGroups();
                            } else {
                                showNotification(result.error || result.data?.error?.message || 'Error al solicitar ingreso', 'error');
                                joinBtn.disabled = false; joinBtn.textContent = 'Solicitar unirse';
                            }
                        })
                        .catch(function() { showNotification(t('messages.connection_error',{defaultValue:'Error de conexion'}), 'error'); joinBtn.disabled = false; joinBtn.textContent = 'Solicitar unirse'; });
                    });
                })();
                break;

            case 'claim-placeholder':
                (function() {
                    var phId = btn.getAttribute('data-ph-id');
                    var gid = btn.getAttribute('data-join-gid');
                    if (!phId || !gid) return;
                    btn.disabled = true;
                    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Vinculando...';
                    var authTk = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') || '';
                    fetch((window.API_BASE_URL || 'https://latanda.online') + '/api/groups/' + encodeURIComponent(gid) + '/join-pg', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + authTk },
                        body: JSON.stringify({ claim_placeholder_id: phId })
                    })
                    .then(function(r) { return r.json(); })
                    .then(function(result) {
                        if (result.success) {
                            showNotification(result.data.message || 'Tu cuenta fue vinculada exitosamente', 'success');
                            if (typeof closeConfirm === 'function') closeConfirm();
                            window.publicGroupsData = (window.publicGroupsData || []).filter(function(g) { return g.id !== gid; });
                            if (typeof fetchMyGroups === 'function') fetchMyGroups();
                        } else {
                            showNotification(result.error || 'Error al vincular', 'error');
                            btn.disabled = false; btn.innerHTML = '<i class="fas fa-user"></i> Reintentar';
                        }
                    })
                    .catch(function() { showNotification('Error de conexion', 'error'); btn.disabled = false; });
                })();
                break;

            case 'skip-placeholder-claim':
                (function() {
                    var gid = btn.getAttribute('data-join-gid');
                    if (!gid) return;
                    if (typeof closeConfirm === 'function') closeConfirm();
                    var authTk = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') || '';
                    fetch((window.API_BASE_URL || 'https://latanda.online') + '/api/groups/' + encodeURIComponent(gid) + '/join-pg', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + authTk },
                        body: JSON.stringify({ skip_placeholder_claim: true })
                    })
                    .then(function(r) { return r.json(); })
                    .then(function(result) {
                        if (result.success) {
                            var msg = result.data && result.data.auto_approved
                                ? 'Te has unido al grupo'
                                : 'Solicitud enviada. El administrador la revisara.';
                            showNotification(msg, 'success');
                            window.publicGroupsData = (window.publicGroupsData || []).filter(function(g) { return g.id !== gid; });
                            if (typeof fetchMyGroups === 'function') fetchMyGroups();
                        } else {
                            showNotification(result.error || 'Error al solicitar ingreso', 'error');
                        }
                    })
                    .catch(function() { showNotification('Error de conexion', 'error'); });
                })();
                break;

            // Save/bookmark toggle
            // Tanda card navigation actions
            case 'td-go-gestionar':
                var tdGid = btn.getAttribute('data-gid');
                if (tdGid) window.location.href = '/gestionar/' + encodeURIComponent(tdGid);
                break;
            case 'td-go-grupo':
                var tdGid2 = btn.getAttribute('data-gid');
                if (tdGid2) window.location.href = '/gestionar/' + encodeURIComponent(tdGid2);
                break;
            case 'td-go-miembros':
                var tdGid3 = btn.getAttribute('data-gid');
                if (tdGid3) window.location.href = '/gestionar/' + encodeURIComponent(tdGid3) + '?tab=miembros';
                break;
            case 'td-go-finanzas':
                var tdGid4 = btn.getAttribute('data-gid');
                if (tdGid4) window.location.href = '/gestionar/' + encodeURIComponent(tdGid4) + '?tab=finanzas';
                break;
            case 'grp-set-preference':
                (function() {
                    var pref = btn.getAttribute('data-pref');
                    var prefGid = btn.getAttribute('data-group-id');
                    if (!pref || !prefGid) return;
                    var token = localStorage.getItem('auth_token') || localStorage.getItem('authToken') || '';
                    fetch((window.API_BASE_URL || 'https://latanda.online') + '/api/groups/' + encodeURIComponent(prefGid) + '/turn-preference', {
                        method: 'POST',
                        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ preference: pref })
                    }).then(function(r) { return r.json(); }).then(function(d) {
                        if (d.success) {
                            showNotification('Preferencia guardada: ' + pref, 'success');
                            // Update active button
                            var picker = btn.closest('.tc-pref-picker');
                            if (picker) {
                                picker.querySelectorAll('.tc-pref-btn').forEach(function(b) { b.classList.remove('tc-pref-active'); });
                                btn.classList.add('tc-pref-active');
                            }
                        }
                    }).catch(function() { showNotification('Error al guardar preferencia', 'error'); });
                })();
                break;
            case 'grp-toggle-save':
                (function() {
                    var saveBtn = btn;
                    var saveGid = saveBtn.getAttribute('data-group-id');
                    if (!saveGid) return;
                    var isSaved = saveBtn.classList.contains('gc-saved');
                    var authTk = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') || '';
                    if (!authTk) { showNotification('Inicia sesion para guardar grupos', 'info'); return; }
                    fetch((window.API_BASE_URL || 'https://latanda.online') + '/api/groups/' + encodeURIComponent(saveGid) + '/save', {
                        method: isSaved ? 'DELETE' : 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + authTk }
                    })
                    .then(function(r) { return r.json(); })
                    .then(function(result) {
                        if (result.success) {
                            var newSaved = result.data.saved;
                            saveBtn.classList.toggle('gc-saved', newSaved);
                            var icon = saveBtn.querySelector('i');
                            if (icon) icon.className = newSaved ? 'fas fa-star' : 'far fa-star';
                        }
                    }).catch(function() {});
                })();
                break;

            // Filters & retry
            case 'grp-reset-filters':
                if (typeof resetFilters === 'function') resetFilters();
                break;
            case 'grp-retry-load':
                if (typeof fetchMyGroups === 'function') fetchMyGroups();
                break;

            // Position modals
            case 'grp-close-reject':
                if (typeof closeRejectModal === 'function') closeRejectModal();
                break;
            case 'grp-confirm-reject':
                if (typeof confirmReject === 'function') confirmReject();
                break;
            case 'grp-close-manual-assign':
                if (typeof closeManualAssignModal === 'function') closeManualAssignModal();
                break;
            case 'grp-confirm-manual-assign':
                if (typeof confirmManualAssign === 'function') confirmManualAssign();
                break;

            // History
            // === MOBILE NAVIGATION HANDLERS ===
            case 'toggle-left-drawer':
                if (window.EdgeSwipe && window.EdgeSwipe.toggleLeft) window.EdgeSwipe.toggleLeft();
                else if (window.SidebarUI) window.SidebarUI.toggle();
                else { var sb = document.querySelector('.sidebar,.mobile-drawer'); if (sb) sb.classList.toggle('active'); }
                break;
            case 'toggle-right-drawer':
                if (window.EdgeSwipe && window.EdgeSwipe.toggleRight) window.EdgeSwipe.toggleRight();
                break;
            case 'drawer-close':
                if (window.EdgeSwipe && window.EdgeSwipe.closeAll) window.EdgeSwipe.closeAll();
                else { document.querySelectorAll('.mobile-drawer,.sidebar').forEach(function(el) { el.classList.remove('active'); }); }
                break;
            case 'drawer-logout':
            case 'logout':
                localStorage.removeItem('auth_token'); localStorage.removeItem('latanda_user'); sessionStorage.clear();
                window.location.href = 'auth-enhanced.html';
                break;
            case 'drawer-mia':
                window.location.href = '/mia.html';
                break;
            case 'toggle-more-menu':
                if (typeof window.toggleMoreMenu === 'function') window.toggleMoreMenu();
                break;

            case 'grp-open-history':
                if (typeof openHistoryModal === 'function') openHistoryModal();
                break;
            case 'grp-switch-history-tab':
                var htab = btn.getAttribute('data-htab');
                if (htab) {
                    var hPayments = document.getElementById('history-payments');
                    var hCollections = document.getElementById('history-collections');
                    var tPayments = document.getElementById('tab-payments');
                    var tCollections = document.getElementById('tab-collections');
                    if (htab === 'payments') {
                        if (hPayments) hPayments.style.display = '';
                        if (hCollections) hCollections.style.display = 'none';
                        if (tPayments) { tPayments.classList.add('active'); tPayments.style.background = '#00ffff'; tPayments.style.color = '#000'; }
                        if (tCollections) { tCollections.classList.remove('active'); tCollections.style.background = 'rgba(255,255,255,0.1)'; tCollections.style.color = '#fff'; }
                    } else {
                        if (hPayments) hPayments.style.display = 'none';
                        if (hCollections) hCollections.style.display = '';
                        if (tCollections) { tCollections.classList.add('active'); tCollections.style.background = '#00ffff'; tCollections.style.color = '#000'; }
                        if (tPayments) { tPayments.classList.remove('active'); tPayments.style.background = 'rgba(255,255,255,0.1)'; tPayments.style.color = '#fff'; }
                    }
                }
                break;

            // Tandas actions
            case 'grp-refresh-tandas':
                if (typeof refreshTandas === 'function') refreshTandas();
                break;
            case 'grp-clear-tanda-filters':
                var sf = document.getElementById('tandasStatusFilter');
                var so = document.getElementById('tandasSortOrder');
                var si = document.getElementById('searchTandas');
                if (sf) sf.value = 'all';
                if (so) so.value = 'next-payment';
                if (si) si.value = '';
                if (typeof filterAndSortTandas === 'function') filterAndSortTandas();
                break;
            case 'grp-show-tanda-history':
                if (typeof showTandaHistory === 'function') showTandaHistory();
                break;
        }
    });

    // Deep-links: redirect to gestionar
    (function() {
        var params = new URLSearchParams(window.location.search);
        var manageGid = params.get('manage');
        if (manageGid) {
            window.location.href = '/gestionar/' + encodeURIComponent(manageGid);
        }
    })();

// --- Block 8 (originally inline) ---
// v4.25.4: Restored — Mi Wallet + Mi Tanda sidebar cards
    async function updateSidebarHubCards() {
        try {
            var token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
            if (!token) return;
            var container = document.getElementById('sidebarHubCards');
            if (!container) return;

            // Wallet balance card
            try {
                var resp = await fetch('/api/wallet/balance', {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                if (resp.ok) {
                    var data = await resp.json();
                    if (data.success) {
                        var balance = data.data ? data.data.balance : data.balance || 0;
                        var ltdBalance = data.data ? data.data.ltd_balance : data.ltd_balance || 0;
                        container.innerHTML = '<div class="sidebar-hub-card">' +
                            '<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">' +
                            '<div style="width:40px;height:40px;background:rgba(0,255,255,0.15);border-radius:12px;display:flex;align-items:center;justify-content:center">' +
                            '<i class="fas fa-wallet" style="color:#00FFFF"></i></div>' +
                            '<div><div style="font-weight:600;color:#fff">Mi Wallet</div>' +
                            '<div style="font-size:0.8rem;color:#888">Saldo disponible</div></div></div>' +
                            '<div style="font-size:1.4rem;font-weight:700;color:#00FFFF">L. ' + Number(balance).toFixed(2) + '</div>' +
                            '<div style="font-size:0.85rem;color:#888;margin-top:4px">' + Number(ltdBalance).toFixed(2) + ' LTD</div>' +
                            '</div>';
                    }
                }
            } catch(ew) {}

            // Tanda balance cards
            try {
                var grpList = window.currentGroupsData || [];
                if (grpList.length === 0) {
                    await new Promise(function(r) { setTimeout(r, 2000); });
                    grpList = window.currentGroupsData || [];
                }
                var activeTandas = (Array.isArray(grpList) ? grpList : []).filter(function(g) { return g.tanda_status === 'active'; });
                if (activeTandas.length > 0) {
                    var userId = '';
                    try { var lu = localStorage.getItem('latanda_user'); if(lu){var p=JSON.parse(lu); userId = String(p.user_id||p.id||'')} } catch(e){}
                    if (!userId) userId = localStorage.getItem('latanda_user_id')||localStorage.getItem('user_id')||'';

                    var tandaSlice = activeTandas.slice(0, 5);
                    for (var ti = 0; ti < tandaSlice.length; ti++) {
                        try {
                            var tg = tandaSlice[ti];
                            var tbResp = await fetch('/api/groups/' + encodeURIComponent(tg.group_id || tg.id) + '/tanda-balances', {
                                headers: { 'Authorization': 'Bearer ' + token }
                            });
                            if (!tbResp.ok) continue;
                            var tbData = await tbResp.json();
                            if (!tbData.success || !tbData.data || !tbData.data.members) continue;
                            var myEntry = tbData.data.members.find(function(m) { return m.user_id === userId; });
                            if (!myEntry) continue;
                            var tb = myEntry.tanda_balance;
                            var tbColor = tb >= 0 ? '#34d399' : '#f87171';
                            var tbLabel = tb >= 0 ? 'Ahorro' : 'Deuda';
                            var eName = tg.name || '';
                            container.innerHTML += '<div class="sidebar-hub-card" style="margin-top:10px">' +
                                '<div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">' +
                                '<div style="width:40px;height:40px;background:rgba(0,255,255,0.1);border-radius:12px;display:flex;align-items:center;justify-content:center">' +
                                '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00FFFF" stroke-width="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>' +
                                '<div><div style="font-weight:600;color:#fff">Mi Tanda</div>' +
                                '<div style="font-size:0.78rem;color:#888">' + tbLabel + ' — ' + eName + '</div></div></div>' +
                                '<div style="font-size:1.3rem;font-weight:700;color:' + tbColor + '">' + (tb < 0 ? '-' : '+') + (window.ltFormatCurrency ? ltFormatCurrency(Math.abs(tb)) : 'L. ' + Math.abs(tb).toLocaleString('es-HN', {minimumFractionDigits:2, maximumFractionDigits:2})) + '</div>' +
                                '<div style="display:flex;align-items:center;gap:12px;margin-top:8px;font-size:0.78rem;color:#64748b">' +
                                '<span>Turno #' + (myEntry.turn_position || '--') + '</span>' +
                                '<span>' + (myEntry.payments_count || 0) + ' pagos</span>' +
                                '</div></div>';
                        } catch(et) {}
                    }
                }
            } catch(e2) {}
        } catch(e) {}
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', updateSidebarHubCards);
    } else { updateSidebarHubCards(); }

// --- Block 9 (originally inline) ---
// v4.25.5: View Details modal (read-only group detail for all roles)
    (function() {
        var _vdEsc = typeof escapeHtml === 'function' ? escapeHtml : function(s) {
            return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
        };

        window.viewGroup = async function(groupId) {
            // Prevent duplicate modals
            var existing = document.getElementById('viewDetailsModal');
            if (existing) existing.remove();

            // Create modal
            var modal = document.createElement('div');
            modal.id = 'viewDetailsModal';
            modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);display:flex;justify-content:center;align-items:center;z-index:10000;';
            modal.innerHTML = '<div style="background:#0f172a;border:1px solid rgba(0,255,255,0.15);border-radius:16px;max-width:650px;width:95%;max-height:90vh;overflow:hidden;box-shadow:0 25px 50px rgba(0,0,0,0.5);">' +
                '<div style="background:linear-gradient(135deg,rgba(0,255,255,0.15),rgba(0,255,255,0.05));padding:16px 20px;border-bottom:1px solid rgba(0,255,255,0.1);display:flex;justify-content:space-between;align-items:center;">' +
                '<div style="display:flex;align-items:center;gap:10px;"><div style="background:rgba(0,255,255,0.15);padding:8px;border-radius:10px;"><i class="fas fa-users" style="color:#00FFFF;font-size:1.1rem;"></i></div><div><h3 style="margin:0;font-size:1.1rem;color:#f8fafc;" id="vdTitle">Cargando...</h3><p style="margin:2px 0 0;font-size:0.78rem;color:#94a3b8;" id="vdSubtitle"></p></div></div>' +
                '<button id="vdClose" style="background:rgba(255,255,255,0.1);border:none;width:30px;height:30px;border-radius:8px;color:#94a3b8;cursor:pointer;font-size:1rem;">&times;</button>' +
                '</div>' +
                '<div id="vdContent" style="padding:20px;max-height:70vh;overflow-y:auto;"><div style="text-align:center;padding:40px;"><i class="fas fa-spinner fa-spin" style="font-size:1.5rem;color:#00FFFF;"></i><p style="color:#94a3b8;margin-top:12px;">Cargando detalles...</p></div></div>' +
                '</div>';

            document.body.appendChild(modal);
            document.body.style.overflow = 'hidden';

            // Close + action handlers
            modal.addEventListener('click', function(e) {
                if (e.target === modal) closeVD();
                var actionBtn = e.target.closest('[data-action]');
                if (!actionBtn) return;
                var act = actionBtn.getAttribute('data-action');
                var agid = actionBtn.getAttribute('data-gid');
                if (act === 'vd-go-gestionar' && agid) { closeVD(); window.location.href = '/gestionar/' + encodeURIComponent(agid); }
                if (act === 'vd-go-miembros' && agid) { closeVD(); window.location.href = '/gestionar/' + encodeURIComponent(agid) + '?tab=miembros'; }
                if (act === 'vd-pay' && agid) { closeVD(); if (typeof registerPayment === 'function') registerPayment(agid); else window.location.href = '/payment.html?group_id=' + encodeURIComponent(agid); }
                if (act === 'vd-extension' && agid) { closeVD(); if (typeof showExtensionRequestModal === 'function') showExtensionRequestModal(agid); }
                if (act === 'vd-toggle-history' && agid) {
                    var histDiv = document.getElementById('vdHistory');
                    if (!histDiv) return;
                    if (histDiv.style.display !== 'none') { histDiv.style.display = 'none'; return; }
                    histDiv.style.display = 'block';
                    histDiv.innerHTML = '<div style="text-align:center;padding:16px;"><i class="fas fa-spinner fa-spin" style="color:#00FFFF;"></i></div>';
                    var authTk = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') || '';
                    fetch((window.API_BASE_URL || 'https://latanda.online') + '/api/groups/' + encodeURIComponent(agid) + '/contribution-history', { headers: { 'Authorization': 'Bearer ' + authTk } })
                        .then(function(r) { return r.json(); })
                        .then(function(res) {
                            if (!res.success) { histDiv.innerHTML = '<div style="text-align:center;color:#fca5a5;padding:12px;">No se pudo cargar el historial</div>'; return; }
                            var entries = res.data.timeline || res.data.contributions || res.data || [];
                            if (!Array.isArray(entries) || entries.length === 0) { histDiv.innerHTML = '<div style="text-align:center;color:#94a3b8;padding:12px;font-size:0.8rem;">Sin pagos registrados aun</div>'; return; }
                            var hHtml = '<div style="font-size:0.78rem;font-weight:600;color:#94a3b8;margin-bottom:8px;"><i class="fas fa-history" style="color:#818cf8;margin-right:5px;"></i>Historial de Pagos</div>';
                            entries.slice(0, 20).forEach(function(entry) {
                                var dateStr = entry.paid_date || entry.created_at || entry.date || '';
                                var fmtDate = dateStr ? new Date(dateStr).toLocaleDateString('es-HN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
                                var amt = parseFloat(entry.amount || 0);
                                var cycle = entry.cycle_number || entry.cycle || '';
                                var stColor = (entry.status === 'completed' || entry.status === 'coordinator_approved') ? '#34d399' : entry.status === 'pending' ? '#fbbf24' : '#94a3b8';
                                hHtml += '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 8px;border-bottom:1px solid rgba(255,255,255,0.04);font-size:0.75rem;">' +
                                    '<div><span style="color:#f8fafc;">Ciclo ' + cycle + '</span><span style="color:#64748b;margin-left:6px;">' + fmtDate + '</span></div>' +
                                    '<div style="font-weight:600;color:' + stColor + ';">L. ' + amt.toLocaleString() + '</div></div>';
                            });
                            histDiv.innerHTML = hHtml;
                        })
                        .catch(function() { histDiv.innerHTML = '<div style="text-align:center;color:#fca5a5;padding:12px;">Error de conexion</div>'; });
                }
                if (act === 'vd-leave' && agid) {
                    var authTk = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') || '';
                    var latandaUser = JSON.parse(localStorage.getItem('latanda_user') || '{}');
                    var uid = latandaUser.user_id || latandaUser.id || '';
                    if (!uid) { showNotification('Error: no se pudo identificar tu usuario', 'error'); return; }
                    fetch((window.API_BASE_URL || 'https://latanda.online') + '/api/groups/' + encodeURIComponent(agid) + '/members/' + encodeURIComponent(uid) + '/can-leave', { headers: { 'Authorization': 'Bearer ' + authTk } })
                        .then(function(r) { return r.json(); })
                        .then(function(res) {
                            if (res.data && res.data.can_leave === false) {
                                alert('No puedes salir del grupo en este momento: ' + (res.data.reason || 'Contacta al coordinador.'));
                                return;
                            }
                            if (!confirm('Estas seguro que deseas salir de este grupo? Esta accion no se puede deshacer.')) return;
                            fetch((window.API_BASE_URL || 'https://latanda.online') + '/api/groups/' + encodeURIComponent(agid) + '/members/' + encodeURIComponent(uid), {
                                method: 'DELETE', headers: { 'Authorization': 'Bearer ' + authTk, 'Content-Type': 'application/json' }
                            })
                            .then(function(r) { return r.json(); })
                            .then(function(delRes) {
                                if (delRes.success) { closeVD(); showNotification('Has salido del grupo', 'success'); if (typeof fetchMyGroups === 'function') fetchMyGroups(); }
                                else { alert(delRes.error || delRes.data?.error?.message || 'No se pudo salir del grupo'); }
                            });
                        })
                        .catch(function() { alert('Error de conexion'); });
                }
            });
            document.getElementById('vdClose').onclick = closeVD;

            function closeVD() {
                modal.remove();
                document.body.style.overflow = '';
            }

            // Fetch data
            try {
                var apiBase = window.API_BASE_URL || 'https://latanda.online';
                var resp = await fetch(apiBase + '/api/groups/' + encodeURIComponent(groupId) + '/stats', { headers: getAuthHeaders() });
                var data = await resp.json();
                if (!data.success) throw new Error('');
                var d = data.data;
                document.getElementById('vdTitle').textContent = d.group?.name || 'Grupo';
                document.getElementById('vdSubtitle').textContent = d.my_role === 'creator' ? 'Creador' : d.my_role === 'coordinator' ? 'Coordinador' : 'Miembro';
                document.getElementById('vdContent').innerHTML = renderVD(d, groupId);
            } catch(e) {
                document.getElementById('vdContent').innerHTML = '<div style="text-align:center;padding:24px;color:#fca5a5;"><i class="fas fa-exclamation-triangle" style="font-size:2rem;margin-bottom:12px;display:block;"></i>No se pudieron cargar los detalles</div>';
            }
        };

        function renderVD(d, groupId) {
            var group = d.group || {};
            var members = d.members || {};
            var payments = d.payments || {};
            var topContributors = d.top_contributors || [];
            var isAdmin = ['creator','coordinator','admin'].indexOf(d.my_role) >= 0;
            var freqMap = { weekly: 'Semanal', biweekly: 'Quincenal', monthly: 'Mensual' };
            var gidSafe = _vdEsc(groupId);
            var html = '';

            // ---- SECTION: Mi Estado (for all users) ----
            var ps = d.my_payment_status || 'pending';
            var psMap = {
                'paid': { l: 'Pagado', c: '#34d399', bg: 'rgba(34,197,94,0.15)', ic: 'fa-check-circle' },
                'up_to_date': { l: 'Al dia', c: '#34d399', bg: 'rgba(34,197,94,0.15)', ic: 'fa-check-circle' },
                'pending': { l: 'Pendiente', c: '#fbbf24', bg: 'rgba(251,191,36,0.15)', ic: 'fa-clock' },
                'late': { l: 'Atrasado', c: '#ef4444', bg: 'rgba(239,68,68,0.15)', ic: 'fa-exclamation-triangle' },
                'mora': { l: 'En mora', c: '#ef4444', bg: 'rgba(239,68,68,0.15)', ic: 'fa-exclamation-circle' },
                'suspension_recommended': { l: 'Riesgo', c: '#ef4444', bg: 'rgba(239,68,68,0.15)', ic: 'fa-ban' }
            };
            var psi = psMap[ps] || psMap['pending'];
            var contribAmt = parseFloat(group.contribution_amount) || 0;
            var maxMem = group.max_members || 1;
            var payoutAmt = contribAmt * maxMem;

            html += '<div style="background:' + psi.bg + ';border:1px solid ' + psi.c + '33;border-radius:12px;padding:14px;margin-bottom:14px;">';
            html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">';
            html += '<span style="font-size:0.82rem;font-weight:600;color:#f8fafc;"><i class="fas fa-user" style="margin-right:6px;color:' + psi.c + ';"></i>Mi Estado</span>';
            html += '<span style="font-size:0.72rem;font-weight:600;padding:3px 10px;border-radius:20px;background:' + psi.c + '22;color:' + psi.c + ';"><i class="fas ' + psi.ic + '" style="margin-right:4px;"></i>' + psi.l + '</span>';
            html += '</div>';
            html += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;">';
            html += '<div><div style="font-size:0.65rem;color:#64748b;text-transform:uppercase;">Total pagado</div><div style="font-weight:600;color:#34d399;">L. ' + (d.my_total_paid || 0).toLocaleString() + '</div></div>';
            html += '<div><div style="font-size:0.65rem;color:#64748b;text-transform:uppercase;">Aporte por ciclo</div><div style="font-weight:600;color:#00FFFF;">L. ' + contribAmt.toLocaleString() + '</div></div>';
            if (d.my_next_payment_due) {
                var dueDate = new Date(d.my_next_payment_due);
                var now = new Date();
                var diffDays = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
                var dueLabel = diffDays > 0 ? 'en ' + diffDays + ' dia' + (diffDays !== 1 ? 's' : '') : diffDays === 0 ? 'Hoy' : 'Vencido hace ' + Math.abs(diffDays) + ' dia' + (Math.abs(diffDays) !== 1 ? 's' : '');
                html += '<div><div style="font-size:0.65rem;color:#64748b;text-transform:uppercase;">Proximo pago</div><div style="font-weight:500;color:' + (diffDays <= 0 ? '#ef4444' : diffDays <= 3 ? '#fbbf24' : '#f8fafc') + ';">' + dueDate.toLocaleDateString('es-HN', { day: 'numeric', month: 'short' }) + '</div></div>';
                html += '<div><div style="font-size:0.65rem;color:#64748b;text-transform:uppercase;">Countdown</div><div style="font-weight:500;color:' + (diffDays <= 0 ? '#ef4444' : '#f8fafc') + ';">' + dueLabel + '</div></div>';
            }
            html += '</div></div>';

            // ---- SECTION: Mi Turno ----
            if (d.my_turn_number || d.estimated_payout_date) {
                var turnNum = d.my_turn_number || '?';
                var turnsLeft = d.turns_until_mine;
                var isMyTurn = turnsLeft === 0;
                var currentCycle = group.current_cycle || 0;
                var turnBorderColor = isMyTurn ? '#34d399' : '#00FFFF';

                html += '<div style="background:rgba(255,255,255,0.04);border:1px solid ' + turnBorderColor + '33;border-radius:12px;padding:14px;margin-bottom:14px;">';
                html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">';
                html += '<span style="font-size:0.82rem;font-weight:600;color:#f8fafc;"><i class="fas fa-sync-alt" style="margin-right:6px;color:' + turnBorderColor + ';"></i>Mi Turno</span>';
                if (isMyTurn) {
                    html += '<span style="font-size:0.72rem;font-weight:700;padding:3px 10px;border-radius:20px;background:rgba(34,197,94,0.2);color:#34d399;animation:pulse 2s infinite;">Es tu turno!</span>';
                } else {
                    html += '<span style="font-size:0.72rem;font-weight:600;padding:3px 10px;border-radius:20px;background:rgba(0,255,255,0.1);color:#00FFFF;">Turno #' + turnNum + '</span>';
                }
                html += '</div>';

                // Turn progress bar
                var turnPct = maxMem > 0 ? Math.round(((turnNum - 1) / maxMem) * 100) : 0;
                var currentPct = maxMem > 0 ? Math.round((currentCycle / maxMem) * 100) : 0;
                html += '<div style="position:relative;height:20px;background:rgba(255,255,255,0.06);border-radius:10px;overflow:hidden;margin-bottom:10px;">';
                html += '<div style="position:absolute;height:100%;width:' + currentPct + '%;background:linear-gradient(90deg,#00FFFF33,#00B8D433);border-radius:10px;"></div>';
                html += '<div style="position:absolute;left:' + turnPct + '%;top:0;bottom:0;width:3px;background:#00FFFF;border-radius:2px;" title="Tu turno"></div>';
                html += '<div style="position:absolute;width:100%;text-align:center;line-height:20px;font-size:0.65rem;color:#94a3b8;">Ciclo ' + currentCycle + ' de ' + maxMem + '</div>';
                html += '</div>';

                html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">';
                html += '<div><div style="font-size:0.65rem;color:#64748b;text-transform:uppercase;">Posicion</div><div style="font-weight:600;color:#f8fafc;">#' + turnNum + ' de ' + maxMem + '</div></div>';
                if (!isMyTurn && turnsLeft != null) {
                    html += '<div><div style="font-size:0.65rem;color:#64748b;text-transform:uppercase;">Faltan</div><div style="font-weight:600;color:#f8fafc;">' + turnsLeft + ' turno' + (turnsLeft !== 1 ? 's' : '') + '</div></div>';
                } else {
                    html += '<div><div style="font-size:0.65rem;color:#64748b;text-transform:uppercase;">Estado</div><div style="font-weight:600;color:#34d399;">Activo</div></div>';
                }
                html += '<div><div style="font-size:0.65rem;color:#64748b;text-transform:uppercase;">Recibiras</div><div style="font-weight:700;color:#34d399;">L. ' + payoutAmt.toLocaleString() + '</div></div>';
                html += '</div>';

                if (d.estimated_payout_label) {
                    html += '<div style="margin-top:8px;font-size:0.75rem;color:#94a3b8;"><i class="fas fa-calendar" style="margin-right:4px;color:#00FFFF;"></i>Fecha estimada: <span style="color:#f8fafc;font-weight:500;">' + _vdEsc(d.estimated_payout_label) + '</span></div>';
                }
                html += '</div>';
            }

            // ---- SECTION: Quick Actions ----
            html += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:14px;">';
            if (isAdmin) {
                html += '<button data-action="vd-go-gestionar" data-gid="' + gidSafe + '" style="padding:10px;background:rgba(0,255,255,0.15);border:1px solid rgba(0,255,255,0.3);color:#00FFFF;border-radius:8px;cursor:pointer;font-weight:500;font-size:0.8rem;"><i class="fas fa-cog" style="margin-right:5px;"></i>Administrar</button>';
            }
            if (ps === 'pending' || ps === 'late' || ps === 'mora') {
                html += '<button data-action="vd-pay" data-gid="' + gidSafe + '" style="padding:10px;background:linear-gradient(135deg,#34d399,#16a34a);border:none;color:#fff;border-radius:8px;cursor:pointer;font-weight:600;font-size:0.8rem;"><i class="fas fa-money-bill-wave" style="margin-right:5px;"></i>Pagar</button>';
            }
            if (ps === 'pending' || ps === 'late' || ps === 'suspension_recommended') {
                html += '<button data-action="vd-extension" data-gid="' + gidSafe + '" style="padding:10px;background:rgba(251,191,36,0.15);border:1px solid rgba(251,191,36,0.3);color:#fbbf24;border-radius:8px;cursor:pointer;font-weight:500;font-size:0.8rem;"><i class="fas fa-clock" style="margin-right:5px;"></i>Prorroga</button>';
            }
            // Contact coordinator
            var coordName = d.coordinator_name || '';
            var coordPhone = d.coordinator_phone || '';
            if (coordName) {
                if (coordPhone) {
                    var waNum = coordPhone.replace(/[^0-9]/g, '');
                    html += '<a href="https://wa.me/' + waNum + '?text=' + encodeURIComponent('Hola ' + coordName + ', soy miembro del grupo ' + (group.name || '')) + '" target="_blank" style="padding:10px;background:rgba(37,211,102,0.15);border:1px solid rgba(37,211,102,0.3);color:#25d366;border-radius:8px;cursor:pointer;font-weight:500;font-size:0.8rem;text-align:center;text-decoration:none;"><i class="fab fa-whatsapp" style="margin-right:5px;"></i>' + _vdEsc(coordName) + '</a>';
                } else {
                    html += '<div style="padding:10px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:#94a3b8;border-radius:8px;font-size:0.8rem;text-align:center;"><i class="fas fa-headset" style="margin-right:5px;"></i>' + _vdEsc(coordName) + '</div>';
                }
            }
            html += '<button data-action="vd-toggle-history" data-gid="' + gidSafe + '" style="padding:10px;background:rgba(99,102,241,0.15);border:1px solid rgba(99,102,241,0.3);color:#818cf8;border-radius:8px;cursor:pointer;font-weight:500;font-size:0.8rem;"><i class="fas fa-history" style="margin-right:5px;"></i>Historial</button>';
            html += '</div>';

            // ---- SECTION: Historial (lazy loaded) ----
            html += '<div id="vdHistory" style="display:none;margin-bottom:14px;"></div>';

            // ---- SECTION: Group Progress ----
            var currentCycle = group.current_cycle || 0;
            var maxMembers = group.max_members || 1;
            if (currentCycle > 0) {
                var pct = Math.min(100, Math.round((currentCycle / maxMembers) * 100));
                var compRate = payments.completion_rate || 0;
                var compColor = compRate >= 80 ? '#34d399' : compRate >= 50 ? '#fbbf24' : '#ef4444';
                html += '<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:14px;margin-bottom:14px;">' +
                    '<div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="font-size:0.8rem;color:#94a3b8;">Progreso del Grupo</span><span style="font-size:0.8rem;font-weight:600;color:#00FFFF;">Ciclo ' + currentCycle + ' de ' + maxMembers + '</span></div>' +
                    '<div style="height:6px;background:rgba(255,255,255,0.1);border-radius:3px;overflow:hidden;"><div style="height:100%;width:' + pct + '%;background:linear-gradient(90deg,#00FFFF,#00B8D4);border-radius:3px;"></div></div>' +
                    '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px;">' +
                    '<div><div style="font-size:0.65rem;color:#64748b;">Miembros</div><div style="font-weight:600;color:#f8fafc;">' + (members.active || members.total || 0) + '/' + maxMembers + '</div></div>' +
                    '<div><div style="font-size:0.65rem;color:#64748b;">Recaudado</div><div style="font-weight:600;color:#34d399;">L. ' + (payments.total_collected || 0).toLocaleString() + '</div></div>' +
                    '<div><div style="font-size:0.65rem;color:#64748b;">Cumplimiento</div><div style="font-weight:600;color:' + compColor + ';">' + compRate + '%</div></div>' +
                    '</div></div>';
            } else {
                // Group info grid (no active tanda)
                html += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:14px;">';
                html += '<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:10px;"><div style="font-size:0.65rem;color:#64748b;text-transform:uppercase;">Aporte</div><div style="font-weight:600;color:#00FFFF;">L. ' + contribAmt.toLocaleString() + '</div></div>';
                html += '<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:10px;"><div style="font-size:0.65rem;color:#64748b;text-transform:uppercase;">Frecuencia</div><div style="font-weight:600;color:#f8fafc;">' + _vdEsc(freqMap[group.frequency] || group.frequency || '-') + '</div></div>';
                html += '<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:10px;"><div style="font-size:0.65rem;color:#64748b;text-transform:uppercase;">Miembros</div><div style="font-weight:600;color:#f8fafc;">' + (members.active || members.total || 0) + '/' + maxMembers + '</div></div>';
                html += '<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:10px;"><div style="font-size:0.65rem;color:#64748b;text-transform:uppercase;">Recaudado</div><div style="font-weight:600;color:#34d399;">L. ' + (payments.total_collected || 0).toLocaleString() + '</div></div>';
                html += '</div>';
            }

            // ---- SECTION: Leave group (subtle, at bottom) ----
            if (!isAdmin) {
                html += '<div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:12px;text-align:center;">';
                html += '<button data-action="vd-leave" data-gid="' + gidSafe + '" style="background:none;border:none;color:#64748b;font-size:0.75rem;cursor:pointer;padding:6px 12px;"><i class="fas fa-sign-out-alt" style="margin-right:4px;"></i>Salir del grupo</button>';
                html += '</div>';
            }

            return html;
        }
    })();

// --- Block 10 (originally inline) ---
// v4.25.4: Restored sidebar calculator/contract/tips for Crear Grupo tab
    // (was deleted during management modal cleanup)

    function _cgsEsc(s) { var d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }
    function _cgsFmt(n) { return window.ltFormatCurrency ? ltFormatCurrency(n) : (window.ltFormatCurrency ? ltFormatCurrency(Number(n || 0)) : 'L. ' + Number(n || 0).toLocaleString('es-HN', {minimumFractionDigits:2, maximumFractionDigits:2})); }

    function updateCgsCalculator() {
        var el = document.getElementById('cgsCalcContent');
        if (!el) return;
        var contribInput = document.getElementById('contribution');
        var membersInput = document.getElementById('max-participants');
        var freqInput = document.getElementById('payment-frequency');
        var contrib = parseFloat(contribInput ? contribInput.value : 0) || 0;
        var members = parseInt(membersInput ? membersInput.value : 0) || 0;
        var freq = freqInput ? freqInput.value : 'monthly';

        if (contrib <= 0 || members <= 0) {
            el.innerHTML = '<div style="color:var(--ds-text-faint);font-size:0.8rem;">Completa el paso 2 para ver la simulacion</div>';
            return;
        }

        var pool = contrib * members;
        var commType = document.querySelector('input[name="commission-type"]:checked');
        var typeVal = commType ? commType.value : 'default';
        var rate = typeVal === 'none' ? 0 : typeVal === 'custom' ? (parseFloat(document.getElementById('custom-commission-rate')?.value) || 2) : (pool >= 100000 ? 1 : pool >= 50000 ? 2 : 3);
        var commTotal = pool * rate / 100;
        var platformFee = commTotal * 0.10;
        var coordFee = commTotal - platformFee;
        var userReceives = pool - commTotal;

        var freqLabel = { weekly: 'Semanal', biweekly: 'Quincenal', monthly: 'Mensual' }[freq] || freq;
        var cyclesPerYear = { weekly: 52, biweekly: 26, monthly: 12 }[freq] || 12;
        var duration = members + ' ciclos (' + Math.round(members / cyclesPerYear * 12) + ' meses)';

        el.innerHTML = '<div style="font-size:0.82rem;">' +
            '<div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="color:var(--ds-text-faint);">Pool por ciclo</span><span style="color:var(--ds-cyan);font-weight:700;">' + _cgsFmt(pool) + '</span></div>' +
            '<div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="color:var(--ds-text-faint);">Beneficiario recibe</span><span style="color:var(--ds-green);font-weight:600;">' + _cgsFmt(userReceives) + '</span></div>' +
            '<div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="color:var(--ds-text-faint);">Comision coord. (' + rate + '%)</span><span>' + _cgsFmt(coordFee) + '</span></div>' +
            '<div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="color:var(--ds-text-faint);">Comision plataforma</span><span>' + _cgsFmt(platformFee) + '</span></div>' +
            '<div style="border-top:1px solid var(--ds-border-subtle,rgba(255,255,255,0.06));padding-top:6px;margin-top:4px;display:flex;justify-content:space-between;"><span style="color:var(--ds-text-faint);">Duracion estimada</span><span>' + _cgsEsc(duration) + '</span></div>' +
            '<div style="display:flex;justify-content:space-between;"><span style="color:var(--ds-text-faint);">Frecuencia</span><span>' + _cgsEsc(freqLabel) + '</span></div>' +
        '</div>';
    }

    function updateCgsContract() {
        var itemsEl = document.getElementById('cgsContractItems');
        var countEl = document.getElementById('cgsContractCount');
        var fillEl = document.getElementById('cgsContractFill');
        if (!itemsEl) return;

        var clauses = [
            { id: 'group-name', label: 'Nombre del grupo', check: function() { return (document.getElementById('group-name')?.value || '').length >= 3; } },
            { id: 'contribution', label: 'Monto de aporte', check: function() { return parseFloat(document.getElementById('contribution')?.value) > 0; } },
            { id: 'max-participants', label: 'Numero de participantes', check: function() { return parseInt(document.getElementById('max-participants')?.value) >= 2; } },
            { id: 'payment-frequency', label: 'Frecuencia de pago', check: function() { return !!document.getElementById('payment-frequency')?.value; } },
            { id: 'group-description', label: 'Descripcion', check: function() { return (document.getElementById('group-description')?.value || '').length >= 10; } },
            { id: 'group-type', label: 'Tipo de grupo', check: function() { return !!document.getElementById('group-type')?.value; } },
            { id: 'location', label: 'Ubicacion', check: function() { return (document.getElementById('location')?.value || '').length >= 3; } },
            { id: 'commission', label: 'Comision definida', check: function() { return !!document.querySelector('input[name="commission-type"]:checked'); } }
        ];

        var filled = 0;
        var html = '';
        clauses.forEach(function(c) {
            var ok = c.check();
            if (ok) filled++;
            html += '<div style="display:flex;align-items:center;gap:6px;font-size:0.78rem;margin-bottom:4px;color:' + (ok ? 'var(--ds-green)' : 'var(--ds-text-faint)') + ';"><i class="fas ' + (ok ? 'fa-check-circle' : 'fa-circle') + '" style="font-size:0.65rem;"></i> ' + _cgsEsc(c.label) + '</div>';
        });

        itemsEl.innerHTML = html;
        if (countEl) countEl.textContent = filled;
        if (fillEl) fillEl.style.width = Math.round(filled / clauses.length * 100) + '%';
    }

    function updateCgsTips(step) {
        var el = document.getElementById('cgsTipsContent');
        if (!el) return;
        var tips = {
            1: ['Elige un nombre descriptivo que identifique al grupo', 'La ubicacion ayuda a otros a encontrar tu grupo', 'Los grupos publicos aparecen en el directorio'],
            2: ['El aporte debe ser accesible para todos los miembros', 'Grupos de 8-15 miembros son los mas exitosos', 'La frecuencia quincenal es la mas popular en Honduras'],
            3: ['Una comision del 2-3% es estandar para coordinadores', 'El periodo de gracia da flexibilidad a los miembros', 'Las notificaciones mantienen al grupo activo'],
            4: ['Revisa todos los datos antes de confirmar', 'Podras editar la configuracion despues de crear', 'Invita miembros de confianza para empezar']
        };
        var stepTips = tips[step] || tips[1];
        el.innerHTML = stepTips.map(function(t) {
            return '<div style="display:flex;gap:8px;margin-bottom:8px;font-size:0.78rem;color:var(--ds-text-muted);"><i class="fas fa-lightbulb" style="color:var(--ds-amber);margin-top:2px;flex-shrink:0;"></i> ' + _cgsEsc(t) + '</div>';
        }).join('');
    }

    // Wire sidebar updates to form inputs
    (function() {
        document.addEventListener('input', function(e) {
            var id = e.target.id;
            if (['contribution', 'max-participants', 'custom-commission-rate'].indexOf(id) >= 0) {
                updateCgsCalculator();
            }
            updateCgsContract();
        });
        document.addEventListener('change', function(e) {
            if (e.target.id === 'payment-frequency' || e.target.name === 'commission-type') {
                updateCgsCalculator();
            }
            updateCgsContract();
        });
        // Listen for step changes from form handler
        document.addEventListener('cgs-step-changed', function(e) {
            var step = e.detail ? e.detail.step : 1;
            updateCgsTips(step);
            if (step >= 2) updateCgsCalculator();
            updateCgsContract();
        });
    })();


// v4.25.12: Distribution mode hint text
(function() {
    var hints = {
        rotation: 'Cada ciclo, un miembro recibe el total recaudado en su turno asignado.',
        lottery: 'Cada ciclo, se sortea aleatoriamente quien recibe el total recaudado.',
        accumulate: 'El dinero se acumula y se reparte proporcionalmente al final del periodo.',
        shares: 'Los miembros compran participaciones. Ganancias se reparten proporcionalmente.',
        request: 'El fondo se acumula. Los miembros solicitan desembolsos que el grupo aprueba por votacion.'
    };
    var sel = document.getElementById('distribution-mode');
    var hint = document.getElementById('distribution-mode-hint');
    if (sel && hint) {
        sel.addEventListener('change', function() { hint.textContent = hints[sel.value] || ''; });
    }
})();
