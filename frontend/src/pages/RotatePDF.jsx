import React, { useState } from 'react';
import { RotateCw } from 'lucide-react';
import ToolLayout from '../components/ToolLayout';
import DropZone from '../components/DropZone';
import ResultCard from '../components/ResultCard';
import { uploadFiles } from '../utils/api';

export default function RotatePDF() {
  const [file, setFile] = useState(null);
  const [angle, setAngle] = useState('90');
  const [pages, setPages] = useState('all');
  const [result, setResult] = useState(null);

  const handleSubmit = async () => {
    if (!file) return;
    setResult({ status: 'loading' });
    try {
      const data = await uploadFiles('/rotate', file, { angle, pages });
      setResult({ status: 'success', url: data.url, filename: data.filename });
    } catch (err) {
      setResult({ status: 'error', error: err.response?.data?.error || err.message });
    }
  };

  return (
    <ToolLayout icon={<RotateCw size={24} />} title="Rotate PDF" color="#059669"
      description="Rotate one or all pages of your PDF to the correct orientation.">
      <DropZone onFiles={f => setFile(f[0])} files={file ? [file] : []} />
      <hr className="divider" />
      <div className="row-2">
        <div className="form-group">
          <label className="form-label">Rotation</label>
          <select className="form-input form-select" value={angle} onChange={e => setAngle(e.target.value)}>
            <option value="90">90° Clockwise</option>
            <option value="180">180°</option>
            <option value="270">90° Counter-clockwise</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Pages</label>
          <input className="form-input" type="text" value={pages} onChange={e => setPages(e.target.value)}
            placeholder="all or 1,3,5" />
          <p className="form-hint">all or comma-separated</p>
        </div>
      </div>
      <button className="submit-btn" onClick={handleSubmit} disabled={!file || result?.status === 'loading'}>
        {result?.status === 'loading' ? 'Rotating…' : 'Rotate PDF'}
      </button>
      <ResultCard state={result} />
    </ToolLayout>
  );
}
