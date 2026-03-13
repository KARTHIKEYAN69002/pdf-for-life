import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sun, Moon, FileText } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import './Header.css';

export default function Header() {
  const { theme, toggle } = useTheme();
  const location = useLocation();

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="logo">
          <div className="logo-icon">
            <FileText size={18} />
          </div>
          <span className="logo-text">PDF<em>for</em>Life</span>
        </Link>
        <nav className="nav">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Tools</Link>
          <a href="#how-it-works" className="nav-link">How it works</a>
          <a href="https://github.com/yourusername/pdf-for-life" target="_blank" rel="noreferrer" className="nav-link">GitHub</a>
        </nav>
        <button className="theme-btn" onClick={toggle} title="Toggle theme" aria-label="Toggle theme">
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
}
