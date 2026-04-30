document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.createElement('button');
  themeToggle.classList.add('toggle-theme-button');
  themeToggle.textContent = 'Dark/Light';

  document.getElementById('sidebar').insertAdjacentElement('afterbegin', themeToggle);

  themeToggle.addEventListener('click', () => {
    const currentTheme = localStorage.getItem('theme_preference') === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme_preference', currentTheme);
    applyTheme(currentTheme);
  });
});

function applyTheme(theme) {
  const darkModeClasses = ['dark-mode'];
  const lightModeClasses = ['light-mode'];

  for (const className of darkModeClasses) {
    document.body.classList.remove(className);
  }

  for (const className of lightModeClasses) {
    document.body.classList.add(className);
  }
}