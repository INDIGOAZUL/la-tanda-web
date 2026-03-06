/* ============================================
   🌙 AUTO NIGHT MODE
   ============================================ */

(function() {
    const start = 22; // 10 PM
    const end = 7;    // 7 AM
    
    function checkTime() {
        const hour = new Date().getHours();
        const isNight = hour >= start || hour < end;
        
        if (isNight && localStorage.getItem('theme') !== 'light') {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    }
    
    // Check every minute
    setInterval(checkTime, 60000);
    checkTime();
})();
