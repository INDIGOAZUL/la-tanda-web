/* ============================================
   🚩 CONTENT REPORT SYSTEM
   ============================================ */

(function() {
    'use strict';
    
    const REPORT_KEY = 'report_submitted_';
    const REASONS = [
        { value: 'spam', label: 'Spam', icon: '📢' },
        { value: 'harassment', label: 'Acoso', icon: '😠' },
        { value: 'inappropriate', label: 'Inapropiado', icon: '🚫' },
        { value: 'misinformation', label: 'Desinformación', icon: '❌' },
        { value: 'other', label: 'Otro', icon: '❓' }
    ];
    
    // Add report button to posts
    function addReportButtons() {
        // Add to feed posts
        const posts = document.querySelectorAll('.feed-post, .post, [class*="post-"]');
        posts.forEach(post => {
            if (post.querySelector('.report-btn')) return;
            
            const reportBtn = document.createElement('button');
            reportBtn.className = 'report-btn';
            reportBtn.innerHTML = '🚩';
            reportBtn.title = 'Reportar';
            reportBtn.style.cssText = 'background:transparent;border:none;cursor:pointer;padding:4px;font-size:14px;';
            reportBtn.onclick = (e) => {
                e.stopPropagation();
                const postId = post.id || extractPostId(post);
                showReportModal(postId);
            };
            
            const actions = post.querySelector('.post-actions, .actions');
            if (actions) {
                actions.appendChild(reportBtn);
            }
        });
    }
    
    function extractPostId(post) {
        // Try to extract ID from data attribute or URL
        return post.dataset?.id || post.id || 'unknown-' + Math.random();
    }
    
    // Show report modal
    function showReportModal(contentId) {
        const existing = document.getElementById('report-modal');
        if (existing) existing.remove();
        
        const modal = document.createElement('div');
        modal.id = 'report-modal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.8); display: flex; align-items: center;
            justify-content: center; z-index: 100000;
        `;
        
        const options = REASONS.map(r => 
            `<label style="display:flex;align-items:center;gap:10px;padding:12px;cursor:pointer;border-radius:8px;margin:5px 0;background:#1e293b;">
                <input type="radio" name="reason" value="${r.value}">
                <span style="font-size:18px;">${r.icon}</span>
                <span style="color:#fff;">${r.label}</span>
            </label>`
        ).join('');
        
        modal.innerHTML = `
            <div style="background:#0f172a;border:1px solid #00d4aa;border-radius:16px;padding:24px;max-width:420px;width:90%;">
                <h3 style="color:#fff;margin:0 0 20px;">🚩 Reportar Contenido</h3>
                <form id="report-form">
                    ${options}
                    <textarea id="report-desc" placeholder="Descripción adicional (opcional)" 
                        style="width:100%;padding:12px;margin:15px 0;border-radius:8px;border:1px solid #334155;background:#1e293b;color:#fff;min-height:80px;"></textarea>
                    <button type="submit" style="width:100%;background:#ef4444;border:none;color:#fff;padding:14px;border-radius:8px;cursor:pointer;font-weight:600;">
                        Enviar Reporte</button>
                </form>
                <button onclick="this.closest('#report-modal').remove()" style="margin-top:10px;width:100%;background:transparent;border:1px solid #475569;color:#94a3b8;padding:10px;border-radius:8px;cursor:pointer;">Cancelar</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
        
        document.getElementById('report-form').onsubmit = async (e) => {
            e.preventDefault();
            const reason = document.querySelector('input[name="reason"]:checked')?.value;
            const description = document.getElementById('report-desc').value;
            
            if (!reason) {
                alert('Por favor selecciona una razón');
                return;
            }
            
            await submitReport(contentId, reason, description);
            modal.remove();
            alert('✅ Reporte enviado. Gracias por mantener la comunidad segura.');
        };
    }
    
    async function submitReport(contentId, reason, description) {
        try {
            const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
            await fetch('/api/feed/social/report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    event_id: contentId,
                    reason,
                    description
                })
            });
        } catch (err) {
            console.log('Report API not available, storing locally');
            localStorage.setItem(REPORT_KEY + contentId, JSON.stringify({ reason, description, date: new Date().toISOString() }));
        }
    }
    
    // Initialize
    function init() {
        // Add button after delay for dynamic content
        setTimeout(addReportButtons, 2000);
        
        // Watch for new posts
        const observer = new MutationObserver(() => {
            addReportButtons();
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
