import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import ToolLayout from '../components/ToolLayout';
import DropZone from '../components/DropZone';
import ResultCard from '../components/ResultCard';
import { uploadFiles, api } from '../utils/api';

export default function RemovePages() {
  const [file, setFile] = useState(null);
  const [pages, setPages] = useState('');
  const [pageCount, setPageCount] = useState(null);
  const [result, setResult] = useState(null);

  const handleFile = async (files) => {
    setFile(files[0]);
    try {
      const form = new FormData();
      form.append('file', files[0]);
      const res = await api.post('/info', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setPageCount(res.data.pageCount);
    } catch {}
  };

  const handleSubmit = async () => {
    if (!file || !pages) return;
    setResult({ status: 'loading' });
    try {
      const data = await uploadFiles('/remove-pages', file, { pages });
      setResult({ status: 'success', url: data.url, filename: data.filename });
    } catch (err) {
      setResult({ status: 'error', error: err.response?.data?.error || err.message });
    }
  };

  return (
    <ToolLayout icon={<Trash2 size={24} />} title="Remove Pages" color="#dc2626"
      description="Delete specific pages from your PDF document.">
      <DropZone onFiles={handleFile} files={file ? [file] : []} />
      {pageCount && <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 8 }}>📄 {pageCount} pages detected</p>}
      <hr className="divider" />
      <div className="form-group">
        <label className="form-label">Pages to Remove</label>
        <input className="form-input" type="text" value={pages} onChange={e => setPages(e.target.value)}
          placeholder="e.g. 1, 3, 5-8" />
        <p className="form-hint">Comma-separated page numbers or ranges.</p>
      </div>
      <button className="submit-btn" onClick={handleSubmit} disabled={!file || !pages || result?.status === 'loading'}>
        {result?.status === 'loading' ? 'Removing Pages…' : 'Remove Pages'}
      </button>
      <ResultCard state={result} />
    </ToolLayout>
  );
}
