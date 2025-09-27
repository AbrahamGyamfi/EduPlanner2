import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Initialize theme from localStorage or system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme;
    
    // Check system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  const [fontSize, setFontSize] = useState(() => {
    const savedFontSize = localStorage.getItem('fontSize');
    return savedFontSize || 'medium';
  });

  const [systemTheme, setSystemTheme] = useState(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
      
      // If user hasn't set a manual preference, follow system
      const savedTheme = localStorage.getItem('theme');
      if (!savedTheme || savedTheme === 'system') {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Apply theme to document
  const applyTheme = (newTheme) => {
    const resolvedTheme = newTheme === 'system' ? systemTheme : newTheme;
    
    // Apply data-theme attribute to html element
    document.documentElement.setAttribute('data-theme', resolvedTheme);
    
    // Also apply for compatibility with existing code
    if (resolvedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark-theme');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark-theme');
    }

    // Add theme transition class temporarily
    document.documentElement.classList.add('theme-transition');
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transition');
    }, 200);
  };

  // Apply font size to document
  const applyFontSize = (newFontSize) => {
    document.documentElement.setAttribute('data-font-size', newFontSize);
    
    // Also set CSS custom property for more control
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px'
    };
    
    document.documentElement.style.setProperty('--base-font-size', fontSizeMap[newFontSize]);
  };

  // Theme change handler
  const changeTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  // Font size change handler
  const changeFontSize = (newFontSize) => {
    setFontSize(newFontSize);
    localStorage.setItem('fontSize', newFontSize);
    applyFontSize(newFontSize);
  };

  // Toggle theme (for quick switching)
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    changeTheme(newTheme);
  };

  // Get resolved theme (handles 'system' theme)
  const getResolvedTheme = () => {
    return theme === 'system' ? systemTheme : theme;
  };

  // Initialize theme and font size on mount
  useEffect(() => {
    applyTheme(theme);
    applyFontSize(fontSize);
  }, []);

  // Load user preferences from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const savedFontSize = localStorage.getItem('fontSize');
    
    if (savedTheme && savedTheme !== theme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    }
    
    if (savedFontSize && savedFontSize !== fontSize) {
      setFontSize(savedFontSize);
      applyFontSize(savedFontSize);
    }
  }, []);

  const value = {
    // Current theme state
    theme,
    fontSize,
    systemTheme,
    
    // Theme methods
    changeTheme,
    changeFontSize,
    toggleTheme,
    getResolvedTheme,
    
    // Utility methods
    isDark: getResolvedTheme() === 'dark',
    isLight: getResolvedTheme() === 'light',
    isSystem: theme === 'system',
    
    // Theme options
    themes: ['light', 'dark', 'system'],
    fontSizes: ['small', 'medium', 'large'],
    
    // For compatibility with existing code
    setTheme: changeTheme,
    setFontSize: changeFontSize
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// CSS-in-JS style for theme transition
const themeTransitionStyle = `
  .theme-transition,
  .theme-transition *,
  .theme-transition *::before,
  .theme-transition *::after {
    transition: all 200ms ease !important;
    transition-delay: 0s !important;
  }
`;

// Inject transition styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = themeTransitionStyle;
  document.head.appendChild(style);
}
