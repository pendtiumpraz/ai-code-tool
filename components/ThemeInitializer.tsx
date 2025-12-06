'use client';

import { useEffect } from 'react';

export function ThemeInitializer() {
  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('app-theme') || 'dark';
    const savedAccent = localStorage.getItem('app-accent') || '#8B5CF6';
    
    // Apply theme
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Apply accent color
    document.documentElement.style.setProperty('--accent-color', savedAccent);
    document.documentElement.style.setProperty('--accent-color-light', savedAccent + '33');
    document.documentElement.style.setProperty('--accent-color-dark', savedAccent + 'cc');
  }, []);

  return null;
}
