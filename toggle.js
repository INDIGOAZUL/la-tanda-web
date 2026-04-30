// toggle.js
document.addEventListener('DOMContentLoaded', function() {
  const themeToggle = document.querySelector('.toggle-theme');
  const sidebarLeftDropdown = document.querySelector('.dropdown-menu');

  // Get the current theme preference from localStorage
  const themePreference = localStorage.getItem('theme_preference') || 'dark';

  // Set the initial theme based on the preference
  setTheme(themePreference);

  themeToggle.addEventListener('click', function() {
    // Toggle the theme between dark and light
    const newTheme = themePreference === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme_preference', newTheme);
    setTheme(newTheme);
  });

  function setTheme(theme) {
    if (theme === 'light') {
      document.body.classList.remove('dark-theme');
      document.body.classList.add('light-theme');

      // Set CSS variables for the light theme
      document.documentElement.style.setProperty('--bg-primary', '#f4f4f4');
      document.documentElement.style.setProperty('--bg-secondary', '#e0e0e0');
      document.documentElement.style.setProperty('--text-primary', '#333333');

      // Update the sidebar dropdown text
      sidebarLeftDropdown.textContent = 'Light Mode';
    } else {
      document.body.classList.remove('light-theme');
      document.body.classList.add('dark-theme');

      // Set CSS variables for the dark theme
      document.documentElement.style.setProperty('--bg-primary', '#212121');
      document.documentElement.style.setProperty('--bg-secondary', '#333333');
      document.documentElement.style.setProperty('--text-primary', '#ffffff');

      // Update the sidebar dropdown text
      sidebarLeftDropdown.textContent = 'Dark Mode';
    }
  }
});