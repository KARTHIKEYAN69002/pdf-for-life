import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Header from './components/Header';
import Home from './pages/Home';
import MergePDF from './pages/MergePDF';
import SplitPDF from './pages/SplitPDF';
import CompressPDF from './pages/CompressPDF';
import RotatePDF from './pages/RotatePDF';
import WatermarkPDF from './pages/WatermarkPDF';
import RemovePages from './pages/RemovePages';
import ExtractImages from './pages/ExtractImages';
import SignPDF from './pages/SignPDF';
import WordToPDF from './pages/WordToPDF';
import PDFToWord from './pages/PDFToWord';
import './index.css';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

function WakeBanner() {
  const [waking, setWaking] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let done = false;
    const wake = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/health`, { signal: AbortSignal.timeout(5000) });
        if (res.ok) { done = true; setReady(true); setWaking(false); return; }
      } catch {}
      if (!done) setWaking(true);
      // retry every 4 seconds until awake
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`${API_BASE}/api/health`, { signal: AbortSignal.timeout(5000) });
          if (res.ok) { clearInterval(interval); setReady(true); setWaking(false); }
        } catch {}
      }, 4000);
      setTimeout(() => clearInterval(interval), 120000);
    };
    wake();
  }, []);

  if (ready || !waking) return null;
  return (
    <div style={{
      background: '#d97706', color: 'white',
      padding: '10px 24px', textAlign: 'center',
      fontSize: 13, fontWeight: 500,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
    }}>
      <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', fontSize: 16 }}>⟳</span>
      Server is waking up — this takes ~30 seconds on first visit. Please wait…
    </div>
  );
}

function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border)', padding: '24px',
      textAlign: 'center', color: 'var(--text3)', fontSize: 13,
      background: 'var(--bg2)'
    }}>
      <p>PDF for Life — Free, open-source PDF tools. Files auto-deleted after 1 hour.</p>
      <p style={{ marginTop: 6 }}>
        Built with ♥ using React, Node.js & pdf-lib ·{' '}
        <a href="https://github.com/KARTHIKEYAN69002/pdf-for-life" target="_blank" rel="noreferrer"
          style={{ color: 'var(--accent)', textDecoration: 'none' }}>GitHub</a>
      </p>
    </footer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Router>
        <Header />
        <WakeBanner />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/merge" element={<MergePDF />} />
            <Route path="/split" element={<SplitPDF />} />
            <Route path="/compress" element={<CompressPDF />} />
            <Route path="/rotate" element={<RotatePDF />} />
            <Route path="/watermark" element={<WatermarkPDF />} />
            <Route path="/remove-pages" element={<RemovePages />} />
            <Route path="/extract-images" element={<ExtractImages />} />
            <Route path="/sign" element={<SignPDF />} />
            <Route path="/word-to-pdf" element={<WordToPDF />} />
            <Route path="/pdf-to-word" element={<PDFToWord />} />
          </Routes>
        </main>
        <Footer />
      </Router>
    </ThemeProvider>
  );
}
