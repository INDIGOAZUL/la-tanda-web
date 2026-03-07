// Early theme application - must load before CSS to prevent FOUC
(function() {
    // Check for saved theme
    const savedTheme = localStorage.getItem('theme');

    // Check system preference if no saved theme
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Determine theme
    const theme = savedTheme || (prefersDark ? 'dark' : 'light');

    // Apply immediately
    document.documentElement.setAttribute('data-theme', theme);

    // Save if using system preference
    if (!savedTheme) {
        localStorage.setItem('theme', theme);
    }
})();
