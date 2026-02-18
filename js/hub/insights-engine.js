/**
 * LA TANDA - Insights Engine
 * Motor de reglas para insights del Hub Inteligente
 * Version: 1.0.0
 */

const HubInsightsEngine = {
    container: null,

    init(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {

            return;
        }
    },

    render(data) {
        if (!this.container) return;
        if (!data || !data.insights || data.insights.length === 0) {
            this.container.style.display = "none";
            return;
        }

        this.container.style.display = "block";
        this.container.innerHTML = `
            <div class="hub-insights-panel">
                <div class="insights-header">
                    <div class="insights-title">
                        <i class="fas fa-lightbulb"></i>
                        <span>Sugerencias para ti</span>
                    </div>
                    <button class="insights-refresh" onclick="HubInsightsEngine.refresh()">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                </div>
                <div class="insights-list">
                    ${data.insights.map(insight => this.renderInsight(insight)).join("")}
                </div>
            </div>
        `;
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    },

    safeUrl(url) {
        if (!url) return '#';
        // v3.96.0 - L1: block protocol-relative URLs and domain prefix bypass
        if (url.startsWith('/') && !url.startsWith('//')) return url;
        try {
            const parsed = new URL(url);
            if (parsed.origin === 'https://latanda.online') return url;
        } catch (e) {}
        return '#';
    },

    renderInsight(insight) {
        // Validate color is hex to prevent CSS injection (v3.96.0 - L1: added length check)
        const rawColor = String(insight.color || '#00ffff');
        const safeColor = (rawColor.length <= 7 && /^#[0-9a-fA-F]{3,6}$/.test(rawColor)) ? rawColor : '#00ffff';
        const safeIcon = this.escapeHtml(insight.icon);
        const safeText = this.escapeHtml(insight.text);
        const safeActionUrl = this.escapeHtml(this.safeUrl(insight.action_url));
        const safeActionText = this.escapeHtml(insight.action_text);
        const safeId = this.escapeHtml(insight.id);

        return `
            <div class="hub-insight-card" data-insight-id="${safeId}">
                <div class="insight-icon" style="background: ${safeColor}20; color: ${safeColor}">
                    <i class="fas ${safeIcon}"></i>
                </div>
                <div class="insight-content">
                    <p class="insight-text">${safeText}</p>
                    <a href="${safeActionUrl}" class="insight-action" style="color: ${safeColor}">
                        ${safeActionText}
                        <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
            </div>
        `;
    },

    async refresh() {
        const refreshBtn = this.container.querySelector(".insights-refresh");
        if (refreshBtn) {
            refreshBtn.classList.add("spinning");
        }

        try {
            if (window.HubAPI) {
                window.HubAPI.cache.delete("insights_" + window.HubAPI.getUserId());
                const data = await window.HubAPI.fetchSecondaryData();
                if (data && data.insights) {
                    this.render(data.insights);
                }
            }
        } catch (error) {

        } finally {
            if (refreshBtn) {
                refreshBtn.classList.remove("spinning");
            }
        }
    }
};

// Export
window.HubInsightsEngine = HubInsightsEngine;
