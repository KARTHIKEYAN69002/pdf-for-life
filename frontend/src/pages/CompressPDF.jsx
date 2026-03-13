import React, { useState } from 'react';
import { Archive } from 'lucide-react';
import ToolLayout from '../components/ToolLayout';
import DropZone from '../components/DropZone';
import ResultCard from '../components/ResultCard';
import { uploadFiles } from '../utils/api';

const LEVELS = [
  { value: 'screen', label: 'Maximum', desc: 'Smallest file, lower image quality (72 DPI)' },
  { value: 'ebook', label: 'Balanced', desc: 'Good compression, decent quality (150 DPI)' },
  { value: 'printer', label: 'Light', desc: 'Minimal compression, high quality (300 DPI)' },
];

export default function CompressPDF() {
  const [file, setFile] = useState(null);
  const [level, setLevel] = useState('ebook');
  const [result, setResult] = useState(null);

  const handleSubmit = async () => {
    if (!file) return;
    setResult({ status: 'loading', message: 'Compressing… this may take a moment.' });
    try {
      const data = await uploadFiles('/compress', file, { level });
      const saved = ((1 - data.compressedSize / data.originalSize) * 100).toFixed(1);
      const orig = (data.originalSize / 1024 / 1024).toFixed(2);
      const comp = (data.compressedSize / 1024 / 1024).toFixed(2);
      const extra = data.note || `${orig} MB → ${comp} MB · ${saved}% smaller`;
      setResult({ status: 'success', url: data.url, filename: data.filename, extra });
    } catch (err) {
      setResult({ status: 'error', error: err.response?.data?.error || err.message });
    }
  };

  return (
    <ToolLayout icon={<Archive size={24} />} title="Compress PDF" color="#0891b2"
      description="Reduce PDF file size by compressing images and removing redundant data.">
      <DropZone onFiles={f => setFile(f[0])} files={file ? [file] : []} />
      <hr className="divider" />

      <div className="form-group">
        <label className="form-label">Compression Level</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {LEVELS.map(l => (
            <label key={l.value} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px', borderRadius: 8, cursor: 'pointer',
              border: `1.5px solid ${level === l.value ? '#0891b2' : 'var(--border)'}`,
              background: level === l.value ? '#f0f9ff' : 'var(--surface2)',
              transition: 'all 0.15s ease'
            }}>
              <input type="radio" name="level" value={l.value}
                checked={level === l.value} onChange={() => setLevel(l.value)}
                style={{ accentColor: '#0891b2', width: 16, height: 16 }} />
              <div>
                <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{l.label}</p>
                <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{l.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div style={{
        padding: '10px 14px', background: 'var(--bg2)', borderRadius: 8,
        border: '1px solid var(--border)', marginBottom: 16
      }}>
        <p style={{ fontSize: 12, color: 'var(--text2)' }}>
          💡 <strong>Best results:</strong> Ghostscript must be installed on the server for real image compression.
          Install it with: <code style={{ background: 'var(--border)', padding: '1px 6px', borderRadius: 4 }}>
          winget install ghostscript</code> (Windows) or <code style={{ background: 'var(--border)', padding: '1px 6px', borderRadius: 4 }}>
          brew install ghostscript</code> (Mac)
        </p>
      </div>

      <button className="submit-btn" onClick={handleSubmit}
        disabled={!file || result?.status === 'loading'}>
        {result?.status === 'loading' ? 'Compressing…' : 'Compress PDF'}
      </button>
      <ResultCard state={result} />
    </ToolLayout>
  );
}
