import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Combine, Scissors, FileText, FileType, Archive,
  RotateCw, Droplets, Trash2, Image, PenLine,
  Zap, Shield, Cpu, RefreshCw
} from 'lucide-react';
import './Home.css';

const TOOLS = [
  { id: 'merge', icon: <Combine size={22} />, label: 'Merge PDFs', desc: 'Combine multiple PDFs into one file', color: '#e85d04', path: '/merge' },
  { id: 'split', icon: <Scissors size={22} />, label: 'Split PDF', desc: 'Split into separate pages or ranges', color: '#7c3aed', path: '/split' },
  { id: 'compress', icon: <Archive size={22} />, label: 'Compress PDF', desc: 'Reduce file size without losing quality', color: '#0891b2', path: '/compress' },
  { id: 'rotate', icon: <RotateCw size={22} />, label: 'Rotate PDF', desc: 'Rotate pages to the correct orientation', color: '#059669', path: '/rotate' },
  { id: 'watermark', icon: <Droplets size={22} />, label: 'Add Watermark', desc: 'Stamp text watermarks on all pages', color: '#d97706', path: '/watermark' },
  { id: 'remove-pages', icon: <Trash2 size={22} />, label: 'Remove Pages', desc: 'Delete specific pages from your PDF', color: '#dc2626', path: '/remove-pages' },
  { id: 'extract-images', icon: <Image size={22} />, label: 'Extract Images', desc: 'Pull all embedded images from a PDF', color: '#7c3aed', path: '/extract-images' },
  { id: 'sign', icon: <PenLine size={22} />, label: 'Sign PDF', desc: 'Add a text signature to your document', color: '#1d4ed8', path: '/sign' },
  { id: 'word-to-pdf', icon: <FileType size={22} />, label: 'Word → PDF', desc: 'Convert .docx documents to PDF', color: '#166534', path: '/word-to-pdf' },
  { id: 'pdf-to-word', icon: <FileText size={22} />, label: 'PDF → Word', desc: 'Convert PDF files to editable Word', color: '#9a3412', path: '/pdf-to-word' },
];

const FEATURES = [
  { icon: <Zap size={18} />, label: 'Fast Processing', desc: 'Files are processed directly on our server. No waiting in queues.' },
  { icon: <Shield size={18} />, label: 'Private & Secure', desc: 'Files are auto-deleted after 1 hour. We never store your data.' },
  { icon: <Cpu size={18} />, label: 'No Installation', desc: 'Works entirely in your browser. No software to download.' },
  { icon: <RefreshCw size={18} />, label: 'Always Free', desc: 'All tools are completely free. No sign-up, no subscription.' },
];

export default function Home() {
  const [search, setSearch] = useState('');
  const filtered = TOOLS.filter(t =>
    t.label.toLowerCase().includes(search.toLowerCase()) ||
    t.desc.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-badge"><span>✦</span> 10 free tools</div>
        <h1 className="hero-title">
          Every PDF tool<br />you'll ever need
        </h1>
        <p className="hero-sub">
          Merge, split, compress, convert, watermark and more —<br />
          all free, all private, all in your browser.
        </p>
        <input
          className="search-input"
          type="text"
          placeholder="Search tools…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </section>

      <section className="tools-section">
        <div className="tools-grid">
          {filtered.map(tool => (
            <Link key={tool.id} to={tool.path} className="tool-card">
              <div className="tool-card-icon" style={{ background: tool.color + '18', color: tool.color }}>
                {tool.icon}
              </div>
              <div className="tool-card-body">
                <h3 className="tool-card-label">{tool.label}</h3>
                <p className="tool-card-desc">{tool.desc}</p>
              </div>
              <div className="tool-card-arrow">→</div>
            </Link>
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="no-results">No tools found for "{search}"</div>
        )}
      </section>

      <section className="features-section" id="how-it-works">
        <div className="features-header">
          <h2>Why PDF for Life?</h2>
          <p>Simple, fast, and private by design</p>
        </div>
        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <div key={i} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.label}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="how-section">
        <div className="how-inner">
          <h2>How it works</h2>
          <div className="steps">
            {[
              { n: '01', title: 'Upload your file', desc: 'Drag & drop or click to browse. Supports PDF and Word documents up to 50MB.' },
              { n: '02', title: 'Choose your action', desc: 'Select the tool, configure options, and click to process.' },
              { n: '03', title: 'Download the result', desc: 'Your processed file is ready instantly. Files auto-delete after 1 hour.' },
            ].map(s => (
              <div key={s.n} className="step">
                <div className="step-num">{s.n}</div>
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
