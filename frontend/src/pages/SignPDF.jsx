import React, { useState, useRef, useEffect } from 'react';
import { PenLine } from 'lucide-react';
import ToolLayout from '../components/ToolLayout';
import DropZone from '../components/DropZone';
import ResultCard from '../components/ResultCard';
import { uploadFiles } from '../utils/api';

export default function SignPDF() {
  const [file, setFile] = useState(null);
  const [signText, setSignText] = useState('');
  const [page, setPage] = useState('1');
  const [x, setX] = useState('60');
  const [y, setY] = useState('80');
  const [fontSize, setFontSize] = useState('28');
  const [result, setResult] = useState(null);

  const handleSubmit = async () => {
    if (!file || !signText) return;
    setResult({ status: 'loading' });
    try {
      const data = await uploadFiles('/sign', file, {
        signatureText: signText, page, x, y, fontSize
      });
      setResult({ status: 'success', url: data.url, filename: data.filename });
    } catch (err) {
      setResult({ status: 'error', error: err.response?.data?.error || err.message });
    }
  };

  return (
    <ToolLayout icon={<PenLine size={24} />} title="Sign PDF" color="#1d4ed8"
      description="Add a text-based signature to your PDF document.">
      <DropZone onFiles={f => setFile(f[0])} files={file ? [file] : []} />
      <hr className="divider" />

      <div className="form-group">
        <label className="form-label">Your Signature</label>
        <input className="form-input" type="text" value={signText}
          onChange={e => setSignText(e.target.value)}
          placeholder="Type your full name"
          style={{ fontStyle: 'italic', fontSize: 20, color: '#1d3a8a' }} />
      </div>

      {signText && (
        <div style={{
          padding: '20px 24px', background: 'var(--bg2)', borderRadius: 8,
          border: '1px dashed var(--border)', marginBottom: 20
        }}>
          <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 12,
            textTransform: 'uppercase', letterSpacing: '0.5px' }}>Signature Preview</p>
          <div style={{ borderBottom: '2px solid #1d4ed8', paddingBottom: 8, display: 'inline-block' }}>
            <span style={{
              fontStyle: 'italic', fontSize: Math.min(parseInt(fontSize), 36),
              color: '#1d4ed8', fontFamily: 'Georgia, serif'
            }}>
              {signText}
            </span>
          </div>
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Font Size: {fontSize}pt</label>
        <input type="range" min="12" max="48" step="2" value={fontSize}
          onChange={e => setFontSize(e.target.value)}
          style={{ width: '100%', accentColor: '#1d4ed8', cursor: 'pointer' }} />
      </div>

      <div className="form-group">
        <label className="form-label">Place on Page</label>
        <div className="row-2">
          <div>
            <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>Page number</p>
            <input className="form-input" type="number" value={page}
              onChange={e => setPage(e.target.value)} min="1" placeholder="1" />
          </div>
          <div>
            <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>Distance from top (px)</p>
            <input className="form-input" type="number" value={y}
              onChange={e => setY(e.target.value)} min="0" placeholder="80" />
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>Distance from left (px)</p>
          <input className="form-input" type="number" value={x}
            onChange={e => setX(e.target.value)} min="0" placeholder="60" style={{ maxWidth: 180 }} />
        </div>
      </div>

      <button className="submit-btn" onClick={handleSubmit}
        disabled={!file || !signText || result?.status === 'loading'}>
        {result?.status === 'loading' ? 'Signing…' : 'Sign PDF'}
      </button>
      <ResultCard state={result} />
    </ToolLayout>
  );
}
