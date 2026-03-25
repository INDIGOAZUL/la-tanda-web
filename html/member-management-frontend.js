
// ============================================
// MEMBER MANAGEMENT FRONTEND
// ============================================

// XSS prevention helper
function _mmEscapeHtml(text) {
    if (text == null) return '';
    var div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// CSS Styles for Member Management
const memberManagementStyles = `
<style>
/* Coordinator Badge */
.badge-role.coordinator, .badge-role.admin, .badge-role.creator {
    background: linear-gradient(135deg, #06b6d4, #0891b2) !important;
    color: white !important;
    font-weight: 600;
}

.badge-role.member {
    background: linear-gradient(135deg, #10b981, #059669) !important;
    color: white !important;
}

/* Pending Count Badge */
.pending-count-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    border-radius: 10px;
    background: #ef4444;
    color: white;
    font-size: 0.75rem;
    font-weight: 600;
    margin-left: 6px;
    animation: pulse-badge 2s infinite;
}

@keyframes pulse-badge {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
}

/* Member Management Modal */
.member-management-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    padding: 20px;
}

.member-management-content {
    background: var(--tanda-darker, #1a1a2e);
    border-radius: 16px;
    max-width: 700px;
    width: 100%;
    max-height: 85vh;
    overflow-y: auto;
    border: 1px solid var(--tanda-cyan, #00d9ff);
    box-shadow: 0 25px 50px -12px rgba(0, 217, 255, 0.25);
}

.member-management-header {
    padding: 20px 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: sticky;
    top: 0;
    background: var(--tanda-darker, #1a1a2e);
    z-index: 10;
}

.member-management-header h2 {
    margin: 0;
    color: var(--tanda-cyan, #00d9ff);
    font-size: 1.25rem;
}

.close-member-modal {
    background: transparent;
    border: none;
    color: #888;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 4px;
    line-height: 1;
}

.close-member-modal:hover {
    color: #ef4444;
}

.member-management-tabs {
    display: flex;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(0, 0, 0, 0.2);
}

.member-tab {
    flex: 1;
    padding: 12px 16px;
    background: transparent;
    border: none;
    color: #888;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
    border-bottom: 2px solid transparent;
}

.member-tab:hover {
    background: rgba(255, 255, 255, 0.05);
    color: white;
}

.member-tab.active {
    color: var(--tanda-cyan, #00d9ff);
    border-bottom-color: var(--tanda-cyan, #00d9ff);
    background: rgba(0, 217, 255, 0.1);
}

.member-management-body {
    padding: 20px 24px;
}

/* Member List */
.member-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.member-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    transition: all 0.2s;
}

.member-item:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(0, 217, 255, 0.3);
}

.member-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--tanda-cyan), var(--tanda-purple, #a855f7));
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    color: white;
    flex-shrink: 0;
}

.member-avatar img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
}

.member-info {
    flex: 1;
    min-width: 0;
}

.member-name {
    font-weight: 600;
    color: white;
    margin-bottom: 4px;
}

.member-email {
    font-size: 0.85rem;
    color: #888;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.member-meta {
    font-size: 0.8rem;
    color: #666;
    margin-top: 4px;
}

.member-actions {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
}

.btn-approve {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 500;
    transition: all 0.2s;
}

.btn-approve:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.btn-reject, .btn-remove {
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 500;
    transition: all 0.2s;
}

.btn-reject:hover,
.role-select {
    padding: 6px 10px;
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 6px;
    background: rgba(0,0,0,0.3);
    color: #fff;
    font-size: 0.85rem;
    cursor: pointer;
    margin-right: 8px;
}

.role-select:hover {
    border-color: var(--tanda-cyan, #00d9ff);
}

.member-actions-extended {
    display: flex;
    align-items: center;
    gap: 8px;
}

.creator-badge {
    background: linear-gradient(135deg, #fbbf24, #f59e0b);
    color: #000;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 600;
}


.btn-remove:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
}

.empty-state {
    text-align: center;
    padding: 40px 20px;
    color: #666;
}

.empty-state-icon {
    font-size: 3rem;
    margin-bottom: 16px;
    opacity: 0.5;
}

.empty-state-text {
    font-size: 1rem;
    color: #888;
}

/* Confirmation Dialog */
.confirm-dialog {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10001;
}

.confirm-dialog-content {
    background: var(--tanda-darker, #1a1a2e);
    border-radius: 12px;
    padding: 24px;
    max-width: 400px;
    width: 90%;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.confirm-dialog h3 {
    margin: 0 0 16px;
    color: white;
}

.confirm-dialog p {
    color: #888;
    margin-bottom: 20px;
}

.confirm-dialog textarea {
    width: 100%;
    padding: 12px;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: white;
    resize: vertical;
    min-height: 80px;
    margin-bottom: 16px;
}

.confirm-dialog-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
}

.btn-cancel {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #888;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
}

.btn-cancel:hover {
    background: rgba(255, 255, 255, 0.05);
    color: white;
}

/* Coordinator Action Button in Card */
.btn-manage-members {
    background: linear-gradient(135deg, #06b6d4, #0891b2);
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.8rem;
    display: inline-flex;
    align-items: center;
    gap: 4px;
}

.btn-manage-members:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);
}

/* ============================================ */
/* FICHA DEL MIEMBRO — On-screen styles         */
/* ============================================ */
.mm-ficha-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.75);
    z-index: 10002;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    animation: mmFichaFadeIn 0.2s ease-out;
}

@keyframes mmFichaFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

.mm-ficha-modal {
    background: #1e293b;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    width: 100%;
    max-width: 700px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 12px 48px rgba(0, 0, 0, 0.5);
}

.mm-ficha-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.mm-ficha-sheet {
    padding: 20px;
}

.ficha-controls {
    display: flex;
    justify-content: space-between;
    margin-bottom: 16px;
}

.ficha-btn-back, .ficha-btn-print {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: #e2e8f0;
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.85rem;
    font-family: inherit;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: background 0.15s;
}

.ficha-btn-back:hover, .ficha-btn-print:hover {
    background: rgba(255, 255, 255, 0.15);
}

.ficha-btn-print {
    background: linear-gradient(135deg, #06b6d4, #0891b2);
    border-color: transparent;
    color: white;
}

.ficha-btn-print:hover {
    opacity: 0.9;
}

.ficha-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    margin-bottom: 16px;
}

.ficha-header-left {
    display: flex;
    align-items: center;
    gap: 12px;
}

.ficha-avatar {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: rgba(0, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    flex-shrink: 0;
}

.ficha-avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.ficha-avatar-initial {
    font-size: 1.3rem;
    font-weight: 700;
    color: #00FFFF;
}

.ficha-name {
    font-size: 1.15rem;
    font-weight: 700;
    color: #e2e8f0;
    margin: 0 0 4px;
}

.ficha-role-badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 6px;
    font-size: 0.7rem;
    font-weight: 600;
    background: rgba(255, 255, 255, 0.1);
    color: #94a3b8;
}

.ficha-role-creator, .ficha-role-coordinator {
    background: linear-gradient(135deg, #06b6d4, #0891b2);
    color: white;
}

.ficha-contact {
    font-size: 0.78rem;
    color: #64748b;
    margin-top: 4px;
}

.ficha-header-right {
    text-align: right;
}

.ficha-group-name {
    font-size: 0.95rem;
    font-weight: 700;
    color: #e2e8f0;
}

.ficha-group-meta {
    font-size: 0.78rem;
    color: #64748b;
}

.ficha-date {
    font-size: 0.7rem;
    color: #475569;
    margin-top: 4px;
}

.ficha-status-banner {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 10px 14px;
    border-radius: 10px;
    margin-bottom: 16px;
    background: rgba(255, 255, 255, 0.04);
    font-size: 0.82rem;
    color: #e2e8f0;
}

.ficha-status-banner.ficha-status-green {
    border-left: 4px solid #22c55e;
}

.ficha-status-banner.ficha-status-amber {
    border-left: 4px solid #f59e0b;
}

.ficha-status-banner.ficha-status-red {
    border-left: 4px solid #ef4444;
}

.ficha-status-label {
    font-weight: 700;
}

.ficha-positions {
    background: rgba(59, 130, 246, 0.15);
    color: #60a5fa;
    padding: 2px 8px;
    border-radius: 6px;
    font-weight: 600;
    font-size: 0.78rem;
}

.ficha-joined {
    color: #64748b;
    font-size: 0.78rem;
}

.ficha-section {
    margin-bottom: 18px;
}

.ficha-section-title {
    font-size: 0.9rem;
    font-weight: 700;
    color: #e2e8f0;
    margin-bottom: 10px;
    padding-bottom: 6px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.ficha-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
}

.ficha-field {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.05);
}

.ficha-label {
    font-size: 0.78rem;
    color: #64748b;
}

.ficha-value {
    font-size: 0.88rem;
    font-weight: 600;
    color: #e2e8f0;
}

.ficha-value.green { color: #22c55e; }
.ficha-value.red { color: #ef4444; }
.ficha-value.amber { color: #f59e0b; }
.ficha-value.cyan { color: #06b6d4; }

.ficha-loan-bar {
    height: 8px;
    background: rgba(239, 68, 68, 0.15);
    border-radius: 6px;
    margin-top: 10px;
    overflow: hidden;
}

.ficha-loan-fill {
    height: 100%;
    background: linear-gradient(90deg, #22c55e, #16a34a);
    border-radius: 6px;
    transition: width 0.3s;
}

.ficha-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.78rem;
}

.ficha-table th {
    text-align: left;
    padding: 8px 10px;
    background: rgba(255, 255, 255, 0.05);
    color: #94a3b8;
    font-weight: 600;
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.ficha-table td {
    padding: 7px 10px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    color: #cbd5e1;
}

.ficha-td-green { color: #22c55e !important; font-weight: 600; }
.ficha-td-amber { color: #f59e0b !important; font-weight: 600; }
.ficha-td-red { color: #ef4444 !important; font-weight: 600; }

.ficha-empty {
    color: #475569;
    font-style: italic;
    padding: 12px 0;
    font-size: 0.82rem;
}

.ficha-footer {
    margin-top: 20px;
    padding-top: 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    text-align: center;
    font-size: 0.7rem;
    color: #475569;
}

.ficha-controls-right {
    display: flex;
    gap: 8px;
}

.ficha-btn-whatsapp {
    background: linear-gradient(135deg, #25D366, #128C7E);
    border: none;
    color: white;
    padding: 8px 14px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.85rem;
    font-family: inherit;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: opacity 0.15s;
}

.ficha-btn-whatsapp:hover {
    opacity: 0.9;
}

.ficha-btn-pdf {
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #ef4444;
    padding: 8px 14px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.85rem;
    font-family: inherit;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.15s;
}

.ficha-btn-pdf:hover {
    background: rgba(239, 68, 68, 0.25);
}

.ficha-notes-section {
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    padding-top: 16px;
}

.ficha-notes-input {
    width: 100%;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    padding: 12px;
    color: #e2e8f0;
    font-size: 0.85rem;
    font-family: inherit;
    resize: vertical;
    min-height: 70px;
    outline: none;
    transition: border-color 0.2s;
    box-sizing: border-box;
}

.ficha-notes-input:focus {
    border-color: #06b6d4;
}

.ficha-notes-input::placeholder {
    color: rgba(255, 255, 255, 0.25);
}

.ficha-notes-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 8px;
}

.ficha-notes-save {
    background: linear-gradient(135deg, #06b6d4, #0891b2);
    border: none;
    color: white;
    padding: 8px 18px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.82rem;
    font-family: inherit;
    font-weight: 600;
    transition: opacity 0.15s;
}

.ficha-notes-save:hover {
    opacity: 0.9;

        /* Tier 3: Credit Score */
        .ficha-credit-row { display: flex; gap: 20px; align-items: center; }
        .ficha-credit-shield { width: 90px; height: 100px; border: 3px solid; border-radius: 12px 12px 50% 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(0,0,0,0.2); flex-shrink: 0; }
        .ficha-credit-score { font-size: 1.6rem; font-weight: 700; line-height: 1; }
        .ficha-credit-cat { font-size: 0.7rem; font-weight: 600; text-transform: uppercase; margin-top: 4px; }
        .ficha-credit-stats { flex: 1; display: flex; flex-wrap: wrap; gap: 8px; }
        .ficha-credit-stats .ficha-field { flex: 1 1 120px; }
        .ficha-credit-factors { display: flex; flex-direction: column; gap: 6px; margin-top: 12px; }
        .ficha-credit-factor { display: flex; align-items: center; gap: 8px; font-size: 0.78rem; color: #94a3b8; }
        .ficha-credit-factor span { min-width: 90px; }
        .ficha-factor-bar { flex: 1; height: 6px; background: rgba(255,255,255,0.08); border-radius: 3px; overflow: hidden; }
        .ficha-factor-fill { height: 100%; border-radius: 3px; transition: width 0.3s; }
        /* Tier 3: Turn Position */
        .ficha-turn-row { display: flex; gap: 16px; align-items: center; }
        .ficha-turn-circle { width: 60px; height: 60px; border-radius: 50%; background: rgba(0,255,255,0.1); border: 2px solid rgba(0,255,255,0.3); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; font-weight: 700; color: #00FFFF; flex-shrink: 0; }
        .ficha-turn-info { flex: 1; }
        .ficha-turn-label { font-size: 0.92rem; font-weight: 600; color: #e2e8f0; }
        .ficha-turn-detail { font-size: 0.78rem; color: #94a3b8; margin-top: 2px; }
        .ficha-turn-badge { display: inline-block; padding: 2px 10px; border-radius: 10px; font-size: 0.72rem; font-weight: 600; margin-top: 6px; }
        .ficha-turn-done { background: rgba(34,197,94,0.15); color: #22c55e; }
        .ficha-turn-now { background: rgba(0,255,255,0.15); color: #00FFFF; animation: fichaPulse 1.5s ease-in-out infinite; }
        .ficha-turn-soon { background: rgba(245,158,11,0.15); color: #f59e0b; }
        @keyframes fichaPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }
        /* Tier 3: Loan History */
        .ficha-subsection-title { font-size: 0.82rem; font-weight: 600; color: #94a3b8; margin: 14px 0 8px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.06); }
        .ficha-table-compact { font-size: 0.78rem; }
        .ficha-table-compact th { padding: 6px 8px; }
        .ficha-table-compact td { padding: 5px 8px; }
        .ficha-resolved-loan { display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; background: rgba(255,255,255,0.03); border-radius: 6px; margin-bottom: 4px; font-size: 0.82rem; }
        /* Tier 3: Risk Indicators */
        .ficha-risk-item { display: flex; gap: 12px; padding: 10px 12px; border-radius: 8px; margin-bottom: 8px; }
        .ficha-risk-info { border-left: 3px solid #3b82f6; background: rgba(59,130,246,0.06); }
        .ficha-risk-warning { border-left: 3px solid #f59e0b; background: rgba(245,158,11,0.06); }
        .ficha-risk-danger { border-left: 3px solid #ef4444; background: rgba(239,68,68,0.06); }
        .ficha-risk-icon { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; flex-shrink: 0; }
        .ficha-risk-info .ficha-risk-icon { color: #3b82f6; }
        .ficha-risk-warning .ficha-risk-icon { color: #f59e0b; }
        .ficha-risk-danger .ficha-risk-icon { color: #ef4444; }
        .ficha-risk-body { flex: 1; }
        .ficha-risk-label { font-size: 0.82rem; font-weight: 600; color: #e2e8f0; }
        .ficha-risk-value { font-size: 0.75rem; color: #94a3b8; margin-top: 2px; }
        .ficha-risk-bar { height: 4px; background: rgba(255,255,255,0.08); border-radius: 2px; margin-top: 6px; overflow: hidden; }
        .ficha-risk-fill { height: 100%; border-radius: 2px; }
        .ficha-risk-info .ficha-risk-fill { background: #3b82f6; }
        .ficha-risk-warning .ficha-risk-fill { background: #f59e0b; }
        .ficha-risk-danger .ficha-risk-fill { background: #ef4444; }
        @media (max-width: 480px) { .ficha-credit-row { flex-direction: column; align-items: flex-start; } .ficha-credit-shield { width: 70px; height: 80px; } .ficha-credit-score { font-size: 1.3rem; } .ficha-turn-circle { width: 48px; height: 48px; font-size: 1rem; } }
}

.ficha-notes-status {
    font-size: 0.78rem;
    color: #64748b;
    transition: color 0.2s;
}

.ficha-notes-saved {
    color: #22c55e;
}

.ficha-notes-error {
    color: #ef4444;
}

@media (max-width: 600px) {
    .ficha-controls { flex-direction: column; gap: 8px; }
    .ficha-controls-right { flex-wrap: wrap; }
}

.btn-ficha {
    background: rgba(6, 182, 212, 0.1);
    border: 1px solid rgba(6, 182, 212, 0.2);
    color: #06b6d4;
    padding: 4px 8px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.85rem;
    transition: all 0.15s;
    margin-top: 6px;
}

.btn-ficha:hover {
    background: rgba(6, 182, 212, 0.2);
    transform: translateY(-1px);
}

@media (max-width: 600px) {
    .ficha-header { flex-direction: column; gap: 12px; }
    .ficha-header-right { text-align: left; }
    .ficha-grid { grid-template-columns: 1fr; }
    .ficha-status-banner { flex-wrap: wrap; gap: 8px; }
    .ficha-table { font-size: 0.72rem; }
    .ficha-table th, .ficha-table td { padding: 5px 6px; }
}
</style>
`;

// Inject styles
document.head.insertAdjacentHTML('beforeend', memberManagementStyles);

// ============================================
// MEMBER MANAGEMENT CLASS
// ============================================
class MemberManagement {
    constructor() {
        this.currentGroupId = null;
        this.pendingMembers = [];
        this.activeMembers = [];
        this.isCoordinator = false;
    }

    // XSS prevention helper
    escapeHtml(text) {
        return _mmEscapeHtml(text);
    }

    // Check if current user is coordinator of a group
    async checkCoordinatorStatus(groupId, userId) {
        try {
            var token = localStorage.getItem('auth_token') || localStorage.getItem('authToken') || '';
            var headers = token ? { 'Authorization': 'Bearer ' + token } : {};
            const response = await fetch(`${window.API_BASE_URL || 'https://latanda.online'}/api/groups/${encodeURIComponent(groupId)}/members`, { headers: headers });
            // If we get a 403, user is not coordinator
            // If we get success or 404, user IS coordinator
            return response.status !== 403;
        } catch (err) {
            return false;
        }
    }

    // Fetch pending members for a group (uses /members endpoint and filters by status)
    async fetchPendingMembers(groupId) {
        try {
            const url = `${window.API_BASE_URL || 'https://latanda.online'}/api/groups/${encodeURIComponent(groupId)}/members`;
            const response = await fetch(url, {
                headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('auth_token') || localStorage.getItem('authToken') || '') }
            });
            const data = await response.json();
            if (data.success) {
                const allMembers = data.data.members || data.data || [];
                // Filter only pending members and map to expected format
                this.pendingMembers = allMembers
                    .filter(m => m.status === 'pending')
                    .map(m => ({
                        user_id: m.user_id,
                        user_name: m.name || m.display_name,
                        display_name: m.display_name || m.name,
                        user_email: m.email,
                        profile_image_url: m.avatar_url,
                        requested_at: m.joined_at
                    }));
                return this.pendingMembers;
            }
            return [];
        } catch (err) {
            return [];
        }
    }

    // Fetch active members for a group
    async fetchActiveMembers(groupId) {
        try {
            const response = await fetch(`${window.API_BASE_URL || 'https://latanda.online'}/api/groups/${encodeURIComponent(groupId)}/members`, {
                headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('auth_token') || localStorage.getItem('authToken') || '') }
            });
            const data = await response.json();
            if (data.success) {
                this.activeMembers = data.data.members || data.data || [];
                return this.activeMembers;
            }
            return [];
        } catch (err) {
            return [];
        }
    }

    // Fetch group approval settings
    async fetchGroupSettings(groupId) {
        try {
            const apiBase = window.API_BASE_URL || 'https://latanda.online';
            const response = await fetch(`${apiBase}/api/groups/${encodeURIComponent(groupId)}/settings`, {
                headers: {
                    'Authorization': 'Bearer ' + (localStorage.getItem('auth_token') || '')
                }
            });
            const data = await response.json();
            if (data.success && data.data) {
                this.groupSettings = data.data.approval_settings || {};
            } else {
                this.groupSettings = {};
            }
        } catch (err) {
            this.groupSettings = {};
        }
    }

    // Approve a pending member
    async approveMember(groupId, memberId, position = null) {
        const coordinatorId = localStorage.getItem('user_id');
        try {
            const response = await fetch(`${window.API_BASE_URL || 'https://latanda.online'}/api/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(memberId)}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (localStorage.getItem('auth_token') || '') },
                body: JSON.stringify({ coordinator_id: coordinatorId, position })
            });
            const data = await response.json();
            if (data.success) {
                showNotification('Miembro aprobado exitosamente', 'success');
                return true;
            } else {
                showNotification('Error al aprobar miembro', 'error');
                return false;
            }
        } catch (err) {
            showNotification('Error de conexion', 'error');
            return false;
        }
    }

    // Reject a pending member
    async rejectMember(groupId, memberId, reason = '') {
        const coordinatorId = localStorage.getItem('user_id');
        try {
            const response = await fetch(`${window.API_BASE_URL || 'https://latanda.online'}/api/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(memberId)}/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (localStorage.getItem('auth_token') || '') },
                body: JSON.stringify({ coordinator_id: coordinatorId, reason })
            });
            const data = await response.json();
            if (data.success) {
                showNotification('Solicitud rechazada', 'success');
                return true;
            } else {
                showNotification('Error al rechazar solicitud', 'error');
                return false;
            }
        } catch (err) {
            showNotification('Error de conexion', 'error');
            return false;
        }
    }

    // Remove an active member
    // L1 FIX: Dead removeMember() method removed (used handleRemove instead)

    // Open member management modal
    async openModal(groupId, groupName) {
        this.currentGroupId = groupId;

        try {
            // Fetch data (all have internal try/catch)
            await Promise.all([
                this.fetchPendingMembers(groupId),
                this.fetchActiveMembers(groupId),
                this.fetchGroupSettings(groupId)
            ]);
        } catch (err) {
            // Prevent unhandled rejection from triggering global-error-handler logout
        }

        const modal = document.createElement('div');
        modal.className = 'member-management-modal';
        modal.id = 'memberManagementModal';

        var pendingHtml = '', activeHtml = '';
        try { pendingHtml = this.renderPendingMembers(); } catch(e) { pendingHtml = '<p style="color:#94a3b8;padding:16px">Error al cargar solicitudes</p>'; }
        try { activeHtml = this.renderActiveMembers(); } catch(e) { activeHtml = '<p style="color:#94a3b8;padding:16px">Error al cargar miembros</p>'; }

        modal.innerHTML = `
            <div class="member-management-content">
                <div class="member-management-header">
                    <h2>Gestion de Miembros - ${this.escapeHtml(groupName)}</h2>
                    <button class="close-member-modal" data-action="mm-close">&times;</button>
                </div>
                <div class="member-management-tabs">
                    <button class="member-tab active" data-action="mm-switch-tab" data-tab="pending">
                        Solicitudes Pendientes
                        ${this.pendingMembers.length > 0 ? `<span class="pending-count-badge">${parseInt(this.pendingMembers.length, 10)}</span>` : ''}
                    </button>
                    <button class="member-tab" data-action="mm-switch-tab" data-tab="active">
                        Miembros Activos (${parseInt(this.activeMembers.length, 10)})
                    </button>
                </div>
                <div class="member-management-body">
                    <div id="pendingMembersTab" class="member-list">
                        ${pendingHtml}
                    </div>
                    <div id="activeMembersTab" class="member-list" style="display: none;">
                        ${activeHtml}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal();
        });
    }

    closeModal() {
        const modal = document.getElementById('memberManagementModal');
        if (modal) modal.remove();
    }

    switchTab(tab) {
        const pendingTab = document.getElementById('pendingMembersTab');
        const activeTab = document.getElementById('activeMembersTab');
        const settingsTab = document.getElementById('settingsTab');
        const tabs = document.querySelectorAll('.member-tab');

        tabs.forEach((t, i) => {
            t.classList.toggle('active',
                (tab === 'pending' && i === 0) ||
                (tab === 'active' && i === 1) ||
                (tab === 'settings' && i === 2)
            );
        });

        if (pendingTab) pendingTab.style.display = tab === 'pending' ? 'flex' : 'none';
        if (activeTab) activeTab.style.display = tab === 'active' ? 'flex' : 'none';
        if (settingsTab) settingsTab.style.display = tab === 'settings' ? 'block' : 'none';
    }

    // Render settings panel
    renderSettings() {
        const settings = this.groupSettings || {};
        return `
            <div class="settings-inner">
                <div class="settings-section">
                    <h3>Auto-Aprobacion</h3>

                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-label">Auto-aprobar invitados</div>
                            <div class="setting-description">Aprobar automaticamente a usuarios invitados por miembros</div>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="setting-auto-invited" ${settings.auto_approve_invited ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>


                </div>

                <div class="settings-section">
                    <h3>Notificaciones</h3>

                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-label">Notificar nuevas solicitudes</div>
                            <div class="setting-description">Recibir notificacion cuando alguien solicite unirse</div>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="setting-notify-request" ${settings.notify_admin_on_request !== false ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>

                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-label">Notificar al usuario</div>
                            <div class="setting-description">Enviar notificacion cuando se apruebe/rechace</div>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="setting-notify-user" ${settings.notify_user_on_decision !== false ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>

                <button class="settings-save-btn" data-action="mm-save-settings">
                    Guardar Configuracion
                </button>
                <div id="settingsStatus"></div>
            </div>
        `;
    }

    // Save settings to API
    async saveSettings() {
        const btn = document.querySelector('.settings-save-btn');
        const statusDiv = document.getElementById('settingsStatus');

        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Guardando...';
        }

        const newSettings = {
            auto_approve_invited: document.getElementById('setting-auto-invited')?.checked || false,

            notify_admin_on_request: document.getElementById('setting-notify-request')?.checked || false,
            notify_user_on_decision: document.getElementById('setting-notify-user')?.checked || false,
            require_manual_approval: true
        };

        try {
            const apiBase = window.API_BASE_URL || 'https://latanda.online';
            const response = await fetch(`${apiBase}/api/groups/${encodeURIComponent(this.currentGroupId)}/settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + (localStorage.getItem('auth_token') || '')
                },
                body: JSON.stringify({ approval_settings: newSettings })
            });

            const data = await response.json();

            if (data.success) {
                this.groupSettings = newSettings;
                if (statusDiv) {
                    statusDiv.className = 'settings-status success';
                    statusDiv.textContent = 'Configuracion guardada';
                }
                if (typeof showNotification === 'function') {
                    showNotification('Configuracion guardada', 'success');
                }
            } else {
                if (statusDiv) {
                    statusDiv.className = 'settings-status error';
                    statusDiv.textContent = 'Error al guardar configuracion';
                }
            }
        } catch (err) {
            if (statusDiv) {
                statusDiv.className = 'settings-status error';
                statusDiv.textContent = 'Error de conexion';
            }
        }

        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Guardar Configuracion';
        }

        setTimeout(() => {
            if (statusDiv) {
                statusDiv.textContent = '';
                statusDiv.className = '';
            }
        }, 3000);
    }

    renderPendingMembers() {
        if (this.pendingMembers.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">&#x2714;</div>
                    <div class="empty-state-text">No hay solicitudes pendientes</div>
                </div>
            `;
        }

        return this.pendingMembers.map(member => {
            const safeName = this.escapeHtml(member.user_name || member.display_name || 'Usuario');
            const safeEmail = this.escapeHtml(member.user_email || 'Sin email');
            const safeId = this.escapeHtml(member.user_id);
            const safeImgUrl = this.escapeHtml(member.profile_image_url || '');
            const initial = (member.user_name || member.display_name || 'U').charAt(0).toUpperCase();
            const safeInitial = this.escapeHtml(initial);
            const dateStr = member.requested_at ? new Date(member.requested_at).toLocaleDateString('es-HN') : '';

            return `
            <div class="member-item" data-member-id="${safeId}">
                <div class="member-avatar">
                    ${member.profile_image_url
                        ? `<img src="${safeImgUrl}" alt="${safeName}">`
                        : safeInitial
                    }
                </div>
                <div class="member-info">
                    <div class="member-name">${safeName}</div>
                    <div class="member-email">${safeEmail}</div>
                    <div class="member-meta">Solicitud: ${this.escapeHtml(dateStr)}</div>
                </div>
                <div class="member-actions">
                    <button class="btn-approve" data-action="mm-approve" data-member-id="${safeId}">
                        Aprobar
                    </button>
                    <button class="btn-reject" data-action="mm-reject" data-member-id="${safeId}">
                        Rechazar
                    </button>
                </div>
            </div>
            `;
        }).join('');
    }

    renderActiveMembers() {
        const userId = localStorage.getItem('user_id');
        const filteredMembers = this.activeMembers.filter(m => m.user_id !== userId && m.status === 'active');

        if (filteredMembers.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">&#x1F465;</div>
                    <div class="empty-state-text">No hay otros miembros en el grupo</div>
                </div>
            `;
        }

        return filteredMembers.map(member => {
            const safeName = this.escapeHtml(member.name || member.display_name || 'Usuario');
            const safeEmail = this.escapeHtml(member.email || 'Sin email');
            const safeId = this.escapeHtml(member.user_id);
            const safeImgUrl = this.escapeHtml(member.profile_image_url || '');
            const safeRole = this.escapeHtml(member.role || 'member');
            const initial = (member.name || member.display_name || 'U').charAt(0).toUpperCase();
            const safeInitial = this.escapeHtml(initial);
            const dateStr = member.joined_at ? new Date(member.joined_at).toLocaleDateString('es-HN') : '';

            return `
            <div class="member-item" data-member-id="${safeId}">
                <div class="member-avatar">
                    ${member.profile_image_url
                        ? `<img src="${safeImgUrl}" alt="${safeName}">`
                        : safeInitial
                    }
                </div>
                <div class="member-info">
                    <div class="member-name">${safeName}</div>
                    <div class="member-email">${safeEmail}</div>
                    <div class="member-meta">
                        Rol: ${safeRole} |
                        Desde: ${this.escapeHtml(dateStr)}
                    </div>
                </div>
                <div class="member-actions-extended">
                    ${member.role !== 'creator' ? `
                        <select class="role-select" data-action="mm-role-change" data-member-id="${safeId}">
                            <option value="member" ${member.role === 'member' ? 'selected' : ''}>Miembro</option>
                            <option value="coordinator" ${member.role === 'coordinator' ? 'selected' : ''}>Coordinador</option>
                        </select>
                        <button class="btn-remove" data-action="mm-remove" data-member-id="${safeId}" data-member-name="${safeName}">
                            Remover
                        </button>
                    ` : `
                        <span class="creator-badge">Creador</span>
                    `}
                    <button class="btn-ficha" data-action="mm-ficha" data-member-id="${safeId}" data-member-name="${safeName}" title="Ver ficha del miembro">
                        &#x1F4CB;
                    </button>
                </div>
            </div>
            `;
        }).join('');
    }

    async handleApprove(memberId) {
        const success = await this.approveMember(this.currentGroupId, memberId);
        if (success) {
            // Remove from pending list and refresh UI
            this.pendingMembers = this.pendingMembers.filter(m => m.user_id !== memberId);
            var pendingTabEl = document.getElementById('pendingMembersTab');
            if (pendingTabEl) pendingTabEl.innerHTML = this.renderPendingMembers();

            // Update tab badge
            const pendingTab = document.querySelector('.member-tab');
            if (pendingTab) {
                const badge = pendingTab.querySelector('.pending-count-badge');
                if (this.pendingMembers.length > 0) {
                    if (badge) {
                        badge.textContent = this.pendingMembers.length;
                    } else {
                        pendingTab.insertAdjacentHTML('beforeend', `<span class="pending-count-badge">${parseInt(this.pendingMembers.length, 10)}</span>`);
                    }
                } else if (badge) {
                    badge.remove();
                }
            }

            // Refresh active members
            await this.fetchActiveMembers(this.currentGroupId);
            var activeTabEl = document.getElementById('activeMembersTab');
            if (activeTabEl) activeTabEl.innerHTML = this.renderActiveMembers();
        }
    }

    handleReject(memberId) {
        this.showConfirmDialog(
            'Rechazar Solicitud',
            'Esta seguro que desea rechazar esta solicitud?',
            true,
            async (reason) => {
                const success = await this.rejectMember(this.currentGroupId, memberId, reason);
                if (success) {
                    this.pendingMembers = this.pendingMembers.filter(m => m.user_id !== memberId);
                    var pendingTabEl = document.getElementById('pendingMembersTab');
                    if (pendingTabEl) pendingTabEl.innerHTML = this.renderPendingMembers();

                    // Update tab badge
                    const pendingTab = document.querySelector('.member-tab');
                    if (pendingTab) {
                        const badge = pendingTab.querySelector('.pending-count-badge');
                        if (this.pendingMembers.length > 0) {
                            if (badge) badge.textContent = this.pendingMembers.length;
                        } else if (badge) {
                            badge.remove();
                        }
                    }
                }
            }
        );
    }

    handleRemove(memberId, memberName) {
        const safeName = _mmEscapeHtml(memberName);
        this.showConfirmDialog(
            'Remover Miembro',
            'Esta seguro que desea remover a ' + safeName + ' del grupo? Esta accion no se puede deshacer.',
            true,
            async (reason) => {
                const token = localStorage.getItem('auth_token');
                if (!token) {
                    showNotification('Debes iniciar sesion', 'error');
                    return;
                }

                const apiBase = window.API_BASE_URL || 'https://latanda.online';
                try {
                    const response = await fetch(apiBase + '/api/groups/' + encodeURIComponent(this.currentGroupId) + '/members/' + encodeURIComponent(memberId), {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + token
                        },
                        body: JSON.stringify({ action: 'remove', reason: reason || '' })
                    });

                    const data = await response.json();

                    if (data.success) {
                        showNotification('Miembro removido exitosamente', 'success');
                        this.activeMembers = this.activeMembers.filter(m => m.user_id !== memberId);
                        var activeTabEl = document.getElementById('activeMembersTab');
                        if (activeTabEl) activeTabEl.innerHTML = this.renderActiveMembers();

                        // Update active count
                        const activeTab = document.querySelectorAll('.member-tab')[1];
                        if (activeTab) {
                            activeTab.textContent = 'Miembros Activos (' + this.activeMembers.filter(m => m.status === 'active').length + ')';
                        }
                    } else {
                        showNotification('Error al remover miembro', 'error');
                    }
                } catch (error) {
                    showNotification('Error de conexion', 'error');
                }
            }
        );
    }

    // ============================================
    // ROLE & STATUS MANAGEMENT
    // ============================================

    async handleRoleChange(memberId, newRole) {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            showNotification('Debes iniciar sesion', 'error');
            return;
        }

        const apiBase = window.API_BASE_URL || 'https://latanda.online';
        try {
            const response = await fetch(apiBase + '/api/groups/' + encodeURIComponent(this.currentGroupId) + '/members/' + encodeURIComponent(memberId) + '/role', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ role: newRole })
            });

            const data = await response.json();

            if (data.success) {
                showNotification('Rol actualizado a ' + (newRole === 'coordinator' ? 'Coordinador' : 'Miembro'), 'success');
                const member = this.activeMembers.find(m => m.user_id === memberId);
                if (member) member.role = newRole;
                var activeTabEl = document.getElementById('activeMembersTab');
                if (activeTabEl) activeTabEl.innerHTML = this.renderActiveMembers();
            } else {
                showNotification('Error al cambiar rol', 'error');
                var activeTabEl2 = document.getElementById('activeMembersTab');
                if (activeTabEl2) activeTabEl2.innerHTML = this.renderActiveMembers();
            }
        } catch (error) {
            showNotification('Error de conexion', 'error');
            var activeTabEl3 = document.getElementById('activeMembersTab');
            if (activeTabEl3) activeTabEl3.innerHTML = this.renderActiveMembers();
        }
    }

    async handleStatusChange(memberId, newStatus, memberName) {
        const action = newStatus === 'suspended' ? 'suspender' : 'activar';
        const safeName = _mmEscapeHtml(memberName);

        this.showConfirmDialog(
            (newStatus === 'suspended' ? 'Suspender' : 'Activar') + ' Miembro',
            'Esta seguro de ' + action + ' a ' + safeName + '?',
            false,
            async () => {
                const token = localStorage.getItem('auth_token');
                if (!token) {
                    showNotification('Debes iniciar sesion', 'error');
                    return;
                }

                const apiBase = window.API_BASE_URL || 'https://latanda.online';
                try {
                    const response = await fetch(apiBase + '/api/groups/' + encodeURIComponent(this.currentGroupId) + '/members/' + encodeURIComponent(memberId) + '/status', {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + token
                        },
                        body: JSON.stringify({ status: newStatus })
                    });

                    const data = await response.json();

                    if (data.success) {
                        showNotification('Miembro ' + (action === 'suspender' ? 'suspendido' : 'activado') + ' exitosamente', 'success');
                        const member = this.activeMembers.find(m => m.user_id === memberId);
                        if (member) member.status = newStatus;
                        var activeTabEl = document.getElementById('activeMembersTab');
                        if (activeTabEl) activeTabEl.innerHTML = this.renderActiveMembers();
                    } else {
                        showNotification('Error al cambiar estado', 'error');
                    }
                } catch (error) {
                    showNotification('Error de conexion', 'error');
                }
            }
        );
    }

    // ============================================
    // FICHA DEL MIEMBRO — Printable member detail sheet
    // ============================================
    async openMemberSheet(memberId, memberName) {
        // Show loading overlay
        var loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'mm-ficha-overlay';
        loadingOverlay.id = 'mmFichaOverlay';
        loadingOverlay.innerHTML = '<div class="mm-ficha-modal"><div class="mm-ficha-loading"><div class="pf-spinner" style="width:40px;height:40px;border:3px solid rgba(255,255,255,0.1);border-top-color:#00FFFF;border-radius:50%;animation:spin 0.8s linear infinite;"></div><p style="color:#94a3b8;margin-top:12px;">Cargando ficha...</p></div></div>';
        document.body.appendChild(loadingOverlay);

        var groupId = this.currentGroupId;
        var token = localStorage.getItem('auth_token') || localStorage.getItem('authToken') || '';
        var headers = { 'Authorization': 'Bearer ' + token };
        var apiBase = window.API_BASE_URL || 'https://latanda.online';

        try {
            // Fetch 3 endpoints in parallel
            var [paymentRes, balanceRes, historyRes, creditRes, loansRes] = await Promise.all([
                fetch(apiBase + '/api/groups/' + encodeURIComponent(groupId) + '/members/payment-status', { headers: headers }).then(function(r) { return r.json(); }).catch(function() { return { success: false }; }),
                fetch(apiBase + '/api/groups/' + encodeURIComponent(groupId) + '/tanda-balances', { headers: headers }).then(function(r) { return r.json(); }).catch(function() { return { success: false }; }),
                fetch(apiBase + '/api/groups/' + encodeURIComponent(groupId) + '/contribution-history?view=timeline&user_id=' + encodeURIComponent(memberId), { headers: headers }).then(function(r) { return r.json(); }).catch(function() { return { success: false }; }),
                fetch(apiBase + '/api/users/' + encodeURIComponent(memberId) + '/credit-score', { headers: headers }).then(function(r) { return r.json(); }).catch(function() { return { success: false }; }),
                fetch(apiBase + '/api/groups/' + encodeURIComponent(groupId) + '/loans', { headers: headers }).then(function(r) { return r.json(); }).catch(function() { return { success: false }; })
            ]);

            // Find this member in the activeMembers array
            var memberInfo = this.activeMembers.find(function(m) { return m.user_id === memberId; }) || {};

            // Find member in payment status
            var paymentData = null;
            if (paymentRes.success && paymentRes.data) {
                var members = paymentRes.data.members || paymentRes.data || [];
                paymentData = members.find(function(m) { return m.user_id === memberId; });
            }

            // Find member in tanda balances
            var balanceData = null;
            if (balanceRes.success && balanceRes.data) {
                var balances = balanceRes.data.members || balanceRes.data.balances || balanceRes.data || [];
                balanceData = balances.find(function(b) { return b.user_id === memberId; });
            }

            // Contribution history
            var historyData = null;
            if (historyRes.success && historyRes.data) {
                historyData = historyRes.data;
            }

            // Credit score
            var creditData = null;
            if (creditRes.success && creditRes.data) {
                creditData = creditRes.data;
            }

            // Loans (filter to this member)
            var memberLoans = [];
            if (loansRes.success && loansRes.data && loansRes.data.loans) {
                memberLoans = loansRes.data.loans.filter(function(l) { return l.user_id === memberId; });
            }

            // Find group info
            var groupData = (window.currentGroupsData || []).find(function(g) { return g.id === groupId; }) || {};

            this.renderMemberSheet(memberInfo, paymentData, balanceData, historyData, groupData, creditData, memberLoans);

            // Fetch coordinator notes
            try {
                var notesRes = await fetch(apiBase + '/api/groups/' + encodeURIComponent(groupId) + '/members/' + encodeURIComponent(memberId) + '/notes', { headers: headers });
                var notesData = await notesRes.json();
                if (notesData.success && notesData.data && notesData.data.notes) {
                    var notesInput = document.getElementById('fichaNotesInput');
                    if (notesInput) notesInput.value = notesData.data.notes;
                }
            } catch (notesErr) {
                // Non-critical, ignore
            }

            // Store current member data for WhatsApp share
            this._fichaData = { member: memberInfo, payment: paymentData, balance: balanceData, group: groupData, credit: creditData, loans: memberLoans };
        } catch (err) {
            console.error('[FICHA] Error loading member sheet:', err);
            var overlay = document.getElementById('mmFichaOverlay');
            if (overlay) overlay.remove();
            if (typeof showNotification === 'function') showNotification('Error al cargar ficha del miembro', 'error');
        }
    }

    renderMemberSheet(member, payment, balance, history, group, credit, memberLoans) {
        var overlay = document.getElementById('mmFichaOverlay');
        if (!overlay) return;
        try {

        var esc = this.escapeHtml.bind(this);
        var name = esc(member.name || member.display_name || 'Miembro');
        var email = esc(member.email || '--');
        var phone = esc(member.phone || '--');
        var role = esc(member.role || 'member');
        var roleLabel = { creator: 'Creador', coordinator: 'Coordinador', member: 'Miembro' }[member.role] || 'Miembro';
        var joinedAt = (member.joined_at || member.created_at) ? new Date(member.joined_at || member.created_at).toLocaleDateString('es-HN', { year: 'numeric', month: 'long', day: 'numeric' }) : '--';
        var numPos = parseInt(member.num_positions) || 1;
        var groupName = esc(group.name || 'Grupo');
        var contribution = parseFloat(group.contribution_amount || 0);
        var freqMap = { weekly: 'Semanal', biweekly: 'Quincenal', monthly: 'Mensual' };
        var frequency = freqMap[group.frequency] || group.frequency || '--';
        var now = new Date().toLocaleDateString('es-HN', { year: 'numeric', month: 'long', day: 'numeric' });
        var initial = (member.name || 'M').charAt(0).toUpperCase();

        // Payment section
        var cyclesPaid = payment ? (parseInt(payment.cycles_paid) || 0) : '--';
        var cyclesPending = payment ? (parseInt(payment.cycles_pending) || 0) : 0;
        var amountPending = payment ? (parseFloat(payment.amount_pending) || 0) : 0;
        var paymentStatus = payment ? payment.payment_status : '--';
        var statusMap = { up_to_date: 'Al dia', pending: 'Pendiente', late: 'Atrasado', grace: 'En gracia', suspended: 'Suspendido' };
        var statusLabel = statusMap[paymentStatus] || paymentStatus || '--';
        var statusClass = paymentStatus === 'up_to_date' ? 'ficha-status-green' : (paymentStatus === 'pending' || paymentStatus === 'grace' ? 'ficha-status-amber' : 'ficha-status-red');

        // Unpaid cycles
        var unpaidCycles = (payment && payment.unpaid_cycles && payment.unpaid_cycles.length > 0) ? payment.unpaid_cycles.map(function(c) { return 'C' + c; }).join(', ') : 'Ninguno';

        // Mora
        var moraCycles = (payment && payment.mora_cycles && payment.mora_cycles.length > 0) ? payment.mora_cycles.map(function(c) { return 'C' + c; }).join(', ') : 'Sin moras';
        var hasMora = payment && payment.mora_cycles && payment.mora_cycles.length > 0;

        // Active loan (handled by _buildFichaLoanSection)

        // Balance section
        var totalContributed = balance ? (parseFloat(balance.total_contributed) || 0) : 0;
        var totalReceived = balance ? (parseFloat(balance.total_received) || 0) : 0;
        var tandaBalance = balance ? (parseFloat(balance.tanda_balance) || 0) : 0;
        // T3: Semantic colors — positive = contributed more (cyan/neutral), zero = settled (green), negative = received more (amber)
        var balanceClass = tandaBalance === 0 ? 'green' : (tandaBalance > 0 ? 'cyan' : 'amber');

        // Contribution history
        var historyHtml = '';
        if (history && history.contributions && history.contributions.length > 0) {
            var rows = history.contributions.slice(0, 20).map(function(c) {
                var cStatus = c.status || '--';
                var cStatusLabel = { completed: 'Pagado', coordinator_approved: 'Aprobado', pending: 'Pendiente', rejected: 'Rechazado', refunded: 'Revertido', archived: 'Archivado' }[cStatus] || cStatus;
                var cStatusClass = (cStatus === 'completed' || cStatus === 'coordinator_approved' || cStatus === 'archived') ? 'green' : (cStatus === 'pending' ? 'amber' : 'red');
                var cDate = (c.paid_date || c.created_at) ? new Date(c.paid_date || c.created_at).toLocaleDateString('es-HN') : '--';
                var cMethod = c.verification_method || c.payment_method || '--';
                var methodMap = { wallet: 'Wallet', cash: 'Efectivo', bank_transfer: 'Transferencia', coordinator_manual: 'Manual', coordinator_bulk: 'Registro masivo', tigo_money: 'Tigo Money', card: 'Tarjeta', crypto: 'Crypto', deposit: 'Deposito', distribution_retention: 'Retencion' };
                cMethod = methodMap[cMethod] || cMethod;
                var cAmount = parseFloat(c.amount) || 0;
                return '<tr>' +
                    '<td>C' + (parseInt(c.cycle_number) || '?') + '</td>' +
                    '<td>L. ' + cAmount.toLocaleString('es-HN') + '</td>' +
                    '<td class="ficha-td-' + cStatusClass + '">' + esc(cStatusLabel) + '</td>' +
                    '<td>' + esc(cMethod) + '</td>' +
                    '<td>' + esc(cDate) + '</td>' +
                '</tr>';
            }).join('');

            historyHtml =
                '<div class="ficha-section">' +
                    '<h3 class="ficha-section-title">&#x1F4C5; Historial de Contribuciones</h3>' +
                    '<table class="ficha-table">' +
                        '<thead><tr><th>Ciclo</th><th>Monto</th><th>Estado</th><th>Metodo</th><th>Fecha</th></tr></thead>' +
                        '<tbody>' + rows + '</tbody>' +
                    '</table>' +
                '</div>';
        } else {
            historyHtml =
                '<div class="ficha-section">' +
                    '<h3 class="ficha-section-title">&#x1F4C5; Historial de Contribuciones</h3>' +
                    '<p class="ficha-empty">Sin contribuciones registradas</p>' +
                '</div>';
        }

        // Summary removed — already shown in Estado de Pagos + Resumen Financiero
        var summaryHtml = '';

        // Avatar
        var avatarHtml = member.avatar_url
            ? '<img src="' + esc(member.avatar_url) + '" class="ficha-avatar-img">'
            : '<span class="ficha-avatar-initial">' + esc(initial) + '</span>';

        // Build full sheet
        overlay.innerHTML =
            '<div class="mm-ficha-modal">' +
                '<div class="mm-ficha-sheet" id="mmFichaSheet">' +
                    // Header (non-print controls)
                    '<div class="ficha-controls no-print">' +
                        '<button class="ficha-btn-back" data-action="mm-ficha-close"><i class="fas fa-arrow-left"></i> Volver</button>' +
                        '<div class="ficha-controls-right">' +
                            '<button class="ficha-btn-whatsapp" data-action="mm-ficha-whatsapp" data-member-id="' + esc(member.user_id || '') + '"><i class="fab fa-whatsapp"></i> Compartir</button>' +
                            '<button class="ficha-btn-pdf" data-action="mm-ficha-pdf"><i class="fas fa-file-pdf"></i> PDF</button>' +
                            '<button class="ficha-btn-print" data-action="mm-ficha-print"><i class="fas fa-print"></i> Imprimir</button>' +
                        '</div>' +
                    '</div>' +

                    // Print header
                    '<div class="ficha-header">' +
                        '<div class="ficha-header-left">' +
                            '<div class="ficha-avatar">' + avatarHtml + '</div>' +
                            '<div class="ficha-header-info">' +
                                '<h2 class="ficha-name">' + name + '</h2>' +
                                '<span class="ficha-role-badge ficha-role-' + esc(member.role || 'member') + '">' + esc(roleLabel) + '</span>' +
                                '<div class="ficha-contact">' + email + (phone !== '--' ? ' &middot; ' + phone : '') + '</div>' +
                            '</div>' +
                        '</div>' +
                        '<div class="ficha-header-right">' +
                            '<div class="ficha-group-name">' + groupName + '</div>' +
                            '<div class="ficha-group-meta">' + esc(frequency) + ' &middot; L. ' + contribution.toLocaleString('es-HN') + '/aporte</div>' +
                            '<div class="ficha-date">Generado: ' + esc(now) + '</div>' +
                        '</div>' +
                    '</div>' +

                    // Status banner
                    '<div class="ficha-status-banner ' + statusClass + '">' +
                        '<span class="ficha-status-label">Estado: ' + esc(statusLabel) + '</span>' +
                        (numPos > 1 ? '<span class="ficha-positions">' + numPos + ' posiciones</span>' : '') +
                        '<span class="ficha-joined">Miembro desde: ' + esc(joinedAt) + '</span>' +
                    '</div>' +

                    // Credit Score + Turn + Risk
                    this._buildFichaCreditSection(credit) +
                    this._buildFichaTurnSection(member, payment, group) +

                    // Resumen Financiero
                    '<div class="ficha-section">' +
                        '<h3 class="ficha-section-title">&#x1F4B0; Resumen Financiero</h3>' +
                        '<div class="ficha-grid">' +
                            '<div class="ficha-field"><span class="ficha-label">Total contribuido</span><span class="ficha-value green">L. ' + totalContributed.toLocaleString('es-HN') + '</span></div>' +
                            '<div class="ficha-field"><span class="ficha-label">Total recibido</span><span class="ficha-value cyan">L. ' + totalReceived.toLocaleString('es-HN') + '</span></div>' +
                            '<div class="ficha-field"><span class="ficha-label">' + (tandaBalance > 0 ? 'Contribuido sin cobrar' : (tandaBalance < 0 ? 'Cobrado de mas' : 'Balance tanda')) + '</span><span class="ficha-value ' + balanceClass + '">L. ' + Math.abs(tandaBalance).toLocaleString('es-HN') + '</span></div>' +
                            '<div class="ficha-field"><span class="ficha-label">Monto pendiente</span><span class="ficha-value ' + (amountPending > 0 ? 'red' : 'green') + '">L. ' + amountPending.toLocaleString('es-HN') + '</span></div>' +
                        '</div>' +
                    '</div>' +

                    // Estado de Pagos
                    '<div class="ficha-section">' +
                        '<h3 class="ficha-section-title">&#x1F4CA; Estado de Pagos</h3>' +
                        '<div class="ficha-grid">' +
                            '<div class="ficha-field"><span class="ficha-label">Ciclos pagados</span><span class="ficha-value green">' + cyclesPaid + '</span></div>' +
                            '<div class="ficha-field"><span class="ficha-label">Ciclos pendientes</span><span class="ficha-value ' + (cyclesPending > 0 ? 'amber' : 'green') + '">' + cyclesPending + '</span></div>' +
                            '<div class="ficha-field"><span class="ficha-label">Ciclos sin pago</span><span class="ficha-value">' + esc(unpaidCycles) + '</span></div>' +
                            '<div class="ficha-field"><span class="ficha-label">Moras</span><span class="ficha-value ' + (hasMora ? 'red' : 'green') + '">' + esc(moraCycles) + '</span></div>' +
                        '</div>' +
                    '</div>' +

                    // Prestamo + Loan History (enriched)
                    this._buildFichaLoanSection(payment, memberLoans) +

                    // Risk indicators
                    this._buildFichaRiskSection(payment, credit, group) +

                    // Historial summary + table
                    summaryHtml +
                    historyHtml +

                    // Coordinator notes
                    '<div class="ficha-section ficha-notes-section no-print">' +
                        '<h3 class="ficha-section-title">&#x1F4DD; Notas del Coordinador</h3>' +
                        '<textarea class="ficha-notes-input" id="fichaNotesInput" placeholder="Notas privadas sobre este miembro..." maxlength="1000" rows="3"></textarea>' +
                        '<div class="ficha-notes-actions">' +
                            '<span class="ficha-notes-status" id="fichaNotesStatus"></span>' +
                            '<button class="ficha-notes-save" data-action="mm-ficha-save-notes" data-member-id="' + esc(member.user_id || '') + '">Guardar notas</button>' +
                        '</div>' +
                    '</div>' +

                    // Footer
                    '<div class="ficha-footer">' +
                        '<span>La Tanda &middot; Ficha del Miembro &middot; ' + esc(now) + '</span>' +
                    '</div>' +
                '</div>' +
            '</div>';

        // Close handlers
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) overlay.remove();
        });
        } catch (renderErr) {
            console.error('[FICHA] Render error:', renderErr);
            overlay.innerHTML = '<div class="mm-ficha-modal" style="padding:40px;text-align:center;"><p style="color:#ef4444;margin-bottom:16px;">Error al renderizar ficha</p><p style="color:#64748b;font-size:0.8rem;">' + (renderErr.message || '') + '</p><button data-action="mm-ficha-close" style="margin-top:16px;padding:8px 20px;background:#334155;border:none;color:#e2e8f0;border-radius:8px;cursor:pointer;">Cerrar</button></div>';
        }
    }

    _buildFichaCreditSection(credit) {
        if (!credit || !credit.score) return '';
        var score = parseInt(credit.score) || 0;
        var category = credit.category || 'sin_datos';
        var catMap = { excelente: 'Excelente', bueno: 'Bueno', regular: 'Regular', riesgo: 'Riesgo', sin_datos: 'Sin datos' };
        var catLabel = catMap[category] || category;
        var colorMap = { excelente: '#22c55e', bueno: '#3b82f6', regular: '#f59e0b', riesgo: '#ef4444', sin_datos: '#64748b' };
        var color = colorMap[category] || '#64748b';
        var summary = credit.summary || {};
        var factors = credit.factors || {};

        var factorsHtml = '';
        if (factors.punctuality !== undefined) {
            factorsHtml =
                '<div class="ficha-credit-factors">' +
                    '<div class="ficha-credit-factor"><span>Puntualidad</span><div class="ficha-factor-bar"><div class="ficha-factor-fill" style="width:' + Math.min(100, (factors.punctuality || 0)) + '%;background:' + color + '"></div></div></div>' +
                    '<div class="ficha-credit-factor"><span>Moras</span><div class="ficha-factor-bar"><div class="ficha-factor-fill" style="width:' + Math.min(100, (factors.mora || 0)) + '%;background:' + color + '"></div></div></div>' +
                    '<div class="ficha-credit-factor"><span>Antiguedad</span><div class="ficha-factor-bar"><div class="ficha-factor-fill" style="width:' + Math.min(100, (factors.seniority || 0)) + '%;background:' + color + '"></div></div></div>' +
                '</div>';
        }

        return '<div class="ficha-section">' +
            '<h3 class="ficha-section-title">&#x1F6E1; Score Crediticio</h3>' +
            '<div class="ficha-credit-row">' +
                '<div class="ficha-credit-shield" style="border-color:' + color + '">' +
                    '<span class="ficha-credit-score" style="color:' + color + '">' + score + '</span>' +
                    '<span class="ficha-credit-cat" style="color:' + color + '">' + catLabel + '</span>' +
                '</div>' +
                '<div class="ficha-credit-stats">' +
                    '<div class="ficha-field"><span class="ficha-label">Moras totales</span><span class="ficha-value">' + (summary.total_moras || 0) + '</span></div>' +
                    '<div class="ficha-field"><span class="ficha-label">Grupos activos</span><span class="ficha-value">' + (summary.active_groups || 0) + '</span></div>' +
                    '<div class="ficha-field"><span class="ficha-label">Grupos completados</span><span class="ficha-value green">' + (summary.completed_groups || 0) + '</span></div>' +
                '</div>' +
            '</div>' +
            factorsHtml +
        '</div>';
    }

    _buildFichaTurnSection(member, payment, group) {
        var turnPos = payment ? payment.turn_position : (member.turn_position || null);
        var allPositions = (payment && payment.all_turn_positions && payment.all_turn_positions.length > 0) ? payment.all_turn_positions : (turnPos ? [turnPos] : []);
        var numPos = parseInt(member.num_positions || payment && payment.num_positions) || 1;
        var currentTurn = parseInt(group.current_turn) || 0;
        var totalSlots = allPositions.length > 0 ? Math.max.apply(null, allPositions.concat([parseInt(group.max_members || group.total_participants) || 0])) : (parseInt(group.max_members || group.total_participants) || 0);
        var hasReceived = payment ? payment.has_received : false;

        if (allPositions.length === 0 && !turnPos && turnPos !== 0) return '';

        // T2-1: Show all turn positions for multi-position members
        var posLabels = allPositions.map(function(p) { return '#' + p; }).join(', ');
        var circleLabel = allPositions.length > 1 ? allPositions.map(function(p) { return '#' + p; }).join(', ') : '#' + (turnPos || allPositions[0] || '?');

        // Find closest upcoming turn
        var nextTurn = null;
        allPositions.forEach(function(p) { if (p > currentTurn && (nextTurn === null || p < nextTurn)) nextTurn = p; });
        var turnsAway = nextTurn ? nextTurn - currentTurn : 0;

        var turnStatus = '';
        var isCurrentTurn = allPositions.indexOf(currentTurn) !== -1;
        if (hasReceived && !nextTurn) {
            turnStatus = '<span class="ficha-turn-badge ficha-turn-done">Ya cobro todos</span>';
        } else if (isCurrentTurn) {
            turnStatus = '<span class="ficha-turn-badge ficha-turn-now">Le toca ahora (#' + currentTurn + ')</span>';
        } else if (turnsAway > 0 && turnsAway <= 3) {
            turnStatus = '<span class="ficha-turn-badge ficha-turn-soon">Proximo en ' + turnsAway + ' turno' + (turnsAway > 1 ? 's' : '') + '</span>';
        }

        var posText = numPos > 1 ? ' (' + numPos + ' posiciones)' : '';

        return '<div class="ficha-section">' +
            '<h3 class="ficha-section-title">&#x1F504; Posicion en la Tanda</h3>' +
            '<div class="ficha-turn-row">' +
                '<div class="ficha-turn-circle">' + (allPositions.length > 1 ? numPos + 'x' : '#' + (turnPos || allPositions[0] || '?')) + '</div>' +
                '<div class="ficha-turn-info">' +
                    '<div class="ficha-turn-label">Turno' + (allPositions.length > 1 ? 's ' : ' ') + posLabels + ' de ' + (totalSlots || '?') + posText + '</div>' +
                    '<div class="ficha-turn-detail">Turno actual: ' + (currentTurn > 0 ? '#' + currentTurn : 'Aun no inicia') + '</div>' +
                    turnStatus +
                '</div>' +
            '</div>' +
        '</div>';
    }

    _buildFichaLoanSection(payment, memberLoans) {
        var hasLoan = payment && payment.active_loan && payment.active_loan.principal > 0;
        if (!hasLoan && (!memberLoans || memberLoans.length === 0)) return '';

        var html = '<div class="ficha-section"><h3 class="ficha-section-title">&#x1F4B3; Prestamos</h3>';

        // Active loan summary
        if (hasLoan) {
            var loan = payment.active_loan;
            var principal = parseFloat(loan.principal) || 0;
            var totalOwed = parseFloat(loan.total_owed) || 0;
            var paid = parseFloat(loan.paid_amount) || 0;
            var progress = totalOwed > 0 ? Math.min(100, Math.round((paid / totalOwed) * 100)) : 0;
            var sourceCycles = (loan.source_cycles && loan.source_cycles.length > 0) ? loan.source_cycles.map(function(c) { return 'C' + c; }).join(', ') : '--';

            html +=
                '<div class="ficha-grid">' +
                    '<div class="ficha-field"><span class="ficha-label">Principal</span><span class="ficha-value red">L. ' + principal.toLocaleString('es-HN') + '</span></div>' +
                    '<div class="ficha-field"><span class="ficha-label">Total adeudado</span><span class="ficha-value red">L. ' + totalOwed.toLocaleString('es-HN') + '</span></div>' +
                    '<div class="ficha-field"><span class="ficha-label">Abonado</span><span class="ficha-value green">L. ' + paid.toLocaleString('es-HN') + '</span></div>' +
                    '<div class="ficha-field"><span class="ficha-label">Origen</span><span class="ficha-value">' + sourceCycles + '</span></div>' +
                '</div>' +
                '<div class="ficha-loan-bar"><div class="ficha-loan-fill" style="width:' + progress + '%"></div></div>' +
                '<div style="text-align:right;font-size:0.75rem;color:#94a3b8;margin-top:4px;">' + progress + '% pagado</div>';
        }

        // Loan payment history from enriched data
        if (memberLoans && memberLoans.length > 0) {
            var activeLoan = memberLoans.find(function(l) { return l.status === 'active' || l.status === 'paying'; });
            var resolvedLoans = memberLoans.filter(function(l) { return l.status !== 'active' && l.status !== 'paying'; });

            // Show payment history for active loan
            if (activeLoan && activeLoan.payments && activeLoan.payments.length > 0) {
                var payRows = activeLoan.payments.slice(0, 10).map(function(p) {
                    var pDate = p.paid_at ? new Date(p.paid_at).toLocaleDateString('es-HN') : '--';
                    var methodMap = { cash: 'Efectivo', wallet: 'Wallet', bank_transfer: 'Transferencia', tigo_money: 'Tigo Money', card: 'Tarjeta', distribution_retention: 'Retencion', crypto: 'Crypto', deposit: 'Deposito' };
                    var pMethod = methodMap[p.payment_method] || p.payment_method || '--';
                    return '<tr><td>L. ' + (parseFloat(p.amount) || 0).toLocaleString('es-HN') + '</td><td>' + pMethod + '</td><td>' + pDate + '</td></tr>';
                }).join('');

                html +=
                    '<h4 class="ficha-subsection-title">Abonos realizados</h4>' +
                    '<table class="ficha-table ficha-table-compact">' +
                        '<thead><tr><th>Monto</th><th>Metodo</th><th>Fecha</th></tr></thead>' +
                        '<tbody>' + payRows + '</tbody>' +
                    '</table>';
            }

            // Show resolved loans summary
            if (resolvedLoans.length > 0) {
                var resolvedHtml = resolvedLoans.map(function(l) {
                    var statusMap = { resolved: 'Pagado', written_off: 'Condonado', cancelled: 'Cancelado' };
                    var sLabel = statusMap[l.status] || l.status;
                    var sClass = l.status === 'resolved' ? 'green' : (l.status === 'written_off' ? 'amber' : 'red');
                    return '<div class="ficha-resolved-loan"><span class="ficha-label">L. ' + (parseFloat(l.principal) || 0).toLocaleString('es-HN') + '</span><span class="ficha-value ' + sClass + '">' + sLabel + '</span></div>';
                }).join('');

                html += '<h4 class="ficha-subsection-title">Historial de prestamos</h4>' + resolvedHtml;
            }
        }

        html += '</div>';
        return html;
    }

    _buildFichaRiskSection(payment, credit, group) {
        var indicators = [];
        var moraCycles = (payment && payment.mora_cycles) || [];
        var maxMoraCycles = parseInt(group.max_mora_cycles) || 4;
        var score = credit ? (parseInt(credit.score) || 0) : 0;
        var hasLoan = payment && payment.active_loan && payment.active_loan.principal > 0;
        var paymentStatus = payment ? payment.payment_status : '';

        // Consecutive moras
        if (moraCycles.length > 0) {
            var pct = Math.round((moraCycles.length / maxMoraCycles) * 100);
            var moraSeverity = moraCycles.length >= maxMoraCycles ? 'danger' : (moraCycles.length >= maxMoraCycles - 1 ? 'warning' : 'info');
            indicators.push({
                icon: 'fa-exclamation-triangle',
                label: 'Moras consecutivas',
                value: moraCycles.length + ' de ' + maxMoraCycles + ' (auto-suspension)',
                severity: moraSeverity,
                pct: Math.min(100, pct)
            });
        }

        // Credit risk
        if (score > 0 && score < 550) {
            indicators.push({
                icon: 'fa-shield-alt',
                label: 'Score crediticio bajo',
                value: score + ' — Categoria: Riesgo',
                severity: 'danger',
                pct: Math.round((score / 850) * 100)
            });
        } else if (score >= 550 && score < 650) {
            indicators.push({
                icon: 'fa-shield-alt',
                label: 'Score crediticio regular',
                value: score + ' — Puede mejorar',
                severity: 'warning',
                pct: Math.round((score / 850) * 100)
            });
        }

        // Active debt
        if (hasLoan) {
            var totalOwed = parseFloat(payment.active_loan.total_owed) || 0;
            indicators.push({
                icon: 'fa-money-bill-wave',
                label: 'Deuda activa',
                value: 'L. ' + totalOwed.toLocaleString('es-HN') + ' pendiente',
                severity: 'warning',
                pct: 100
            });
        }

        // Suspended
        if (paymentStatus === 'suspended') {
            indicators.push({
                icon: 'fa-ban',
                label: 'Miembro suspendido',
                value: 'No puede participar hasta resolver deuda',
                severity: 'danger',
                pct: 100
            });
        }

        // Late
        if (paymentStatus === 'late') {
            indicators.push({
                icon: 'fa-clock',
                label: 'Pago atrasado',
                value: 'Fuera de periodo de gracia',
                severity: 'danger',
                pct: 100
            });
        }

        if (indicators.length === 0) return '';

        var html = '<div class="ficha-section"><h3 class="ficha-section-title">&#x26A0; Indicadores de Riesgo</h3>';
        indicators.forEach(function(ind) {
            html +=
                '<div class="ficha-risk-item ficha-risk-' + ind.severity + '">' +
                    '<div class="ficha-risk-icon"><i class="fas ' + ind.icon + '"></i></div>' +
                    '<div class="ficha-risk-body">' +
                        '<div class="ficha-risk-label">' + ind.label + '</div>' +
                        '<div class="ficha-risk-value">' + ind.value + '</div>' +
                        '<div class="ficha-risk-bar"><div class="ficha-risk-fill" style="width:' + ind.pct + '%"></div></div>' +
                    '</div>' +
                '</div>';
        });
        html += '</div>';
        return html;
    }

    shareFichaWhatsApp(memberId) {
        var d = this._fichaData;
        if (!d) return;

        var name = (d.member && d.member.name) || 'Miembro';
        var groupName = (d.group && d.group.name) || 'Grupo';
        var contributed = d.balance ? (parseFloat(d.balance.total_contributed) || 0) : 0;
        var received = d.balance ? (parseFloat(d.balance.total_received) || 0) : 0;
        var balance = d.balance ? (parseFloat(d.balance.tanda_balance) || 0) : 0;
        var cyclesPaid = d.payment ? (parseInt(d.payment.cycles_paid) || 0) : 0;
        var cyclesPending = d.payment ? (parseInt(d.payment.cycles_pending) || 0) : 0;
        var amountPending = d.payment ? (parseFloat(d.payment.amount_pending) || 0) : 0;
        var creditLine = d.credit && d.credit.score ? ' (Score: ' + d.credit.score + ')' : '';
        var statusMap = { up_to_date: 'Al dia', pending: 'Pendiente', late: 'Atrasado', grace: 'En gracia', suspended: 'Suspendido' };
        var status = d.payment ? (statusMap[d.payment.payment_status] || d.payment.payment_status || '--') : '--';

        var text = '*Ficha del Miembro - La Tanda*\n\n' +
            '*' + name + '* | ' + groupName + creditLine + '\n' +
            '---\n' +
            'Estado: ' + status + '\n' +
            'Ciclos pagados: ' + cyclesPaid + '\n' +
            'Ciclos pendientes: ' + cyclesPending + '\n' +
            'Monto pendiente: L. ' + amountPending.toLocaleString('es-HN') + '\n' +
            '---\n' +
            'Total contribuido: L. ' + contributed.toLocaleString('es-HN') + '\n' +
            'Total recibido: L. ' + received.toLocaleString('es-HN') + '\n' +
            'Balance: L. ' + balance.toLocaleString('es-HN') + '\n';

        if (d.payment && d.payment.active_loan && d.payment.active_loan.principal > 0) {
            var loan = d.payment.active_loan;
            text += '---\n' +
                'Prestamo activo: L. ' + (parseFloat(loan.total_owed) || 0).toLocaleString('es-HN') + '\n' +
                'Abonado: L. ' + (parseFloat(loan.paid_amount) || 0).toLocaleString('es-HN') + '\n';
        }

        text += '\n_Generado desde La Tanda_';

        var waUrl = 'https://wa.me/?text=' + encodeURIComponent(text);
        window.open(waUrl, '_blank');
    }

    downloadFichaPDF() {
        // Use the print window approach but trigger save-as-PDF
        var sheet = document.getElementById('mmFichaSheet');
        if (!sheet) return;

        var pdfWindow = window.open('', '_blank', 'width=800,height=600');
        if (!pdfWindow) {
            if (typeof showNotification === 'function') showNotification('Permite ventanas emergentes para descargar PDF', 'error');
            return;
        }

        pdfWindow.document.write('<!DOCTYPE html><html><head><meta charset="utf-8"><title>Ficha del Miembro - La Tanda</title>');
        pdfWindow.document.write('<style>');
        pdfWindow.document.write('* { margin: 0; padding: 0; box-sizing: border-box; }');
        pdfWindow.document.write('body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; padding: 24px; font-size: 12px; }');
        pdfWindow.document.write('.no-print { display: none !important; }');
        pdfWindow.document.write('.ficha-header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; border-bottom: 2px solid #0f172a; margin-bottom: 16px; }');
        pdfWindow.document.write('.ficha-header-left { display: flex; align-items: center; gap: 12px; }');
        pdfWindow.document.write('.ficha-avatar { width: 48px; height: 48px; border-radius: 50%; background: #e2e8f0; display: flex; align-items: center; justify-content: center; overflow: hidden; }');
        pdfWindow.document.write('.ficha-avatar-img { width: 100%; height: 100%; object-fit: cover; }');
        pdfWindow.document.write('.ficha-avatar-initial { font-size: 1.2rem; font-weight: 700; color: #475569; }');
        pdfWindow.document.write('.ficha-name { font-size: 1.3rem; font-weight: 700; margin-bottom: 2px; }');
        pdfWindow.document.write('.ficha-role-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 600; background: #e2e8f0; color: #475569; margin-right: 8px; }');
        pdfWindow.document.write('.ficha-role-creator, .ficha-role-coordinator { background: #0891b2; color: white; }');
        pdfWindow.document.write('.ficha-contact { font-size: 0.8rem; color: #64748b; margin-top: 4px; }');
        pdfWindow.document.write('.ficha-header-right { text-align: right; }');
        pdfWindow.document.write('.ficha-group-name { font-size: 1rem; font-weight: 700; }');
        pdfWindow.document.write('.ficha-group-meta { font-size: 0.8rem; color: #64748b; }');
        pdfWindow.document.write('.ficha-date { font-size: 0.7rem; color: #94a3b8; margin-top: 4px; }');
        pdfWindow.document.write('.ficha-status-banner { display: flex; align-items: center; gap: 16px; padding: 8px 12px; border-radius: 6px; margin-bottom: 16px; background: #f1f5f9; font-size: 0.8rem; }');
        pdfWindow.document.write('.ficha-status-banner.ficha-status-green { border-left: 4px solid #22c55e; }');
        pdfWindow.document.write('.ficha-status-banner.ficha-status-amber { border-left: 4px solid #f59e0b; }');
        pdfWindow.document.write('.ficha-status-banner.ficha-status-red { border-left: 4px solid #ef4444; }');
        pdfWindow.document.write('.ficha-status-label { font-weight: 700; }');
        pdfWindow.document.write('.ficha-positions { background: #dbeafe; padding: 2px 6px; border-radius: 4px; font-weight: 600; }');
        pdfWindow.document.write('.ficha-joined { color: #64748b; }');
        pdfWindow.document.write('.ficha-section { margin-bottom: 16px; page-break-inside: avoid; }');
        pdfWindow.document.write('.ficha-section-title { font-size: 0.9rem; font-weight: 700; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #e2e8f0; }');
        pdfWindow.document.write('.ficha-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }');
        pdfWindow.document.write('.ficha-field { display: flex; justify-content: space-between; padding: 6px 10px; background: #f8fafc; border-radius: 4px; }');
        pdfWindow.document.write('.ficha-label { font-size: 0.78rem; color: #64748b; }');
        pdfWindow.document.write('.ficha-value { font-size: 0.85rem; font-weight: 600; }');
        pdfWindow.document.write('.ficha-value.green { color: #16a34a; }');
        pdfWindow.document.write('.ficha-value.red { color: #dc2626; }');
        pdfWindow.document.write('.ficha-value.amber { color: #d97706; }');
        pdfWindow.document.write('.ficha-value.cyan { color: #0891b2; }');
        pdfWindow.document.write('.ficha-loan-bar { height: 8px; background: #fee2e2; border-radius: 4px; margin-top: 8px; }');
        pdfWindow.document.write('.ficha-loan-fill { height: 100%; background: #22c55e; border-radius: 4px; }');
        pdfWindow.document.write('.ficha-table { width: 100%; border-collapse: collapse; font-size: 0.78rem; }');
        pdfWindow.document.write('.ficha-table th { text-align: left; padding: 6px 8px; background: #f1f5f9; border-bottom: 2px solid #e2e8f0; font-weight: 600; }');
        pdfWindow.document.write('.ficha-table td { padding: 5px 8px; border-bottom: 1px solid #f1f5f9; }');
        pdfWindow.document.write('.ficha-td-green { color: #16a34a; font-weight: 600; }');
        pdfWindow.document.write('.ficha-td-amber { color: #d97706; font-weight: 600; }');
        pdfWindow.document.write('.ficha-td-red { color: #dc2626; font-weight: 600; }');
        pdfWindow.document.write('.ficha-empty { color: #94a3b8; font-style: italic; padding: 8px; }');
        pdfWindow.document.write('.ficha-footer { margin-top: 20px; padding-top: 12px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 0.7rem; color: #94a3b8; }');
        pdfWindow.document.write('.ficha-pdf-hint { text-align: center; padding: 16px; color: #64748b; font-size: 0.85rem; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; margin-bottom: 16px; }');
        pdfWindow.document.write('</style></head><body>');
        pdfWindow.document.write('<div class="ficha-pdf-hint">Para guardar como PDF: en el dialogo de impresion, selecciona <strong>"Guardar como PDF"</strong> como destino.</div>');
        pdfWindow.document.write(sheet.innerHTML);
        pdfWindow.document.write('</body></html>');
        pdfWindow.document.close();

        setTimeout(function() {
            pdfWindow.print();
        }, 300);
    }

    async saveFichaNote(memberId) {
        var input = document.getElementById('fichaNotesInput');
        var status = document.getElementById('fichaNotesStatus');
        if (!input) return;

        var notesText = input.value.trim();
        var groupId = this.currentGroupId;
        var token = localStorage.getItem('auth_token') || localStorage.getItem('authToken') || '';
        var apiBase = window.API_BASE_URL || 'https://latanda.online';

        if (status) { status.textContent = 'Guardando...'; status.className = 'ficha-notes-status'; }

        try {
            var response = await fetch(apiBase + '/api/groups/' + encodeURIComponent(groupId) + '/members/' + encodeURIComponent(memberId) + '/notes', {
                method: 'PUT',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ notes: notesText || null })
            });

            var data = await response.json();
            if (data.success) {
                if (status) { status.textContent = 'Guardado'; status.className = 'ficha-notes-status ficha-notes-saved'; }
            } else {
                var errMsg = (data.data && data.data.error && data.data.error.message) || 'Error al guardar';
                if (status) { status.textContent = errMsg; status.className = 'ficha-notes-status ficha-notes-error'; }
            }
        } catch (err) {
            if (status) { status.textContent = 'Error de conexion'; status.className = 'ficha-notes-status ficha-notes-error'; }
        }

        setTimeout(function() {
            if (status) { status.textContent = ''; status.className = 'ficha-notes-status'; }
        }, 3000);
    }

    printMemberSheet() {
        var sheet = document.getElementById('mmFichaSheet');
        if (!sheet) return;

        var printWindow = window.open('', '_blank', 'width=800,height=600');
        if (!printWindow) {
            if (typeof showNotification === 'function') showNotification('Permite ventanas emergentes para imprimir', 'error');
            return;
        }

        printWindow.document.write('<!DOCTYPE html><html><head><meta charset="utf-8"><title>Ficha del Miembro - La Tanda</title>');
        printWindow.document.write('<style>');
        printWindow.document.write('* { margin: 0; padding: 0; box-sizing: border-box; }');
        printWindow.document.write('body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; padding: 20px; font-size: 12px; }');
        printWindow.document.write('.no-print { display: none !important; }');
        printWindow.document.write('.ficha-header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; border-bottom: 2px solid #0f172a; margin-bottom: 16px; }');
        printWindow.document.write('.ficha-header-left { display: flex; align-items: center; gap: 12px; }');
        printWindow.document.write('.ficha-avatar { width: 48px; height: 48px; border-radius: 50%; background: #e2e8f0; display: flex; align-items: center; justify-content: center; overflow: hidden; }');
        printWindow.document.write('.ficha-avatar-img { width: 100%; height: 100%; object-fit: cover; }');
        printWindow.document.write('.ficha-avatar-initial { font-size: 1.2rem; font-weight: 700; color: #475569; }');
        printWindow.document.write('.ficha-name { font-size: 1.3rem; font-weight: 700; margin-bottom: 2px; }');
        printWindow.document.write('.ficha-role-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 600; background: #e2e8f0; color: #475569; margin-right: 8px; }');
        printWindow.document.write('.ficha-role-creator, .ficha-role-coordinator { background: #0891b2; color: white; }');
        printWindow.document.write('.ficha-contact { font-size: 0.8rem; color: #64748b; margin-top: 4px; }');
        printWindow.document.write('.ficha-header-right { text-align: right; }');
        printWindow.document.write('.ficha-group-name { font-size: 1rem; font-weight: 700; }');
        printWindow.document.write('.ficha-group-meta { font-size: 0.8rem; color: #64748b; }');
        printWindow.document.write('.ficha-date { font-size: 0.7rem; color: #94a3b8; margin-top: 4px; }');
        printWindow.document.write('.ficha-status-banner { display: flex; align-items: center; gap: 16px; padding: 8px 12px; border-radius: 6px; margin-bottom: 16px; background: #f1f5f9; font-size: 0.8rem; }');
        printWindow.document.write('.ficha-status-banner.ficha-status-green { border-left: 4px solid #22c55e; }');
        printWindow.document.write('.ficha-status-banner.ficha-status-amber { border-left: 4px solid #f59e0b; }');
        printWindow.document.write('.ficha-status-banner.ficha-status-red { border-left: 4px solid #ef4444; }');
        printWindow.document.write('.ficha-status-label { font-weight: 700; }');
        printWindow.document.write('.ficha-positions { background: #dbeafe; padding: 2px 6px; border-radius: 4px; font-weight: 600; }');
        printWindow.document.write('.ficha-joined { color: #64748b; }');
        printWindow.document.write('.ficha-section { margin-bottom: 16px; page-break-inside: avoid; }');
        printWindow.document.write('.ficha-section-title { font-size: 0.9rem; font-weight: 700; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #e2e8f0; }');
        printWindow.document.write('.ficha-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }');
        printWindow.document.write('.ficha-field { display: flex; justify-content: space-between; padding: 6px 10px; background: #f8fafc; border-radius: 4px; }');
        printWindow.document.write('.ficha-label { font-size: 0.78rem; color: #64748b; }');
        printWindow.document.write('.ficha-value { font-size: 0.85rem; font-weight: 600; }');
        printWindow.document.write('.ficha-value.green { color: #16a34a; }');
        printWindow.document.write('.ficha-value.red { color: #dc2626; }');
        printWindow.document.write('.ficha-value.amber { color: #d97706; }');
        printWindow.document.write('.ficha-value.cyan { color: #0891b2; }');
        printWindow.document.write('.ficha-loan-bar { height: 8px; background: #fee2e2; border-radius: 4px; margin-top: 8px; }');
        printWindow.document.write('.ficha-loan-fill { height: 100%; background: #22c55e; border-radius: 4px; }');
        printWindow.document.write('.ficha-table { width: 100%; border-collapse: collapse; font-size: 0.78rem; }');
        printWindow.document.write('.ficha-table th { text-align: left; padding: 6px 8px; background: #f1f5f9; border-bottom: 2px solid #e2e8f0; font-weight: 600; }');
        printWindow.document.write('.ficha-table td { padding: 5px 8px; border-bottom: 1px solid #f1f5f9; }');
        printWindow.document.write('.ficha-td-green { color: #16a34a; font-weight: 600; }');
        printWindow.document.write('.ficha-td-amber { color: #d97706; font-weight: 600; }');
        printWindow.document.write('.ficha-td-red { color: #dc2626; font-weight: 600; }');
        printWindow.document.write('.ficha-empty { color: #94a3b8; font-style: italic; padding: 8px; }');
        printWindow.document.write('.ficha-footer { margin-top: 20px; padding-top: 12px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 0.7rem; color: #94a3b8; }');
        printWindow.document.write('@media print { body { padding: 10px; } }');
        printWindow.document.write('</style></head><body>');
        printWindow.document.write(sheet.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();

        setTimeout(function() {
            printWindow.print();
        }, 300);
    }

    showConfirmDialog(title, message, showReason, onConfirm) {
        const dialog = document.createElement('div');
        dialog.className = 'confirm-dialog';
        dialog.innerHTML = `
            <div class="confirm-dialog-content">
                <h3>${_mmEscapeHtml(title)}</h3>
                <p>${_mmEscapeHtml(message)}</p>
                ${showReason ? '<textarea id="confirmReason" placeholder="Razon (opcional)..."></textarea>' : ''}
                <div class="confirm-dialog-actions">
                    <button class="btn-cancel" data-action="mm-confirm-cancel">Cancelar</button>
                    <button class="btn-reject" data-action="mm-confirm-ok">Confirmar</button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        dialog.querySelector('[data-action="mm-confirm-ok"]').addEventListener('click', () => {
            const reason = showReason ? dialog.querySelector('#confirmReason').value : '';
            dialog.remove();
            onConfirm(reason);
        });

        dialog.querySelector('[data-action="mm-confirm-cancel"]').addEventListener('click', () => {
            dialog.remove();
        });

        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) dialog.remove();
        });
    }
}

// Initialize global instance
window.memberManagement = new MemberManagement();

// Function to open member management (called from group card)
function openMemberManagement(groupId, groupName) {
    window.memberManagement.openModal(groupId, groupName).catch(function(err) {
        // Prevent unhandled rejection from triggering global-error-handler logout
    });
}

// Safe wrapper to handle special characters in group names
function openMemberManagementSafe(button) {
    const groupId = button.getAttribute('data-group-id');
    const groupName = button.getAttribute('data-group-name') || 'Grupo';
    openMemberManagement(groupId, groupName);
}

// ============================================
// DELEGATED CLICK HANDLER
// ============================================
document.addEventListener('click', function(e) {
    var target = e.target.closest('[data-action]');
    if (!target) return;

    var action = target.getAttribute('data-action');
    if (!action || !action.startsWith('mm-')) return;

    var memberId, memberName;

    switch (action) {
        case 'mm-close':
            window.memberManagement.closeModal();
            break;

        case 'mm-switch-tab':
            var tab = target.getAttribute('data-tab');
            if (tab) window.memberManagement.switchTab(tab);
            break;

        case 'mm-approve':
            memberId = target.getAttribute('data-member-id');
            if (memberId) window.memberManagement.handleApprove(memberId);
            break;

        case 'mm-reject':
            memberId = target.getAttribute('data-member-id');
            if (memberId) window.memberManagement.handleReject(memberId);
            break;

        case 'mm-remove':
            memberId = target.getAttribute('data-member-id');
            memberName = target.getAttribute('data-member-name') || 'este miembro';
            if (memberId) window.memberManagement.handleRemove(memberId, memberName);
            break;

        case 'mm-save-settings':
            window.memberManagement.saveSettings();
            break;

        case 'mm-ficha':
            memberId = target.getAttribute('data-member-id');
            memberName = target.getAttribute('data-member-name') || 'Miembro';
            if (memberId) window.memberManagement.openMemberSheet(memberId, memberName);
            break;

        case 'mm-ficha-close':
            var fichaOverlay = document.getElementById('mmFichaOverlay');
            if (fichaOverlay) fichaOverlay.remove();
            break;

        case 'mm-ficha-print':
            window.memberManagement.printMemberSheet();
            break;

        case 'mm-ficha-pdf':
            window.memberManagement.downloadFichaPDF();
            break;

        case 'mm-ficha-whatsapp':
            memberId = target.getAttribute('data-member-id');
            window.memberManagement.shareFichaWhatsApp(memberId);
            break;

        case 'mm-ficha-save-notes':
            memberId = target.getAttribute('data-member-id');
            if (memberId) window.memberManagement.saveFichaNote(memberId);
            break;

        case 'mm-confirm-cancel':
            // Handled by direct listener in showConfirmDialog
            break;

        case 'mm-confirm-ok':
            // Handled by direct listener in showConfirmDialog
            break;
    }
});

// Delegated change handler for role select
document.addEventListener('change', function(e) {
    var target = e.target.closest('[data-action="mm-role-change"]');
    if (!target) return;
    var memberId = target.getAttribute('data-member-id');
    var newRole = target.value;
    if (memberId && newRole) {
        window.memberManagement.handleRoleChange(memberId, newRole);
    }
});
