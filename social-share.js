/* ============================================
   📲 SOCIAL SHARING
   ============================================ */

(function() {
    function addShareButtons() {
        const posts = document.querySelectorAll('.feed-post, .post');
        posts.forEach(post => {
            if (post.querySelector('.share-btn')) return;
            
            const shareBtn = document.createElement('button');
            shareBtn.className = 'share-btn';
            shareBtn.innerHTML = '📲';
            shareBtn.title = 'Compartir';
            shareBtn.style.cssText = 'background:transparent;border:none;cursor:pointer;padding:4px;font-size:14px;';
            shareBtn.onclick = () => sharePost(post);
            
            const actions = post.querySelector('.post-actions, .actions');
            if (actions) actions.appendChild(shareBtn);
        });
    }
    
    function sharePost(post) {
        const text = post.querySelector('p, .content')?.textContent?.substring(0, 100);
        const url = window.location.href;
        
        if (navigator.share) {
            navigator.share({ title: 'La Tanda', text, url });
        } else {
            // Fallback - copy to clipboard
            navigator.clipboard.writeText(url);
            alert('¡Enlace copiado!');
        }
    }
    
    setTimeout(addShareButtons, 2000);
    const observer = new MutationObserver(addShareButtons);
    observer.observe(document.body, { childList: true, subtree: true });
})();
