// toggle.js

document.addEventListener('DOMContentLoaded', function() {
  const themeToggle = document.getElementById('theme-toggle');
  const body = document.body;

  // Get current theme from localStorage if available
  const currentTheme = localStorage.getItem('theme_preference') || 'dark';
  body.style.backgroundColor = `var(--${currentTheme}_primary)`; // Set initial background color

  themeToggle.addEventListener('change', function() {
    const newTheme = this.checked ? 'light' : 'dark';
    localStorage.setItem('theme_preference', newTheme); // Update localStorage
    body.style.backgroundColor = `var(--${newTheme}_primary)`; // Update body background color on change
  });
});