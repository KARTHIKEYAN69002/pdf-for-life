import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './ToolLayout.css';

export default function ToolLayout({ icon, title, description, color, children }) {
  return (
    <div className="tool-page">
      <div className="tool-container">
        <Link to="/" className="back-btn">
          <ArrowLeft size={15} />
          All Tools
        </Link>
        <div className="tool-header">
          <div className="tool-header-icon" style={{ background: color || 'var(--accent)' }}>
            {icon}
          </div>
          <div>
            <h1 className="tool-title">{title}</h1>
            <p className="tool-desc">{description}</p>
          </div>
        </div>
        <div className="tool-card">
          {children}
        </div>
      </div>
    </div>
  );
}
