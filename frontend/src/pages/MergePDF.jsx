import React, { useState } from 'react';
import { Combine, X } from 'lucide-react';
import ToolLayout from '../components/ToolLayout';
import DropZone from '../components/DropZone';
import ResultCard from '../components/ResultCard';
import { uploadFiles } from '../utils/api';

export default function MergePDF() {
  const [files, setFiles] = useState([]);
  const [result, setResult] = useState(null);

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (files.length < 2) return;
    setResult({ status: 'loading' });
    try {
      const data = await uploadFiles('/merge', files);
      setResult({
        status: 'success',
        url: data.url,
        filename: data.filename,
        extra: `Merged ${files.length} files · ${data.pageCount} total pages`
      });
    } catch (err) {
      setResult({ status: 'error', error: err.response?.data?.error || err.message });
    }
  };

  const totalMB = (files.reduce((a, f) => a + f.size, 0) / 1024 / 1024).toFixed(2);

  return (
    <ToolLayout icon={<Combine size={24} />} title="Merge PDFs" color="#e85d04"
      description="Combine multiple PDF files into a single document. Files merge in the order listed below.">

      <DropZone
        onFiles={f => setFiles(prev => [...prev, ...f])}
        multiple
        accept={{ 'application/pdf': ['.pdf'] }}
        label="Drop PDF files here"
        hint="Add multiple PDFs · Max 200MB each"
      />

      {files.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)' }}>
              {files.length} file{files.length > 1 ? 's' : ''} · {totalMB} MB total
            </p>
            <button onClick={() => setFiles([])}
              style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
              Clear all
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {files.map((f, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px', background: 'var(--surface)',
                border: '1px solid var(--border)', borderRadius: 8
              }}>
                <span style={{ fontSize: 16 }}>📄</span>
                <span style={{ flex: 1, fontSize: 13, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {f.name}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text3)', flexShrink: 0 }}>
                  {(f.size / 1024 / 1024).toFixed(1)} MB
                </span>
                <button onClick={() => removeFile(i)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 2, display: 'flex' }}>
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <hr className="divider" />
      <button className="submit-btn" onClick={handleSubmit}
        disabled={files.length < 2 || result?.status === 'loading'}>
        {result?.status === 'loading' ? 'Merging…' : `Merge ${files.length} PDF${files.length !== 1 ? 's' : ''}`}
      </button>
      {files.length === 1 && (
        <p style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', marginTop: 8 }}>
          Add at least one more PDF to merge
        </p>
      )}
      <ResultCard state={result} />
    </ToolLayout>
  );
}
