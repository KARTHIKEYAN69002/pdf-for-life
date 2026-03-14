import React, { useState } from 'react';
import { Combine } from 'lucide-react';
import ToolLayout from '../components/ToolLayout';
import DropZone from '../components/DropZone';
import ResultCard from '../components/ResultCard';
import { uploadFiles } from '../utils/api';

export default function MergePDF() {
  const [files, setFiles] = useState([]);
  const [result, setResult] = useState(null);

  const handleSubmit = async () => {
    if (files.length < 2) return;
    setResult({ status: 'loading' });
    try {
      const data = await uploadFiles('/merge', files);
      setResult({ status: 'success', url: data.url, filename: data.filename });
    } catch (err) {
      setResult({ status: 'error', error: err.response?.data?.error || err.message });
    }
  };

  return (
    <ToolLayout icon={<Combine size={24} />} title="Merge PDFs" color="#e85d04"
      description="Combine multiple PDF files into a single document. Files are merged in the order they're listed.">
      <DropZone onFiles={f => setFiles(prev => [...prev, ...f])} multiple accept={{ 'application/pdf': ['.pdf'] }}
        label="Drop PDF files here" hint="Add multiple PDFs" files={files} />
      {files.length > 0 && (
        <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 8 }}>
          {files.length} file{files.length > 1 ? 's' : ''} selected · {(files.reduce((a, f) => a + f.size, 0) / 1024 / 1024).toFixed(2)} MB total
        </p>
      )}
      <hr className="divider" />
      <button className="submit-btn" onClick={handleSubmit} disabled={files.length < 2 || result?.status === 'loading'}>
        {result?.status === 'loading' ? 'Merging…' : `Merge ${files.length} PDFs`}
      </button>
      <ResultCard state={result} />
    </ToolLayout>
  );
}
