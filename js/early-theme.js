// Early theme application - must load before CSS to prevent FOUC
(function() {
    // Check for saved theme first (user's explicit choice)
    const savedTheme = localStorage.getItem('theme');

    // If user has saved preference, use it immediately
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        return;
    }

    // Otherwise, check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const systemTheme = prefersDark ? 'dark' : 'light';

    // Apply system preference WITHOUT saving it
    // This ensures future changes to system preference are respected
    document.documentElement.setAttribute('data-theme', systemTheme);
})();
