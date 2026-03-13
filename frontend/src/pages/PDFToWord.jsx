import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import ToolLayout from '../components/ToolLayout';
import DropZone from '../components/DropZone';
import ResultCard from '../components/ResultCard';
import { uploadFiles } from '../utils/api';

export default function PDFToWord() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);

  const handleSubmit = async () => {
    if (!file) return;
    setResult({ status: 'loading' });
    try {
      const data = await uploadFiles('/pdf-to-word', file);
      setResult({ status: 'success', url: data.url, filename: data.filename,
        extra: 'Note: Text extraction quality depends on the PDF structure.' });
    } catch (err) {
      setResult({ status: 'error', error: err.response?.data?.error || err.message });
    }
  };

  return (
    <ToolLayout icon={<FileText size={24} />} title="PDF → Word" color="#9a3412"
      description="Convert PDF documents to editable Word format (.docx).">
      <DropZone onFiles={f => setFile(f[0])} files={file ? [file] : []} />
      <hr className="divider" />
      <div style={{ padding: '12px 16px', background: 'var(--accent-bg)', borderRadius: 8, border: '1px solid var(--accent)', marginBottom: 16 }}>
        <p style={{ fontSize: 13, color: 'var(--accent)' }}>
          ⚠️ PDF→Word conversion extracts text content. Complex layouts, tables, and images may not be preserved perfectly.
        </p>
      </div>
      <button className="submit-btn" onClick={handleSubmit} disabled={!file || result?.status === 'loading'}>
        {result?.status === 'loading' ? 'Converting…' : 'Convert to Word'}
      </button>
      <ResultCard state={result} />
    </ToolLayout>
  );
}
