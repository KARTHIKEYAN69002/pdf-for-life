import React from 'react';
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
        <a href="https://github.com/yourusername/pdf-for-life" target="_blank" rel="noreferrer"
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
