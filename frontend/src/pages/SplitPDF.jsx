import React, { useState } from 'react';
import { Scissors } from 'lucide-react';
import ToolLayout from '../components/ToolLayout';
import DropZone from '../components/DropZone';
import ResultCard from '../components/ResultCard';
import { uploadFiles } from '../utils/api';

export default function SplitPDF() {
  const [file, setFile] = useState(null);
  const [ranges, setRanges] = useState('');
  const [result, setResult] = useState(null);

  const handleSubmit = async () => {
    if (!file) return;
    setResult({ status: 'loading' });
    try {
      const data = await uploadFiles('/split', file, { ranges });
      setResult({ status: 'success', url: data.url, filename: data.filename, extra: 'Download the ZIP containing all split pages.' });
    } catch (err) {
      setResult({ status: 'error', error: err.response?.data?.error || err.message });
    }
  };

  return (
    <ToolLayout icon={<Scissors size={24} />} title="Split PDF" color="#7c3aed"
      description="Split a PDF into separate pages or custom page ranges. Download as a ZIP file.">
      <DropZone onFiles={f => setFile(f[0])} files={file ? [file] : []} />
      <hr className="divider" />
      <div className="form-group">
        <label className="form-label">Page Ranges (optional)</label>
        <input className="form-input" type="text" value={ranges} onChange={e => setRanges(e.target.value)}
          placeholder="e.g. 1-3, 5, 7-9" />
        <p className="form-hint">Leave blank to split every page individually.</p>
      </div>
      <button className="submit-btn" onClick={handleSubmit} disabled={!file || result?.status === 'loading'}>
        {result?.status === 'loading' ? 'Splitting…' : 'Split PDF'}
      </button>
      <ResultCard state={result} />
    </ToolLayout>
  );
}
