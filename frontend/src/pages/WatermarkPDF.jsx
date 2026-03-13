import React, { useState } from 'react';
import { Droplets } from 'lucide-react';
import ToolLayout from '../components/ToolLayout';
import DropZone from '../components/DropZone';
import ResultCard from '../components/ResultCard';
import { uploadFiles } from '../utils/api';

export default function WatermarkPDF() {
  const [file, setFile] = useState(null);
  const [text, setText] = useState('CONFIDENTIAL');
  const [opacity, setOpacity] = useState('0.3');
  const [fontSize, setFontSize] = useState('60');
  const [color, setColor] = useState('#ff0000');
  const [result, setResult] = useState(null);

  const handleSubmit = async () => {
    if (!file || !text) return;
    setResult({ status: 'loading' });
    try {
      const data = await uploadFiles('/watermark', file, { text, opacity, fontSize, color });
      setResult({ status: 'success', url: data.url, filename: data.filename });
    } catch (err) {
      setResult({ status: 'error', error: err.response?.data?.error || err.message });
    }
  };

  return (
    <ToolLayout icon={<Droplets size={24} />} title="Add Watermark" color="#d97706"
      description="Add a diagonal text watermark to every page of your PDF.">
      <DropZone onFiles={f => setFile(f[0])} files={file ? [file] : []} />
      <hr className="divider" />

      <div className="form-group">
        <label className="form-label">Watermark Text</label>
        <input className="form-input" type="text" value={text}
          onChange={e => setText(e.target.value)} placeholder="e.g. CONFIDENTIAL" />
      </div>

      <div className="form-group">
        <label className="form-label">Font Size: {fontSize}pt</label>
        <input type="range" min="20" max="120" step="5" value={fontSize}
          onChange={e => setFontSize(e.target.value)}
          style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
          <span>Small (20)</span><span>Large (120)</span>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Opacity: {Math.round(opacity * 100)}%</label>
        <input type="range" min="0.05" max="0.8" step="0.05" value={opacity}
          onChange={e => setOpacity(e.target.value)}
          style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
          <span>Subtle (5%)</span><span>Strong (80%)</span>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Color</label>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input type="color" value={color} onChange={e => setColor(e.target.value)}
            style={{ width: 48, height: 42, padding: 3, border: '1px solid var(--border)',
              borderRadius: 8, cursor: 'pointer', background: 'var(--bg2)', flexShrink: 0 }} />
          <input className="form-input" type="text" value={color}
            onChange={e => setColor(e.target.value)}
            placeholder="#ff0000" style={{ flex: 1 }} />
        </div>
      </div>

      {text && (
        <div style={{
          padding: '16px', background: 'var(--bg2)', borderRadius: 8,
          border: '1px dashed var(--border)', marginBottom: 16,
          textAlign: 'center', overflow: 'hidden'
        }}>
          <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Preview</p>
          <span style={{
            color, opacity: parseFloat(opacity),
            fontSize: Math.min(parseInt(fontSize) * 0.4, 32),
            fontWeight: 'bold', transform: 'rotate(-30deg)',
            display: 'inline-block', letterSpacing: 2
          }}>
            {text}
          </span>
        </div>
      )}

      <button className="submit-btn" onClick={handleSubmit}
        disabled={!file || !text || result?.status === 'loading'}>
        {result?.status === 'loading' ? 'Adding Watermark…' : 'Add Watermark'}
      </button>
      <ResultCard state={result} />
    </ToolLayout>
  );
}
