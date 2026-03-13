import React, { useState } from 'react';
import { FileType } from 'lucide-react';
import ToolLayout from '../components/ToolLayout';
import DropZone from '../components/DropZone';
import ResultCard from '../components/ResultCard';
import { uploadFiles } from '../utils/api';

export default function WordToPDF() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);

  const handleSubmit = async () => {
    if (!file) return;
    setResult({ status: 'loading' });
    try {
      const data = await uploadFiles('/word-to-pdf', file);
      setResult({ status: 'success', url: data.url, filename: data.filename });
    } catch (err) {
      setResult({ status: 'error', error: err.response?.data?.error || err.message });
    }
  };

  return (
    <ToolLayout icon={<FileType size={24} />} title="Word → PDF" color="#166534"
      description="Convert Microsoft Word documents (.docx) to PDF format.">
      <DropZone
        onFiles={f => setFile(f[0])}
        files={file ? [file] : []}
        accept={{ 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'], 'application/msword': ['.doc'] }}
        label="Drop your Word document here"
        hint="Supports .docx and .doc files"
      />
      <hr className="divider" />
      <button className="submit-btn" onClick={handleSubmit} disabled={!file || result?.status === 'loading'}>
        {result?.status === 'loading' ? 'Converting…' : 'Convert to PDF'}
      </button>
      <ResultCard state={result} />
    </ToolLayout>
  );
}
