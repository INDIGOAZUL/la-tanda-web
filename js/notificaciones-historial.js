document.addEventListener('DOMContentLoaded', () => {
    // Make sure NotificationCenter is globally accessible or initialized
    let nc = window.notificationCenter;
    if (!nc && typeof NotificationCenter !== 'undefined') {
        nc = new NotificationCenter();
        window.notificationCenter = nc;
    }

    const historyList = document.getElementById('historyList');
    const searchInput = document.getElementById('searchNotifications');
    const typeFilter = document.getElementById('filterType');
    const dateFilter = document.getElementById('filterDate');
    const loadMoreBtn = document.getElementById('loadMoreHistoryBtn');

    let allHistory = [];
    let displayedCount = 0;
    const PAGE_SIZE = 20;

    async function loadHistory(append = false) {
        if (!nc) return;
        
        if (!append) {
            historyList.innerHTML = showSkeletons();
            displayedCount = 0;
        }

        try {
            const limit = PAGE_SIZE * 2;
            const offset = append ? allHistory.length : 0;
            const response = await fetch(nc.apiBase + `/api/notifications?limit=${limit}&offset=${offset}`, {
                headers: nc.getAuthHeaders()
            });
            const data = await response.json();
            
            if (data.success && data.data && data.data.notifications) {
                const mapped = data.data.notifications.map(n => ({
                    ...n,
                    icon: nc.getIconForType(n.type),
                    mappedType: nc.mapNotificationType(n.type)
                }));
                if (append) {
                    allHistory = [...allHistory, ...mapped];
                } else {
                    allHistory = mapped;
                }
                if (mapped.length < limit) {
                    nc.loadedAll = true; // Use the flag from nc
                }
            } else if (!append) {
                allHistory = nc.notifications || [];
            }
        } catch (e) {
            console.error("Failed to load history", e);
            if (!append) allHistory = nc.notifications || [];
        }
        
        renderHistory();
    }

    function showSkeletons() {
        return Array(6).fill(0).map(() => `
            <div class="history-item skeleton">
                <div class="history-icon skeleton-pulse"></div>
                <div class="history-content">
                    <div class="skeleton-line skeleton-pulse" style="width: 40%"></div>
                    <div class="skeleton-line skeleton-pulse" style="width: 80%"></div>
                    <div class="skeleton-line skeleton-pulse" style="width: 20%"></div>
                </div>
            </div>
        `).join('');
    }

    function renderHistory() {
        const query = searchInput.value.toLowerCase();
        const type = typeFilter.value;
        const date = dateFilter.value;

        let filtered = allHistory.filter(n => {
            const matchesQuery = !query || (n.title && n.title.toLowerCase().includes(query)) || (n.message && n.message.toLowerCase().includes(query));
            const matchesType = type === 'all' || n.mappedType === type || n.type === type;
            const matchesDate = !date || n.time.startsWith(date) || (n.created_at && n.created_at.startsWith(date));
            
            return matchesQuery && matchesType && matchesDate;
        });

        // Grouping logic similar to notification center
        const grouped = [];
        let i = 0;
        while (i < filtered.length) {
            const n = filtered[i];
            const t = n.type || '';
            if (['turn_updated', 'recruitment_starting', 'recruitment_halfway', 'recruitment_almost_full', 'recruitment_urgent'].includes(t)) {
                let count = 1;
                const groupId = (n.data || {}).group_id;
                while (i + count < filtered.length) {
                    const next = filtered[i + count];
                    const nextType = next.type || '';
                    const nextGroup = (next.data || {}).group_id;
                    if (nextType === t && nextGroup === groupId) { count++; } else { break; }
                }
                if (count > 2) {
                    const gn = Object.assign({}, n);
                    gn.title = (n.title || '').split(' — ')[0] + ' (' + count + ' notificaciones)';
                    grouped.push(gn);
                    i += count;
                    continue;
                }
            }
            grouped.push(n);
            i++;
        }

        if (grouped.length === 0) {
            historyList.innerHTML = `<div class="history-empty">No se encontraron notificaciones con los filtros actuales.</div>`;
            return;
        }

        historyList.innerHTML = grouped.map(n => `
            <div class="history-item ${n.read ? '' : 'unread'}" data-id="${n.id}">
                <div class="history-icon">${n.icon || '🔔'}</div>
                <div class="history-content">
                    <h4 class="history-title">${nc ? nc.escapeHtml(n.title) : n.title}</h4>
                    <p class="history-message">${nc ? nc.escapeHtml(n.message) : n.message}</p>
                    ${nc ? nc.renderInlineActions(n) : ''}
                    <div class="history-meta">
                        <span>${nc ? nc.getTimeAgo(n.time || n.created_at) : new Date(n.time || n.created_at).toLocaleDateString()}</span>
                        <span>${n.mappedType || 'Sistema'}</span>
                    </div>
                </div>
            </div>
        `).join('');

        // Re-attach inline action handlers
        historyList.querySelectorAll('.nc-inline-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (nc && nc.handleInlineAction) {
                    nc.handleInlineAction(btn.dataset.id, btn.dataset.action);
                }
            });
        });
    }

    // Infinite scroll observer
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !nc.loadedAll) {
            loadHistory(true);
        }
    }, { threshold: 0.1 });

    const sentinel = document.getElementById('historySentinel');
    if (sentinel) observer.observe(sentinel);

    searchInput.addEventListener('input', () => { loadHistory(); });
    typeFilter.addEventListener('change', () => { loadHistory(); });
    dateFilter.addEventListener('change', () => { loadHistory(); });
    
    // Listen for cross-tab updates
    document.addEventListener('notifications:updated', () => {
        loadHistory();
    });

    // Initialize
    loadHistory();
});
