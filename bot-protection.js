/* ============================================
   🤖 BOT PROTECTION
   ============================================ */

(function() {
    // Detect automation
    const isBot = 
        navigator.webdriver ||
        window.cdc_adoQpoasnfa76pfcZLmcfl_Array ||
        window.callPhantom ||
        window._Selenium_IDE_Recorder;
    
    if (isBot) {
        console.log('Bot detected');
    }
    
    // Honeypot fields
    function addHoneypot() {
        const form = document.querySelector('form');
        if (!form || form.querySelector('input[name="website"]')) return;
        
        const honeypot = document.createElement('input');
        honeypot.type = 'text';
        honeypot.name = 'website';
        honeypot.style.cssText = 'position:absolute;left:-9999px;';
        honeypot.tabIndex = -1;
        honeypot.autocomplete = 'off';
        
        form.appendChild(honeypot);
        
        form.addEventListener('submit', (e) => {
            if (honeypot.value) {
                e.preventDefault();
                console.log('Bot submission blocked');
            }
        });
    }
    
    // Rate limiting
    let lastSubmit = 0;
    window.addEventListener('submit', () => {
        const now = Date.now();
        if (now - lastSubmit < 3000) {
            console.log('Too fast, possible bot');
        }
        lastSubmit = now;
    });
    
    addHoneypot();
})();
