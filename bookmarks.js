/* ============================================
   🔖 BOOKMARKS/SAVED POSTS
   ============================================ */

(function() {
    const STORAGE_KEY = 'saved_posts';
    
    function getSaved() {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    }
    
    function toggleSave(postId) {
        const saved = getSaved();
        const idx = saved.indexOf(postId);
        
        if (idx > -1) {
            saved.splice(idx, 1);
        } else {
            saved.push(postId);
        }
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
        updateButton(postId);
    }
    
    function updateButton(postId) {
        const btn = document.querySelector(`[data-post-id="${postId}"] .bookmark-btn`);
        const saved = getSaved();
        if (btn) {
            btn.textContent = saved.includes(postId) ? '🔖' : '📑';
        }
    }
    
    function addBookmarkButtons() {
        const posts = document.querySelectorAll('.feed-post');
        posts.forEach(post => {
            const id = post.id || 'post-' + Math.random();
            post.dataset.postId = id;
            
            if (post.querySelector('.bookmark-btn')) return;
            
            const btn = document.createElement('button');
            btn.className = 'bookmark-btn';
            btn.textContent = '📑';
            btn.title = 'Guardar';
            btn.style.cssText = 'background:transparent;border:none;cursor:pointer;padding:4px;font-size:14px;';
            btn.onclick = () => toggleSave(id);
            
            const actions = post.querySelector('.post-actions, .actions');
            if (actions) actions.appendChild(btn);
            
            updateButton(id);
        });
    }
    
    setTimeout(addBookmarkButtons, 2000);
    const observer = new MutationObserver(addBookmarkButtons);
    observer.observe(document.body, { childList: true, subtree: true });
    
    window.showSavedPosts = function() {
        const saved = getSaved();
        alert('Posts guardados: ' + saved.length);
    };
})();
