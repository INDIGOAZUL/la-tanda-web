import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import '../css/dashboard-layout.css';

const ThemeToggle: React.FC = () => {
    const [isDarkTheme, setIsDarkTheme] = useState<boolean>(() => {
        const storedTheme = localStorage.getItem('theme_preference');
        return storedTheme === 'dark';
    });

    const toggleTheme = () => {
        const newTheme = !isDarkTheme ? 'dark' : 'light';
        setIsDarkTheme(!isDarkTheme);
        localStorage.setItem('theme_preference', newTheme);
        document.body.className = newTheme; // Apply the theme directly
    };

    useEffect(() => {
        document.body.className = isDarkTheme ? 'dark' : 'light';
    }, [isDarkTheme]);

    return (
      <div className="theme-toggle">
          <button onClick={toggleTheme}>
              Switch to {isDarkTheme ? 'Light' : 'Dark'} Theme
          </button>
      </div>
    );
};

// Assuming there's already a ReactDOM.render call somewhere here
ReactDOM.render(<ThemeToggle />, document.getElementById('sidebar') || document.body); // Replace with actual sidebar ID if available